import { useEffect, useState } from "react";
import Reveal from "../components/Reveal";
import useInView from "../hooks/useInView";
import useTyped, { prefersReducedMotion } from "../hooks/useTyped";
import { SKILLS, TOOLS, ABOUT, SOCIAL_LINKS, WORKER_URL } from "../data/content";
import avatarSrc from "../assets/avatar.jpg";
import "./About.css";

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

const PROMPTS = [
  "name@jnjal:~$ name",
  "name@jnjal:~$ contact",
  "name@jnjal:~$ phone",
  "name@jnjal:~$ message",
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s()-]{5,19}$/;
const TME_RE = /^@?[A-Za-z0-9_]{4,32}$/;
const LOGIN = new Date().toString().slice(4, 24);

function Prompt({ text, typed }) {
  const done = typed.length >= text.length;
  return (
    <span className="term-prompt mono">
      {typed}
      {!done && <span className="term-caret" aria-hidden="true" />}
    </span>
  );
}

function useCount(target, active, duration = 1200) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (!active || prefersReducedMotion()) return undefined;

    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

function SkillRing({ name, level, inView, delay }) {
  const shown = useCount(level, inView);

  return (
    <Reveal delay={delay} className="skill-ring">
      <div className="ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="ring-bg" cx="50" cy="50" r={RING_R} />
          <circle
            className="ring-fill"
            cx="50"
            cy="50"
            r={RING_R}
            strokeDasharray={RING_C}
            strokeDashoffset={inView ? RING_C * (1 - level / 100) : RING_C}
          />
        </svg>
        <div className="ring-value mono">
          {shown}
          <span>%</span>
        </div>
      </div>
      <div className="ring-name">{name}</div>
    </Reveal>
  );
}

export default function About() {
  const [skillRef, skillIn] = useInView(0.2);
  const [contactRef, contactIn] = useInView(0.2);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [prog, setProg] = useState(0);

  const pName = useTyped(PROMPTS[0], contactIn, 30, 150);
  const pEmail = useTyped(PROMPTS[1], contactIn, 30, 650);
  const pPhone = useTyped(PROMPTS[2], contactIn, 30, 1150);
  const pMsg = useTyped(PROMPTS[3], contactIn, 30, 1650);

  useEffect(() => {
    if (!sending) return undefined;
    const id = window.setInterval(() => {
      setProg((p) => Math.min(92, p + 5 + Math.random() * 9));
    }, 170);
    return () => window.clearInterval(id);
  }, [sending]);

  const handleSubmit = async () => {
    const contact = formData.email.trim();
    if (!formData.name || !contact || !formData.message) {
      setError("لطفاً همه فیلدها رو پر کن");
      return;
    }
    if (!EMAIL_RE.test(contact) && !TME_RE.test(contact) && !PHONE_RE.test(contact)) {
      setError("ایمیل، آیدی یا شماره معتبر وارد کن");
      return;
    }
    if (formData.phone && !PHONE_RE.test(formData.phone.trim())) {
      setError("شماره تماس نامعتبره");
      return;
    }
    setSending(true);
    setError("");
    setProg(6);
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "contact" }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch {
      setError("خطا در ارسال، دوباره تلاش کن");
      setProg(0);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section id="about" className="section">
        <div className="container">
          <Reveal className="kicker">درباره — about.md</Reveal>
          <Reveal delay={60}>
            <h2 className="page-title about-title">
              یه دانشجوی مهندسی کامپیوتر که <span className="accent-text">شبا کد می‌زنه</span>
            </h2>
          </Reveal>

          <div className="about-top">
            <div className="about-intro">
              {ABOUT.paragraphs.map((p, i) => (
                <Reveal key={i} delay={120 + i * 70} className="intro-row">
                  <span className="intro-no mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <p className={i === 0 ? "intro-text intro-lead" : "intro-text"}>{p}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={240} className="about-seal">
              <svg className="seal" viewBox="0 0 140 140" aria-hidden="true">
                <defs>
                  <path id="seal-path" d="M70,70 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" />
                  <clipPath id="seal-avatar-clip">
                    <circle cx="70" cy="70" r="40" />
                  </clipPath>
                </defs>
                <circle className="seal-ring" cx="70" cy="70" r="65" />
                <circle className="seal-ring seal-ring-dash" cx="70" cy="70" r="42" />
                <g className="seal-rotate">
                  <text className="seal-text">
                    <textPath href="#seal-path" startOffset="0">
                      ✦ JNJAL.DEV ✦ FULLSTACK DEVELOPER ✦
                    </textPath>
                  </text>
                </g>
                <text className="seal-center" x="70" y="71" textAnchor="middle" dominantBaseline="central">ج</text>
                <image
                  className="seal-photo"
                  href={avatarSrc}
                  x="30"
                  y="30"
                  width="80"
                  height="80"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#seal-avatar-clip)"
                />
              </svg>
              <span className="seal-caption mono">handmade on the web</span>
            </Reveal>
          </div>

          <Reveal delay={140} className="about-facts">
            {ABOUT.facts.map((f, i) => (
              <div key={f.title} className="fact">
                <div className="fact-head">
                  <span className="fact-no mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fact-label mono faint">{f.label}</span>
                </div>
                <div className="fact-title">{f.title}</div>
                <p className="fact-text dim">{f.text}</p>
              </div>
            ))}
          </Reveal>

          <div className="about-grid">
            <div ref={skillRef}>
              <h3 className="section-h">تخصص‌های اصلی</h3>
              <div className="skills-rings">
                {SKILLS.map((s, i) => (
                  <SkillRing key={s.name} name={s.name} level={s.level} inView={skillIn} delay={i * 110} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="section-h">ابزارهای کاری</h3>
              <div className="tools-wrap">
                {TOOLS.map((t) => <span key={t} className="tool-chip mono">{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section">
        <div className="container">
          <Reveal className="kicker">تماس</Reveal>
          <Reveal delay={60}><h2 className="page-title">بیا حرف بزنیم</h2></Reveal>
          <Reveal delay={120} className="page-lede">
            پروژه جدید داری؟ ایده‌ای تو ذهنته؟ دوست دارم بشنوم.
          </Reveal>

          <div className="contact-grid" ref={contactRef}>
            <div className="contact-side">
              <div className="channels">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="channel"
                    data-hover
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    <span className="channel-label mono faint">{s.label}</span>
                    <span className="channel-value">{s.value}</span>
                    <span className="channel-arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>

              <p className="channel-note dim">
                معمولاً تا یه روز جواب میدم — مگه اینکه شب باشه و یه باگ داشته باشم.
              </p>
            </div>

            <Reveal delay={100} className="terminal">
              <div className="terminal-bar">
                <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
                <span className="terminal-name mono">contact.sh</span>
              </div>

              <div className="terminal-body">
                <div className="term-meta mono">last login: {LOGIN} — tty1</div>

                {sent ? (
                  <div className="term-panel">
                    <div className="term-line term-ok">
                      <span className="mono">✓</span> پیام دریافت شد — به زودی جواب میدم.
                    </div>
                    <button type="button" className="term-btn term-btn-ghost" onClick={() => setSent(false)} data-hover>
                      ارسال پیام دیگه
                    </button>
                  </div>
                ) : (
                <form className="term-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <label className="term-field">
                    <Prompt text={PROMPTS[0]} typed={pName} />
                    <input
                      type="text"
                      className="term-input"
                      placeholder="اسمت چیه؟"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    />
                  </label>

                  <label className="term-field">
                    <Prompt text={PROMPTS[1]} typed={pEmail} />
                    <input
                      type="text"
                      className="term-input"
                      placeholder="ایمیل یا آیدی تلگرام (بدون @)"
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    />
                  </label>

                  <label className="term-field">
                    <Prompt text={PROMPTS[2]} typed={pPhone} />
                    <input
                      type="tel"
                      className="term-input term-input-ltr"
                      placeholder="شماره تماس (اختیاری)"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </label>

                  <label className="term-field">
                    <Prompt text={PROMPTS[3]} typed={pMsg} />
                    <textarea
                      rows={5}
                      className="term-input term-textarea"
                      placeholder="پروژه‌ات رو توضیح بده..."
                      value={formData.message}
                      onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                    />
                  </label>

                  {error && <div className="term-error mono">✗ {error}</div>}

                  {sending && (
                    <div className="term-progress" aria-hidden="true">
                      <span style={{ width: `${Math.round(prog)}%` }} />
                    </div>
                  )}

                  <button type="submit" className="term-btn" disabled={sending} data-hover>
                    {sending ? "در حال ارسال..." : "ارسال پیام ▸"}
                  </button>
                </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
