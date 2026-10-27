import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { prefersReducedMotion } from "../hooks/useTyped";
import { SUPPORT } from "../data/content";
import "./Support.css";

const SUPPORT_URL = SUPPORT.url && SUPPORT.url !== "#" ? SUPPORT.url : "https://daramet.com/jnjal";
const ready = Boolean(SUPPORT_URL);

const CONFETTI_COLORS = ["#9c2c44", "#e0556f", "#f2e9e4", "#d9a05b", "#7a1f35"];

// جشن کوچیک موقع کلیک — کتابخانه فقط وقتی لازم شد لود می‌شه (چانک جدا)
async function celebrate(e) {
  if (prefersReducedMotion()) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const origin = {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };

  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 38,
      gravity: 0.9,
      scalar: 0.85,
      ticks: 220,
      origin,
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });

    // موج دوم، کمی آروم‌تر
    window.setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 110,
        startVelocity: 24,
        scalar: 0.65,
        ticks: 200,
        origin,
        disableForReducedMotion: true,
      });
    }, 160);
  } catch {
    /* اگه لود نشد، کلیک عادی ادامه پیدا می‌کنه */
  }
}

export default function Support() {
  return (
    <section id="support" className="section">
      <div className="container">
        <Reveal className="kicker">حمایت</Reveal>
        <Reveal delay={60}><h2 className="page-title">اگه کارام به دردت خورد</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          اجباری در کار نیست؛ اگه دوست داشتی حمایت کن. شاید خرج یه قهوه بشه، شاید هم کمک کنه یه شب دیگه بشینم پای پروژه‌ها.
        </Reveal>

        <Reveal delay={180} className="support-card">
          <div className="support-body">
            <span className="support-badge mono">✦ support · voluntary</span>
            <div className="support-title">اگه خواستی یه دستی برسون</div>
            <p className="support-text dim">
              اگه این سایت یا یکی از پروژه‌هام به دردت خورده، می‌تونی از اینجا حمایتم کنی.
              هرچقدر و هر وقت خودت خواستی؛ نه اجباریه، نه تعهدی داره.
            </p>
          </div>

          {ready ? (
            <a
              className="support-btn"
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-hover
              onClick={celebrate}
            >
              <Icon name="heart" size={17} />
              {SUPPORT.label}
            </a>
          ) : (
            <span className="support-btn support-btn-pending">هنوز درگاه رو نچسبوندم اینجا</span>
          )}
        </Reveal>
      </div>
    </section>
  );
}
