import { memo, useEffect, useRef, useState } from "react";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { prefersReducedMotion } from "../hooks/useTyped";
import { MUSIC } from "../data/content";
import "./Music.css";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const VIZ_BARS = 28;

function fmt(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const Chevron = ({ dir }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {dir === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
  </svg>
);

// جعبه‌ی صفحه‌ها — memo تا ری‌رندرهای پخش (timeupdate هر ~۲۵۰ms) بهش نرسه
const Crate = memo(function Crate() {
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });
  const [openSlot, setOpenSlot] = useState(null);
  const [scrollable, setScrollable] = useState(false);

  // فقط وقتی محتوا از عرض جعبه بیشتره، فلش‌ها و فِیِدها نشون داده می‌شن
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 8);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scrollTo = (dir) => {
    scrollRef.current?.scrollBy({
      left: dir * 240,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  // درگ با موس (تاچ از اسکرول بومی استفاده می‌کنه) — بدون ری‌رندر
  const onPointerDown = (e) => {
    if (e.pointerType === "touch") return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
    };
    el.classList.add("is-dragging");
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    const el = scrollRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (d.moved > 4) el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = () => {
    const el = scrollRef.current;
    dragRef.current.active = false;
    el?.classList.remove("is-dragging");
  };

  const slotClick = (i) => {
    if (dragRef.current.moved > 6) return;
    setOpenSlot((o) => (o === i ? null : i));
  };

  return (
    <>
      <div className="crate-head">
        <div className="crate-head-right">
          <h3 className="section-h" style={{ margin: 0 }}>بند‌های مورد علاقم</h3>
          {scrollable && (
            <div className="crate-nav">
              <button
                type="button"
                className="crate-arrow"
                onClick={() => scrollTo(1)}
                aria-label="صفحات قبلی"
                data-hover
              >
                <Chevron dir="right" />
              </button>
              <button
                type="button"
                className="crate-arrow"
                onClick={() => scrollTo(-1)}
                aria-label="صفحات بعدی"
                data-hover
              >
                <Chevron dir="left" />
              </button>
            </div>
          )}
        </div>
        <span className="crate-hint faint">روی هر صفحه برو تا بیاد بیرون</span>
      </div>

      <div className={`crate${scrollable ? " has-scroll" : ""}`}>
        <div
          className="bands"
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {MUSIC.bands.map((b, i) => {
            const rot = (i % 2 ? 1 : -1) * (2 + (i % 3));
            const isOpen = openSlot === i;
            return (
              <Reveal
                key={b.name}
                delay={i * 45}
                className={`band-slot${isOpen ? " is-open" : ""}`}
                style={{ "--rot": `${rot}deg` }}
              >
                <div
                  className="band-disc"
                  tabIndex={0}
                  role="button"
                  aria-expanded={isOpen}
                  aria-label={`${b.name} — اطلاعات بیشتر`}
                  onClick={() => slotClick(i)}
                  onFocus={() => {
                    if (dragRef.current.moved < 6) setOpenSlot(i);
                  }}
                  onBlur={() => setOpenSlot((o) => (o === i ? null : o))}
                >
                  <span className="band-grooves" aria-hidden="true" />
                  <span className="band-label">
                    <span className="band-name">{b.name}</span>
                  </span>
                  <span className="band-hole" aria-hidden="true" />
                  <span className="band-info mono">{b.name}</span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="crate-front">
          <span className="mono">{faNum(MUSIC.bands.length)} صفحه</span>
          <span className="crate-front-line" aria-hidden="true" />
        </div>
      </div>
    </>
  );
});

export default function Music() {
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const barsRef = useRef([]);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const [volume, setVolume] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [plays, setPlays] = useState(0);

  const pct = duration ? (time / duration) * 100 : 0;
  const track = MUSIC.favorite;

  // گراف صدا برای ویژوالایزر — فقط یکبار و بعد از اولین پخش (سیاست autoplay)
  const ensureGraph = () => {
    if (ctxRef.current || !audioRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      /* اگه WebAudio در دسترس نبود، بی‌صدا بدون ویژوالایزر ادامه میده */
    }
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      ensureGraph();
      ctxRef.current?.resume?.();
      a.play().catch(() => setFailed(true));
    } else {
      a.pause();
    }
  };

  const toggleRepeat = () => {
    setRepeat((r) => {
      const next = !r;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  };

  // ویژوالایزر — داده‌ی طیف مستقیم روی DOM، بدون ری‌رندر
  useEffect(() => {
    if (!playing || !analyserRef.current || prefersReducedMotion()) return undefined;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const usable = Math.max(8, Math.floor(data.length * 0.62));
    let raf = 0;

    const loop = () => {
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < VIZ_BARS; i += 1) {
        const idx = Math.floor((i / VIZ_BARS) * usable);
        const v = data[idx] / 255;
        const el = barsRef.current[i];
        if (el) el.style.transform = `scaleY(${Math.max(0.06, v)})`;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // پاک‌سازی موقع خروج
  useEffect(
    () => () => {
      ctxRef.current?.close?.();
      ctxRef.current = null;
      analyserRef.current = null;
    },
    []
  );

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
            onPlay={() => {
              setPlaying(true);
              setPlays((p) => p + 1);
            }}
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
            {(track.year || track.album) && (
              <div className="gramo-meta mono faint">
                {[track.album, track.year].filter(Boolean).join(" · ")}
              </div>
            )}

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

            <div className="gramo-viz" aria-hidden="true">
              {Array.from({ length: VIZ_BARS }, (_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    barsRef.current[i] = el;
                  }}
                />
              ))}
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
              {plays > 0 && (
                <span className="gramo-plays mono faint">{faNum(plays)} بار گوش دادی</span>
              )}
              <span className="gramo-hint faint">روی صفحه بزن تا پخش بشه</span>

              <div className="gramo-tools">
                <button
                  type="button"
                  className={`gramo-mini${repeat ? " is-on" : ""}`}
                  onClick={toggleRepeat}
                  data-hover
                  aria-label="تکرار آهنگ"
                  aria-pressed={repeat}
                >
                  <Icon name="repeat" size={15} />
                </button>
                <span className="gramo-vol-ic" aria-hidden="true">
                  <Icon name="volume" size={15} />
                </span>
                <input
                  type="range"
                  className="gramo-vol"
                  min="0"
                  max="1"
                  step="0.02"
                  value={volume}
                  style={{ "--pct": `${volume * 100}%` }}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  aria-label="صدا"
                />
              </div>
            </div>

            {failed && (
              <div className="gramo-error">
                فایل صوتی پیدا نشد — فایل رو بذار توی <span className="mono">public/music/</span>
              </div>
            )}
          </div>
        </Reveal>

        {MUSIC.why && <p className="gramo-why">«{MUSIC.why}»</p>}

        <Crate />
      </div>
    </section>
  );
}
