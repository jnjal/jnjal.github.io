import { useEffect, useId, useMemo, useState } from "react";
import Reveal from "../components/Reveal";
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

function daysToNowruz(now) {
  const y = now.getFullYear();
  let target = new Date(y, 2, 21);
  if (now.getTime() > target.getTime()) target = new Date(y + 1, 2, 21);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
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

const WEEK_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export default function Now() {
  const [now, setNow] = useState(() => new Date());
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

        {/* کتابخانه‌ی روز — فهرست کتاب‌ها */}
        <Reveal delay={220} className="books">
          <div className="books-head">
            <span className="books-name">{NOW.gallery} ✦</span>
            <span className="books-hours mono faint">{NOW.hours}</span>
            <span className="books-time mono">
              <i aria-hidden="true" />
              الان {clock}
            </span>
          </div>

          <div className="book-list">
            {NOW.items.map((b, i) => (
              <Reveal
                key={b.label}
                delay={i * 70}
                className="book-row"
                style={{ "--color": b.color }}
              >
                <span className="book-row-spine" aria-hidden="true" />
                <div className="book-row-top">
                  <span className="book-row-no mono">{pad2(i + 1)}</span>
                  <span className="book-row-title">{b.label}</span>
                  <span className="book-row-author">✦ {b.author}</span>
                  <span className="book-row-lead" aria-hidden="true" />
                  <span className="book-row-quote">
                    <span aria-hidden="true">«</span>
                    {b.byTime?.[bucket] || b.value}
                    <span aria-hidden="true">»</span>
                  </span>
                </div>
                <div className="book-row-desc">
                  {b.live === "anime"
                    ? `${ANIME.watching.arc} — اپیزود ${ANIME.watching.ep} از ${faNum(ANIME.watching.total)}`
                    : b.detail}
                </div>
              </Reveal>
            ))}
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
              <span className="cal-caption-sep" aria-hidden="true">✦</span>
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
            <h3 className="cal-legend-title">✦ راهنمای فاز ماه</h3>

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

              <div className="cal-legend-foot">
                <span>ماه تابان ~۲۹.۵ روز</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
