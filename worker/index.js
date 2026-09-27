export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

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

    // ── Validation ──
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

    // ── Escape to prevent injection in Telegram message ──
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

    const text = lines.join("\n");

    // ── Send to Telegram (secrets stored in env, not in code) ──
    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
      }
    );

    if (!tgRes.ok) {
      throw new Error("Telegram API error");
    }

    return json({ ok: true });
  },
};

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
