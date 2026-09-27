import { useState } from "react";
import Reveal from "../components/Reveal";
import useLocalStorage from "../hooks/useLocalStorage";
import { GUESTBOOK_SEED } from "../data/content";
import "./Guestbook.css";

function timeAgo(ts) {
  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "امروز";
  if (days === 1) return "دیروز";
  return `${days} روز پیش`;
}

export default function Guestbook() {
  const [entries, setEntries] = useLocalStorage("guestbook", GUESTBOOK_SEED);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim() || !message.trim()) {
      setError("اسم و پیام رو پر کن");
      return;
    }
    setEntries([{ name: name.trim(), message: message.trim(), ts: Date.now() }, ...entries]);
    setName("");
    setMessage("");
    setError("");
  };

  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">دفتر مهمان</Reveal>
        <Reveal delay={60}><h1 className="page-title">یه چیزی بنویس</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          فعلاً پیام‌ها فقط تو مرورگر خودت ذخیره می‌شن، بدون سرور — یه‌جور دفترچه شخصیه، نه یه بورد عمومی.
        </Reveal>

        <Reveal className="card guestbook-form">
          <input placeholder="اسمت" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea rows={3} placeholder="یه چیزی بنویس..." value={message} onChange={(e) => setMessage(e.target.value)} />
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary" onClick={submit} data-hover>ثبت پیام</button>
        </Reveal>

        <div className="guestbook-list">
          {entries.map((e, i) => (
            <Reveal key={`${e.ts}-${i}`} delay={i * 40} className="card guestbook-entry">
              <div className="guestbook-entry-top">
                <span style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</span>
                <span className="mono faint" style={{ fontSize: 11 }}>{timeAgo(e.ts)}</span>
              </div>
              <p className="dim" style={{ fontSize: 14, lineHeight: 1.8, marginTop: 6 }}>{e.message}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
