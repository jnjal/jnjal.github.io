import { memo, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { prefersReducedMotion } from "../hooks/useTyped";
import { MUSIC } from "../data/content";
import "./Music.css";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const VIZ_BARS = 28;
/* ارتفاع ثابت میله‌ها در حالت توقف — یک موج ثابت، نه خط صاف */
const VIZ_SHAPE = [
  0.34, 0.52, 0.4, 0.66, 0.46, 0.78, 0.58, 0.9,
  0.62, 0.44, 0.72, 0.5, 0.86, 0.6, 0.38, 0.7,
  0.54, 0.82, 0.48, 0.64, 0.36, 0.58, 0.76, 0.42,
  0.66, 0.5, 0.74, 0.4,
];

function fmt(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const Chevron = ({ dir }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {dir === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
  </svg>
);

const Crate = memo(function Crate() {
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });
  const [openSlot, setOpenSlot] = useState(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 8);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scrollTo = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "touch") return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: 0 };
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
          <h3 className="section-h" style={{ margin: 0 }}>بندایی که زیاد گوش می‌دم</h3>
          {scrollable && (
            <div className="crate-nav">
              <button type="button" className="crate-arrow" onClick={() => scrollTo(1)} aria-label="صفحات قبلی" data-hover><Chevron dir="right" /></button>
              <button type="button" className="crate-arrow" onClick={() => scrollTo(-1)} aria-label="صفحات بعدی" data-hover><Chevron dir="left" /></button>
            </div>
          )}
        </div>
        <span className="crate-hint faint">✦ روی هر صفحه برو تا بیاد بیرون</span>
      </div>

      <div className={`crate${scrollable ? " has-scroll" : ""}`}>
        <div className="bands" ref={scrollRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
          {MUSIC.bands.map((b, i) => {
            const rot = (i % 2 ? 1 : -1) * (2 + (i % 3));
            const isOpen = openSlot === i;
            return (
              <Reveal key={b.name} delay={i * 45} className={`band-slot${isOpen ? " is-open" : ""}`} style={{ "--rot": `${rot}deg` }}>
                <div className="band-disc" tabIndex={0} role="button" aria-expanded={isOpen} aria-label={`${b.name} — اطلاعات بیشتر`} onClick={() => slotClick(i)} onFocus={() => { if (dragRef.current.moved < 6) setOpenSlot(i); }} onBlur={() => setOpenSlot((o) => (o === i ? null : o))}>
                  <span className="band-grooves" aria-hidden="true" />
                  <span className="band-label"><span className="band-name">{b.name}</span></span>
                  <span className="band-hole" aria-hidden="true" />
                  <span className="band-info mono">{b.name}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
        <div className="crate-front"><span className="mono">{faNum(MUSIC.bands.length)} صفحه</span><span className="crate-front-line" aria-hidden="true" /></div>
      </div>
    </>
  );
});

export default function Music() {
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const barsRef = useRef([]);
  const ghostRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const pct = duration ? (time / duration) * 100 : 0;
  const track = MUSIC.favorite;

  const barSetters = useMemo(
    () => Array.from({ length: VIZ_BARS }, (_, i) => (el) => { barsRef.current[i] = el; }),
    []
  );

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
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  /* برچسب زمان شناور: فقط با جابه‌جایی مستقیم DOM، بدون رندر دوباره */
  const moveGhost = (e) => {
    const ghost = ghostRef.current;
    const rail = e.currentTarget;
    if (!ghost || !rail || !duration) return;
    const rect = rail.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const half = ghost.offsetWidth / 2;
    const x = Math.min(rect.width - half, Math.max(half, ratio * rect.width));
    ghost.style.left = `${x}px`;
    ghost.textContent = fmt(ratio * duration);
  };

  useEffect(() => {
    if (!playing || !analyserRef.current || prefersReducedMotion()) return undefined;
    const analyser = analyserRef.current;
    const bars = barsRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const usable = Math.max(8, Math.floor(data.length * 0.62));
    let raf = 0;

    const loop = () => {
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < VIZ_BARS; i += 1) {
        const idx = Math.floor((i / VIZ_BARS) * usable);
        const v = data[idx] / 255;
        const el = bars[i];
        if (el) el.style.transform = `scaleY(${Math.max(0.06, v)})`;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      bars.forEach((el) => { if (el) el.style.transform = ""; });
    };
  }, [playing]);

  useEffect(() => () => {
    ctxRef.current?.close?.();
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  return (
    <section id="music" className="section">
      <div className="container">
        <Reveal className="kicker">موزیک</Reveal>
        <Reveal delay={60}><h2 className="page-title">از اون آهنگایی که یه ساله ولم نمی‌کنه</h2></Reveal>
        <Reveal delay={120} className="page-lede">این آهنگ رو گذاشتم همین‌جا؛ اگه تو هم خواستی گوش بدی، لازم نیست بری دنبالش بگردی.</Reveal>

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
          />

          <div className="gramo-head">
            <span className="gramo-state"><span className="gramo-dot" aria-hidden="true" /><span aria-live="polite">{playing ? "در حال پخش" : "آماده‌ی پخش"}</span></span>
            <span className="gramo-leader" aria-hidden="true" />
            <span className="gramo-rpm mono">۳۳⅓ RPM</span>
            {(track.year || track.album) && <span className="gramo-meta mono">{[track.album, track.year].filter(Boolean).join(" · ")}</span>}
          </div>

          <div className="gramo-deck">
            <button type="button" className="disc" onClick={toggle} data-hover aria-label={playing ? "توقف پخش" : "پخش آهنگ"}>
              <span className="disc-grooves" />
              <span className="disc-label"><span className="disc-title">{track.title}</span><span className="disc-artist">{track.artist}</span></span>
              <span className="disc-hole" />
            </button>
            <span className="deck-arm" aria-hidden="true" />
          </div>

          <div className="gramo-info">
            <h3 className="gramo-title">{track.title}</h3>
            <div className="gramo-artist">{track.artist}</div>

            <div className="gramo-seek">
              <div className="gramo-rail" style={{ "--pct": `${pct}%` }} onPointerMove={moveGhost} onPointerDown={moveGhost}>
                <input type="range" className="gramo-range" min={0} max={duration || 0} step={0.1} value={time} onChange={(e) => { const a = audioRef.current; if (a) a.currentTime = Number(e.target.value); }} aria-label="پیشرفت آهنگ" aria-valuetext={`${fmt(time)} از ${fmt(duration)}`} disabled={!duration} />
                <span className="gramo-knob" aria-hidden="true" />
                <span className="gramo-ghost mono" ref={ghostRef} aria-hidden="true">0:00</span>
              </div>
              <div className="gramo-times mono">
                <span className="gramo-elapsed">{fmt(time)}</span>
                <span className="gramo-duration">{fmt(duration)}</span>
              </div>
            </div>

            <div className="gramo-foot">
              <button type="button" className="gramo-play" onClick={toggle} data-hover aria-label={playing ? "توقف پخش" : "پخش آهنگ"}>
                {playing ? <Icon name="pause" size={15} /> : <Icon name="play" size={15} />}
                <span>{playing ? "توقف" : "پخش"}</span>
              </button>

              <div className="gramo-viz" aria-hidden="true">
                {Array.from({ length: VIZ_BARS }, (_, i) => <span key={i} ref={barSetters[i]} style={{ "--h": VIZ_SHAPE[i] }} />)}
              </div>
            </div>
          </div>

          {MUSIC.why && <p className="gramo-why">«{MUSIC.why}»</p>}
        </Reveal>
        <Crate />
      </div>
    </section>
  );
}
