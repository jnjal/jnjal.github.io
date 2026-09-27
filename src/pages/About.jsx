import { useState } from "react";
import Reveal from "../components/Reveal";
import useInView from "../hooks/useInView";
import { SKILLS, TOOLS, PROFILE } from "../data/content";
import "./About.css";

const WORKER_URL = "https://portfolio.iwdwy.workers.dev/";

function SkillBar({ name, level, inView, delay }) {
  return (
    <Reveal delay={delay} className="skill-row">
      <div className="skill-row-top">
        <span>{name}</span>
        <span className="mono accent-text" style={{ fontSize: 12 }}>{level}%</span>
      </div>
      <div className="skill-track">
        <div className="skill-fill" style={{ width: inView ? `${level}%` : "0%" }} />
      </div>
    </Reveal>
  );
}

export default function About() {
  const [skillRef, skillIn] = useInView(0.2);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      setError("لطفاً همه فیلدها رو پر کن");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("ایمیل معتبر وارد کن");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setFormData({ name: "", email: "", message: "" });
    } catch {
      setError("خطا در ارسال، دوباره تلاش کن");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">درباره</Reveal>
        <Reveal delay={60}><h1 className="page-title">یه دانشجوی مهندسی کامپیوتر که شبا کد می‌زنه</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          {PROFILE.role}م. بیشتر پروژه‌هام از یه ایده کوچیک شروع می‌شن که بعد از چند شب بی‌خوابی تبدیل می‌شن به یه چیز واقعی.
          کدنویسی برام یعنی ساختن چیزی که هم درست کار کنه، هم خوب به‌نظر برسه.
        </Reveal>

        <div className="about-grid">
          <div ref={skillRef}>
            <h2 className="section-h">تخصص‌های اصلی</h2>
            <div className="skills-list">
              {SKILLS.map((s, i) => (
                <SkillBar key={s.name} name={s.name} level={s.level} inView={skillIn} delay={i * 90} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="section-h">ابزارهای کاری</h2>
            <div className="tools-wrap">
              {TOOLS.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>
            <Reveal className="card approach-card">
              <div className="mono accent-text" style={{ fontSize: 11, marginBottom: 12 }}>رویکرد</div>
              <p className="dim" style={{ fontSize: 14.5, lineHeight: 1.9 }}>
                برنامه‌نویسی برای من یعنی ساختن چیزی که هم کار کنه، هم خوب به‌نظر برسه.
                کد تمیز، عملکرد بالا، و تجربه کاربری روان — همیشه دنبال همینام.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal className="contact-section">
          <h2 className="section-h">بیا حرف بزنیم</h2>
          <p className="dim" style={{ marginBottom: 28, fontSize: 14.5 }}>پروژه جدید داری؟ ایده‌ای تو ذهنته؟ دوست دارم بشنوم.</p>

          {sent ? (
            <div className="card contact-sent">
              <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
              <div className="accent-text" style={{ fontWeight: 700, marginBottom: 4 }}>پیام دریافت شد!</div>
              <div className="dim" style={{ fontSize: 13.5 }}>به زودی باهات تماس می‌گیرم.</div>
              <button onClick={() => setSent(false)} className="btn" style={{ marginTop: 20 }} data-hover>ارسال پیام دیگه</button>
            </div>
          ) : (
            <div className="contact-form">
              <input
                type="text" placeholder="اسمت چیه؟" value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                type="text" placeholder="ایمیلت چیه؟" value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
              <textarea
                rows={5} placeholder="پروژه‌ات رو توضیح بده..." value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
              />
              {error && <div className="form-error">{error}</div>}
              <button onClick={handleSubmit} disabled={sending} className="btn btn-primary" data-hover>
                {sending ? "در حال ارسال..." : "ارسال پیام ✦"}
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
