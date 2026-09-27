import { useRef } from "react";
import "./GlassCard.css";

export default function GlassCard() {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} className="glass-card" onMouseMove={handleMove} data-hover>
      <div className="glass-spot" aria-hidden="true" />
      <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>موس رو تکون بده</span>
    </div>
  );
}
