import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS, PROFILE, SOCIAL_LINKS } from "../data/content";
import { scrollToY } from "../lib/smooth";
import Clock from "./Clock";
import Icon from "./Icon";
import "./Nav.css";

const pad = (n) => String(n).padStart(2, "0");

export default function Nav({ onSecret }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(NAV_ITEMS[0].id);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const clicks = useRef(0);
  const clickTimer = useRef(null);
  const linksRef = useRef(null);
  const navRef = useRef(null);
  const progressRef = useRef(null);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === active)
  );

  // کدوم بخش توی دیده‌ست
  useEffect(() => {
    const nodes = NAV_ITEMS.map(({ id }) => document.getElementById(id)).filter(Boolean);
    if (!nodes.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  // نوار پیشرفت + شفاف‌شدن هدر موقع اسکرول — مستقیم روی DOM، بدون ری‌رندر
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      if (progressRef.current) progressRef.current.style.width = `${pct}%`;
      navRef.current?.classList.toggle("is-scrolled", y > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // جای خط زیر آیتم فعال
  useEffect(() => {
    const box = linksRef.current;
    if (!box) return;
    const el = box.querySelector(".nav-link.active");
    if (!el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    setIndicator({ left: r.left - b.left, width: r.width });
  }, [active, open]);

  // قفل اسکرول موقع باز بودن منوی موبایل
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // تله‌ی فوکوس منوی موبایل — Tab بین لینک‌های منو قفله و فوکوس برمی‌گرده به همبرگری
  useEffect(() => {
    if (!open) return undefined;
    const hamburger = hamburgerRef.current;
    const menu = menuRef.current;
    const focusables = menu
      ? Array.from(menu.querySelectorAll("a[href], button:not([disabled])"))
      : [];
    focusables[0]?.focus();

    const onKey = (e) => {
      if (e.key !== "Tab" || !focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !menu.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !menu.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      hamburger?.focus();
    };
  }, [open]);

  useEffect(() => () => clearTimeout(clickTimer.current), []);

  const handleLogoClick = () => {
    clicks.current += 1;
    clearTimeout(clickTimer.current);
    if (clicks.current >= 5) {
      clicks.current = 0;
      setOpen(false);
      onSecret?.();
      return;
    }
    clickTimer.current = setTimeout(() => { clicks.current = 0; }, 1500);
  };

  const linkClass = (id) => `nav-link${active === id ? " active" : ""}`;

  // اسکرول دستی با جبران ارتفاع واقعی هِدِر — جای فرود همیشه زیر خط هِدِر
  const goToSection = (e, id) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();

    const target = document.getElementById(id);
    if (!target) return;

    const wasOpen = open;
    setOpen(false);

    const jump = () => {
      const offset = (navRef.current?.offsetHeight || 64) + 10;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      scrollToY(top);
      window.history.pushState(null, "", `#${id}`);
    };

    // موبایل: اول منو ببنده و overflow بادی آزاد بشه، بعد بپر
    if (wasOpen) window.setTimeout(jump, 60);
    else jump();
  };

  return (
    <nav ref={navRef} className={`nav${open ? " is-open" : ""}`}>
      <div className="container nav-inner">
        <button
          className="nav-logo"
          data-hover
          data-no-magnet
          onClick={handleLogoClick}
          aria-label={PROFILE.name}
        >
          <span className="nav-mark mono" aria-hidden="true">✦</span>
          <span className="nav-brand">
            <span className="nav-word">
              {PROFILE.name}
              <span className="nav-word-dot" aria-hidden="true" />
            </span>
            <span className="nav-tag mono" aria-hidden="true">dev · tehran</span>
          </span>
        </button>

        <div className="nav-links desktop-only" ref={linksRef}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-hover
              className={linkClass(item.id)}
              aria-current={active === item.id ? "true" : undefined}
              onClick={(e) => goToSection(e, item.id)}
            >
              {item.label}
            </a>
          ))}
          <span
            className="nav-indicator"
            aria-hidden="true"
            style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
          />
        </div>

        <div className="nav-right desktop-only">
          <span className="nav-chapter" key={active} aria-hidden="true">
            <span className="nav-chapter-no mono">{pad(activeIndex + 1)}</span>
            <span className="nav-chapter-sep mono">/</span>
            <span className="nav-chapter-label">{NAV_ITEMS[activeIndex]?.label}</span>
          </span>
          <Clock className="nav-clock" />
        </div>

        <button
          ref={hamburgerRef}
          className={`hamburger mobile-only${open ? " is-open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="منو"
          aria-expanded={open}
          data-hover
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <span ref={progressRef} className="nav-progress" aria-hidden="true" />

      {open && (
        <div className="nav-mobile" ref={menuRef} data-lenis-prevent>
          <div className="nav-mobile-head">
            <span className="nav-mobile-kicker">فهرست</span>
            <span className="nav-mobile-count mono">
              {pad(activeIndex + 1)} <span className="faint">/ {pad(NAV_ITEMS.length)}</span>
            </span>
          </div>

          <div className="nav-mobile-list">
            {NAV_ITEMS.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={linkClass(item.id)}
                aria-current={active === item.id ? "true" : undefined}
                onClick={(e) => goToSection(e, item.id)}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="nav-mobile-no mono" aria-hidden="true">{pad(i + 1)}</span>
                <span className="nav-mobile-label">{item.label}</span>
                <span className="nav-mobile-star mono" aria-hidden="true">✦</span>
              </a>
            ))}
          </div>

          <div className="nav-mobile-foot">
            <div className="nav-mobile-socials">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  title={s.label}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <Icon name={s.icon} size={16} />
                </a>
              ))}
            </div>
            <Clock />
          </div>
        </div>
      )}
    </nav>
  );
}
