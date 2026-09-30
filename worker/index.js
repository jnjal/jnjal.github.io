/**
 * ورکر پورتفولیو
 *
 *   POST /                  → ارسال فرم تماس به تلگرام
 *   POST /archive/login     → بررسی رمز Archive و صدور توکن کوتاه‌عمر
 *   GET  /archive           → محتوای Archive از D1 (نیازمند توکن)
 *   POST /telegram/webhook  → ربات تلگرام برای مدیریت Archive
 *   GET  /telegram/setup    → ست کردن وب‌هوک + فهرست دستورات (یک بار باز کن)
 *   GET  /telegram/commands → فقط ثبت فهرست دستورات
 *
 * متغیرهای لازم (هرگز داخل ریپو نباشن):
 *   wrangler secret put ARCHIVE_PASSWORD   → رمز ورود Archive
 *   wrangler secret put BOT_TOKEN          → توکن ربات تلگرام
 *   wrangler secret put CHAT_ID            → چت‌آیدی تلگرام (هم برای فرم، هم برای ربات)
 *   binding دیتابیس D1 با نام DB          → در wrangler.toml
 *   جدول archive_entries                    → worker/schema.sql
 *
 * وب‌هوک ربات (یک بار، از مرورگر خودت — توکن فقط آدرس‌بار خودته):
 *   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://portfolio.iwdwy.workers.dev/telegram/webhook
 *
 * دستورات ربات (فقط از CHAT_ID مجاز اجرا می‌شه):
 *   /help                  راهنما
 *   /list                  لیست موارد آرشیو
 *   /add                   شروع تعاملی: نوع با دکمه → عنوان → متن → دکمه‌ی ثبت
 *   /add نوع | عنوان | متن   افزودن سریع
 *   /edit شناسه | عنوان | متن
 *   /del شناسه
 *
 * نیازمندی اضافه: جدول bot_state (worker/schema.sql)
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

/* ---------------- ربات تلگرام (مدیریت Archive) ---------------- */

const TG_WELCOME = [
  "سلام 👋",
  "",
  "این ربات برای مدیریت آرشیوی شخصیمه.",
  "با /add یا دکمه‌ی پایین، قدم‌قدم یه مورد جدید اضافه کن.",
].join("\n");

const TG_HELP = [
  "راهنمای سریع:",
  "",
  "➕ افزودن: از منو دکمه‌ی «افزودن مورد» رو بزن",
  "📄 لیست: دکمه‌ی «لیست» → روی مورد بزن → متن",
  "✏️ ویرایش و 🗑 حذف: از داخل هر مورد، با دکمه",
  "",
  "دستورات هم کار می‌کنن:",
  "/add — افزودن مرحله‌ای",
  "/add نوع | عنوان | متن — افزودن سریع",
  "/list — لیست موارد",
  "/edit شناسه | عنوان | متن",
  "/del شناسه",
  "/start — بازگشت به منو",
].join("\n");

const TG_TYPES = [
  ["خاطره", "memory"],
  ["آدم‌ها", "people"],
  ["فکرها", "thoughts"],
  ["وابستگی‌ها", "attachments"],
  ["رویاها", "dreams"],
  ["وسواس‌ها", "obsessions"],
  ["موسیقی", "music"],
  ["چیزهای نگفته", "unsaid"],
  ["ترس‌ها", "fears"],
  ["یادگاری‌ها", "keepsakes"],
];

const typeKeyboard = () => {
  const rows = [];
  for (let i = 0; i < TG_TYPES.length; i += 3) {
    rows.push(
      TG_TYPES.slice(i, i + 3).map(([label, type]) => ({
        text: label,
        callback_data: `at:${type}`,
      }))
    );
  }
  rows.push([{ text: "لغو ✕", callback_data: "ax" }]);
  return rows;
};

const cancelKeyboard = () => [[{ text: "لغو ✕", callback_data: "ax" }]];

const confirmKeyboard = () => [
  [
    { text: "ثبت ✅", callback_data: "as" },
    { text: "لغو ✕", callback_data: "ax" },
  ],
];

const nowISO = () => new Date().toISOString();
const cut = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);
const splitPipe = (s) => s.split("|").map((p) => p.trim());

async function tgSend(env, chatId, text, keyboard) {
  const body = { chat_id: chatId, text: cut(String(text), 4000) };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function tgAnswer(env, callbackId) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });
}

/* ── وضعیت مکالمه (توی D1 تا بین ریکوئست‌ها بمونه) ── */

async function getState(env, chatId) {
  if (!env.DB) return null;
  const row = await env.DB.prepare(
    "SELECT state, payload FROM bot_state WHERE chat_id = ?"
  )
    .bind(String(chatId))
    .first();
  if (!row) return null;
  try {
    return { state: row.state, payload: JSON.parse(row.payload || "{}") };
  } catch {
    return null;
  }
}

async function setState(env, chatId, state, payload) {
  if (!env.DB) return;
  await env.DB.prepare(
    "INSERT INTO bot_state (chat_id, state, payload, updated_at) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(chat_id) DO UPDATE SET state = excluded.state, payload = excluded.payload, updated_at = excluded.updated_at"
  )
    .bind(String(chatId), state, JSON.stringify(payload || {}), nowISO())
    .run();
}

async function insertEntry(env, entry) {
  const info = await env.DB.prepare(
    "INSERT INTO archive_entries (type, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(entry.type || "note", entry.title, entry.content, nowISO(), nowISO())
    .run();
  return info.meta && info.meta.last_row_id;
}

const welcomeKeyboard = () => [
  [
    { text: "➕ افزودن مورد", callback_data: "go:add" },
    { text: "📄 لیست موارد", callback_data: "go:list" },
  ],
  [{ text: "❓ راهنما", callback_data: "go:help" }],
];

const menuKeyboard = () => [[{ text: "🏠 منو", callback_data: "go:menu" }]];

const backToListKeyboard = () => [
  [
    { text: "📄 لیست", callback_data: "go:list" },
    { text: "🏠 منو", callback_data: "go:menu" },
  ],
];

function entriesKeyboard(results) {
  const rows = [];
  for (let i = 0; i < results.length; i += 2) {
    rows.push(
      results.slice(i, i + 2).map((r) => ({
        text: cut(`#${r.id} · ${r.title}`, 40),
        callback_data: `pick:${r.id}`,
      }))
    );
  }
  rows.push([
    { text: "➕ افزودن", callback_data: "go:add" },
    { text: "🔄 تازه", callback_data: "go:list" },
  ]);
  rows.push([{ text: "🏠 منو", callback_data: "go:menu" }]);
  return rows;
}

async function fetchEntry(env, id) {
  if (!env.DB) throw new Error("db");
  return env.DB.prepare(
    "SELECT id, type, title, content, created_at FROM archive_entries WHERE id = ?"
  )
    .bind(Number(id))
    .first();
}

async function sendList(env, chatId) {
  if (!env.DB) throw new Error("db");
  const { results } = await env.DB.prepare(
    "SELECT id, type, title FROM archive_entries ORDER BY id DESC LIMIT 12"
  ).all();
  await tgSend(
    env,
    chatId,
    results.length
      ? `آرشیو (${results.length} مورد اخیر)\nروی هرکدوم بزن تا متنش رو ببینی:`
      : "هنوز چیزی توی آرشیو نیست.",
    entriesKeyboard(results)
  );
}

async function startAdd(env, chatId) {
  if (!env.DB) throw new Error("db");
  await setState(env, chatId, "await_type", {});
  await tgSend(env, chatId, "چی می‌خوای اضافه کنی؟", typeKeyboard());
}

/* ── پاسخ به دکمه‌ها ── */

async function handleCallback(env, chatId, data) {
  if (data === "ax") {
    await setState(env, chatId, "idle", {});
    await tgSend(env, chatId, "لغو شد ✕", welcomeKeyboard());
    return;
  }

  if (data === "go:add") {
    await startAdd(env, chatId);
    return;
  }

  if (data === "go:list") {
    await sendList(env, chatId);
    return;
  }

  if (data === "go:help") {
    await tgSend(env, chatId, TG_HELP, welcomeKeyboard());
    return;
  }

  if (data === "go:menu") {
    await setState(env, chatId, "idle", {});
    await tgSend(env, chatId, TG_WELCOME, welcomeKeyboard());
    return;
  }

  if (data.startsWith("at:")) {
    const type = data.slice(3);
    await setState(env, chatId, "await_title", { type });
    await tgSend(env, chatId, `نوع: ${type}\n\nعنوان رو بفرست:`, cancelKeyboard());
    return;
  }

  // انتخاب یکی از لیست → نمایش متن + دکمه‌های ویرایش/حذف
  if (data.startsWith("pick:")) {
    const id = data.slice(5);
    const entry = await fetchEntry(env, id);
    if (!entry) {
      await tgSend(env, chatId, `مورد #${id} پیدا نشد.`, backToListKeyboard());
      return;
    }
    await tgSend(
      env,
      chatId,
      `#${entry.id} [${entry.type}]\n${entry.title}\n────\n${cut(entry.content || "", 1200)}`,
      [
        [
          { text: "✏️ ویرایش", callback_data: `ed:${entry.id}` },
          { text: "🗑 حذف", callback_data: `dc:${entry.id}` },
        ],
        [
          { text: "📄 لیست", callback_data: "go:list" },
          { text: "🏠 منو", callback_data: "go:menu" },
        ],
      ]
    );
    return;
  }

  // تأیید حذف
  if (data.startsWith("dc:")) {
    const id = data.slice(3);
    const entry = await fetchEntry(env, id);
    if (!entry) {
      await tgSend(env, chatId, `مورد #${id} پیدا نشد.`, backToListKeyboard());
      return;
    }
    await tgSend(
      env,
      chatId,
      `مطمئنی «${entry.title}» حذف بشه؟\nاین کار برگشت نداره.`,
      [
        [
          { text: `حذف قطعی ✕ (#${id})`, callback_data: `dy:${entry.id}` },
          { text: "انصراف", callback_data: `pick:${entry.id}` },
        ],
      ]
    );
    return;
  }

  if (data.startsWith("dy:")) {
    const id = data.slice(3);
    if (!env.DB) throw new Error("db");
    const info = await env.DB.prepare("DELETE FROM archive_entries WHERE id = ?")
      .bind(Number(id))
      .run();
    await tgSend(
      env,
      chatId,
      info.meta && info.meta.changes ? `حذف شد ✓ (#${id})` : `مورد #${id} پیدا نشد.`,
      backToListKeyboard()
    );
    return;
  }

  // شروع ویرایش
  if (data.startsWith("ed:")) {
    const id = data.slice(3);
    const entry = await fetchEntry(env, id);
    if (!entry) {
      await tgSend(env, chatId, `مورد #${id} پیدا نشد.`, backToListKeyboard());
      return;
    }
    await setState(env, chatId, "await_edit_title", { id: Number(id) });
    await tgSend(
      env,
      chatId,
      `عنوان فعلی:\n${entry.title}\n\nعنوان جدید رو بفرست:`,
      cancelKeyboard()
    );
    return;
  }

  if (data === "es") {
    const st = await getState(env, chatId);
    if (!st || st.state !== "confirm_edit" || !st.payload.title) {
      await tgSend(env, chatId, "چیزی برای ویرایش نیست.", menuKeyboard());
      return;
    }
    if (!env.DB) throw new Error("db");
    const p = st.payload;
    const info = await env.DB.prepare(
      "UPDATE archive_entries SET title = ?, content = ?, updated_at = ? WHERE id = ?"
    )
      .bind(p.title, p.content, nowISO(), Number(p.id))
      .run();
    await setState(env, chatId, "idle", {});
    await tgSend(
      env,
      chatId,
      info.meta && info.meta.changes ? `ویرایش شد ✓ (#${p.id})` : `مورد #${p.id} پیدا نشد.`,
      backToListKeyboard()
    );
    return;
  }

  if (data === "as") {
    const st = await getState(env, chatId);
    if (!st || st.state !== "confirm" || !st.payload.title) {
      await tgSend(env, chatId, "چیزی برای ثبت نیست. دوباره از منو شروع کن.", welcomeKeyboard());
      return;
    }
    const id = await insertEntry(env, st.payload);
    await setState(env, chatId, "idle", {});
    await tgSend(
      env,
      chatId,
      `اضافه شد ✓ ${id ? `(#${id})` : ""}\n[${st.payload.type || "note"}] ${st.payload.title}`,
      backToListKeyboard()
    );
  }
}

// یک بار صدا بزن تا فهرست دستورات موقع تایپ `/` توی تلگرام ظاهر بشه
async function setupCommands(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!env.BOT_TOKEN) return json({ error: "bot not configured" }, 500);

  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "شروع و راهنما" },
        { command: "add", description: "افزودن مورد جدید" },
        { command: "list", description: "لیست موارد آرشیو" },
        { command: "edit", description: "ویرایش مورد" },
        { command: "del", description: "حذف مورد" },
        { command: "help", description: "راهنمای دستورات" },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return json({ ok: data.ok === true, commands: data.result || null });
}

// راه‌اندازی کامل ربات با یه بار باز کردن آدرس (وب‌هوک + فهرست دستورات)
async function setupWebhook(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!env.BOT_TOKEN) return json({ error: "bot not configured" }, 500);

  const url = new URL(request.url);
  const hookUrl = `https://${url.host}/telegram/webhook`;

  const [webhook, commands] = await Promise.all([
    fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: hookUrl }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, description: "request failed" })),

    fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "شروع و راهنما" },
          { command: "add", description: "افزودن مورد جدید" },
          { command: "list", description: "لیست موارد آرشیو" },
          { command: "edit", description: "ویرایش مورد" },
          { command: "del", description: "حذف مورد" },
          { command: "help", description: "راهنمای دستورات" },
        ],
      }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, description: "request failed" })),
  ]);

  return json({
    webhook: {
      ok: webhook.ok === true,
      url: hookUrl,
      detail: webhook.description || (webhook.result && webhook.result.url) || null,
    },
    commands: { ok: commands.ok === true, detail: commands.description || null },
  });
}

async function telegramHandler(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let update;
  try {
    update = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  // فقط چت خودم مجازه — بقیه بی‌صدا نادیده گرفته می‌شن
  const cb = update.callback_query;
  const msg = update.message || update.edited_message;
  const chatId =
    (cb && cb.message && cb.message.chat && cb.message.chat.id) ||
    (msg && msg.chat && msg.chat.id);

  if (!chatId || !env.CHAT_ID || String(chatId) !== String(env.CHAT_ID)) return json({ ok: true });
  if (!env.BOT_TOKEN) return json({ error: "bot not configured" }, 500);

  // ── فشردن دکمه‌ها ──
  if (cb && cb.data) {
    await tgAnswer(env, cb.id);
    try {
      await handleCallback(env, chatId, cb.data);
    } catch {
      await tgSend(env, chatId, "خطا: دیتابیس در دسترس نیست.");
    }
    return json({ ok: true });
  }

  if (!msg || !msg.text) return json({ ok: true });

  const cmd = msg.text.trim();
  const args = cmd.replace(/^\/[a-zA-Z]+/, "").trim();

  try {
    // ── دستورات ──
    if (cmd.startsWith("/")) {
      if (/^\/start\b/.test(cmd)) {
        await tgSend(env, chatId, TG_WELCOME, welcomeKeyboard());
      } else if (/^\/help\b/.test(cmd)) {
        await tgSend(env, chatId, TG_HELP);
      } else if (/^\/list\b/.test(cmd)) {
        await sendList(env, chatId);
      } else if (/^\/add\b/.test(cmd)) {
        if (!env.DB) throw new Error("db");

        // بدون آرگومان → حالت تعاملی با دکمه‌ها
        if (!args) {
          await startAdd(env, chatId);
          return json({ ok: true });
        }

        // با آرگومان → حالت سریع
        const [type, title, ...rest] = splitPipe(args);
        if (!title || rest.join("|").length === 0) {
          await tgSend(env, chatId, "فرمت درست:\n/add نوع | عنوان | متن\nیا فقط /add");
        } else {
          const id = await insertEntry(env, {
            type: type || "note",
            title,
            content: rest.join("|"),
          });
          await tgSend(
            env,
            chatId,
            `اضافه شد ✓ ${id ? `(#${id})` : ""}\n[${type || "note"}] ${title}`
          );
        }
      } else if (/^\/edit\b/.test(cmd)) {
        if (!env.DB) throw new Error("db");
        const [id, title, ...rest] = splitPipe(args);
        if (!/^\d+$/.test(id || "") || !title) {
          await tgSend(env, chatId, "فرمت درست:\n/edit شناسه | عنوان | متن");
        } else {
          const info = await env.DB.prepare(
            "UPDATE archive_entries SET title = ?, content = ?, updated_at = ? WHERE id = ?"
          )
            .bind(title, rest.join("|"), nowISO(), Number(id))
            .run();
          await tgSend(
            env,
            chatId,
            info.meta && info.meta.changes
              ? `ویرایش شد ✓ (#${id})`
              : `چیزی با شناسه‌ی ${id} پیدا نشد.`
          );
        }
      } else if (/^\/del\b/.test(cmd)) {
        if (!env.DB) throw new Error("db");
        if (!/^\d+$/.test(args)) {
          await tgSend(env, chatId, "فرمت درست:\n/del شناسه");
        } else {
          const info = await env.DB.prepare("DELETE FROM archive_entries WHERE id = ?")
            .bind(Number(args))
            .run();
          await tgSend(
            env,
            chatId,
            info.meta && info.meta.changes
              ? `حذف شد ✓ (#${args})`
              : `چیزی با شناسه‌ی ${args} پیدا نشد.`
          );
        }
      } else {
        await tgSend(env, chatId, "دستور ناشناخته. /help رو بزن.");
      }
      return json({ ok: true });
    }

    // ── پیام معمولی → مرحله‌به‌مرحله برای /add ──
    const st = await getState(env, chatId);

    if (st && st.state === "await_title") {
      const title = msg.text.trim();
      if (!title) {
        await tgSend(env, chatId, "عنوان خالیه؛ دوباره بفرست:", cancelKeyboard());
        return json({ ok: true });
      }
      await setState(env, chatId, "await_content", { ...st.payload, title });
      await tgSend(
        env,
        chatId,
        "عنوان ثبت شد ✓\n\nحالا متن رو بفرست (چندخطی آزاده):",
        cancelKeyboard()
      );
      return json({ ok: true });
    }

    if (st && st.state === "await_content") {
      const payload = { ...st.payload, content: msg.text };
      await setState(env, chatId, "confirm", payload);
      await tgSend(
        env,
        chatId,
        `پیش‌نمایش:\n\nنوع: ${payload.type || "note"}\nعنوان: ${payload.title}\n────\n${payload.content}\n────\n\nثبت بشه؟`,
        confirmKeyboard()
      );
      return json({ ok: true });
    }

    if (st && st.state === "await_type") {
      await tgSend(env, chatId, "لطفاً یکی از دکمه‌ها رو بزن:", typeKeyboard());
      return json({ ok: true });
    }

    // ── مسیر ویرایش ──
    if (st && st.state === "await_edit_title") {
      const title = msg.text.trim();
      if (!title) {
        await tgSend(env, chatId, "عنوان خالیه؛ دوباره بفرست:", cancelKeyboard());
        return json({ ok: true });
      }
      await setState(env, chatId, "await_edit_content", { ...st.payload, title });
      await tgSend(
        env,
        chatId,
        "عنوان ثبت شد ✓\n\nحالا متن جدید رو بفرست:",
        cancelKeyboard()
      );
      return json({ ok: true });
    }

    if (st && st.state === "await_edit_content") {
      const payload = { ...st.payload, content: msg.text };
      await setState(env, chatId, "confirm_edit", payload);
      await tgSend(
        env,
        chatId,
        `پیش‌نمایش ویرایش #${payload.id}:\n\nعنوان: ${payload.title}\n────\n${payload.content}\n────\n\nثبت بشه؟`,
        [
          [
            { text: "ثبت ✅", callback_data: "es" },
            { text: "لغو ✕", callback_data: "ax" },
          ],
        ]
      );
      return json({ ok: true });
    }

    await tgSend(env, chatId, "دکمه‌ها رو بزن، یا /start برای منو.", welcomeKeyboard());
    return json({ ok: true });
  } catch {
    await tgSend(env, chatId, "خطا: دیتابیس در دسترس نیست یا اشتباهی پیش اومد.");
    return json({ ok: true });
  }
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

    if (url.pathname === "/telegram/setup") {
      return setupWebhook(request, env);
    }

    if (url.pathname === "/telegram/commands") {
      return setupCommands(request, env);
    }

    if (url.pathname.startsWith("/telegram")) {
      return telegramHandler(request, env);
    }

    try {
      return await contactHandler(request, env);
    } catch {
      return json({ error: "خطای سرور" }, 500);
    }
  },
};
