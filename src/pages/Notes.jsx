import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { NOTES } from "../data/content";
import "./Notes.css";

export default function Notes() {
  return (
    <section id="notes" className="section">
      <div className="container">
        <Reveal className="kicker">یادداشت‌ها</Reveal>
        <Reveal delay={60}><h2 className="page-title">چند خط، بدون ویرایش زیاد</h2></Reveal>
        <Reveal delay={120} className="page-lede">
          یه چیزی بین دفترچه‌خاطرات و لاگ توسعه. تاریخ‌گذاری شده، ناقص، و همون‌طوری که فکرش کردم.
        </Reveal>

        {NOTES.length === 0 ? (
          <Reveal className="notes-empty">
            <div className="paper">
              <span className="paper-tape" aria-hidden="true" />
              <div className="paper-head">
                <Icon name="pencil" className="paper-icon" size={16} />
                <span className="mono faint">۰ یادداشت</span>
              </div>
              <p className="paper-text">هنوز چیزی اینجا ننوشتم. شاید یه شب دیگه، شاید هرگز.</p>
              <span className="paper-line" aria-hidden="true" />
            </div>
          </Reveal>
        ) : (
          <div className="notes-scrap">
            {NOTES.map((note, i) => (
              <Reveal key={note.date} delay={i * 70} className="note-slot">
                <article className="note-card">
                  <span className="note-tape" aria-hidden="true" />
                  <div className="note-top">
                    <span className="note-date mono">{note.date}</span>
                    <span className="note-index mono faint">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="note-text">{note.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
