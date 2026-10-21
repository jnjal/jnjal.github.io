import { Suspense, lazy, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Reveal from "../components/Reveal";
import { PROJECTS } from "../data/content";
import "./Projects.css";

const LicenseModal = lazy(() => import("../components/LicenseModal"));

// فنر دکمه‌ها — حس فیزیکی موقع هاور/کلیک
const SPRING = { type: "spring", stiffness: 420, damping: 22 };

// کارت پروژه: ورود نرم و پله‌ای با Motion (به‌جای Reveal که کل کارت رو یک‌جا می‌آورد)
function StoryCard({ project: p, index, onLicense }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="story-slot"
      initial={reduced ? false : { opacity: 0, y: 34, scale: 0.985 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        delay: reduced ? 0 : (index % 3) * 0.08,
      }}
    >
      <article className="story">
        <span className="story-ghost mono" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
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
            <motion.button
              type="button"
              className="btn btn-primary"
              data-hover
              data-no-magnet
              onClick={onLicense}
              whileHover={reduced ? undefined : { scale: 1.04 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              transition={SPRING}
            >
              {p.cta} ✦
            </motion.button>
          ) : (
            <motion.a
              href={p.link}
              className="btn btn-primary"
              data-hover
              data-no-magnet
              target={p.external ? "_blank" : undefined}
              rel={p.external ? "noopener noreferrer" : undefined}
              whileHover={reduced ? undefined : { scale: 1.04 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              transition={SPRING}
            >
              {p.cta} {p.external ? "↗" : ""}
            </motion.a>
          )}
        </div>
      </article>
    </motion.div>
  );
}

export default function Projects() {
  const [licenseOpen, setLicenseOpen] = useState(false);

  return (
    <section id="projects" className="section">
      <div className="container">
        <Reveal className="kicker">پروژه‌ها</Reveal>
        <Reveal delay={60}><h2 className="page-title">چیزایی که ساختم</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          اینجا فقط اسم پروژه‌ها رو ردیف نکردم؛ هرکدوم یه کم داستان دارن. چی شد شروعشون کردم و آخرش به کجا رسیدن.
        </Reveal>

        <div className="stories">
          {PROJECTS.map((p, i) => (
            <StoryCard
              key={p.id}
              project={p}
              index={i}
              onLicense={() => setLicenseOpen(true)}
            />
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
