import { useEffect, useState } from "react";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// متن رو قدم‌قدم تایپ می‌کنه — `active` یعنی از کِی شروع کنه، `delay` میلی‌ثانیه تاخیره.
export default function useTyped(text, active = true, speed = 38, delay = 0) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!active || !text) return undefined;

    if (prefersReducedMotion()) {
      const t = window.setTimeout(() => setOut(text), 0);
      return () => window.clearTimeout(t);
    }

    let i = 0;
    let interval = 0;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) window.clearInterval(interval);
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [text, active, speed, delay]);

  return out;
}
