import { useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS, PROFILE } from "../data/content";
import Clock from "./Clock";
import "./Nav.css";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const clicks = useRef(0);
  const clickTimer = useRef(null);

  const handleLogoClick = () => {
    clicks.current += 1;
    clearTimeout(clickTimer.current);
    if (clicks.current >= 5) {
      clicks.current = 0;
      navigate("/void");
      return;
    }
    clickTimer.current = setTimeout(() => { clicks.current = 0; }, 1500);
  };

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <button className="nav-logo" data-hover onClick={handleLogoClick} aria-label="جنجال">
          <span className="mono">✦</span> {PROFILE.name}
        </button>

        <div className="nav-links desktop-only">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-hover
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right desktop-only">
          <Clock />
        </div>

        <button
          className="hamburger mobile-only"
          onClick={() => setOpen((o) => !o)}
          aria-label="منو"
          aria-expanded={open}
          data-hover
        >
          <span style={{ transform: open ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>

      {open && (
        <div className="nav-mobile">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
          <div style={{ padding: "16px 24px" }}>
            <Clock />
          </div>
        </div>
      )}
    </nav>
  );
}
