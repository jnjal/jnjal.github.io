import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WORKER_URL } from "../data/content";
import "./Archive.css";

const API = WORKER_URL.replace(/\/+$/, "");
const TOKEN_KEY = "archive_token";
const GLITCH_MS = 780;
const UNLOCK_MS = 950;

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "";
  }
};

export default function Archive({ onClose }) {
  const [stage, setStage] = useState("glitch"); // glitch | safe | unlocking | open
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const unlockTimer = useRef(0);
  const inputRef = useRef(null);

  // فوکوس روی فیلد رمز به‌محض نمایش گاوصندوق
  useEffect(() => {
    if (stage === "safe") inputRef.current?.focus();
  }, [stage]);

  const load = useCallback(async (token) => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`${API}/archive`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setStage("safe");
        setError("نشست تموم شده — دوباره رمز رو وارد کن.");
        return;
      }
      if (!res.ok) throw new Error();

      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setLoadError("ارتباط با سرور برقرار نشد. بعداً دوباره تلاش کن.");
    } finally {
      setLoading(false);
    }
  }, []);

  // قفل اسکرول + Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(unlockTimer.current);
    };
  }, [onClose]);

  // بعد از glitch: اگه نشست ذخیره‌شده‌ای هست رد می‌شیم، وگرنه گاوصندوق رو نشون بده
  useEffect(() => {
    const t = window.setTimeout(() => {
      const saved = sessionStorage.getItem(TOKEN_KEY);
      if (saved) {
        setStage("unlocking");
        unlockTimer.current = window.setTimeout(() => setStage("open"), UNLOCK_MS);
        load(saved);
      } else {
        setStage("safe");
      }
    }, GLITCH_MS);
    return () => window.clearTimeout(t);
  }, [load]);

  const unlock = async (e) => {
    e.preventDefault();
    if (busy || stage !== "safe") return;
    if (!password) {
      setError("رمز رو وارد کن.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/archive/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 401) {
        setError("رمز اشتباهه.");
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!data.token) throw new Error();

      sessionStorage.setItem(TOKEN_KEY, data.token);
      setPassword("");
      setStage("unlocking");
      window.clearTimeout(unlockTimer.current);
      unlockTimer.current = window.setTimeout(() => setStage("open"), UNLOCK_MS);
      load(data.token);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setPassword("");
    setEntries([]);
    setError("");
    setStage("safe");
  };

  return createPortal(
    <div className="arc-overlay" role="dialog" aria-modal="true" aria-label="Archive">
      <div className="arc-noise" aria-hidden="true" />
      {stage === "glitch" && <div className="arc-glitch" aria-hidden="true" />}

      <div className="arc-shell">
        <header className="arc-head">
          <span className="mono">archive — private room</span>
          <div className="arc-head-btns">
            {stage === "open" && (
              <button type="button" className="arc-mini" onClick={lock} data-hover>
                قفل کن
              </button>
            )}
            <button type="button" className="arc-mini" onClick={onClose} aria-label="بستن" data-hover>
              ×
            </button>
          </div>
        </header>

        {stage !== "open" ? (
          <div className="arc-vault">
            <div className={`arc-dial${stage === "unlocking" ? " is-unlock" : ""}`} aria-hidden="true">
              <span className="arc-dial-ring" />
              <span className="arc-dial-hub" />
            </div>

            <form className="arc-form" onSubmit={unlock}>
              <div className="arc-form-label mono">رمز Archive</div>

              <input
                ref={inputRef}
                type="password"
                className="arc-input mono"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={stage !== "safe" || busy}
                aria-label="رمز Archive"
              />

              {error && <div className="arc-err">✗ {error}</div>}

              <button
                type="submit"
                className="btn btn-primary arc-submit"
                disabled={stage !== "safe" || busy}
                data-hover
              >
                {busy ? "در حال بررسی..." : stage === "unlocking" ? "باز شد" : "باز کن"}
              </button>

              <p className="arc-hint dim">
                این اتاق فقط برای آدم‌های خیلی نزدیکه. اگه رمزش رو نداری، احتمالاً لازمش نداری.
              </p>
            </form>
          </div>
        ) : (
          <div className="arc-room">
            <div className="arc-room-head">
              <div>
                <div className="arc-room-title">اتاق شخصی</div>
                <div className="mono faint">{entries.length} مورد</div>
              </div>
              <span className="arc-room-dot" aria-hidden="true" />
            </div>

            {loading && <div className="arc-state mono">در حال باز کردن…</div>}
            {!loading && loadError && <div className="arc-state arc-err">✗ {loadError}</div>}
            {!loading && !loadError && entries.length === 0 && (
              <div className="arc-state">
                هنوز چیزی اینجا نیست. وقتی چیزی اضافه شد، همین‌جا می‌بینیش.
              </div>
            )}

            <div className="arc-entries">
              {entries.map((e) => (
                <article className="arc-entry" key={e.id}>
                  <div className="arc-entry-top">
                    <span className="arc-type">{e.type || "note"}</span>
                    <span className="mono faint">{fmtDate(e.created_at)}</span>
                  </div>
                  <h3 className="arc-entry-title">{e.title}</h3>
                  <p className="arc-entry-text">{e.content}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
