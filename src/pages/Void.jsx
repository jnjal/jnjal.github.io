import { Link } from "react-router-dom";
import ScrambleText from "../components/lab/ScrambleText";
import "./Void.css";

export default function Void() {
  return (
    <div className="page void-page">
      <div className="container void-inner">
        <div className="mono faint" style={{ fontSize: 12, marginBottom: 18 }}>/void</div>
        <h1 className="void-title">احتمالاً نباید اینجا باشی.</h1>
        <p className="dim" style={{ maxWidth: 420, lineHeight: 1.9, marginBottom: 36 }}>
          ولی حالا که اومدی، یه هدیه‌ی کوچیک: پنج بار روی لوگو کلیک کردی تا به اینجا برسی. کنجکاوی خوبه.
        </p>
        <div style={{ marginBottom: 40 }}>
          <ScrambleText />
        </div>
        <Link to="/" className="btn" data-hover>برگردیم به دنیای واقعی ←</Link>
      </div>
    </div>
  );
}
