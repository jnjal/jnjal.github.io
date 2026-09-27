import { SOCIAL_LINKS, HUMAN_TOUCHES } from "../data/content";
import "./Footer.css";

const note = HUMAN_TOUCHES[Math.floor(Math.random() * HUMAN_TOUCHES.length)];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-line mono">© {new Date().getFullYear()} — جنجال · {note}</div>
        <div className="footer-links">
          {SOCIAL_LINKS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" data-hover className="footer-link">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
