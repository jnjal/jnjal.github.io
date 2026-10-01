import { useRef, useState } from "react";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { MUSIC } from "../data/content";
import "./Music.css";

function fmt(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Music() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  const pct = duration ? (time / duration) * 100 : 0;
  const track = MUSIC.favorite;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setFailed(true));
    else a.pause();
  };

  return (
    <section id="music" className="section">
      <div className="container">
        <Reveal className="kicker">موزیک</Reveal>
        <Reveal delay={60}><h2 className="page-title">یه آهنگ، همین‌جا گوش بده</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          موزیک مورد علاقه‌ام رو گذاشتم که هرکی خواست لازم نباشه جای دیگه‌ای دنبالش بگرده.
        </Reveal>

        <Reveal className={`gramo${playing ? " is-playing" : ""}`}>
          <audio
            ref={audioRef}
            src={track.src}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onError={() => setFailed(true)}
          />

          <div className="gramo-deck">
            <button
              type="button"
              className="disc"
              onClick={toggle}
              data-hover
              aria-label={playing ? "توقف پخش" : "پخش آهنگ"}
            >
              <span className="disc-grooves" />
              <span className="disc-label">
                <span className="disc-title">{track.title}</span>
                <span className="disc-artist">{track.artist}</span>
              </span>
              <span className="disc-hole" />
            </button>
            <span className="deck-arm" aria-hidden="true" />
          </div>

          <div className="gramo-info">
            <div className="gramo-state mono">
              <span className="gramo-dot" aria-hidden="true" />
              {playing ? "در حال پخش" : "آماده‌ی پخش"}
            </div>

            <div className="gramo-title">{track.title}</div>
            <div className="gramo-artist dim">{track.artist}</div>

            <input
              type="range"
              className="gramo-range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              style={{ "--pct": `${pct}%` }}
              onChange={(e) => {
                const a = audioRef.current;
                if (a) a.currentTime = Number(e.target.value);
              }}
              aria-label="پیشرفت آهنگ"
              disabled={!duration}
            />
            <div className="gramo-time mono faint">
              <span>{fmt(time)}</span>
              <span>{fmt(duration)}</span>
            </div>

            <div className="gramo-controls">
              <button
                type="button"
                className="gramo-btn"
                onClick={toggle}
                data-hover
                aria-label={playing ? "توقف" : "پخش"}
              >
                {playing ? <Icon name="pause" size={16} /> : <Icon name="play" size={16} />}
              </button>
              <span className="gramo-hint faint">روی صفحه بزن تا پخش بشه</span>
            </div>

            {failed && (
              <div className="gramo-error">
                فایل صوتی پیدا نشد — فایل رو بذار توی <span className="mono">public/music/</span>
              </div>
            )}
          </div>
        </Reveal>

        <div className="crate-head">
          <h3 className="section-h" style={{ margin: 0 }}>بند‌های مورد علاقم</h3>
          <span className="crate-hint faint">روی هر صفحه برو تا بیاد بیرون</span>
        </div>

        <div className="crate">
          <div className="bands">
            {MUSIC.bands.map((b, i) => (
              <Reveal key={b} delay={i * 45} className="band-slot">
                <div className="band-disc">
                  <span className="band-grooves" aria-hidden="true" />
                  <span className="band-label">
                    <span className="band-name">{b}</span>
                  </span>
                  <span className="band-hole" aria-hidden="true" />
                  <span className="band-info mono">
                    <span className="band-index">{String(i + 1).padStart(2, "0")}</span>
                    {b}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="crate-front">
            <span className="mono">{String(MUSIC.bands.length).padStart(2, "0")} صفحه</span>
            <span className="crate-front-line" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
