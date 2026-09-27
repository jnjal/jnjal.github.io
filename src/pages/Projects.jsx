import Reveal from "../components/Reveal";
import { PROJECTS } from "../data/content";
import "./Projects.css";

export default function Projects() {
  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">پروژه‌ها</Reveal>
        <Reveal delay={60}><h1 className="page-title">چیزایی که ساختم</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          بعضی‌هاشون کامل شدن، بعضی‌هاشون هنوز در حال تغییرن. هر کدوم یه دلیلی برای وجود داشتن دارن.
        </Reveal>

        <div className="projects-grid">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90}>
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="card project-card" data-hover>
                <div className="project-card-top">
                  <span className="mono faint" style={{ fontSize: 11 }}>{p.year}</span>
                  <span className="tag">{p.category}</span>
                </div>
                <h3 style={{ fontSize: 19, margin: "14px 0 10px" }}>{p.title}</h3>
                <p className="dim" style={{ fontSize: 14, lineHeight: 1.85, marginBottom: 18 }}>{p.desc}</p>
                <div className="project-tags">
                  {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
                <span className="project-arrow" aria-hidden="true">↗</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
