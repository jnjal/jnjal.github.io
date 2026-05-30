import { useState, useEffect, useRef } from "react";

const WORKER_URL = "https://portfolio.tnugos.workers.dev/";

const projects = [
  {
    id: 1,
    title: "پورتفولیو شخصی",
    category: "Frontend",
    year: "2026",
    desc: "طراحی و توسعه پورتفولیو شخصی با React و Vite، دپلوی روی GitHub Pages و Cloudflare Pages با CI/CD خودکار",
    tags: ["React", "Vite", "CSS"],
    link: "https://jnjal.github.io",
    color: "#C8F563",
  },
  {
    id: 2,
    title: "پروژه دوم",
    category: "React",
    year: "2026",
    desc: "توضیح پروژه دوم خودت رو اینجا بنویس",
    tags: ["React", "Next.js", "Tailwind"],
    link: "#",
    color: "#63C8F5",
  },
  {
    id: 3,
    title: "پروژه سوم",
    category: "Next.js",
    year: "2025",
    desc: "توضیح پروژه سوم خودت رو اینجا بنویس",
    tags: ["Next.js", "TypeScript", "CSS"],
    link: "#",
    color: "#F563C8",
  },
];

const skills = [
  { name: "React", level: 90 },
  { name: "Next.js", level: 85 },
  { name: "JavaScript", level: 88 },
  { name: "HTML & CSS", level: 97 },
  { name: "Git & GitHub", level: 85 },
];

const tools = ["React", "Next.js", "TypeScript", "Tailwind", "Git", "Figma", "Vite", "Vercel", "Cloudflare", "VS Code"];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function AnimatedBar({ level, color, inView }) {
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 4,
        background: color,
        width: inView ? `${level}%` : "0%",
        transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hov, setHov] = useState(false);
  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  useEffect(() => {
    if (isMobile) return;
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    const over = (e) => setHov(e.target.closest("a,button,[data-hover]") !== null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, []);
  if (isMobile) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999,
      width: hov ? 40 : 12, height: hov ? 40 : 12,
      borderRadius: "50%", background: hov ? "transparent" : "#C8F563",
      border: hov ? "2px solid #C8F563" : "none",
      transform: `translate(${pos.x - (hov ? 20 : 6)}px, ${pos.y - (hov ? 20 : 6)}px)`,
      transition: "width 0.2s, height 0.2s, background 0.2s, border 0.2s",
      mixBlendMode: "difference",
    }} />
  );
}

export default function Portfolio() {
  const [active, setActive] = useState("home");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [heroRef, heroIn] = useInView(0.1);
  const [skillRef, skillIn] = useInView(0.2);
  const [projRef, projIn] = useInView(0.1);

  const navItems = [
    { id: "home", label: "من" },
    { id: "projects", label: "پروژه‌ها" },
    { id: "skills", label: "مهارت‌ها" },
    { id: "contact", label: "تماس" },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActive(id);
    setMenuOpen(false);
  };

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
    <div style={{
      background: "#0a0a0a", color: "#e8e8e8", minHeight: "100vh",
      fontFamily: "'Vazirmatn', 'IBM Plex Mono', monospace",
      direction: "rtl", overflowX: "hidden", cursor: "none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&family=IBM+Plex+Mono:wght@400;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #C8F563; border-radius: 2px; }
        html { scroll-behavior: smooth; }
        .fade-up { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.d1 { transition-delay: 0.1s; }
        .fade-up.d2 { transition-delay: 0.25s; }
        .fade-up.d3 { transition-delay: 0.4s; }
        .fade-up.d4 { transition-delay: 0.55s; }
        .proj-card { transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
        .proj-card:hover .proj-overlay { opacity: 1 !important; }
        .proj-card:hover { transform: translateY(-8px) !important; }
        .tag { padding: 4px 10px; border: 1px solid #333; border-radius: 100px; font-size: 11px; color: #888; letter-spacing: 0.5px; }
        .tool-pill { padding: 8px 16px; border: 1px solid #222; border-radius: 100px; font-size: 13px; color: #aaa; transition: all 0.2s; cursor: default; }
        .tool-pill:hover { border-color: #C8F563; color: #C8F563; }
        input, textarea { outline: none; resize: none; font-family: inherit; direction: rtl; }
        input::placeholder, textarea::placeholder { color: #444; }
        .nav-link { position: relative; cursor: pointer; padding: 6px 0; font-size: 14px; color: #666; transition: color 0.2s; letter-spacing: 0.5px; }
        .nav-link.active, .nav-link:hover { color: #C8F563; }
        .nav-link.active::after { content: ''; position: absolute; bottom: 0; right: 0; left: 0; height: 2px; background: #C8F563; border-radius: 2px; }
        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; }
        .hamburger span { display: block; width: 24px; height: 2px; background: #e8e8e8; transition: all 0.3s; border-radius: 2px; }
        .mobile-menu { display: none; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .hero-buttons { display: flex; gap: 16px; align-items: center; }
        .hero-stats { display: flex; gap: 48px; margin-top: 80px; padding-top: 48px; border-top: 1px solid #1a1a1a; }
        .section-pad { padding: 120px 48px; }
        .nav-pad { padding: 20px 48px; }
        .footer-pad { padding: 32px 48px; }
        @media (pointer: coarse) { * { cursor: auto !important; } }
        @media (max-width: 768px) {
          .hamburger { display: flex; }
          .desktop-nav { display: none !important; }
          .desktop-logo { display: none !important; }
          .mobile-menu { display: flex; flex-direction: column; gap: 0; position: fixed; top: 64px; right: 0; left: 0; background: rgba(10,10,10,0.98); backdrop-filter: blur(20px); border-bottom: 1px solid #1a1a1a; z-index: 99; padding: 8px 0; }
          .mobile-menu .nav-link { padding: 16px 24px; font-size: 16px; border-bottom: 1px solid #111; }
          .mobile-menu .nav-link.active::after { display: none; }
          .skills-grid { grid-template-columns: 1fr; gap: 48px; }
          .hero-buttons { flex-direction: column; align-items: stretch; }
          .hero-buttons button { text-align: center; }
          .hero-stats { gap: 24px; flex-wrap: wrap; }
          .section-pad { padding: 80px 20px; }
          .nav-pad { padding: 16px 20px; }
          .footer-pad { padding: 24px 20px; flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      <Cursor />

      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)",
        backdropFilter: "blur(12px)",
      }}>
        <div className="nav-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 13, color: "#C8F563", letterSpacing: 2 }}>
            ✦ جنجال
          </div>
          <div className="desktop-nav" style={{ display: "flex", gap: 32 }}>
            {navItems.map(n => (
              <span key={n.id} className={`nav-link ${active === n.id ? "active" : ""}`} onClick={() => scrollTo(n.id)} data-hover>
                {n.label}
              </span>
            ))}
          </div>
          <div className="desktop-logo" style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#444", letterSpacing: 1 }}>
            FRONTEND DEVELOPER
          </div>
          <div className="hamburger" onClick={() => setMenuOpen(o => !o)} data-hover>
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            {navItems.map(n => (
              <span key={n.id} className={`nav-link ${active === n.id ? "active" : ""}`} onClick={() => scrollTo(n.id)}>
                {n.label}
              </span>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" ref={heroRef} className="section-pad" style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", paddingTop: 0, paddingBottom: 0 }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,245,99,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,200,245,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 900, paddingTop: 80 }}>
          <div className={`fade-up ${heroIn ? "visible" : ""}`} style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: "#C8F563", letterSpacing: 4, marginBottom: 24, textTransform: "uppercase" }}>
            ✦ در دسترس برای پروژه‌های جدید
          </div>

          <h1 className={`fade-up d1 ${heroIn ? "visible" : ""}`} style={{ fontSize: "clamp(52px, 8vw, 96px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 8, fontStyle: "italic" }}>
            توسعه‌دهنده
          </h1>
          <h1 className={`fade-up d1 ${heroIn ? "visible" : ""}`} style={{ fontSize: "clamp(52px, 8vw, 96px)", fontWeight: 900, lineHeight: 1.05, color: "#C8F563", marginBottom: 8, fontStyle: "italic" }}>
            فرانت‌اند
          </h1>
          <h1 className={`fade-up d1 ${heroIn ? "visible" : ""}`} style={{ fontSize: "clamp(52px, 8vw, 96px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 40, fontStyle: "italic" }}>
            و وب
          </h1>

          <p className={`fade-up d2 ${heroIn ? "visible" : ""}`} style={{ fontSize: 18, color: "#777", maxWidth: 520, lineHeight: 1.8, marginBottom: 48 }}>
            رابط‌های کاربری سریع، زیبا و قابل نگهداری می‌سازم — با React و Next.js، با تمرکز بر تجربه کاربر و کد تمیز.
          </p>

          <div className={`fade-up d3 hero-buttons ${heroIn ? "visible" : ""}`}>
            <button data-hover onClick={() => scrollTo("projects")} style={{
              padding: "14px 32px", background: "#C8F563", color: "#0a0a0a",
              border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700,
              cursor: "none", fontFamily: "inherit", transition: "all 0.3s", letterSpacing: 0.5,
            }}
              onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}>
              مشاهده پروژه‌ها ←
            </button>
            <button data-hover onClick={() => scrollTo("contact")} style={{
              padding: "14px 32px", background: "transparent", color: "#e8e8e8",
              border: "1px solid #333", borderRadius: 100, fontSize: 14,
              cursor: "none", fontFamily: "inherit", transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.target.style.borderColor = "#C8F563"; e.target.style.color = "#C8F563"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#e8e8e8"; }}>
              تماس با من
            </button>
          </div>

          <div className={`fade-up d4 hero-stats ${heroIn ? "visible" : ""}`}>
            {[["۱+", "سال تجربه"], ["۳+", "پروژه تحویل‌شده"], ["۱۰۰٪", "رضایت مشتریان"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#C8F563", fontFamily: "'IBM Plex Mono'" }}>{n}</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" ref={projRef} className="section-pad">
        <div className={`fade-up ${projIn ? "visible" : ""}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64 }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#555", letterSpacing: 4, marginBottom: 12 }}>02 — PROJECTS</div>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900 }}>پروژه‌های برگزیده</h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {projects.map((p, i) => (
            <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer"
              data-hover className={`proj-card fade-up d${i % 4 + 1} ${projIn ? "visible" : ""}`}
              style={{
                background: "#111", borderRadius: 20, overflow: "hidden", position: "relative",
                cursor: "none", border: "1px solid #1a1a1a", textDecoration: "none", color: "inherit", display: "block",
              }}>
              <div style={{ height: 180, background: `linear-gradient(135deg, #151515 0%, #0d0d0d 100%)`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${p.color}18`, border: `1px solid ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${p.color}30` }} />
                </div>
                <div style={{ position: "absolute", top: 16, left: 16, fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#444" }}>{p.year}</div>
                <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 12px", background: `${p.color}15`, border: `1px solid ${p.color}30`, borderRadius: 100, fontSize: 11, color: p.color }}>{p.category}</div>
                <div className="proj-overlay" style={{ position: "absolute", inset: 0, background: `${p.color}10`, opacity: 0, transition: "opacity 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 24 }}>↗</span>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 16 }}>{p.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section id="skills" ref={skillRef} className="section-pad" style={{ background: "#080808" }}>
        <div className={`fade-up ${skillIn ? "visible" : ""}`} style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#555", letterSpacing: 4, marginBottom: 12 }}>03 — SKILLS</div>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900 }}>مهارت‌ها و ابزارها</h2>
        </div>

        <div className="skills-grid">
          <div>
            <h3 style={{ fontSize: 16, color: "#555", marginBottom: 32, letterSpacing: 1 }}>تخصص‌های اصلی</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {skills.map((s, i) => (
                <div key={s.name} className={`fade-up d${i % 4 + 1} ${skillIn ? "visible" : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 15 }}>{s.name}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: "#C8F563" }}>{s.level}%</span>
                  </div>
                  <AnimatedBar level={s.level} color="#C8F563" inView={skillIn} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, color: "#555", marginBottom: 32, letterSpacing: 1 }}>ابزارهای کاری</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {tools.map(t => <span key={t} className="tool-pill">{t}</span>)}
            </div>
            <div style={{ marginTop: 48, padding: 32, background: "#111", borderRadius: 20, border: "1px solid #1a1a1a" }}>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#C8F563", letterSpacing: 3, marginBottom: 16 }}>APPROACH</div>
              <p style={{ fontSize: 15, color: "#666", lineHeight: 1.9 }}>
                برنامه‌نویسی برای من یعنی ساختن چیزی که هم کار کنه، هم خوب به نظر برسه. کد تمیز، عملکرد بالا، و تجربه کاربری روان — اینا چیزاییه که همیشه دنبالشونم.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section-pad">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#555", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>04 — CONTACT</div>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, textAlign: "center", marginBottom: 16 }}>بیا باهم کار کنیم</h2>
          <p style={{ textAlign: "center", color: "#555", fontSize: 16, lineHeight: 1.7, marginBottom: 56 }}>
            پروژه جدید داری؟ ایده‌ای تو ذهنته؟ دوست دارم بشنوم.
          </p>

          {sent ? (
            <div style={{ textAlign: "center", padding: 48, background: "#111", borderRadius: 20, border: "1px solid #C8F56340" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#C8F563", marginBottom: 8 }}>پیام دریافت شد!</div>
              <div style={{ color: "#555" }}>به زودی باهات تماس می‌گیرم.</div>
              <button onClick={() => setSent(false)} data-hover style={{ marginTop: 24, padding: "10px 24px", background: "transparent", border: "1px solid #333", borderRadius: 100, color: "#888", cursor: "none", fontFamily: "inherit", fontSize: 13 }}>
                ارسال پیام دیگه
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "name", placeholder: "اسمت چیه؟", type: "input" },
                { key: "email", placeholder: "ایمیلت چیه؟", type: "input" },
                { key: "message", placeholder: "پروژه‌ات رو توضیح بده...", type: "textarea" },
              ].map(f => {
                const commonStyle = {
                  width: "100%", padding: "16px 20px",
                  background: "#111", border: "1px solid #1a1a1a",
                  borderRadius: 14, color: "#e8e8e8", fontSize: 15,
                  fontFamily: "inherit", direction: "rtl",
                  transition: "border-color 0.2s",
                };
                return f.type === "textarea" ? (
                  <textarea key={f.key} rows={5} placeholder={f.placeholder} value={formData[f.key]}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    style={commonStyle}
                    onFocus={e => e.target.style.borderColor = "#C8F563"}
                    onBlur={e => e.target.style.borderColor = "#1a1a1a"} />
                ) : (
                  <input key={f.key} type="text" placeholder={f.placeholder} value={formData[f.key]}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    style={commonStyle}
                    onFocus={e => e.target.style.borderColor = "#C8F563"}
                    onBlur={e => e.target.style.borderColor = "#1a1a1a"} />
                );
              })}
              {error && <div style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", padding: "8px 0" }}>{error}</div>}
              <button data-hover onClick={handleSubmit} disabled={sending} style={{
                padding: "16px", background: sending ? "#333" : "#C8F563", color: sending ? "#888" : "#0a0a0a",
                border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700,
                cursor: sending ? "not-allowed" : "none", fontFamily: "inherit", marginTop: 8,
                transition: "all 0.3s",
              }}>
                {sending ? "در حال ارسال..." : "ارسال پیام ✦"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-pad" style={{ borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#333" }}>© 2026 — JNJAL</div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "GitHub", href: "https://github.com/jnjal" },
            { label: "LinkedIn", href: "#" },
            { label: "Dribbble", href: "#" },
          ].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              data-hover style={{ fontSize: 12, color: "#444", cursor: "none", transition: "color 0.2s", textDecoration: "none" }}
              onMouseEnter={e => e.target.style.color = "#C8F563"}
              onMouseLeave={e => e.target.style.color = "#444"}>{s.label}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}