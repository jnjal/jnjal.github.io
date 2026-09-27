import { useEffect, useRef, useState } from "react";
import ScrambleText from "../components/lab/ScrambleText";
import useTyped from "../hooks/useTyped";
import "./Void.css";

const SECRET = "void";
const BODY =
  "ولی حالا که اومدی، یه هدیه‌ی کوچیک: پنج بار روی لوگو کلیک کردی تا به اینجا برسی. کنجکاوی خوبه.";

export default function Void({ onClose }) {
  const [found, setFound] = useState(false);
  const buffer = useRef("");
  const typed = useTyped(BODY, true, 26, 550);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key.length !== 1) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-16);
      if (buffer.current.endsWith(SECRET)) setFound((v) => !v);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className={`void-overlay${found ? " is-found" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="/void"
    >
      <div className="void-noise" aria-hidden="true" />

      <div className="container void-inner">
        <div className="mono faint" style={{ fontSize: 12, marginBottom: 18 }}>/void</div>

        <h2 className="void-title">احتمالاً نباید اینجا باشی.</h2>

        <p className="dim void-body">
          {typed}
          {typed.length < BODY.length && <span className="void-caret" aria-hidden="true" />}
        </p>

        <div className="void-scramble">
          <ScrambleText />
        </div>

        {found && (
          <div className="void-secret">
            <div className="mono">access granted</div>
            <p>پیدام کردی. حالا اینجا جای توئه — هر وقت خواستی برگرد.</p>
          </div>
        )}

        <button type="button" className="btn" onClick={onClose} data-hover>
          برگردیم به دنیای واقعی ←
        </button>
      </div>
    </div>
  );
}
