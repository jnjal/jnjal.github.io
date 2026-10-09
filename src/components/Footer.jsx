import { SOCIAL_LINKS, HUMAN_TOUCHES } from "../data/content";
import useInView from "../hooks/useInView";
import useTyped from "../hooks/useTyped";
import Icon from "./Icon";
import "./Footer.css";

const note = HUMAN_TOUCHES[Math.floor(Math.random() * HUMAN_TOUCHES.length)];

export default function Footer() {
  const [ref, inView] = useInView(0.35);
  const typed = useTyped(note, inView, 42, 250);

  return (
    <footer className="footer" ref={ref}>
      <div className="container">
        <div className="footer-top">
          <div className="footer-bye">
            <div className="footer-typed mono">
              <span>{typed}</span>
              <span className="footer-caret" aria-hidden="true" />
            </div>
            <div className="footer-sign" aria-hidden="true">✦ جنجال</div>
          </div>

          <div className="footer-side">
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

            <a href="#home" className="to-top" data-hover aria-label="برو بالا">
              <Icon name="arrowUp" size={17} />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="mono">© {new Date().getFullYear()} — jnjal</span>
          <span className="mono">react · vite · cloudflare</span>
        </div>
      </div>
    </footer>
  );
}
