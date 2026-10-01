import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WORKER_URL, ARCHIVE_TYPES } from "../data/content";
import useTyped, { prefersReducedMotion } from "../hooks/useTyped";
import Icon from "./Icon";
import WallClock from "./WallClock";
import avatarSrc from "../assets/avatar.jpg";
import "./Archive.css";

const API = WORKER_URL.replace(/\/+$/, "");
const TOKEN_KEY = "archive_token";
const UNLOCK_MS = 950;
const IDLE_MS = 120000;

const GHOST_TYPES = new Set(["secret", "unsaid"]);

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "";
  }
};

const faNum = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const fmtClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const metaOf = (type) => ARCHIVE_TYPES[type] || { label: type || "note", icon: "file", color: "#9c2c44" };

// گروه‌بندی بر اساس نوع، با ترتیب نوع‌های شناخته‌شده
function groupByType(entries) {
  const groups = [];
  const index = new Map();

  entries.forEach((e) => {
    const key = e.type || "note";
    if (!index.has(key)) {
      const g = { key, meta: metaOf(key), items: [] };
      index.set(key, g);
      groups.push(g);
    }
    index.get(key).items.push(e);
  });

  const order = Object.keys(ARCHIVE_TYPES);
  groups.sort((a, b) => {
    const ia = order.indexOf(a.key);
    const ib = order.indexOf(b.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return groups;
}

// جای ارقام کیبورد هر بار رندومه (شامل صفر)
function shuffleKeys() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

// تایپ متن کوتاه موقع ورود (صفحه‌ی اول کتاب اول)
function TypedContent({ text, active, delay = 0, className = "bp-text" }) {
  const content = text || "";
  const canType = content.length > 0 && content.length <= 300;
  const out = useTyped(content, active && canType, 14, delay);
  return <p className={className}>{canType ? out : content}</p>;
}

export default function Archive({ onClose }) {
  const [stage, setStage] = useState(() =>
    sessionStorage.getItem(TOKEN_KEY) ? "unlocking" : "safe"
  ); // safe | unlocking | open
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [keys, setKeys] = useState(shuffleKeys);
  const [round, setRound] = useState(0);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [openBook, setOpenBook] = useState(null);
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState(""); // "" | fwd | back
  const [flipping, setFlipping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [idleLeft, setIdleLeft] = useState(IDLE_MS);

  const denyTimer = useRef(0);
  const flipTimer = useRef(0);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const activityRef = useRef(0);
  const reduced = prefersReducedMotion();

  const groups = groupByType(entries);
  const openGroup = openBook ? groups.find((g) => g.key === openBook) : null;
  const openIndex = openGroup ? groups.indexOf(openGroup) : -1;
  const pages = openGroup ? openGroup.items : [];
  const pageCount = pages.length;
  const pageIdx = Math.min(page, Math.max(0, pageCount - 1));
  const currentEntry = pages[pageIdx];

  // ورق زدن: اول صفحه‌ی فعلی می‌پره، بعد صفحه‌ی بعدی می‌شینه (کم‌حرکت: مستقیم عوض می‌شه)
  const turnTo = useCallback(
    (target) => {
      const t = Math.max(0, Math.min(pageCount - 1, target));
      if (t === page || flipping) return;
      if (prefersReducedMotion()) {
        setPage(t);
        return;
      }
      setFlip(t > page ? "fwd" : "back");
      setFlipping(true);
      window.clearTimeout(flipTimer.current);
      flipTimer.current = window.setTimeout(() => {
        setPage(t);
        setFlipping(false);
      }, 210);
    },
    [page, flipping, pageCount]
  );

  const pageFlipClass = flipping
    ? flip === "fwd"
      ? " is-out-fwd"
      : " is-out-back"
    : flip === "fwd"
      ? " is-in-fwd"
      : flip === "back"
        ? " is-in-back"
        : "";

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

  const lock = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setPassword("");
    setEntries([]);
    setError("");
    setStage("safe");
  }, []);

  // ورود با توکن ذخیره‌شده — بدون گلیچ، لاگ ترمینال و در
  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    const t = saved ? window.setTimeout(() => load(saved), 0) : 0;
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(denyTimer.current);
    };
  }, [load]);

  // قفل‌گشایی چرخ → مستقیم ورود به اتاق
  useEffect(() => {
    if (stage !== "unlocking") return undefined;
    const t = window.setTimeout(() => {
      if (sessionStorage.getItem(TOKEN_KEY)) setStage("open");
      else setStage("safe");
    }, UNLOCK_MS);
    return () => window.clearTimeout(t);
  }, [stage]);

  // فوکوس روی فیلد رمز
  useEffect(() => {
    if (stage === "safe") inputRef.current?.focus();
  }, [stage]);

  // قفل اسکرول + Esc (اول کتاب، بعد کل اتاق)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (openBook) setOpenBook(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, openBook]);

  // ورق زدن با کلیدهای جهت‌دار (کتاب باز)
  useEffect(() => {
    if (!openGroup) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") turnTo(pageIdx + 1);
      else if (e.key === "ArrowRight") turnTo(pageIdx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openGroup, turnTo, pageIdx]);

  useEffect(() => () => window.clearTimeout(flipTimer.current), []);

  // قفل خودکار بعد از بی‌حرکتی
  useEffect(() => {
    if (stage !== "open") return undefined;

    activityRef.current = Date.now();
    const onActivity = () => {
      activityRef.current = Date.now();
    };
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);

    const id = window.setInterval(() => {
      const left = IDLE_MS - (Date.now() - activityRef.current);
      setIdleLeft(left);
      if (left <= 0) lock();
    }, 1000);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [stage, lock]);

  // پیشرفت اسکرول اتاق
  const handleScroll = (e) => {
    activityRef.current = Date.now();
    const sc = e.currentTarget;
    const max = sc.scrollHeight - sc.clientHeight;
    setProgress(max > 0 ? Math.min(100, (sc.scrollTop / max) * 100) : 0);
  };

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
        setDenied(true);
        setKeys(shuffleKeys());
        setRound((r) => r + 1);
        window.clearTimeout(denyTimer.current);
        denyTimer.current = window.setTimeout(() => setDenied(false), 700);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!data.token) throw new Error();

      sessionStorage.setItem(TOKEN_KEY, data.token);
      setPassword("");
      setStage("unlocking");
      load(data.token);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  const push = (digit) => {
    setError("");
    setDenied(false);
    setPassword((p) => (p + digit).slice(0, 16));
  };

  const clearPin = () => {
    setError("");
    setDenied(false);
    setPassword("");
  };

  const padDisabled = stage !== "safe" || busy;
  const dialTurn = reduced ? undefined : `rotate(${stage === "unlocking" ? 270 : password.length * 30}deg)`;

  return createPortal(
    <div
      className="arc-overlay"
      ref={overlayRef}
      onScroll={handleScroll}
      role="dialog"
      aria-modal="true"
      aria-label="Archive"
    >
      <div className="arc-noise" aria-hidden="true" />

      <div className="arc-shell">
        <header className="arc-head">
          <span className="mono">archive — private room</span>

          <div className="arc-head-right">
            {stage === "open" && idleLeft <= 60000 && (
              <span className="arc-idle mono"><Icon name="lock" size={12} /> {fmtClock(idleLeft)}</span>
            )}
            {stage === "open" && (
              <button type="button" className="arc-mini" onClick={lock} data-hover>
                قفل کن
              </button>
            )}
            <button type="button" className="arc-mini" onClick={onClose} aria-label="بستن" data-hover>
              ×
            </button>
          </div>

          <span className="arc-progress" aria-hidden="true" style={{ width: `${progress}%` }} />
        </header>

        {(stage === "safe" || stage === "unlocking") && (
          <div className="arc-vault">
            <div className="arc-vault-door">
              <span className="arc-bolt arc-bolt-tl" aria-hidden="true" />
              <span className="arc-bolt arc-bolt-tr" aria-hidden="true" />
              <span className="arc-bolt arc-bolt-bl" aria-hidden="true" />
              <span className="arc-bolt arc-bolt-br" aria-hidden="true" />
              <span className="arc-hinge arc-hinge-1" aria-hidden="true" />
              <span className="arc-hinge arc-hinge-2" aria-hidden="true" />

              <div className="arc-dial-slot">
                <span className="arc-dial-pointer" aria-hidden="true" />
                <div
                  className={`arc-dial${stage === "unlocking" ? " is-unlock" : ""}`}
                  aria-hidden="true"
                  style={dialTurn ? { transform: dialTurn } : undefined}
                >
                  <svg viewBox="0 0 200 200" className="arc-dial-svg">
                    <defs>
                      <radialGradient id="arc-dial-face" cx="34%" cy="28%" r="78%">
                        <stop offset="0%" stopColor="#2c2c33" />
                        <stop offset="62%" stopColor="#16161a" />
                        <stop offset="100%" stopColor="#0c0c0e" />
                      </radialGradient>
                      <radialGradient id="arc-dial-hub" cx="35%" cy="30%" r="75%">
                        <stop offset="0%" stopColor="#b23a52" />
                        <stop offset="68%" stopColor="#7a1f35" />
                        <stop offset="100%" stopColor="#571325" />
                      </radialGradient>
                    </defs>

                    <circle cx="100" cy="100" r="97" fill="#101014" stroke="#33333b" strokeWidth="2" />
                    <circle cx="100" cy="100" r="90" fill="url(#arc-dial-face)" stroke="#26262c" />

                    {Array.from({ length: 48 }, (_, i) => (
                      <line
                        key={`tick-${i}`}
                        className="arc-dial-tick"
                        x1="100"
                        y1="5"
                        x2="100"
                        y2="13"
                        transform={`rotate(${i * 7.5} 100 100)`}
                      />
                    ))}

                    {Array.from({ length: 10 }, (_, i) => {
                      const a = ((i * 36) * Math.PI) / 180;
                      return (
                        <text
                          key={`num-${i}`}
                          className="arc-dial-num"
                          x={100 + 74 * Math.sin(a)}
                          y={100 - 74 * Math.cos(a) + 4}
                          textAnchor="middle"
                        >
                          {i * 10}
                        </text>
                      );
                    })}

                    <circle
                      cx="100"
                      cy="100"
                      r="66"
                      fill="none"
                      stroke="rgba(156, 44, 68, 0.55)"
                      strokeWidth="1.4"
                      strokeDasharray="3 6"
                    />

                    {[0, 120, 240].map((deg) => (
                      <g key={`spoke-${deg}`} transform={`rotate(${deg} 100 100)`}>
                        <rect
                          x="96.5"
                          y="46"
                          width="7"
                          height="46"
                          rx="3.5"
                          fill="#2e2e36"
                          stroke="#3a3a43"
                          strokeWidth="0.8"
                        />
                        <circle cx="100" cy="44" r="6.5" fill="#26262d" stroke="#3a3a43" strokeWidth="0.8" />
                      </g>
                    ))}

                    <circle cx="100" cy="100" r="27" fill="url(#arc-dial-hub)" stroke="#3f101e" strokeWidth="2" />
                    <circle cx="100" cy="100" r="10" fill="#3a0f1c" />
                  </svg>
                </div>
              </div>

            <form className="arc-form" onSubmit={unlock}>
              <label className={`arc-display${denied ? " is-denied" : ""}`}>
                <span className="arc-display-top mono">
                  <span>archive</span>
                  <span
                    className={`arc-led${busy || stage === "unlocking" ? " is-on" : ""}`}
                    aria-hidden="true"
                  />
                </span>

                <input
                  ref={inputRef}
                  type="password"
                  inputMode="none"
                  className="arc-display-input mono"
                  placeholder="––––"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  disabled={padDisabled}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="رمز Archive (عددی)"
                />

                <span className="arc-display-bottom mono">
                  <span key={`${password.length}-${stage}`} className="arc-pop">
                    {stage === "unlocking"
                      ? "access granted"
                      : password
                        ? `${password.length} digit`
                        : "enter pin"}
                  </span>
                  {error && <span className="arc-display-err">err</span>}
                </span>
              </label>

              {error && <div className="arc-err">✗ {error}</div>}

              <div className="arc-pad" key={round}>
                {keys.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    className="arc-key"
                    style={{ animationDelay: `${i * 22}ms` }}
                    onClick={() => push(String(n))}
                    disabled={padDisabled}
                    data-hover
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="submit"
                  className="arc-key arc-key-enter arc-key-wide-a"
                  disabled={padDisabled}
                  data-hover
                  aria-label="تایید"
                >
                  ↵
                </button>
                <button
                  type="button"
                  className="arc-key arc-key-clear arc-key-wide-b"
                  onClick={clearPin}
                  disabled={padDisabled}
                  data-hover
                >
                  C
                </button>

                <span className="arc-pad-label mono">archive · pin pad</span>
              </div>

              <p className="arc-hint dim">
                این اتاق فقط برای آدم‌های خیلی نزدیکه. اگه رمزش رو نداری، احتمالاً لازمش نداری.
              </p>
            </form>
            </div>
          </div>
        )}

        {stage === "open" && (
          <div className="arc-room">
            <div className="arc-room-head">
              <div className="arc-room-id">
                <div className="arc-room-title">اتاق شخصی</div>
                <div className="arc-room-stats mono">
                  {faNum(entries.length)} مورد · {faNum(groups.length)} موضوع
                </div>
              </div>

              <div className="arc-room-side">
                <svg className="arc-seal" viewBox="0 0 120 120" aria-hidden="true">
                  <defs>
                    <path
                      id="arc-seal-path"
                      d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
                    />
                    <clipPath id="arc-seal-avatar-clip">
                      <circle cx="60" cy="60" r="34" />
                    </clipPath>
                  </defs>
                  <circle className="arc-seal-ring" cx="60" cy="60" r="57" />
                  <circle className="arc-seal-ring arc-seal-ring-dash" cx="60" cy="60" r="36" />
                  <g className="arc-seal-rotate">
                    <text className="arc-seal-text">
                      <textPath href="#arc-seal-path" startOffset="0">
                        PRIVATE ARCHIVE · JNJAL · 
                      </textPath>
                    </text>
                  </g>
                  <image
                    className="arc-seal-photo"
                    href={avatarSrc}
                    x="26"
                    y="26"
                    width="68"
                    height="68"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#arc-seal-avatar-clip)"
                  />
                </svg>

                <WallClock />
              </div>
            </div>

            {loading && <div className="arc-state mono">در حال باز کردن…</div>}
            {!loading && loadError && <div className="arc-state arc-err">✗ {loadError}</div>}
            {!loading && !loadError && entries.length === 0 && (
              <div className="arc-state">
                هنوز چیزی اینجا نیست. وقتی چیزی اضافه شد، همین‌جا می‌بینیش.
              </div>
            )}

            {!loading && !loadError && entries.length > 0 && (
              <>
                {!openGroup && (
                  <>
                    <div className="arc-shelf-wrap">
                      <div className="arc-shelf">
                        {groups.map((g, i) => (
                          <button
                            key={g.key}
                            type="button"
                            className="book"
                            style={{ "--type": g.meta.color }}
                            onClick={() => {
                              window.clearTimeout(flipTimer.current);
                              setOpenBook(g.key);
                              setPage(0);
                              setFlip("");
                              setFlipping(false);
                            }}
                            data-hover
                          >
                            <span className="book-spine" aria-hidden="true" />
                            <span className="book-edges" aria-hidden="true" />
                            <span className="book-face">
                              <span className="book-top">
                                <Icon name={g.meta.icon} size={18} />
                                <span className="book-no mono">{faNum(i + 1)}</span>
                              </span>
                              <span className="book-title">{g.meta.label}</span>
                              <span className="book-count mono">
                                {faNum(g.items.length)} مورد
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* بچه‌گربه‌ی خوابیده روی قفسه */}
                      <span className="arc-cat" aria-hidden="true">
                        <svg viewBox="0 0 140 72">
                          <g className="arc-cat-breath">
                            {/* بدنِ خمیده (تیره‌تر از سر تا جدا دیده بشه) */}
                            <path
                              d="M30 68 C 27 50 40 36 66 33 C 94 30 118 40 126 58 C 128 62 128 66 127 68 Z"
                              fill="#15151a"
                              stroke="rgba(255, 255, 255, 0.05)"
                              strokeWidth="1"
                            />
                            {/* راه‌های خفیف بدنه */}
                            <g stroke="#2e2e37" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.5">
                              <path d="M65 37 C 67 40.5 67 44 65.5 47.5" />
                              <path d="M81 35.5 C 84 40 84.5 45 83 49" />
                              <path d="M98 37.5 C 101 42 102 47.5 101 52.5" />
                              <path d="M113 44 C 116.5 48.5 118 54 117.5 60" />
                            </g>
                            <path
                              d="M102 46 C 112 51 118 58 119 67"
                              stroke="#2e2e37"
                              strokeWidth="2"
                              fill="none"
                              opacity="0.4"
                              strokeLinecap="round"
                            />

                            {/* گوش‌ها (پایینشون روی سره تا ن孚ه نزنه) */}
                            <path
                              d="M26 36 L20 10 L44 30 Z"
                              fill="#191920"
                              stroke="rgba(255, 255, 255, 0.12)"
                              strokeWidth="1"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M46 30 L58 8 L56 36 Z"
                              fill="#1f1f26"
                              stroke="rgba(255, 255, 255, 0.12)"
                              strokeWidth="1"
                              strokeLinejoin="round"
                            />
                            <path d="M28.5 34 L24 17 L41 27.5 Z" fill="#d99a8a" />
                            <path d="M48.5 31 L56.5 15 L54.5 33 Z" fill="#d99a8a" />

                            {/* سر (روشن‌تر از بدنه) */}
                            <ellipse
                              cx="40"
                              cy="46"
                              rx="21"
                              ry="18"
                              fill="#1f1f26"
                              stroke="rgba(255, 255, 255, 0.07)"
                              strokeWidth="1"
                            />
                            <g stroke="#33333d" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.6">
                              <path d="M35.5 33.5 C 34.8 36 34.8 38.5 35.5 40.5" />
                              <path d="M42.5 32 C 42.5 35 42.5 37.5 43 40" />
                              <path d="M49.5 34 C 50.3 36.5 50.7 39 50.7 41" />
                            </g>

                            {/* پوزه، دماغ، دهن */}
                            <ellipse cx="24" cy="52" rx="9" ry="6.5" fill="#27272f" />
                            <path d="M18 49 L24 49 L21 52.3 Z" fill="#c96a6a" />
                            <path
                              d="M21 53 C 19.5 55.3 17 55.6 15.5 54.4"
                              stroke="#5a5a64"
                              strokeWidth="1.4"
                              fill="none"
                              strokeLinecap="round"
                            />

                            {/* چشمِ بسته */}
                            <path
                              d="M30 42.5 C 34.5 47.5 40.5 47.5 45 42.5"
                              stroke="#8a8a95"
                              strokeWidth="2.6"
                              fill="none"
                              strokeLinecap="round"
                            />

                            {/* مژه‌ها */}
                            <g stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.1" strokeLinecap="round" fill="none">
                              <path d="M15 50 L4 46.5" />
                              <path d="M14.5 52.5 L3 52.5" />
                              <path d="M15.5 55 L4.5 58.5" />
                            </g>

                            {/* سینه‌ی خفیف */}
                            <path
                              d="M54 56 C 60 58.5 63 62.5 63.5 68 L 51 68 C 49.5 63 50.5 58.5 52 56 Z"
                              fill="#2a2a32"
                              opacity="0.55"
                            />

                            {/* پنجه‌های جلو */}
                            <ellipse cx="27" cy="64" rx="10" ry="4.8" fill="#23232b" />
                            <ellipse cx="45" cy="65.5" rx="9.5" ry="4.4" fill="#23232b" />
                            <g stroke="#3d3d47" strokeWidth="1.2" strokeLinecap="round">
                              <path d="M24 61.8 L24 65.5" />
                              <path d="M30 61.8 L30 65.8" />
                              <path d="M42.5 63.5 L42.5 67" />
                              <path d="M48 63.3 L48 66.8" />
                            </g>

                            {/* ریم‌نوری بالا — سیلوئت روی زمینه‌ی تیره */}
                            <path
                              d="M22 42 C 24 32 31 27 41 27 C 50 27 56.5 31 59.5 39.5"
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.12)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M33 63 C 31 49 43 38 66 35.5 C 92 32.5 114 42.5 122.5 58"
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.1)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />

                            {/* نور گرم میز زیرش */}
                            <path
                              d="M24 67 C 56 71.5 110 71.5 128 65"
                              stroke="rgba(255, 186, 110, 0.42)"
                              strokeWidth="2.4"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </g>

                          {/* دمِ نواردار */}
                          <g className="arc-cat-tail">
                            <path
                              d="M124 64 C 134 62 138 53 132 47.5 C 127.5 43.5 121 47 122.5 52"
                              stroke="#1e1e24"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                            />
                            <path
                              d="M124 64 C 134 62 138 53 132 47.5 C 127.5 43.5 121 47 122.5 52"
                              stroke="rgba(255, 255, 255, 0.1)"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              opacity="0.35"
                            />
                            <path d="M130 56 L134.5 57.5" stroke="#3a3a44" strokeWidth="3" strokeLinecap="round" />
                            <path d="M133.5 49.5 L137 53" stroke="#3a3a44" strokeWidth="3" strokeLinecap="round" />
                          </g>
                        </svg>
                      </span>
                    </div>

                    <div className="arc-desk" aria-hidden="true">
                      <svg viewBox="0 0 600 200" role="presentation">
                        <defs>
                          <linearGradient id="arc-cone-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffbe6e" stopOpacity="0.26" />
                            <stop offset="100%" stopColor="#ffbe6e" stopOpacity="0.05" />
                          </linearGradient>
                          <radialGradient id="arc-bulb-grad">
                            <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.55" />
                            <stop offset="55%" stopColor="#ffbe6e" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#ffbe6e" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="arc-shade-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8e2439" />
                            <stop offset="100%" stopColor="#571324" />
                          </linearGradient>
                        </defs>
                        {/* گل: سوسن عنکبوتی — ساقه و برگ و گل با هم تکون می‌خورن */}
                        <g className="arc-plant">
                          {/* گلبرگ‌های باریک و موج‌دار */}
                          <g fill="#c21f39">
                            <path
                              d="M300 34 C 298.5 28 297 24 298 19 C 299 15 296.5 12 298 8 C 299 5 301 5 302 8 C 303.5 12 301 15 302 19 C 303 24 301.5 28 300 34 Z"
                              transform="rotate(-80 300 34)"
                            />
                            <path
                              d="M300 34 C 298.5 28 297 24 298 19 C 299 15 296.5 12 298 8 C 299 5 301 5 302 8 C 303.5 12 301 15 302 19 C 303 24 301.5 28 300 34 Z"
                              transform="rotate(-40 300 34)"
                            />
                            <path d="M300 34 C 298.5 28 297 24 298 19 C 299 15 296.5 12 298 8 C 299 5 301 5 302 8 C 303.5 12 301 15 302 19 C 303 24 301.5 28 300 34 Z" />
                            <path
                              d="M300 34 C 298.5 28 297 24 298 19 C 299 15 296.5 12 298 8 C 299 5 301 5 302 8 C 303.5 12 301 15 302 19 C 303 24 301.5 28 300 34 Z"
                              transform="rotate(40 300 34)"
                            />
                            <path
                              d="M300 34 C 298.5 28 297 24 298 19 C 299 15 296.5 12 298 8 C 299 5 301 5 302 8 C 303.5 12 301 15 302 19 C 303 24 301.5 28 300 34 Z"
                              transform="rotate(80 300 34)"
                            />
                          </g>

                          {/* پرچم‌های بلند — مشخصه‌ی اصلی سوسن عنکبوتی */}
                          <g fill="none" stroke="#d63a50" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M300 34 C 294 20 280 13 264 12" />
                            <path d="M300 34 C 296 16 286 7 276 5" />
                            <path d="M300 34 C 299 15 294 6 291 4" />
                            <path d="M300 34 C 301 15 306 6 309 4" />
                            <path d="M300 34 C 304 16 314 7 324 5" />
                            <path d="M300 34 C 306 20 320 13 336 12" />
                          </g>
                          <g fill="#e8a23c">
                            <circle cx="264" cy="12" r="2.6" />
                            <circle cx="276" cy="5" r="2.6" />
                            <circle cx="291" cy="4" r="2.6" />
                            <circle cx="309" cy="4" r="2.6" />
                            <circle cx="324" cy="5" r="2.6" />
                            <circle cx="336" cy="12" r="2.6" />
                          </g>
                          <circle cx="300" cy="34" r="3.5" fill="#8f1a2e" />

                          {/* ساقه و برگ */}
                          <path
                            d="M300 76 C 296 64, 304 56, 300 38"
                            fill="none"
                            stroke="#4e9e6f"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path d="M299 64 C 286 62, 279 54, 279 45 C 290 47, 297 55, 299 64 Z" fill="#3f8a5e" />
                          <path d="M301 74 C 313 72, 319 66, 319 58 C 309 60, 303 66, 301 74 Z" fill="#4e9e6f" />
                        </g>

                        {/* گلدون */}
                        <path d="M272 87 L328 87 L319 120 L281 120 Z" fill="#8e4f3c" />
                        <rect x="266" y="74" width="68" height="13" rx="3" fill="#a35f49" />

                        {/* میز */}
                        <rect x="48" y="137" width="504" height="7" fill="#1f1710" />
                        <rect x="24" y="120" width="552" height="17" rx="4" fill="#2b2119" />
                        <rect x="26" y="121" width="548" height="3" rx="1.5" fill="#3a2d22" />
                        <rect x="56" y="144" width="16" height="52" fill="#221a12" />
                        <rect x="528" y="144" width="16" height="52" fill="#221a12" />

                        {/* مخروط نور لامپ */}
                        <path d="M466 62 L514 62 L556 120 L424 120 Z" fill="url(#arc-cone-grad)" />

                        {/* لامپ میزی */}
                        <path
                          d="M514 57 C 524 72 522 98 508 112"
                          fill="none"
                          stroke="#2e2e36"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        <rect x="486" y="112" width="44" height="8" rx="3" fill="#26262d" stroke="#33333b" />
                        <path
                          d="M464 58 Q 490 26 516 58 Z"
                          fill="url(#arc-shade-grad)"
                          stroke="#4a1220"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path d="M466 58 L514 58" stroke="#ffd9a0" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="490" cy="64" r="34" fill="url(#arc-bulb-grad)" />

                        {/* ماگ قهوه + بخار */}
                        <ellipse cx="150" cy="121" rx="22" ry="3.4" fill="rgba(0, 0, 0, 0.45)" />
                        <path
                          d="M169 98 C 181 98.5 182 113 167.5 114"
                          fill="none"
                          stroke="#c2bbaa"
                          strokeWidth="7.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M169 98 C 181 98.5 182 113 167.5 114"
                          fill="none"
                          stroke="#e8e1d2"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M131 92 L136 117 C 136.5 119.5 138.5 121 141 121 L159 121 C 161.5 121 163.5 119.5 164 117 L169 92 Z"
                          fill="#e8e1d2"
                          stroke="#b8b0a0"
                          strokeWidth="1.4"
                        />
                        <path d="M133.5 104 L166.5 104 L165.5 111 L134.5 111 Z" fill="#9c2c44" />
                        <ellipse cx="150" cy="92.5" rx="19.5" ry="5" fill="#d8d1c2" stroke="#b8b0a0" strokeWidth="1.3" />
                        <ellipse cx="150" cy="93.5" rx="15.6" ry="3.6" fill="#2f211a" />
                        <ellipse cx="145" cy="93" rx="4.5" ry="1.3" fill="#53402f" opacity="0.8" />
                        <path
                          className="arc-steam arc-steam-1"
                          d="M145 88 C 142 80 148 76 145 68"
                          fill="none"
                          stroke="rgba(232, 232, 238, 0.55)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          className="arc-steam arc-steam-2"
                          d="M155 88 C 158 80 152 75 155 67"
                          fill="none"
                          stroke="rgba(232, 232, 238, 0.45)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* ذرات گرد در نور */}
                      <span className="arc-dust" aria-hidden="true">
                        {Array.from({ length: 7 }, (_, i) => (
                          <i key={i} />
                        ))}
                      </span>
                    </div>

                    <div className="arc-shelf-hint faint">
                      به چپ و راست بکش تا همه‌ی کتاب‌ها رو ببینی · روی هرکدوم بزن تا باز بشه
                    </div>
                  </>
                )}

                {openGroup && (
                  <div className="arc-book" style={{ "--type": openGroup.meta.color }}>
                    <div className="arc-book-head">
                      <button
                        type="button"
                        className="arc-back"
                        onClick={() => {
                          window.clearTimeout(flipTimer.current);
                          setOpenBook(null);
                          setFlip("");
                          setFlipping(false);
                        }}
                        data-hover
                      >
                        → بازگشت به قفسه
                      </button>

                      <div className="arc-book-id">
                        <span className="arc-book-no mono">{faNum(openIndex + 1)}</span>
                        <div>
                          <div className="arc-book-title">{openGroup.meta.label}</div>
                          <div className="arc-book-meta mono">
                            {faNum(openGroup.items.length)} مورد
                          </div>
                        </div>
                      </div>

                      <Icon
                        name={openGroup.meta.icon}
                        className="arc-book-mark"
                        size={62}
                      />
                    </div>

                    {currentEntry && (
                      <>
                        <div className="bp-stage">
                          <article
                            key={currentEntry.id}
                            className={`bp-page${pageFlipClass}${GHOST_TYPES.has(currentEntry.type) ? " is-ghost" : ""}`}
                          >
                            <div className="bp-page-head">
                              <span className="bp-page-kind mono">
                                <Icon name={openGroup.meta.icon} size={13} />
                                {openGroup.meta.label}
                              </span>
                              <span className="bp-page-no mono">
                                صفحه‌ی {faNum(pageIdx + 1)}
                              </span>
                            </div>

                            <h4 className="bp-title">{currentEntry.title}</h4>

                            {openIndex === 0 && pageIdx === 0 ? (
                              <TypedContent
                                text={currentEntry.content}
                                active={stage === "open"}
                                delay={300}
                              />
                            ) : (
                              <p className="bp-text">{currentEntry.content}</p>
                            )}

                            {GHOST_TYPES.has(currentEntry.type) && (
                              <span className="bp-ghost-hint">محو — روش برو</span>
                            )}

                            <div className="bp-page-foot">
                              <span className="mono">{fmtDate(currentEntry.created_at)}</span>
                              <span className="bp-counter mono">
                                {faNum(pageIdx + 1)} / {faNum(pages.length)}
                              </span>
                            </div>
                          </article>
                        </div>

                        <div className="bp-nav">
                          <button
                            type="button"
                            className="bp-nav-btn"
                            onClick={() => turnTo(pageIdx - 1)}
                            disabled={flipping || pageIdx === 0}
                            data-hover
                          >
                            → ورق قبلی
                          </button>
                          <span className="bp-nav-hint faint">
                            ← → هم کار می‌کنن
                          </span>
                          <button
                            type="button"
                            className="bp-nav-btn bp-nav-next"
                            onClick={() => turnTo(pageIdx + 1)}
                            disabled={flipping || pageIdx >= pages.length - 1}
                            data-hover
                          >
                            ورق بعدی ←
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
