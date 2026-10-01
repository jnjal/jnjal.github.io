import { useCallback, useEffect, useRef, useState } from "react";
import useInView from "../../hooks/useInView";
import "./ScrambleText.css";

const CHARS = "!<>-/[]{}=+*^?#۰۱۲۳۴۵۶۷۸۹";

// متن رو به‌صورت glitch اسکریبل می‌کنه:
// - auto: یکبار وقتی اومد توی دید
// - هاور/focus: هر بار از نو
export default function ScrambleText({
  text,
  auto = true,
  delay = 0,
  speed = 35,
  className = "",
  as: Tag = "span",
}) {
  const [ref, inView] = useInView(0.4);
  const [display, setDisplay] = useState(text);
  const timer = useRef(null);

  const stop = useCallback(() => clearInterval(timer.current), []);

  const reset = useCallback(() => {
    stop();
    setDisplay(text);
  }, [stop, text]);

  const scramble = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stop();
    let iteration = 0;
    timer.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (i < iteration) return text[i];
            if (char === " ") return " ";
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (iteration >= text.length) reset();
      iteration += 1 / 3;
    }, speed);
  }, [stop, reset, text, speed]);

  useEffect(() => {
    if (!auto || !inView) return undefined;
    const id = window.setTimeout(scramble, delay);
    return () => window.clearTimeout(id);
  }, [auto, inView, delay, scramble]);

  useEffect(() => stop, [stop]);

  return (
    <Tag
      ref={ref}
      className={`scramble ${className}`}
      onMouseEnter={scramble}
      onMouseLeave={reset}
      aria-label={text}
    >
      {display}
    </Tag>
  );
}
