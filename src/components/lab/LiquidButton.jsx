import "./LiquidButton.css";

export default function LiquidButton() {
  return (
    <button className="liquid-btn" data-hover>
      <span className="liquid-blob" aria-hidden="true" />
      <span className="liquid-label">هاور کن</span>
    </button>
  );
}
