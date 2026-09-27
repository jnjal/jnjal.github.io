import Reveal from "../components/Reveal";
import { ANIME } from "../data/content";
import "./Anime.css";

export default function Anime() {
  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">انیمه</Reveal>
        <Reveal delay={60}><h1 className="page-title">یه بخش کوچیک از هویتم</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          نه همه‌ی این سایت، فقط یه گوشه‌اش.
        </Reveal>

        <Reveal className="card watching-card">
          <div className="mono faint" style={{ fontSize: 11, marginBottom: 10 }}>در حال تماشا</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{ANIME.watching.title}</div>
          <div className="dim" style={{ fontSize: 14 }}>{ANIME.watching.detail}</div>
        </Reveal>

        <Reveal delay={80}><h2 className="section-h" style={{ marginTop: 56 }}>محبوب‌ترین‌ها</h2></Reveal>
        <div className="anime-grid">
          {ANIME.favorites.map((a, i) => (
            <Reveal key={a.title} delay={i * 70} className="card anime-fav">
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{a.title}</div>
              <div className="dim" style={{ fontSize: 13, lineHeight: 1.8 }}>{a.note}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
