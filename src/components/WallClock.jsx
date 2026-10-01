import { useEffect, useState } from "react";
import { PROFILE } from "../data/content";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function WallClock() {
  const now = useNow();

  let h = 0;
  let m = 0;
  let s = 0;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: PROFILE.timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
    h = get("hour");
    m = get("minute");
    s = get("second");
  } catch {
    /* ساعت مرورگر */
  }

  const hands = {
    hour: `rotate(${(h % 12) * 30 + m * 0.5}deg)`,
    min: `rotate(${m * 6 + s * 0.1}deg)`,
    sec: `rotate(${s * 6}deg)`,
  };

  return (
    <div className="arc-wall-clock" role="img" aria-label={`ساعت تهران — ${h}:${String(m).padStart(2, "0")}`}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="47" fill="#141418" stroke="#2c2c33" strokeWidth="3" />
        <circle cx="50" cy="50" r="41.5" fill="none" stroke="rgba(156, 44, 68, 0.3)" strokeWidth="1" />

        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            className={i % 3 === 0 ? "arc-clock-tick-major" : "arc-clock-tick"}
            x1="50"
            y1="10"
            x2="50"
            y2={i % 3 === 0 ? 18 : 14.5}
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}

        <line className="arc-clock-hour" x1="50" y1="52" x2="50" y2="30" style={{ transform: hands.hour }} />
        <line className="arc-clock-min" x1="50" y1="53" x2="50" y2="20" style={{ transform: hands.min }} />
        <line className="arc-clock-sec" x1="50" y1="58" x2="50" y2="17" style={{ transform: hands.sec }} />

        <circle cx="50" cy="50" r="3.6" fill="#9c2c44" />
        <circle cx="50" cy="50" r="1.4" fill="#141418" />
      </svg>
    </div>
  );
}
