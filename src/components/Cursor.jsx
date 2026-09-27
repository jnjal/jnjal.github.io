import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!enabled) return;

    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    const over = (e) => setHover(Boolean(e.target.closest("a,button,[data-hover]")));
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = hover ? 34 : 10;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        background: hover ? "transparent" : "var(--accent-2)",
        border: hover ? "1.5px solid var(--accent-2)" : "none",
        transform: `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`,
        transition: "width 0.15s, height 0.15s, background 0.15s, border 0.15s",
      }}
    />
  );
}
