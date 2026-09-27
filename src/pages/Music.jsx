import Reveal from "../components/Reveal";
import { MUSIC } from "../data/content";
import "./Music.css";

export default function Music() {
  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">موزیک</Reveal>
        <Reveal delay={60}><h1 className="page-title">چیزی که این روزا گوشمه</h1></Reveal>
        <Reveal delay={120} className="page-lede">معمولاً وقتی کد می‌زنم، یه چیزی پس‌زمینه‌ست.</Reveal>

        <Reveal className="card now-playing">
          <div className="np-bars" aria-hidden="true"><span /><span /><span /><span /></div>
          <div>
            <div className="mono faint" style={{ fontSize: 11, marginBottom: 8 }}>الان پخش می‌شه</div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{MUSIC.nowPlaying.track}</div>
            <div className="dim" style={{ fontSize: 14, marginBottom: 6 }}>{MUSIC.nowPlaying.artist}</div>
            <div className="faint" style={{ fontSize: 12.5 }}>{MUSIC.nowPlaying.note}</div>
          </div>
        </Reveal>

        <Reveal delay={80}><h2 className="section-h" style={{ marginTop: 56 }}>اخیراً گوش دادم</h2></Reveal>
        <div className="recent-list">
          {MUSIC.recent.map((m, i) => (
            <Reveal key={m.track} delay={i * 60} className="recent-row">
              <span className="mono faint" style={{ fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div style={{ fontSize: 14.5 }}>{m.track}</div>
                <div className="dim" style={{ fontSize: 12.5 }}>{m.artist}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
