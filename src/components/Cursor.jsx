import { useEffect, useRef, useState } from "react";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

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
  const magnetRef = useRef(null);
  const target = useRef({ x: -100, y: -100 });
  const pressedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    if (dotRef.current) dotRef.current.style.transform = "translate(-100px, -100px)";

    // دکمه با transition خودش برمی‌گرده، نه با پرش یک‌باره
    const resetMagnet = () => {
      if (magnetRef.current) {
        magnetRef.current.style.transform = "translate(0px, 0px)";
        magnetRef.current = null;
      }
    };

    const move = (e) => {
      target.current = { x: e.clientX, y: e.clientY };

      // فقط دکمه‌های عادی کشیده می‌شن؛ دکمه‌های Motion خودشون فنر دارن (data-no-magnet)
      let el = e.target instanceof Element ? e.target.closest(".btn, [data-magnet]") : null;
      if (el && el.hasAttribute("data-no-magnet")) el = null;

      if (el !== magnetRef.current) {
        resetMagnet();
        magnetRef.current = el;
      }

      if (el) {
        const r = el.getBoundingClientRect();
        const dx = clamp(e.clientX - (r.left + r.width / 2), -60, 60);
        const dy = clamp(e.clientY - (r.top + r.height / 2), -60, 60);
        el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.18).toFixed(1)}px)`;
      }
    };

    const over = (e) => setHover(Boolean(e.target instanceof Element && e.target.closest("a,button,[data-hover]")));
    const down = () => { pressedRef.current = true; };
    const up = () => { pressedRef.current = false; };

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
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("blur", up);
    window.addEventListener("scroll", resetMagnet, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("blur", up);
      window.removeEventListener("scroll", resetMagnet);
      cancelAnimationFrame(raf);
      resetMagnet();
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
