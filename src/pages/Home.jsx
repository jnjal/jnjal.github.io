import { useEffect, useState } from "react";
import Reveal from "../components/Reveal";
import Clock from "../components/Clock";
import { TOOLS } from "../data/content";
import "./Home.css";

const CYCLE = ["چیز می‌سازم", "بات می‌نویسم", "ابزار می‌سازم", "خط می‌شکنم"];

function useCycle(words, ms) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % words.length), ms);
    return () => clearInterval(id);
  }, [words.length, ms]);

  return words[i];
}

export default function Home() {
  const word = useCycle(CYCLE, 2600);

  return (
    <section id="home" className="section home">
      <div className="container">
        <div className="home-hero">
          <div className="home-main">
            <Reveal className="kicker home-kicker">
              <span className="home-kicker-dot" aria-hidden="true" />
              سلام، دیر وقته و من هنوز بیدارم
            </Reveal>

            <Reveal delay={70}>
              <h1 className="home-title">
                سلام، من <span className="home-name">جنجال</span>ـم.
              </h1>
            </Reveal>

            <Reveal delay={140} className="home-sub">
              برای اینترنت{" "}
              <span className="home-cycle">
                {CYCLE.map((w) => (
                  <span
                    key={w}
                    className={`home-cycle-word${w === word ? " is-on" : ""}`}
                    aria-hidden={w === word ? undefined : "true"}
                  >
                    {w}
                  </span>
                ))}
              </span>{" "}
              — و هر چی وسطش پیدا بشه.
            </Reveal>

            <Reveal delay={210} className="home-actions">
              <a href="#projects" className="btn btn-primary" data-hover>پروژه‌ها</a>
              <a href="#now" className="btn" data-hover>الان چیکار می‌کنم؟</a>
              <a href="#about" className="home-scroll" data-hover aria-label="برو پایین">
                <span aria-hidden="true">↓</span>
              </a>
            </Reveal>
          </div>

          <Reveal delay={280} className="home-card">
            <div className="home-card-head">
              <span className="home-card-mark" aria-hidden="true">✦</span>
              <span className="mono faint">status.txt</span>
            </div>

            <div className="home-card-live">
              <span className="home-live-dot" aria-hidden="true" />
              آنلاین و بیدار
            </div>

            <dl className="home-card-rows">
              <div>
                <dt className="mono">local</dt>
                <dd><Clock /></dd>
              </div>
              <div>
                <dt className="mono">based</dt>
                <dd>ایران</dd>
              </div>
              <div>
                <dt className="mono">stack</dt>
                <dd className="mono">React · Workers · TS</dd>
              </div>
              <div>
                <dt className="mono">open</dt>
                <dd>برای یه پروژه‌ی خوب</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={340} className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <span key={`${t}-${i}`} className="ticker-item mono">
                {t}
                <span className="ticker-sep">✦</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
