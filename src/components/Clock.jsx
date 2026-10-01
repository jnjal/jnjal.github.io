import { useEffect, useState } from "react";
import { PROFILE } from "../data/content";

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
    <span className={`mono ${className}`} style={{ fontSize: 11, color: "var(--text-faint)", display: "inline-flex", gap: 8, alignItems: "center" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5fbf6e", display: "inline-block" }} />
      {time} · {PROFILE.gmtLabel}
    </span>
  );
}
