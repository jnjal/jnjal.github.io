import { Suspense, lazy, useState } from "react";
import Reveal from "../components/Reveal";

const LicenseModal = lazy(() => import("../components/LicenseModal"));
import { PROJECTS } from "../data/content";
import "./Projects.css";

export default function Projects() {
  const [licenseOpen, setLicenseOpen] = useState(false);

  return (
    <section id="projects" className="section">
      <div className="container">
        <Reveal className="kicker">پروژه‌ها</Reveal>
        <Reveal delay={60}><h2 className="page-title">دو تا داستان</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          اینجا پروژه رو به‌صورت کارت نشون نمیدم. هر کدوم یه داستان داره: از کجا شروع شد، چی شد، و حالا کجاست.
        </Reveal>

        <div className="stories">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.id} delay={i * 110} className="story">
              <span className="story-ghost mono" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="story-meta">
                <span className="tag">{p.category}</span>
                <span className="mono faint" style={{ fontSize: 11 }}>{p.year}</span>
                {p.badge && <span className="story-badge">{p.badge}</span>}
              </div>

              <h3 className="story-title">{p.title}</h3>

              <div className="story-text">
                {p.story.map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>

              <div className="story-foot">
                <div className="project-tags">
                  {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>

                {p.license ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-hover
                    onClick={() => setLicenseOpen(true)}
                  >
                    {p.cta} ✦
                  </button>
                ) : (
                  <a
                    href={p.link}
                    className="btn btn-primary"
                    data-hover
                    target={p.external ? "_blank" : undefined}
                    rel={p.external ? "noopener noreferrer" : undefined}
                  >
                    {p.cta} {p.external ? "↗" : ""}
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {licenseOpen && (
          <Suspense fallback={null}>
            <LicenseModal onClose={() => setLicenseOpen(false)} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
