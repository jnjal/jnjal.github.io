import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { prefersReducedMotion } from "../hooks/useTyped";
import { NOW } from "../data/content";
import "./Now.css";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

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

const onTilt = (e) => {
  if (prefersReducedMotion()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
  el.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
};

const offTilt = (e) => {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
};

export default function Now() {
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

        <div className="now-bento">
          {NOW.items.map((item, i) => (
            <Reveal key={item.label} delay={i * 70} className={`now-cell now-cell-${i}`}>
              <div className="now-face" onMouseMove={onTilt} onMouseLeave={offTilt}>
                <Icon name={item.icon} className="now-icon" />
                <div className="now-label mono faint">{item.label}</div>
                <div className="now-value">{item.value}</div>
                {item.detail && <div className="now-detail dim">{item.detail}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
