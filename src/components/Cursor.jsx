import { useEffect, useRef, useState } from "react";

function canUseCursor() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return !coarse && !reduced;
}

export default function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const [enabled] = useState(canUseCursor);
  const ringRef = useRef(null);
  const magnetRef = useRef(null);
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled) return undefined;

    const resetMagnet = () => {
      if (magnetRef.current) {
        magnetRef.current.style.transform = "";
        magnetRef.current = null;
      }
    };

    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      target.current = { x: e.clientX, y: e.clientY };

      const el = e.target instanceof Element ? e.target.closest(".btn") : null;
      if (el !== magnetRef.current) {
        resetMagnet();
        magnetRef.current = el;
      }
      if (el) {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(dx * 0.16).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)`;
      }
    };

    const over = (e) => setHover(Boolean(e.target instanceof Element && e.target.closest("a,button,[data-hover]")));

    let raf = 0;
    let x = -100;
    let y = -100;
    const loop = () => {
      x += (target.current.x - x) * 0.17;
      y += (target.current.y - y) * 0.17;
      if (ringRef.current) ringRef.current.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over);
    window.addEventListener("scroll", resetMagnet, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
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
          border: "1.5px solid rgba(156, 44, 68, 0.75)",
          borderRadius: "50%",
          background: hover ? "rgba(122, 31, 53, 0.16)" : "transparent",
          pointerEvents: "none",
          zIndex: 9998,
          transition: "width 0.25s ease, height 0.25s ease, margin 0.25s ease, background 0.25s ease",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          width: size,
          height: size,
          borderRadius: "50%",
          background: hover ? "transparent" : "var(--accent-2)",
          border: hover ? "1.5px solid var(--accent-2)" : "none",
          transform: `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`,
          transition: "width 0.15s, height 0.15s, background 0.15s, border 0.15s",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
