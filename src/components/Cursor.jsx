import { useEffect, useRef, useState } from "react";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// هر چیزی که رفتار دکمه‌ای داره: خودِ button و لینک‌هایی که شکل دکمه‌ان
const MAGNET_SELECTOR = "button, .btn, .to-top, .social-dot, .home-scroll, [data-magnet]";

function canUseCursor() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return !coarse && !reduced;
}

export default function Cursor() {
  const [hover, setHover] = useState(false);
  const [enabled] = useState(canUseCursor);
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const target = useRef({ x: -100, y: -100 });
  const pressedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    if (dotRef.current) dotRef.current.style.transform = "translate(-100px, -100px)";

    // آهنربا: هر دکمه‌ای که موس روشه به سمت موس کشیده می‌شه و با ease برمی‌گرده.
    // از پراپرتی translate استفاده می‌کنیم تا transform خودِ دکمه (هاور/موشن) دست‌نخورده بمونه.
    const magnets = new Map(); // el → { x, y, tx, ty }
    let current = null;

    const releaseAll = () => {
      current = null;
      magnets.forEach((m) => { m.tx = 0; m.ty = 0; });
    };

    const move = (e) => {
      target.current = { x: e.clientX, y: e.clientY };

      // دکمه‌های Motion فنر خودشون رو دارن (data-no-magnet)
      const hit = e.target instanceof Element ? e.target.closest(MAGNET_SELECTOR) : null;
      let el = hit && !hit.hasAttribute("data-no-magnet") ? hit : null;

      let tx = 0;
      let ty = 0;

      if (el) {
        const r = el.getBoundingClientRect();
        // ردیف‌ها و پنل‌های بزرگ کشیده نمی‌شن؛ آهنربا فقط برای کنترل‌های جمع‌وجوره
        if (r.width > 460 || r.height > 140) {
          el = null;
        } else {
          tx = clamp(e.clientX - (r.left + r.width / 2), -60, 60) * 0.18;
          ty = clamp(e.clientY - (r.top + r.height / 2), -60, 60) * 0.18;
        }
      }

      if (el !== current) {
        current = el;
        magnets.forEach((m, node) => {
          if (node !== el) { m.tx = 0; m.ty = 0; }
        });
      }

      if (el) {
        let m = magnets.get(el);
        if (!m) {
          m = { x: 0, y: 0, tx: 0, ty: 0 };
          el.style.willChange = "translate";
          magnets.set(el, m);
        }
        m.tx = tx;
        m.ty = ty;
      }
    };

    const over = (e) => setHover(Boolean(e.target instanceof Element && e.target.closest("a,button,[data-hover]")));
    const down = () => { pressedRef.current = true; };
    const up = () => { pressedRef.current = false; };
    // موس از پنجره بیرون رفت → دکمه‌ها سر جاشون برگردن
    const out = (e) => { if (!e.relatedTarget) releaseAll(); };

    let raf = 0;
    let x = -100;
    let y = -100;
    let press = 1;
    let dotPress = 1;

    const loop = () => {
      x += (target.current.x - x) * 0.17;
      y += (target.current.y - y) * 0.17;
      press += ((pressedRef.current ? 0.72 : 1) - press) * 0.3;
      dotPress += ((pressedRef.current ? 0.7 : 1) - dotPress) * 0.35;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${x}px, ${y}px) scale(${press.toFixed(3)})`;
      }
      // نقطه دقیقاً روی موس می‌مونه، فقط له می‌شه
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x}px, ${target.current.y}px) scale(${dotPress.toFixed(3)})`;
      }

      // دکمه‌ها نرم به سمت هدف (یا صفر) می‌رن و وقتی رسیدن، از لیست درمی‌رن
      magnets.forEach((m, el) => {
        m.x += (m.tx - m.x) * 0.22;
        m.y += (m.ty - m.y) * 0.22;
        if (Math.abs(m.x - m.tx) < 0.04) m.x = m.tx;
        if (Math.abs(m.y - m.ty) < 0.04) m.y = m.ty;

        if (!m.tx && !m.ty && !m.x && !m.y) {
          el.style.translate = "";
          el.style.willChange = "";
          magnets.delete(el);
          return;
        }
        el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      });

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseout", out);
    window.addEventListener("blur", releaseAll);
    window.addEventListener("scroll", releaseAll, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseout", out);
      window.removeEventListener("blur", releaseAll);
      window.removeEventListener("scroll", releaseAll);
      cancelAnimationFrame(raf);
      magnets.forEach((m, el) => {
        el.style.translate = "";
        el.style.willChange = "";
      });
      magnets.clear();
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = hover ? 34 : 10;
  const ringSize = hover ? 46 : 26;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          border: `1.5px solid rgba(156, 44, 68, ${hover ? 0.9 : 0.75})`,
          borderRadius: "50%",
          background: hover ? "rgba(122, 31, 53, 0.16)" : "transparent",
          pointerEvents: "none",
          zIndex: 9998,
          willChange: "transform",
          transition: "width 0.25s ease, height 0.25s ease, margin 0.25s ease, background 0.25s ease, border-color 0.25s ease",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          borderRadius: "50%",
          background: hover ? "transparent" : "var(--accent-2)",
          border: hover ? "1.5px solid var(--accent-2)" : "none",
          pointerEvents: "none",
          willChange: "transform",
          transition: "width 0.15s, height 0.15s, background 0.15s, border 0.15s",
        }}
      />
    </>
  );
}
