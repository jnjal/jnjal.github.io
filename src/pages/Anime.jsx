import Reveal from "../components/Reveal";
import { ANIME } from "../data/content";
import "./Anime.css";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
const toNum = (v) => Number(String(v).replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d))));
const faRating = (n) => faNum(String(n)).replace(/\./g, "٫");

const WATCH_EP = toNum(ANIME.watching.ep);
const WATCH_PCT = Math.min(100, Math.round((WATCH_EP / (ANIME.watching.total || 1)) * 100));
const TOTAL_EPS = ANIME.favorites.reduce((s, f) => s + (f.eps || 0), 0);

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

            {(ANIME.watching.year || ANIME.watching.genre || ANIME.watching.studio) && (
              <div className="ticket-meta mono">
                {[ANIME.watching.year, ANIME.watching.genre, ANIME.watching.studio]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}

            <div className="ticket-code mono">ep. {ANIME.watching.ep} · now playing</div>

            <div className="ticket-progress">
              <div className="ticket-progress-row mono faint">
                <span>{ANIME.watching.ep} / {faNum(ANIME.watching.total)}</span>
                <span>٪{faNum(WATCH_PCT)}</span>
              </div>
              <div className="ticket-bar" aria-hidden="true">
                <i style={{ width: `${WATCH_PCT}%` }} />
              </div>
            </div>
          </div>

          <div className="ticket-stub">
            <div className="ticket-stub-label mono">قسمت</div>
            <div className="ticket-stub-num">{ANIME.watching.ep}</div>
            <div className="ticket-stub-sub mono faint">٪{faNum(WATCH_PCT)} کل سریال</div>
          </div>
        </Reveal>

        <div className="anime-fav-head">
          <h3 className="section-h" style={{ margin: 0 }}>محبوب‌ترین‌ها</h3>
          <span className="mono faint" style={{ fontSize: 11 }}>
            {faNum(ANIME.favorites.length)} عنوان · {faNum(TOTAL_EPS)} اپیزود
          </span>
        </div>

        <div className="anime-grid">
          {ANIME.favorites.map((a, i) => (
            <Reveal key={a.title} delay={i * 90} className="fav-card">
              <span className="fav-num mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>

              <div className="fav-head">
                <h3 className="fav-title">{a.title}</h3>
                {a.year && <span className="fav-year mono faint">{a.year}</span>}
              </div>

              {a.rating != null && (
                <div className="fav-rating">
                  <span className="fav-rating-label mono faint">امتیاد</span>
                  <span className="fav-rating-track" aria-hidden="true">
                    <i className="fav-rating-fill" style={{ width: `${(a.rating / 10) * 100}%` }} />
                  </span>
                  <span className="fav-rating-num mono">{faRating(a.rating)} / ۱۰</span>
                </div>
              )}

              <p className="fav-note">{a.note}</p>

              {(a.genre || a.eps || a.status) && (
                <div className="fav-foot">
                  <span className="fav-meta">
                    {[a.genre, a.eps ? `${faNum(a.eps)} اپیزود` : ""].filter(Boolean).join(" · ")}
                  </span>
                  {a.status && (
                    <span className={`fav-status${a.status === "در حال تماشا" ? " is-live" : ""}`}>
                      <i aria-hidden="true" />
                      {a.status}
                    </span>
                  )}
                </div>
              )}
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="anime-queue">
          <div className="anime-queue-head">
            <span className="anime-queue-label">در صف انتظار</span>
            {ANIME.queue.length > 0 && (
              <span className="mono faint" style={{ fontSize: 11 }}>
                {faNum(ANIME.queue.length)} عنوان
              </span>
            )}
          </div>
          {ANIME.queue.length > 0 ? (
            <div className="anime-queue-chips">
              {ANIME.queue.map((q, i) => (
                <span key={q} className="queue-chip">
                  <span className="queue-chip-no mono">{faNum(i + 1)}</span>
                  {q}
                </span>
              ))}
            </div>
          ) : (
            <p className="anime-queue-empty">
              فعلاً چیزی توی صف ندارم — اگه چیزی پیدا شد، همین‌جا اضافه‌اش می‌کنم.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
