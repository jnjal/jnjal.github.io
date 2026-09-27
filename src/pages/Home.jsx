import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { NOW, PROJECTS } from "../data/content";
import "./Home.css";

export default function Home() {
  const featured = PROJECTS.filter((p) => p.featured).slice(0, 2);

  return (
    <div className="page home">
      <div className="container">
        <div className="home-hero">
          <Reveal className="kicker">سلام، دیر وقته و من هنوز بیدارم</Reveal>
          <Reveal delay={80}>
            <h1 className="home-title">
              سلام، من <span className="accent-text">جنجال</span>ـم.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="home-sub">برای اینترنت چیز می‌سازم — بات، رابط کاربری، و هر چی وسطش پیدا بشه.</p>
          </Reveal>

          <Reveal delay={240} className="home-actions">
            <Link to="/projects" className="btn btn-primary" data-hover>پروژه‌ها</Link>
            <Link to="/now" className="btn" data-hover>الان چیکار می‌کنم؟</Link>
          </Reveal>
        </div>

        <Reveal delay={100} className="now-strip">
          {NOW.items.slice(0, 3).map((item) => (
            <div key={item.label} className="now-strip-item">
              <span>{item.emoji}</span>
              <div>
                <div className="faint mono" style={{ fontSize: 11 }}>{item.label}</div>
                <div style={{ fontSize: 14 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal className="home-projects">
          <div className="home-projects-head">
            <h2 style={{ fontSize: 20 }}>یه دو تا چیزی که ساختم</h2>
            <Link to="/projects" className="footer-link" data-hover>همه‌شون ←</Link>
          </div>
          <div className="home-projects-grid">
            {featured.map((p) => (
              <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer" className="card home-project-card" data-hover>
                <div className="mono faint" style={{ fontSize: 11, marginBottom: 10 }}>{p.category} · {p.year}</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{p.title}</h3>
                <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.8 }}>{p.desc}</p>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
