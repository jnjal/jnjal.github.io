import { HUMAN_TOUCHES, NAV_ITEMS, NOTES, SOCIAL_LINKS } from "../data/content";
import useInView from "../hooks/useInView";
import useTyped from "../hooks/useTyped";
import Icon from "./Icon";
import "./Footer.css";

const note = HUMAN_TOUCHES[Math.floor(Math.random() * HUMAN_TOUCHES.length)];

// چند لنگر برای فهرست سریع پایین صفحه
const QUICK_IDS = ["about", "projects", "notes", "support"];
const quickLinks = NAV_ITEMS.filter((item) => QUICK_IDS.includes(item.id));

// نوار متحرک بالای فوتر — متن کامل یادداشت‌ها به ترتیب، ستاره فقط بین موضوع‌ها
// دو نیمه‌ی یکسان برای لوپ بی‌درز
const noteBody = (text) =>
  text
    .replace(/\*\*/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const marqueePhrase = NOTES.length
  ? `${NOTES.map((n) => noteBody(n.text)).join(" ✦ ")} ✦ `
  : "جنجال ✦ توسعه‌دهنده فول‌استک ✦ ";

// هر نیمه به‌اندازه‌ی کافی پهن باشه تا روی صفحه‌های عریض هم جای خالی نمونه
const MARQUEE = marqueePhrase.repeat(marqueePhrase.length < 700 ? 3 : 1);

// سرعت نوار با طول متن هماهنگ می‌شه تا همیشه آروم و خوانا بمونه
const MARQUEE_DURATION = Math.max(60, Math.round(MARQUEE.length * 0.12));

export default function Footer() {
  const [ref, inView] = useInView(0.35);
  const typed = useTyped(note, inView, 42, 250);

  return (
    <footer className="footer" ref={ref}>
      <div className="footer-marquee" aria-hidden="true">
        <div className="footer-marquee-track" style={{ animationDuration: `${MARQUEE_DURATION}s` }}>
          <span>{MARQUEE}</span>
          <span>{MARQUEE}</span>
        </div>
      </div>

      <div className="container">
        <div className="footer-top">
          <div className="footer-bye">
            <div className="footer-typed mono">
              <span>{typed}</span>
              <span className="footer-caret" aria-hidden="true" />
            </div>
            <div className="footer-sign" aria-hidden="true">✦ جنجال</div>
            <div className="footer-endline" aria-hidden="true">
              <span className="footer-endline-rule" />
              <span className="mono">پایان</span>
              <span className="footer-endline-rule" />
            </div>
          </div>

          <div className="footer-side">
            <nav className="footer-col" aria-label="دسترسی سریع">
              <div className="footer-col-head mono">دسترسی</div>
              <div className="footer-links">
                {quickLinks.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="footer-link" data-hover>
                    <span className="footer-link-dot" aria-hidden="true" />
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            <div className="footer-col">
              <div className="footer-col-head mono">ارتباط</div>
              <div className="footer-social">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="social-dot"
                    data-hover
                    aria-label={s.label}
                    title={s.label}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    <Icon name={s.icon} size={18} />
                  </a>
                ))}
              </div>

              <a href="#home" className="to-top" data-hover aria-label="برگرد بالا">
                <Icon name="arrowUp" size={16} />
                <span>برگرد بالا</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="mono">© {new Date().getFullYear()} — jnjal</span>
          <span className="mono footer-place">تهران · GMT+3:30</span>
          <span className="mono">react · vite · cloudflare</span>
        </div>
      </div>
    </footer>
  );
}
