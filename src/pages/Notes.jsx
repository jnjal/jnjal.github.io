import Reveal from "../components/Reveal";
import { NOTES } from "../data/content";
import "./Notes.css";

export default function Notes() {
  return (
    <div className="page">
      <div className="container">
        <Reveal className="kicker">یادداشت‌ها</Reveal>
        <Reveal delay={60}><h1 className="page-title">چند خط، بدون ویرایش زیاد</h1></Reveal>
        <Reveal delay={120} className="page-lede">
          یه چیزی بین دفترچه‌خاطرات و لاگ توسعه. تاریخ‌گذاری شده، ناقص، و همون‌طوری که فکرش کردم.
        </Reveal>

        <div className="notes-list">
          {NOTES.map((note, i) => (
            <Reveal key={note.date} delay={i * 60} className="note-row">
              <div className="mono note-date">{note.date}</div>
              <p className="note-text">{note.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
