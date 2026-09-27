import { Link } from "react-router-dom";
import "./Void.css";

export default function NotFound() {
  return (
    <div className="page void-page">
      <div className="container void-inner">
        <div className="mono faint" style={{ fontSize: 12, marginBottom: 18 }}>404</div>
        <h1 className="void-title">این صفحه پیدا نشد.</h1>
        <p className="dim" style={{ maxWidth: 420, lineHeight: 1.9, marginBottom: 36 }}>
          یا اشتباه تایپ کردی، یا این یه لینک قدیمیه که دیگه وجود نداره.
        </p>
        <Link to="/" className="btn" data-hover>برو خونه ←</Link>
      </div>
    </div>
  );
}
