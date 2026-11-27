import { useEffect, useState } from "react";
import { PROFILE } from "../data/content";
import "./Clock.css";

// فرمت سطح ماژول — ساخته‌شدن توی هر رندر هزینه‌داره
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: PROFILE.timezone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTime() {
  return TIME_FMT.format(new Date());
}

export default function Clock({ className = "" }) {
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`clock mono${className ? ` ${className}` : ""}`}>
      <span className="clock-dot" aria-hidden="true" />
      {/* کلید هر رقم بر اساس جایگاه + خودِ رقمه؛ فقط رقمِ عوض‌شده دوباره mount می‌شه و roll می‌خوره */}
      <span className="clock-time">
        {time.split("").map((ch, i) => (
          <span key={`${i}-${ch}`} className={ch === ":" ? "clock-colon" : "clock-digit"}>
            {ch}
          </span>
        ))}
      </span>
      <span className="clock-zone">· {PROFILE.gmtLabel}</span>
    </span>
  );
}
