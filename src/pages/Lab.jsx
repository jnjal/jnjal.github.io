import Reveal from "../components/Reveal";
import LiquidButton from "../components/lab/LiquidButton";
import MagneticButton from "../components/lab/MagneticButton";
import GlassCard from "../components/lab/GlassCard";
import ScrambleText from "../components/lab/ScrambleText";
import "./Lab.css";

const EXPERIMENTS = [
  { id: "001", title: "دکمه مایع", desc: "هاور کن تا ببینی چطور از پایین بالا میاد.", Demo: LiquidButton },
  { id: "002", title: "نشانگر مغناطیسی", desc: "دکمه به سمت موس کج می‌شه.", Demo: MagneticButton },
  { id: "003", title: "کارت شیشه‌ای", desc: "یه اسپات‌لایت که دنبال موس می‌گرده.", Demo: GlassCard },
  { id: "004", title: "اعوجاج متن", desc: "هاور کن تا متن رمزگشایی بشه.", Demo: ScrambleText },
];

export default function Lab() {
  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">آزمایشگاه</Reveal>
        <Reveal delay={60}><h1 className="page-title">چیزایی که فقط برای بازی کردن ساختم</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          نه همه‌شون کاربردی‌ان. بعضی‌هاشون فقط بهونه بودن برای تست یه ایده‌ی کوچیک.
        </Reveal>

        <div className="lab-grid">
          {EXPERIMENTS.map(({ id, title, desc, Demo }, i) => (
            <Reveal key={id} delay={i * 90} className="card lab-item">
              <div className="lab-item-head">
                <span className="mono faint" style={{ fontSize: 12 }}>#{id}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                  <div className="dim" style={{ fontSize: 12.5, marginTop: 2 }}>{desc}</div>
                </div>
              </div>
              <div className="lab-item-demo">
                <Demo />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
