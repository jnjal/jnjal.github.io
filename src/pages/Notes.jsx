import { useState } from "react";
import Reveal from "../components/Reveal";
import Icon from "../components/Icon";
import { NOTES } from "../data/content";
import "./Notes.css";

// آیکون هر حس‌وحال — بدون ایموجی، از آیکون‌های SVG سایت
const MOOD_ICONS = {
  "بی‌خواب": "moon",
  فکر: "thought",
  خوش: "pulse",
  کد: "code",
};

export default function Notes() {
  const [openNote, setOpenNote] = useState(null);

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
                <span className="mono faint">۰ یادداشت ✦</span>
              </div>
              <p className="paper-text">هنوز چیزی اینجا ننوشتم. شاید یه شب دیگه، شاید هرگز.</p>
              <span className="paper-line" aria-hidden="true" />
            </div>
          </Reveal>
        ) : (
          <div className="notes-scrap">
            {NOTES.map((note, i) => {
              const key = `${note.date}-${i}`;
              const isOpen = openNote === key;
              const long = note.text.length > 160;

              return (
                <Reveal key={key} delay={i * 70} className="note-slot">
                  <article className="note-card">
                    <span className="note-tape" aria-hidden="true" />
                    {i === 0 && <span className="note-new">جدید</span>}

                    <div className="note-top">
                      <span className="note-date mono">{note.date}</span>
                      <span className="note-index mono faint">{String(i + 1).padStart(2, "0")}</span>
                    </div>

                    {note.title && <h3 className="note-title">{note.title}</h3>}

                    <p className={`note-text${isOpen ? " is-open" : ""}`}>{note.text}</p>

                    {long && (
                      <button
                        type="button"
                        className="note-more"
                        onClick={() => setOpenNote(isOpen ? null : key)}
                        data-hover
                      >
                        {isOpen ? "کمتر" : "ادامه"}
                      </button>
                    )}

                    {(note.mood || note.tags?.length > 0) && (
                      <div className="note-foot">
                        {note.tags?.length > 0 && (
                          <div className="note-tags">
                            {note.tags.map((t) => (
                              <span key={t} className="note-tag mono">#{t}</span>
                            ))}
                          </div>
                        )}
                        {note.mood && (
                          <span className="note-mood">
                            <Icon name={MOOD_ICONS[note.mood] || "note"} size={12} />
                            {note.mood}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
