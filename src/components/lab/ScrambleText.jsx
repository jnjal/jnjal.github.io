import { useEffect, useRef, useState } from "react";
import "./ScrambleText.css";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";
const ORIGINAL = "JNJAL.DEV";

export default function ScrambleText() {
  const [display, setDisplay] = useState(ORIGINAL);
  const raf = useRef(null);

  const scramble = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let iteration = 0;
    clearInterval(raf.current);
    raf.current = setInterval(() => {
      setDisplay(
        ORIGINAL.split("")
          .map((char, i) => {
            if (i < iteration) return ORIGINAL[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (iteration >= ORIGINAL.length) clearInterval(raf.current);
      iteration += 1 / 3;
    }, 35);
  };

  const reset = () => {
    clearInterval(raf.current);
    setDisplay(ORIGINAL);
  };

  useEffect(() => () => clearInterval(raf.current), []);

  return (
    <button
      className="scramble-text mono"
      onMouseEnter={scramble}
      onMouseLeave={reset}
      onFocus={scramble}
      onBlur={reset}
      data-hover
      aria-label={ORIGINAL}
    >
      {display}
    </button>
  );
}
