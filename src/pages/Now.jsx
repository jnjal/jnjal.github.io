import Reveal from "../components/Reveal";
import { NOW } from "../data/content";
import "./Now.css";

export default function Now() {
  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">الان</Reveal>
        <Reveal delay={60}><h1 className="page-title">این روزا چیکار می‌کنم</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          یه صفحه که سعی می‌کنم به‌روز نگهش دارم. آخرین آپدیت: <span className="mono">{NOW.updatedAt}</span>
        </Reveal>

        <div className="now-list">
          {NOW.items.map((item, i) => (
            <Reveal key={item.label} delay={i * 80} className="card now-card">
              <span className="now-emoji" aria-hidden="true">{item.emoji}</span>
              <div>
                <div className="mono faint" style={{ fontSize: 11.5, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{item.value}</div>
                <div className="dim" style={{ fontSize: 13.5 }}>{item.detail}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
