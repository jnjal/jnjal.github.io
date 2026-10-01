import { useEffect, useId, useMemo, useState } from "react";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { prefersReducedMotion } from "../hooks/useTyped";
import { NOW, ANIME, PROFILE } from "../data/content";
import "./Now.css";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
const toNum = (v) => Number(String(v).replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d))));
const pad2 = (n) => faNum(String(n).padStart(2, "0"));

// فرمت‌های Intl سطح ماژول — ساخته‌شدن توی هر رندر هزینه‌داره
const TZ = PROFILE.timezone;
const F_HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour12: false, hour: "2-digit" });
const F_MINUTE = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour12: false, minute: "2-digit" });
const F_CLOCK = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour12: false, hour: "2-digit", minute: "2-digit" });
const F_DAYKEY = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const F_YM = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TZ, year: "numeric", month: "numeric" });
const F_DAY = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TZ, day: "numeric" });
const F_DOW = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TZ, weekday: "long" });
const F_TITLE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TZ, year: "numeric", month: "long" });
const F_TODAY = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TZ, day: "numeric", month: "long" });

const PLANET_SIZE = { 1: 16, 2: 22, 3: 30 };
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// غبار کهکشان — نقاط ریز با آفست deterministic
const DUST = Array.from({ length: 46 }, (_, i) => {
  const x = ((i * 37) % 97) + 2;
  const y = ((i * 61) % 89) + 3;
  const a = (0.12 + (i % 4) * 0.11).toFixed(2);
  return `${x}% ${y}% 0 0.6px rgba(255,255,255,${a})`;
}).join(", ");

// ستاره‌های ریز تزئینی — فقط برای پُر کردن خلأهای آسمان
const MINI_STARS = [
  { x: 18, y: 20, s: 2.5, t: 3.8, d: 0.4 },
  { x: 40, y: 14, s: 2, t: 4.6, d: 1.2 },
  { x: 56, y: 24, s: 3, t: 3.2, d: 2.0 },
  { x: 86, y: 52, s: 2.5, t: 5.0, d: 0.8 },
  { x: 10, y: 44, s: 2, t: 4.2, d: 1.7 },
  { x: 36, y: 72, s: 2.5, t: 3.6, d: 2.4 },
  { x: 88, y: 30, s: 2, t: 4.8, d: 0.2 },
  { x: 64, y: 10, s: 2, t: 3.4, d: 1.5 },
];

// پارالاکس لایه‌های آسمان با موسور
const onSkyMove = (e) => {
  if (prefersReducedMotion()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  el.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
};

const onSkyLeave = (e) => {
  e.currentTarget.style.setProperty("--mx", "0");
  e.currentTarget.style.setProperty("--my", "0");
};

const mod = (a, m) => ((a % m) + m) % m;

// سرعت ماه رو عوض می‌کنه بدون پرشِ زاویه — فاز چرخش فعلی حفظ می‌شه
const setOrbitSpeed = (btn, seconds) => {
  const orbit = btn?.querySelector?.(".planet-orbit");
  if (!orbit) return;
  try {
    const period = parseFloat(getComputedStyle(orbit).getPropertyValue("--period")) || 9;
    const next = seconds || period;
    const anim = orbit.getAnimations()[0];
    if (!anim) {
      orbit.style.animationDuration = `${next}s`;
      return;
    }
    const t = (Number(anim.currentTime) || 0) / 1000;
    const timing = anim.effect.getTiming();
    const d0 = (timing.delay || 0) / 1000;
    const dur = timing.duration / 1000;
    const p = mod(t - d0, dur) / dur;
    const d1 = mod(t - p * next, next) - next;
    orbit.style.animationDuration = `${next}s`;
    orbit.style.animationDelay = `${d1}s`;
  } catch {
    orbit.style.animationDuration = `${seconds || 9}s`;
  }
};

// صبح ۵–۱۲، عصر ۱۲–۱۸، شب ۱۸–۵
function dayBucket(hour) {
  if (hour >= 5 && hour < 12) return "صبح";
  if (hour >= 12 && hour < 18) return "عصر";
  return "شب";
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "همین الان";
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "کمتر از یک ساعت پیش";
  if (hours < 24) return `${faNum(hours)} ساعت پیش`;
  const days = Math.floor(diff / 86400000);
  if (days <= 1) return "دیروز";
  return `${faNum(days)} روز پیش`;
}

// ماه جاری شمسی — بدون کتابخانه، فقط Intl
function buildCalendar(ref, todayRef) {
  const todayKey = `${F_YM.format(todayRef)}|${F_DAY.format(todayRef)}`;
  const key = F_YM.format(ref);
  const days = [];

  for (let i = -35; i <= 35; i += 1) {
    const d = new Date(ref.getTime() + i * 86400000);
    if (F_YM.format(d) !== key) continue;
    days.push({
      day: F_DAY.format(d),
      dow: F_DOW.format(d),
      isToday: `${F_YM.format(d)}|${F_DAY.format(d)}` === todayKey,
    });
  }

  return { title: F_TITLE.format(ref), days };
}

// فاز ماه — محاسبه‌ی ریاضی، بدون کتابخانه (ماه تابان ~۲۹.۵۳ روز)
function moonPhase(date) {
  const SYNODIC = 29.530588853;
  const knownNew = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - knownNew) / 86400000;
  return (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
}

function phaseName(p) {
  if (p < 0.04 || p > 0.96) return "ماه نو";
  if (p < 0.46) return "هلال روبه‌رشد";
  if (p <= 0.54) return "ماه کامل";
  return "رو به کاهش";
}

// ردیف‌های باکس راهنما — p نمونه‌ی همون فاز، name باید با phaseName یکی باشه
const PHASE_ROWS = [
  { name: "ماه نو", p: 0 },
  { name: "هلال روبه‌رشد", p: 0.125 },
  { name: "ماه کامل", p: 0.5 },
  { name: "رو به کاهش", p: 0.75 },
];

// درصد روشنایی ماه از فاز (۰ تا ۱۰۰)
const illum = (p) => Math.round(((1 - Math.cos(p * Math.PI * 2)) / 2) * 100);

// ماه شمسی → فصل
function seasonOf(month) {
  if (month >= 3 && month <= 5) return "بهار";
  if (month >= 6 && month <= 8) return "تابستان";
  if (month >= 9 && month <= 11) return "پاییز";
  return "زمستان";
}

const WEEK_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function daysToNowruz(now) {
  const y = now.getFullYear();
  let target = new Date(y, 2, 21);
  if (now.getTime() > target.getTime()) target = new Date(y + 1, 2, 21);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

// گلیف فاز ماه — دایره‌ی روشن جابه‌جاشده داخل کلیپ‌پس‌زمینه
function MoonGlyph({ phase, size = 34 }) {
  const uid = useId().replace(/:/g, "");
  const clip = `moon-${uid}`;
  const R = 15;
  const dx = 2 * R * (1 - 2 * phase);
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="18" cy="18" r={R} />
        </clipPath>
      </defs>
      <circle cx="18" cy="18" r={R} fill="#101014" stroke="rgba(232, 230, 227, 0.3)" strokeWidth="1" />
      <g clipPath={`url(#${clip})`}>
        <circle cx={18 + dx} cy="18" r={R} fill="#e8e6e3" />
      </g>
    </svg>
  );
}

// محیط دایره‌ی روزها (r = 42 در viewBox صد)
const ARC_C = 2 * Math.PI * 42;

export default function Now() {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState({ i: -1, k: 0 });
  const [drawMode, setDrawMode] = useState(false);
  const [pending, setPending] = useState(null);
  const [drawn, setDrawn] = useState([]);
  const [calOffset, setCalOffset] = useState(0);
  const [calHover, setCalHover] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hour = Number(F_HOUR.format(now));
  const minute = Number(F_MINUTE.format(now));
  const bucket = dayBucket(hour);
  const clock = faNum(F_CLOCK.format(now));
  const dawnDiff = (6 - (hour + minute / 60) + 24) % 24;
  const dawnTxt = dawnDiff < 1 ? "کمتر از یه ساعت" : `~${faNum(Math.floor(dawnDiff))} ساعت`;
  const dayKey = F_DAYKEY.format(now);
  const todayBase = useMemo(() => new Date(`${dayKey}T12:00:00+03:30`), [dayKey]);
  const cal = useMemo(() => {
    const ref = calOffset
      ? new Date(todayBase.getFullYear(), todayBase.getMonth() + calOffset, 15)
      : todayBase;
    return buildCalendar(ref, todayBase);
  }, [todayBase, calOffset]);

  const phase = moonPhase(todayBase);
  const currentPhaseName = phaseName(phase);
  const nowruz = daysToNowruz(todayBase);
  const todayStr = F_TODAY.format(todayBase);
  const todayDow = F_DOW.format(todayBase);
  const todayDay = F_DAY.format(todayBase);
  const monthName = cal.title.split(" ")[0];
  const todayIdx = cal.days.findIndex((d) => d.isToday);
  const arcLen = calOffset === 0 && todayIdx >= 0 ? (ARC_C * (todayIdx + 1)) / cal.days.length : 0;

  // آمار زنده‌ی باکس راهنما
  const brightness = illum(phase);
  const moonAge = Math.round(phase * 29.53);
  const nextNewMoon = Math.max(1, Math.ceil(29.53 - phase * 29.53));
  const minsLeft = 24 * 60 - (hour * 60 + minute);
  const tillMid = `${faNum(Math.floor(minsLeft / 60))}:${pad2(minsLeft % 60)}`;

  // روزِ سال شمسی — پیدا کردن روز ۱ فروردین با اسکن مارس (بدون کتابخانه، فقط یکبار در روز)
  const yearStats = useMemo(() => {
    const [pYear, pMonth] = F_YM.format(todayBase).split("/");
    const findNowruz = (targetYear, gYear) => {
      for (let d = 18; d <= 24; d += 1) {
        const c = new Date(gYear, 2, d);
        const [cy, cm] = F_YM.format(c).split("/");
        if (cy === targetYear && cm === "۱" && F_DAY.format(c) === "۱") return c;
      }
      return null;
    };

    const gy = todayBase.getMonth() >= 2 ? todayBase.getFullYear() : todayBase.getFullYear() - 1;
    const first = findNowruz(pYear, gy);
    const next = findNowruz(faNum(toNum(pYear) + 1), gy + 1);
    if (!first || !next) return null;

    const localMidnight = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate());
    return {
      season: seasonOf(toNum(pMonth)),
      year: pYear,
      day: Math.round((localMidnight - first) / 86400000) + 1,
      total: Math.round((next - first) / 86400000) - 1,
    };
  }, [todayBase]);

  const active = hovered ?? selected;
  const activeItem = NOW.items[active];
  const anime = activeItem.live === "anime";

  // سیاره‌های وصله به سیاره‌ی فعال — برای درخشش شبکه
  const nearSet = new Set([active]);
  NOW.links.forEach(([a, b]) => {
    if (a === active) nearSet.add(b);
    if (b === active) nearSet.add(a);
  });

  const handlePlanetClick = (i) => {
    if (drawMode) {
      if (pending === null) setPending(i);
      else if (pending === i) setPending(null);
      else {
        setDrawn((d) => [...d, [pending, i]]);
        setPending(null);
      }
      return;
    }
    setSelected(i);
    setBurst((b) => ({ i, k: b.k + 1 }));
  };

  return (
    <section id="now" className="section">
      <div className="container">
        <Reveal className="kicker">الان</Reveal>
        <Reveal delay={60}><h2 className="page-title">این روزا چیکار می‌کنم</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          یه تیکه از زندگیم که سعی می‌کنم به‌روز بمونه.
        </Reveal>

        <Reveal delay={180} className="now-live mono faint">
          <span className="now-dot" aria-hidden="true" />
          آخرین آپدیت {NOW.updatedAt}
          <span className="now-ago">— {timeAgo(NOW.updatedAtISO)}</span>
        </Reveal>

        <Reveal delay={220} className="sky">
          <div className="sky-head">
            <span className="sky-name">{NOW.gallery}</span>
            <span className="sky-catalog mono">{NOW.catalog}</span>
            <span className="sky-hours mono faint">{NOW.hours}</span>
            <span className="sky-time mono">
              <i aria-hidden="true" />
              الان {clock} · تا سپیده‌دم {dawnTxt}
            </span>
          </div>

          <div
            className={`sky-box${drawMode ? " is-drawing" : ""}`}
            onMouseMove={onSkyMove}
            onMouseLeave={onSkyLeave}
          >
            <span className="sky-dust" aria-hidden="true" style={{ boxShadow: DUST }} />
            <span className="mini-stars" aria-hidden="true">
              {MINI_STARS.map((s, i) => (
                <span
                  key={i}
                  className="mini-star"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: `${s.s}px`,
                    height: `${s.s}px`,
                    animationDuration: `${s.t}s`,
                    animationDelay: `${s.d}s`,
                  }}
                />
              ))}
            </span>
            <span className="sky-shoot" aria-hidden="true" />
            <span className="sky-sat" aria-hidden="true" />

            <span className="sky-corner sky-c1" aria-hidden="true" />
            <span className="sky-corner sky-c2" aria-hidden="true" />
            <span className="sky-corner sky-c3" aria-hidden="true" />
            <span className="sky-corner sky-c4" aria-hidden="true" />
            <div className="sky-hud mono" aria-hidden="true">
              <span className="hud-tl">RA {clock}</span>
              <span className="hud-tr">DEC +35°41′</span>
              <span className="hud-bl">ZOOM 100×</span>
              <span className="hud-br">OBJ {NOW.items.length}</span>
            </div>

            <svg className="sky-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {NOW.links.map(([a, b]) => (
                <line
                  key={`${a}-${b}`}
                  className={a === active || b === active ? "is-hot" : undefined}
                  x1={NOW.items[a].x}
                  y1={NOW.items[a].y}
                  x2={NOW.items[b].x}
                  y2={NOW.items[b].y}
                />
              ))}
              {drawn.map(([a, b], idx) => (
                <line
                  key={`d-${idx}-${a}-${b}`}
                  className={`is-custom${a === active || b === active ? " is-hot" : ""}`}
                  pathLength="1"
                  x1={NOW.items[a].x}
                  y1={NOW.items[a].y}
                  x2={NOW.items[b].x}
                  y2={NOW.items[b].y}
                />
              ))}
            </svg>

            {NOW.items.map((planet, i) => (
              <button
                key={planet.label}
                type="button"
                className={`sky-planet${hovered === i ? " is-active" : ""}${selected === i ? " is-sel" : ""}${
                  nearSet.has(i) && i !== active ? " is-near" : ""
                }`}
                style={{
                  left: `${planet.x}%`,
                  top: `${planet.y}%`,
                  "--i": i,
                  "--color": planet.color,
                  "--size": `${PLANET_SIZE[planet.weight] || 18}px`,
                  "--period": `${planet.period || 9}s`,
                }}
                onMouseEnter={(e) => {
                  setHovered(i);
                  setOrbitSpeed(e.currentTarget, 2.4);
                }}
                onMouseLeave={(e) => {
                  setHovered(null);
                  setOrbitSpeed(e.currentTarget, null);
                }}
                onFocus={(e) => {
                  setHovered(i);
                  setOrbitSpeed(e.currentTarget, 2.4);
                }}
                onBlur={(e) => {
                  setHovered(null);
                  setOrbitSpeed(e.currentTarget, null);
                }}
                onClick={() => handlePlanetClick(i)}
                aria-label={`سیاره‌ی ${planet.label}`}
                aria-pressed={selected === i}
                data-hover
              >
                <span
                  className="planet-body"
                  style={{ animationDelay: `${((i * 47) % 90) / 10}s` }}
                >
                  <span className="planet-orbit" aria-hidden="true">
                    <span className="planet-moon" />
                  </span>
                  {planet.ring && <span className="planet-ring" aria-hidden="true" />}
                  <span className="planet-core" />
                  {burst.i === i && (
                    <span className="planet-burst" key={burst.k} aria-hidden="true">
                      {BURST_ANGLES.map((a) => (
                        <i key={a} style={{ "--a": `${a}deg` }} />
                      ))}
                    </span>
                  )}
                </span>
                <span className="planet-label">{planet.label}</span>
              </button>
            ))}

            <div className="sky-tools">
              <button
                type="button"
                className={`sky-tool${drawMode ? " is-on" : ""}`}
                onClick={() => {
                  setDrawMode((m) => !m);
                  setPending(null);
                }}
                data-hover
              >
                <Icon name="pencil" size={13} className="sky-tool-icon" />
                {drawMode ? "کشیدن روشن" : "کشیدن"}
              </button>
              <button
                type="button"
                className="sky-tool"
                onClick={() => {
                  setDrawn([]);
                  setPending(null);
                }}
                data-hover
              >
                <Icon name="eraser" size={13} className="sky-tool-icon" />
                پاک کردن
              </button>
              {drawMode && (
                <span className="sky-tool-hint">
                  {pending === null ? "دو تا سیاره رو به هم وصل کن" : "سیاره‌ی دوم رو بزن"}
                </span>
              )}
            </div>
          </div>

          <div className="sky-info" key={active}>
            <div className="sky-info-head">
              <span className="sky-info-no mono">رصد {pad2(active + 1)}</span>
              <span className="sky-info-title">{activeItem.label}</span>
            </div>
            <div className="sky-info-value">{activeItem.byTime?.[bucket] || activeItem.value}</div>
            <div className="sky-info-medium">{activeItem.medium}</div>
            <p className="sky-info-desc dim">
              {anime
                ? `${ANIME.watching.arc} — اپیزود ${ANIME.watching.ep} از ${faNum(ANIME.watching.total)}`
                : activeItem.detail}
            </p>
          </div>
        </Reveal>

        <div className="cal-row">
        <Reveal delay={140} className="now-cal" role="group" aria-label={`تقویم ${cal.title}`}>
          <div className="now-cal-head">
            <span className="now-cal-nav">
              <button
                type="button"
                className="cal-nav-btn mono"
                onClick={() => setCalOffset((o) => o - 1)}
                data-hover
              >
                ماه قبل
              </button>
              <span className="now-cal-title">{cal.title}</span>
              <button
                type="button"
                className="cal-nav-btn mono"
                onClick={() => setCalOffset((o) => o + 1)}
                data-hover
              >
                ماه بعد
              </button>
            </span>
            <span className="now-cal-phase">
              <MoonGlyph phase={phase} size={18} />
              {phaseName(phase)}
            </span>
          </div>

          <div className="cal-dial" onMouseLeave={() => setCalHover(null)}>
            <span className="cal-ring" aria-hidden="true" />
            {arcLen > 0 && (
              <svg className="cal-arc" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  className="cal-arc-line"
                  cx="50"
                  cy="50"
                  r="42"
                  style={{ "--len": arcLen, strokeDasharray: `${arcLen} ${ARC_C}` }}
                />
              </svg>
            )}

            {cal.days.map((d, i) => {
              const angle = (i / cal.days.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <span
                  key={d.day}
                  className={`cal-day${d.isToday ? " is-today" : ""}${
                    d.dow === "جمعه" ? " is-friday" : ""
                  }${calHover === i ? " is-hover" : ""}`}
                  style={{
                    left: `${(50 + 42 * Math.cos(angle)).toFixed(2)}%`,
                    top: `${(50 + 42 * Math.sin(angle)).toFixed(2)}%`,
                  }}
                  onMouseEnter={() => setCalHover(i)}
                  onClick={() => setCalHover(i)}
                  aria-current={d.isToday ? "date" : undefined}
                >
                  {d.day}
                </span>
              );
            })}

            <div className="cal-center">
              <span className="cal-center-label">امروز</span>
              <MoonGlyph phase={phase} />
              <span className="cal-center-day">{todayDay}</span>
              <span className="cal-center-dow">{todayDow}</span>
            </div>
          </div>

          <div className="cal-week">
            {WEEK_NAMES.map((w) => (
              <span
                key={w}
                className={`cal-week-day${w === todayDow ? " is-today" : ""}${
                  w === "جمعه" ? " is-friday" : ""
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          <div className="cal-caption">
            <span className="cal-caption-main">
              {calHover !== null
                ? `${cal.days[calHover].day} ${monthName} — ${cal.days[calHover].dow}`
                : `امروز ${todayStr} — ${todayDow}`}
            </span>
            <span className="cal-caption-sep" aria-hidden="true">·</span>
            <span className="cal-nowruz">
              {nowruz === 0 ? "امروز نوروزه!" : `${faNum(nowruz)} روز تا نوروز`}
            </span>
            {calOffset !== 0 && (
              <button type="button" className="cal-today-btn" onClick={() => setCalOffset(0)} data-hover>
                امروز
              </button>
            )}
          </div>
        </Reveal>

          <Reveal delay={220} className="cal-legend">
            <h3 className="cal-legend-title">راهنمای فاز ماه</h3>

            <div className="cal-legend-body">
            <ul className="cal-legend-list">
              {PHASE_ROWS.map((r) => {
                const isCurrent = currentPhaseName === r.name;
                return (
                  <li key={r.name} className={isCurrent ? "is-current" : undefined}>
                    <MoonGlyph phase={r.p} size={22} />
                    <span>{r.name}</span>
                    <span className="cal-legend-end">
                      {isCurrent && <span className="cal-legend-now mono">الان</span>}
                      <span className="cal-legend-illum mono">{faNum(illum(r.p))}٪</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="cal-legend-stats">
              <div className="cal-stat">
                <span className="cal-stat-label">روشنایی امروز</span>
                <span className="cal-stat-value">{faNum(brightness)}٪</span>
                <span className="cal-stat-bar" aria-hidden="true">
                  <i style={{ width: `${brightness}%` }} />
                </span>
              </div>
              <div className="cal-stat">
                <span className="cal-stat-label">ماه قمری</span>
                <span className="cal-stat-value">روز {faNum(moonAge)}</span>
              </div>
              <div className="cal-stat">
                <span className="cal-stat-label">ماه نو بعدی</span>
                <span className="cal-stat-value">~{faNum(nextNewMoon)} روز</span>
              </div>
              <div className="cal-stat">
                <span className="cal-stat-label">تا نیمه‌شب</span>
                <span className="cal-stat-value">{tillMid}</span>
              </div>
              {yearStats && (
                <div className="cal-stat cal-stat-wide">
                  <span className="cal-stat-label">تقویم</span>
                  <span className="cal-stat-value">
                    {yearStats.season} {yearStats.year}
                  </span>
                  <span className="cal-stat-sub">
                    روز {faNum(yearStats.day)} از {faNum(yearStats.total)}
                  </span>
                </div>
              )}
            </div>
            </div>

            <div className="cal-legend-foot">
              <span>ماه تابان ~۲۹.۵ روز</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
