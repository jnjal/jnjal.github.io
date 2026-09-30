/**
 * ورکر پورتفولیو
 *
 *   POST /                → ارسال فرم تماس به تلگرام
 *   POST /archive/login   → بررسی رمز Archive و صدور توکن کوتاه‌عمر
 *   GET  /archive         → محتوای Archive از D1 (نیازمند توکن)
 *
 * متغیرهای لازم (هرگز داخل ریپو نباشن):
 *   wrangler secret put ARCHIVE_PASSWORD   → رمز ورود Archive
 *   wrangler secret put BOT_TOKEN          → توکن ربات تلگرام
 *   wrangler secret put CHAT_ID            → چت‌آیدی تلگرام
 *   binding دیتابیس D1 با نام DB          → در wrangler.toml
 *   جدول archive_entries                    → worker/schema.sql
 *
 * TODO(آینده): ربات تلگرام — POST /telegram/webhook با commandهای
 * /list /add /edit /delete که مستقیم به همین D1 وصل می‌شن و نیازی به
 * تغییر کد سایت نیست. TELEGRAM_BOT_TOKEN هم باید Worker Secret باشه.
 */

const SESSION_TTL = 60 * 60 * 2; // توکن ۲ ساعته

const encoder = new TextEncoder();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...extra },
  });

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(str) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(str));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// مقایسه‌ی رمز بدون نشت زمانی
async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([sha256Hex(String(a)), sha256Hex(String(b))]);
  if (ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i += 1) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

async function hmacSign(keyStr, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64url(new Uint8Array(sig));
}

// توکن: exp.signature — بدون حفظ رمز در فرانت یا در URL
async function createToken(secret) {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL);
  return `${exp}.${await hmacSign(secret, exp)}`;
}

async function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return false;
  const [exp, sig] = token.split(".");
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, await hmacSign(secret, exp));
}

function bearer(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

/* ---------------- Archive ---------------- */

async function archiveHandler(request, env, url) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!env.ARCHIVE_PASSWORD) {
    return json({ error: "archive not configured" }, 500);
  }

  // ── POST /archive/login ──
  if (url.pathname === "/archive/login" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad request" }, 400);
    }

    const password = String((body && body.password) || "");
    if (!password || !(await safeEqual(password, env.ARCHIVE_PASSWORD))) {
      return json({ error: "unauthorized" }, 401);
    }

    return json({ token: await createToken(env.ARCHIVE_PASSWORD), expiresIn: SESSION_TTL });
  }

  // ── GET /archive ──
  if (url.pathname === "/archive" && request.method === "GET") {
    const token = bearer(request);
    if (!(await verifyToken(token, env.ARCHIVE_PASSWORD))) {
      return json({ error: "unauthorized" }, 401);
    }

    if (!env.DB) return json({ error: "db not configured" }, 500);

    try {
      const { results } = await env.DB.prepare(
        "SELECT id, type, title, content, created_at, updated_at FROM archive_entries ORDER BY created_at DESC"
      ).all();
      return json({ entries: results || [] });
    } catch {
      return json({ error: "db error" }, 500);
    }
  }

  return json({ error: "not found" }, 404);
}

/* ---------------- فرم تماس ---------------- */

// نوع راه‌تماس رو تشخیص می‌ده: ایمیل / آیدی تلگرام / شماره
function contactKind(value) {
  const v = String(value).trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { label: "ایمیل", icon: "📧" };
  }

  const tme = v.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{4,32})/i);
  if (tme) {
    return { label: "آیدی تلگرام", icon: "✈️", value: `@${tme[1]}` };
  }

  if (/^[+\d][\d\s()-]{5,19}$/.test(v)) {
    return { label: "شماره", icon: "📞" };
  }

  if (/^@?[A-Za-z0-9_]{4,32}$/.test(v)) {
    return { label: "آیدی تلگرام", icon: "✈️" };
  }

  return null;
}

async function contactHandler(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "JSON نامعتبره" }, 400);
  }

  const {
    name = "",
    email = "",
    phone = "",
    message = "",
    source = "contact",
  } = payload || {};

  if (!name.trim() || !email.trim() || !message.trim()) {
    return json({ error: "همه فیلدها الزامی هستن" }, 400);
  }

  if (name.length > 100 || email.length > 120 || phone.length > 30 || message.length > 2000) {
    return json({ error: "متن خیلی طولانیه" }, 400);
  }

  const kind = contactKind(email);
  if (!kind) {
    return json({ error: "ایمیل، آیدی تلگرام یا شماره نامعتبره" }, 400);
  }

  if (phone && !/^[+\d][\d\s()-]{5,19}$/.test(phone.trim())) {
    return json({ error: "شماره تماس نامعتبره" }, 400);
  }

  const isDarino = source === "darino";
  const contact = kind.value || email.trim();

  const escape = (str) =>
    String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = [
    isDarino ? "🎯 پیام جدید از فرم «دارینو»!" : "📩 پیام جدید از پورتفولیو!",
    "",
    `👤 اسم: ${escape(name.trim())}`,
    `${kind.icon} ${kind.label}: ${escape(contact)}`,
  ];

  if (phone.trim()) {
    lines.push(`📞 شماره تماس: ${escape(phone.trim())}`);
  }

  lines.push("", "💬 پیام:", escape(message.trim()));

  const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text: lines.join("\n") }),
  });

  if (!tgRes.ok) {
    throw new Error("Telegram API error");
  }

  return json({ ok: true });
}

/* ---------------- Router ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/archive")) {
      return archiveHandler(request, env, url);
    }

    try {
      return await contactHandler(request, env);
    } catch {
      return json({ error: "خطای سرور" }, 500);
    }
  },
};
