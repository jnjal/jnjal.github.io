import { Suspense, lazy, useEffect, useState } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import Cursor from "./Cursor";

const Archive = lazy(() => import("./Archive"));

export default function Layout({ children }) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  // انیمیشن‌های بخش‌های خارج از دید متوقف می‌مونن (صرفه‌جویی CPU/GPU)
  useEffect(() => {
    const nodes = document.querySelectorAll("section, footer");
    if (!nodes.length) return undefined;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("anim-off", !entry.isIntersecting);
      });
    });
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ cursor: "inherit", display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <a href="#main-content" className="skip-link">پرش به محتوای اصلی</a>
      <Cursor />
      <div className="boot" aria-hidden="true" />
      <div className="bg-fx" aria-hidden="true">
        <div className="noise" />
        <div className="glow" />
      </div>
      <Nav onSecret={() => setArchiveOpen(true)} />
      <main id="main-content">{children}</main>
      <Footer />
      {archiveOpen && (
        <Suspense fallback={null}>
          <Archive onClose={() => setArchiveOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
