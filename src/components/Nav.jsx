import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS, PROFILE } from "../data/content";
import { prefersReducedMotion } from "../hooks/useTyped";
import Clock from "./Clock";
import "./Nav.css";

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
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      window.history.pushState(null, "", `#${id}`);
    };

    // موبایل: اول منو ببنده و overflow بادی آزاد بشه، بعد بپر
    if (wasOpen) window.setTimeout(jump, 60);
    else jump();
  };

  return (
    <nav ref={navRef} className="nav">
      <div className="container nav-inner">
        <button className="nav-logo" data-hover onClick={handleLogoClick} aria-label="جنجال">
          <span className="mono">✦</span> {PROFILE.name}
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
          <Clock />
        </div>

        <button
          ref={hamburgerRef}
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

      <span ref={progressRef} className="nav-progress" aria-hidden="true" />

      {open && (
        <div className="nav-mobile" ref={menuRef}>
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={linkClass(item.id)}
              aria-current={active === item.id ? "true" : undefined}
              onClick={(e) => goToSection(e, item.id)}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className="nav-mobile-no mono" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
            </a>
          ))}
          <div className="nav-mobile-foot">
            <Clock />
          </div>
        </div>
      )}
    </nav>
  );
}
