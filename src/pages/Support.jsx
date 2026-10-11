import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { SUPPORT } from "../data/content";
import "./Support.css";

const ready = Boolean(SUPPORT.url && SUPPORT.url !== "#");

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
              href={SUPPORT.url}
              target="_blank"
              rel="noopener noreferrer"
              data-hover
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
