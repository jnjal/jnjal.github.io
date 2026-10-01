import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WORKER_URL, ARCHIVE_TYPES } from "../data/content";
import useTyped, { prefersReducedMotion } from "../hooks/useTyped";
import Icon from "./Icon";
import "./Archive.css";

const API = WORKER_URL.replace(/\/+$/, "");
const TOKEN_KEY = "archive_token";
const GLITCH_MS = 780;
const LOG_MS = 1800;
const UNLOCK_MS = 950;
const DOOR_MS = 900;
const IDLE_MS = 120000;

const GHOST_TYPES = new Set(["secret", "unsaid"]);

const BOOT_LOG = [
  "vault://archive",
  "· decrypting payload ....... ok",
  "· randomizing pin pad ...... ok",
  "· awaiting operator input_",
].join("\n");

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

const daysAgo = (iso) => {
  try {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return "امروز";
    if (d === 1) return "دیروز";
    return `${faNum(d)} روز پیش`;
  } catch {
    return "";
  }
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

// تایپ متن کوتاه موقع ورود (فقط برای کارت اول هر بخش)
function TypedContent({ text, active, delay = 0 }) {
  const content = text || "";
  const canType = content.length > 0 && content.length <= 300;
  const out = useTyped(content, active && canType, 14, delay);
  return <p className="arc-entry-text">{canType ? out : content}</p>;
}

function EntryCard({ entry, open, onToggle, typable, active, lead }) {
  const meta = metaOf(entry.type);
  const ghost = GHOST_TYPES.has(entry.type);
  const long = (entry.content || "").length > 180;

  return (
    <article
      className={`arc-entry${lead ? " is-lead" : ""}${ghost && !open ? " is-ghost" : ""}`}
      style={{ "--type": meta.color }}
    >
      <span className="arc-tape" aria-hidden="true" />

      <div className="arc-entry-top">
        <span className="arc-type">
          <Icon name={meta.icon} size={13} />
          {meta.label}
        </span>
        <span className="mono faint">{fmtDate(entry.created_at)}</span>
      </div>

      <h4 className="arc-entry-title">{entry.title}</h4>

      {typable ? (
        <TypedContent text={entry.content} active={active} delay={260} />
      ) : (
        <p className={`arc-entry-text${long && !open ? " is-clamped" : ""}`}>{entry.content}</p>
      )}

      {long && (
        <button type="button" className="arc-more" onClick={onToggle} data-hover>
          {open ? "کمتر ↑" : "بیشتر ↓"}
        </button>
      )}

      {ghost && !open && <span className="arc-ghost-hint">محو — روش برو</span>}
    </article>
  );
}

export default function Archive({ onClose }) {
  const [stage, setStage] = useState("glitch"); // glitch | boot | safe | unlocking | door | open
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [keys, setKeys] = useState(shuffleKeys);
  const [round, setRound] = useState(0);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [view, setView] = useState("type"); // type (کتاب‌ها) | time
  const [openBook, setOpenBook] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [progress, setProgress] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [idleLeft, setIdleLeft] = useState(IDLE_MS);

  const unlockTimer = useRef(0);
  const denyTimer = useRef(0);
  const bootTimer = useRef(0);
  const doorTimer = useRef(0);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const activityRef = useRef(0);
  const reduced = prefersReducedMotion();

  const bootLog = useTyped(BOOT_LOG, stage === "boot", 16, 120);

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
    setExpanded(new Set());
    setStage("safe");
  }, []);

  // شروع: گلیچ → لاگ ترمینال → گاوصندوق (یا ورود با توکن ذخیره‌شده)
  useEffect(() => {
    bootTimer.current = window.setTimeout(() => setStage("boot"), GLITCH_MS);
    return () => {
      window.clearTimeout(bootTimer.current);
      window.clearTimeout(unlockTimer.current);
      window.clearTimeout(denyTimer.current);
      window.clearTimeout(doorTimer.current);
    };
  }, []);

  useEffect(() => {
    if (stage !== "boot") return undefined;
    doorTimer.current = window.setTimeout(() => {
      const saved = sessionStorage.getItem(TOKEN_KEY);
      if (saved) {
        setStage("unlocking");
        unlockTimer.current = window.setTimeout(() => setStage("door"), UNLOCK_MS);
        load(saved);
      } else {
        setStage("safe");
      }
    }, LOG_MS);
    return () => window.clearTimeout(doorTimer.current);
  }, [stage, load]);

  // در باز می‌شه → ورود به اتاق
  useEffect(() => {
    if (stage !== "door") return undefined;
    doorTimer.current = window.setTimeout(() => setStage("open"), DOOR_MS);
    return () => window.clearTimeout(doorTimer.current);
  }, [stage]);

  // فوکوس روی فیلد رمز
  useEffect(() => {
    if (stage === "safe") inputRef.current?.focus();
  }, [stage]);

  // قفل اسکرول + Esc (اول جستجو، بعد کتاب، بعد کل اتاق)
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

  // جستجو با Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      window.clearTimeout(unlockTimer.current);
      unlockTimer.current = window.setTimeout(() => setStage("door"), UNLOCK_MS);
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

  const toggleCard = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const groups = groupByType(entries);
  const openGroup = openBook ? groups.find((g) => g.key === openBook) : null;
  const openIndex = openGroup ? groups.indexOf(openGroup) : -1;
  const q = query.trim().toLowerCase();
  const results = q
    ? entries.filter((e) => `${e.title}\n${e.content}`.toLowerCase().includes(q))
    : [];
  const lastAdded = entries.length ? daysAgo(entries[0].created_at) : "";
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
      {stage === "glitch" && <div className="arc-glitch" aria-hidden="true" />}

      {stage === "door" && (
        <div className="arc-door" aria-hidden="true">
          <span className="arc-door-half arc-door-a" />
          <span className="arc-door-half arc-door-b" />
          <span className="arc-door-plate mono">archive</span>
        </div>
      )}

      <div className="arc-shell">
        <header className="arc-head">
          <span className="mono">archive — private room</span>

          <div className="arc-head-right">
            {stage === "open" && idleLeft <= 60000 && (
              <span className="arc-idle mono">🔒 {fmtClock(idleLeft)}</span>
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

        {stage === "boot" && (
          <div className="arc-log mono">
            {bootLog}
            <span className="arc-log-caret" aria-hidden="true" />
          </div>
        )}

        {(stage === "glitch" || stage === "safe" || stage === "unlocking") && (
          <div className="arc-vault">
            <div
              className={`arc-dial${stage === "unlocking" ? " is-unlock" : ""}`}
              aria-hidden="true"
              style={dialTurn ? { transform: dialTurn } : undefined}
            >
              <span className="arc-dial-ring" />
              <span className="arc-dial-hub" />
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
                  inputMode="numeric"
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
        )}

        {stage === "open" && (
          <div className="arc-room">
            <div className="arc-room-head">
              <div className="arc-room-id">
                <div className="arc-room-title">اتاق شخصی</div>
                <div className="arc-room-stats mono">
                  {faNum(entries.length)} مورد · {faNum(groups.length)} موضوع
                  {lastAdded && ` · آخرین افزودن ${lastAdded}`}
                </div>
              </div>

              <div className="arc-room-side">
                <svg className="arc-seal" viewBox="0 0 120 120" aria-hidden="true">
                  <defs>
                    <path
                      id="arc-seal-path"
                      d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
                    />
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
                  <text
                    className="arc-seal-center"
                    x="60"
                    y="61"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    ج
                  </text>
                </svg>

                <button
                  type="button"
                  className="arc-mini"
                  onClick={() => setSearchOpen((v) => !v)}
                  data-hover
                  aria-label="جستجو"
                >
                  ⌕
                </button>
              </div>
            </div>

            {searchOpen && (
              <div className="arc-search">
                <input
                  className="arc-search-input"
                  autoFocus
                  placeholder="جستجو در آرشیو… (Esc برای بستن)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setSearchOpen(false);
                      setQuery("");
                    }
                  }}
                />
                <span className="mono faint">{q ? `${faNum(results.length)} نتیجه` : ""}</span>
              </div>
            )}

            {loading && <div className="arc-state mono">در حال باز کردن…</div>}
            {!loading && loadError && <div className="arc-state arc-err">✗ {loadError}</div>}
            {!loading && !loadError && entries.length === 0 && (
              <div className="arc-state">
                هنوز چیزی اینجا نیست. وقتی چیزی اضافه شد، همین‌جا می‌بینیش.
              </div>
            )}

            {!loading && !loadError && q && (
              <div className="arc-entries arc-results">
                {results.length === 0 ? (
                  <div className="arc-state">چیزی پیدا نشد.</div>
                ) : (
                  results.map((e) => (
                    <EntryCard
                      key={e.id}
                      entry={e}
                      open={expanded.has(e.id)}
                      onToggle={() => toggleCard(e.id)}
                    />
                  ))
                )}
              </div>
            )}

            {!loading && !loadError && !q && entries.length > 0 && (
              <>
                <div className="arc-views">
                  <button
                    type="button"
                    className={`arc-view${view === "type" ? " is-on" : ""}`}
                    onClick={() => {
                      setView("type");
                      setOpenBook(null);
                    }}
                    data-hover
                  >
                    📚 موضوعات
                  </button>
                  <button
                    type="button"
                    className={`arc-view${view === "time" ? " is-on" : ""}`}
                    onClick={() => setView("time")}
                    data-hover
                  >
                    بر اساس زمان
                  </button>
                </div>

                {view === "time" && (
                  <div className="arc-timeline">
                    {entries.map((e) => {
                      const meta = metaOf(e.type);
                      return (
                        <div className="tl-row" key={e.id} style={{ "--type": meta.color }}>
                          <span className="tl-dot" aria-hidden="true" />
                          <div className="tl-body">
                            <div className="tl-meta mono">
                              {fmtDate(e.created_at)} · {meta.label}
                            </div>
                            <div className="tl-title">{e.title}</div>
                            <p className="tl-text">{e.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {view === "type" && !openGroup && (
                  <>
                    <div className="arc-shelf">
                      {groups.map((g, i) => (
                        <button
                          key={g.key}
                          type="button"
                          className="book"
                          style={{ "--type": g.meta.color }}
                          onClick={() => setOpenBook(g.key)}
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
                    <div className="arc-shelf-hint faint">
                      به چپ و راست بکش تا همه‌ی کتاب‌ها رو ببینی · روی هرکدوم بزن تا باز بشه
                    </div>
                  </>
                )}

                {view === "type" && openGroup && (
                  <div className="arc-book" style={{ "--type": openGroup.meta.color }}>
                    <div className="arc-book-head">
                      <button
                        type="button"
                        className="arc-back"
                        onClick={() => setOpenBook(null)}
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

                    <div className="arc-pages">
                      <div className="arc-entries">
                        {openGroup.items.map((e, ci) => (
                          <EntryCard
                            key={e.id}
                            entry={e}
                            lead={ci === 0}
                            open={expanded.has(e.id)}
                            onToggle={() => toggleCard(e.id)}
                            typable={openIndex === 0 && ci === 0}
                            active={stage === "open"}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="arc-book-foot mono" aria-hidden="true">
                      <span>end of book</span>
                      <span className="arc-end-line" />
                      <span>✦</span>
                    </div>
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
