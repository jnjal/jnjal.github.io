import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { SUPPORT } from "../data/content";
import "./Support.css";

const ready = Boolean(SUPPORT.url && SUPPORT.url !== "#");

export default function Support() {
  return (
    <section id="support" className="section">
      <div className="container">
        <Reveal className="kicker">حمایت</Reveal>
        <Reveal delay={60}><h2 className="page-title">اگه کارام به دردت خورد</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          بدون اجبار و بدون چشم‌داشت. یه حمایت کوچیک یعنی یه شب کد بیشتر و یه فنجون قهوه‌ی داغ‌تر.
        </Reveal>

        <Reveal delay={180} className="support-card">
          <div className="support-body">
            <span className="support-badge mono">✦ support · voluntary</span>
            <div className="support-title">یه دست کمک</div>
            <p className="support-text dim">
              اگه این سایت یا یکی از پروژه‌های دیگه‌ام برات ارزشی داشته، می‌تونی از راه درگاه حمایت کنی.
              هر مبلغی، هر وقتی که خواستی — بدون ثبت‌نام، بدون تعهد.
            </p>
          </div>

          {ready ? (
            <a
              className="support-btn"
              href={SUPPORT.url}
              target="_blank"
              rel="noopener noreferrer"
              data-hover
            >
              <Icon name="heart" size={17} />
              {SUPPORT.label}
            </a>
          ) : (
            <span className="support-btn support-btn-pending">لینک درگاه به‌زودی</span>
          )}
        </Reveal>
      </div>
    </section>
  );
}
