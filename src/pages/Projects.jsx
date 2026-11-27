import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Reveal from "../components/Reveal";
import { PROJECTS } from "../data/content";
import "./Projects.css";

const LicenseModal = lazy(() => import("../components/LicenseModal"));

// فنر دکمه‌ها — حس فیزیکی موقع هاور/کلیک
const SPRING = { type: "spring", stiffness: 420, damping: 22 };

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

// کارت پروژه: ورود نرم و پله‌ای با Motion (به‌جای Reveal که کل کارت رو یک‌جا می‌آورد)
function StoryCard({ project: p, index, onLicense, slotRef }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={slotRef}
      data-index={index}
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
      <article className="story" data-buy={p.licenseFor ? "true" : undefined}>
        <div className="story-rail">
          <span className="story-rail-label mono" aria-hidden="true">فصل</span>
          <span className="story-rail-num mono" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="story-rail-line" aria-hidden="true" />
          <span className="story-rail-cat">{p.category}</span>
        </div>

        <div className="story-main">
          <div className="story-meta">
            <span className="mono faint" style={{ fontSize: 11 }}>{p.year}</span>
            {p.badge && <span className="story-badge">{p.badge}</span>}
          </div>

          <h3 className="story-title" dir="auto">{p.title}</h3>

          <div className="story-text">
            {p.story.map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>

          <div className="story-foot">
            <div className="project-tags">
              {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>

            {p.licenseFor ? (
              <motion.button
                type="button"
                className="btn btn-primary"
                data-hover
                data-no-magnet
                onClick={() => onLicense(p)}
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
        </div>
      </article>
    </motion.div>
  );
}

export default function Projects() {
  const [licenseProject, setLicenseProject] = useState(null);
  const [active, setActive] = useState(0);
  const slotRefs = useRef([]);

  // فهرست فصل‌ها با اسکرول هم‌گام می‌شه
  useEffect(() => {
    const nodes = slotRefs.current.filter(Boolean);
    if (!nodes.length) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    nodes.forEach((node) => obs.observe(node));
    return () => obs.disconnect();
  }, []);

  const jumpTo = (index) => {
    slotRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="projects" className="section">
      <div className="container">
        <div className="projects-head">
          <div className="projects-head-main">
            <Reveal className="kicker">پروژه‌ها</Reveal>
            <Reveal delay={60}><h2 className="page-title">چیزایی که ساختم</h2></Reveal>
            <Reveal delay={120} className="page-lede">
              اینجا فقط اسم پروژه‌ها رو ردیف نکردم؛ هرکدوم یه کم داستان دارن. چی شد شروعشون کردم و آخرش به کجا رسیدن.
            </Reveal>
          </div>

          <Reveal delay={180} className="projects-index">
            <div className="projects-index-head mono">
              <span>فهرست فصل‌ها</span>
              <span>{faNum(PROJECTS.length)} فصل</span>
            </div>
            <ol>
              {PROJECTS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`chapter-link${active === i ? " is-active" : ""}`}
                    aria-current={active === i ? "true" : undefined}
                    onClick={() => jumpTo(i)}
                    data-hover
                  >
                    <span className="chapter-link-no mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="chapter-link-title">{p.title}</span>
                    <span className="chapter-link-dot" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="stories">
          {PROJECTS.map((p, i) => (
            <StoryCard
              key={p.id}
              project={p}
              index={i}
              onLicense={setLicenseProject}
              slotRef={(el) => { slotRefs.current[i] = el; }}
            />
          ))}
        </div>

        {licenseProject && (
          <Suspense fallback={null}>
            <LicenseModal project={licenseProject} onClose={() => setLicenseProject(null)} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
