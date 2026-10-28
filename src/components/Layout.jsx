import { Suspense, lazy, useEffect, useState } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import Cursor from "./Cursor";
import SmoothScroll from "./SmoothScroll";

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

  // نور پس‌زمینه با سکشن فعال آروم جابه‌جا و هم‌رنگ می‌شه (CSS با data-section)
  useEffect(() => {
    const fx = document.querySelector(".bg-fx");
    const nodes = document.querySelectorAll("main section[id]");
    if (!fx || !nodes.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) fx.dataset.section = entry.target.id;
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ cursor: "inherit", display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <a href="#main-content" className="skip-link">برو سراغ محتوای اصلی</a>
      <Cursor />
      <SmoothScroll />
      <div className="boot" aria-hidden="true" />
      <div className="bg-fx" aria-hidden="true">
        <div className="noise">
          <span />
          <span />
        </div>
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
