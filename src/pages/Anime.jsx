import Reveal from "../components/Reveal";
import { ANIME } from "../data/content";
import "./Anime.css";

export default function Anime() {
  return (
    <section id="anime" className="section anime">
      <div className="container anime-inner">
        <span className="anime-jp" aria-hidden="true">アニメ</span>

        <Reveal className="kicker">انیمه</Reveal>
        <Reveal delay={60}><h2 className="page-title">یه بخش کوچیک از هویتم</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          نه همه‌ی این سایت، فقط یه گوشه‌اش.
        </Reveal>

        <Reveal delay={160} className="ticket">
          <div className="ticket-main">
            <div className="ticket-live mono">
              <span className="ticket-dot" aria-hidden="true" />
              در حال تماشا
            </div>
            <div className="ticket-title">{ANIME.watching.title}</div>
            <div className="ticket-arc">{ANIME.watching.arc}</div>
            <div className="ticket-code mono">ep. {ANIME.watching.ep} · now playing</div>
          </div>

          <div className="ticket-stub">
            <div className="ticket-stub-label mono">قسمت</div>
            <div className="ticket-stub-num">{ANIME.watching.ep}</div>
          </div>
        </Reveal>

        <div className="anime-fav-head">
          <h3 className="section-h" style={{ margin: 0 }}>محبوب‌ترین‌ها</h3>
          <span className="mono faint" style={{ fontSize: 11 }}>
            {String(ANIME.favorites.length).padStart(2, "0")} عنوان
          </span>
        </div>

        <div className="anime-grid">
          {ANIME.favorites.map((a, i) => (
            <Reveal key={a.title} delay={i * 90} className="fav-card">
              <span className="fav-num mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="fav-title">{a.title}</div>
              <p className="fav-note dim">{a.note}</p>
              <span className="fav-bar" aria-hidden="true" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
