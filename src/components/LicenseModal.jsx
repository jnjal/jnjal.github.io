import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, DARINO, PROFILE, WORKER_URL } from "../data/content";
import { prefersReducedMotion } from "../hooks/useTyped";
import "./LicenseModal.css";

const ITEM = PROJECTS.find((p) => p.license) || PROJECTS[1];
const SUBJECT = "خرید لایسنس دارینو";
const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const STEPS = [
  { key: "intro", q: "دارینو چیه؟" },
  { key: "why", q: "چرا دارینو؟" },
  { key: "features", q: "ویژگی دارینو چیه؟" },
  { key: "terms", q: "قیمت و شرایط خرید؟" },
  { key: "buy", q: "چطور بخرم؟" },
];

const CLAMP = 320;

// محتوای بلند رو تا یه ارتفاع مشخص نگه می‌داره؛ با «خوندن ادامه» باز می‌شه
function Collapsible({ open, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (open) {
      el.style.maxHeight = `${el.scrollHeight}px`;
      const onEnd = () => {
        el.style.maxHeight = "none";
      };
      el.addEventListener("transitionend", onEnd, { once: true });
      return () => el.removeEventListener("transitionend", onEnd);
    }

    // هنوز هیچ‌وقت باز نشده → ارتفاع رو از CSS نگه می‌داریم
    if (!el.style.maxHeight) return undefined;

    el.style.maxHeight = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.style.maxHeight = `${CLAMP}px`;
    return undefined;
  }, [open]);

  return (
    <div ref={ref} className={`lic-clamp${open ? " is-open" : ""}`}>
      <div className="lic-clamp-inner">{children}</div>
    </div>
  );
}

export default function LicenseModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("in");
  const [typed, setTyped] = useState(STEPS[0].q);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [openWhy, setOpenWhy] = useState(false);
  const [openFeat, setOpenFeat] = useState(false);

  const typedRef = useRef(STEPS[0].q);
  const phaseTimer = useRef(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => () => window.clearTimeout(phaseTimer.current), []);

  // سوال: اول حذف قدم‌به‌قدم (مثل بک‌اسپیس)، بعد تایپ دوباره
  useEffect(() => {
    const target = STEPS[step].q;

    if (prefersReducedMotion()) {
      const t = window.setTimeout(() => {
        typedRef.current = target;
        setTyped(target);
      }, 0);
      return () => window.clearTimeout(t);
    }

    let interval = 0;
    let text = typedRef.current;

    const startTyping = () => {
      let i = 0;
      interval = window.setInterval(() => {
        i += 1;
        text = target.slice(0, i);
        typedRef.current = text;
        setTyped(text);
        if (i >= target.length) window.clearInterval(interval);
      }, 38);
    };

    interval = window.setInterval(() => {
      if (text.length > 0) {
        text = text.slice(0, -1);
        typedRef.current = text;
        setTyped(text);
      } else {
        window.clearInterval(interval);
        startTyping();
      }
    }, 22);

    return () => window.clearInterval(interval);
  }, [step]);

  const animating = typed !== STEPS[step].q;
  const last = step === STEPS.length - 1;

  const go = (next) => {
    if (animating || phase === "out") return;
    if (next < 0 || next >= STEPS.length) return;
    setPhase("out");
    phaseTimer.current = window.setTimeout(() => {
      setStep(next);
      setPhase("in");
    }, 170);
  };

  const details = [
    form.name,
    form.contact,
    form.phone ? `شماره تماس: ${form.phone}` : "",
    form.message,
  ]
    .filter(Boolean)
    .join("\n\n");

  const body = details || `سلام، درباره‌ی «${ITEM.title}» می‌خوام بدونم.`;
  const tagged = `مربوط به دارینو:\n\n${body}`;

  const mailtoHref = `mailto:${PROFILE.email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent("https://jnjal.github.io")}&text=${encodeURIComponent(tagged)}`;

  const sendToSite = async () => {
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.contact.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          source: "darino",
        }),
      });
      if (!res.ok) throw new Error();
      setForm({ name: "", contact: "", phone: "", message: "" });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const renderStep = (key) => {
    switch (key) {
      case "intro":
        return (
          <>
            <div className="lic-subtitle mono">{DARINO.subtitle}</div>
            <div className="lic-story">
              {ITEM.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <blockquote className="lic-quote">{DARINO.tagline}</blockquote>
          </>
        );

      case "why":
        return (
          <>
            <div className="lic-section-head">
              <span className="mono faint">why darino</span>
              <span className="lic-count mono">{fa(DARINO.why.length)} دلیل</span>
            </div>
            <Collapsible open={openWhy}>
              <div className="lic-why-grid">
                {DARINO.why.map((w, i) => (
                  <div className="why" key={w.title}>
                    <span className="why-no mono">{fa(i + 1)}</span>
                    <div className="why-body">
                      <div className="why-title">{w.title}</div>
                      <p className="why-text">{w.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>

            <div className="lic-more">
              <button
                type="button"
                className="lic-more-btn"
                onClick={() => setOpenWhy((v) => !v)}
                data-hover
              >
                {openWhy ? "بستن ↑" : "خوندن ادامه ↓"}
              </button>
            </div>
          </>
        );

      case "features":
        return (
          <>
            <div className="lic-section-head">
              <span className="mono faint">features</span>
              <span className="lic-count mono">{fa(DARINO.specs.length)} بخش</span>
            </div>
            <Collapsible open={openFeat}>
              <div className="lic-specs-grid">
                {DARINO.specs.map((s, i) => (
                  <div className="spec" key={s.title}>
                    <div className="spec-head">
                      <span className="spec-no mono">{String(i + 1).padStart(2, "0")}</span>
                      <span className="spec-title">{s.title}</span>
                    </div>
                    <ul className="spec-list">
                      {s.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Collapsible>

            <div className="lic-more">
              <button
                type="button"
                className="lic-more-btn"
                onClick={() => setOpenFeat((v) => !v)}
                data-hover
              >
                {openFeat ? "بستن ↑" : "خوندن ادامه ↓"}
              </button>
            </div>
          </>
        );

      case "terms":
        return (
          <>
            <div className="lic-price">
              <span className="mono faint">price</span>
              <strong>{DARINO.price}</strong>
            </div>

            <div className="lic-section-head">
              <span className="mono faint">terms</span>
              <span className="lic-count mono">{fa(DARINO.terms.length)} بند</span>
            </div>

            <div className="lic-contract">
              {DARINO.terms.map((t, i) => (
                <div className="clause" key={t.title}>
                  <span className="clause-no mono">{fa(i + 1)}</span>
                  <div className="clause-body">
                    <div className="clause-title">{t.title}</div>
                    <p className="clause-text">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case "buy":
        return (
          <>
            <div className="lic-section-head">
              <span className="mono faint">contact</span>
              <span className="lic-count mono">۳ روش</span>
            </div>

            <div className="lic-form">
              <p className="lic-hint dim">
                اگه دمو خواستی، توی متن همین فرم بنویس — یا از ایمیل و حتی تلگرام بگو.
              </p>
              <div className="lic-form-row">
                <input
                  type="text"
                  className="lic-input"
                  placeholder="اسم"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  type="text"
                  className="lic-input"
                  placeholder="ایمیل یا آیدی تلگرام (بدون @)"
                  value={form.contact}
                  onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
                />
                <input
                  type="tel"
                  className="lic-input lic-input-ltr"
                  placeholder="شماره تماس (اختیاری)"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <textarea
                rows={3}
                className="lic-input"
                placeholder="پیامت درباره‌ی دارینو..."
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              />
            </div>

            <div className="lic-methods">
              <a className="btn btn-primary" href={mailtoHref} data-hover>
                ارسال با ایمیل
              </a>
              <a className="btn" href={telegramHref} target="_blank" rel="noopener noreferrer" data-hover>
                ارسال با تلگرام
              </a>
              <button
                type="button"
                className="btn"
                onClick={sendToSite}
                disabled={status === "sending"}
                data-hover
              >
                {status === "sending" ? "در حال ارسال..." : "ارسال از طریق سایت"}
              </button>
            </div>

            {status === "error" && (
              <div className="lic-msg lic-msg-err">✗ همه‌ی فیلدها رو پر کن و دوباره تلاش کن.</div>
            )}
            {status === "sent" && (
              <div className="lic-msg lic-msg-ok">✓ پیامت ارسال شد — به زودی جواب میدم.</div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div
      className="lic-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lic-card" role="dialog" aria-modal="true" aria-labelledby="lic-title">
        <div className="lic-bar">
          <span className="mono">darino — license.txt</span>
          <button type="button" className="lic-close" onClick={onClose} aria-label="بستن" data-hover>
            ×
          </button>
        </div>

        <div className="lic-progress" aria-hidden="true">
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className="lic-body">
          <h3 id="lic-title" className="lic-step-head">
            <span className="lic-step-q">{typed}</span>
            <span className="lic-caret" aria-hidden="true" />
          </h3>

          <div className={`lic-step-content${phase === "out" ? " is-out" : ""}`} key={step}>
            {renderStep(STEPS[step].key)}
          </div>
        </div>

        <div className="lic-nav">
          <span className="lic-step-count mono">
            {fa(step + 1)} / {fa(STEPS.length)}
          </span>

          <div className="lic-nav-btns">
            <button
              type="button"
              className="btn"
              onClick={() => go(step - 1)}
              disabled={step === 0 || animating || phase === "out"}
              data-hover
            >
              ← قبلی
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => go(step + 1)}
              disabled={last || animating || phase === "out"}
              data-hover
            >
              بعدی →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
