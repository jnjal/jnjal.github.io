import { useRef } from "react";
import "./MagneticButton.css";

export default function MagneticButton() {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  return (
    <div className="magnetic-zone" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <button ref={ref} className="magnetic-btn" data-hover>بیا نزدیک</button>
    </div>
  );
}
