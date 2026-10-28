import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { headerOffset, registerLenis, scrollToY } from "../lib/smooth";

// اسکرول نرم (اینرسی) برای کل سایت.
// - روی تاچ و حالت «کاهش حرکت» خاموش می‌مونه و اسکرول نیتیو می‌مونه
// - لینک‌های داخلی (#section) هم از همین مسیر می‌رن تا هم نرم باشن، هم زیر هدر نگیرن
export default function SmoothScroll() {
  useEffect(() => {
    const smooth = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis = null;

    if (smooth && !reduce) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        autoRaf: true,
      });
      registerLenis(lenis);
    }

    // لینک‌های داخلی: اسکرول نرم + جبران ارتفاع هدر
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (!link || link.classList.contains("skip-link")) return;

      const id = link.getAttribute("href").slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      e.preventDefault();

      const offset = id === "home" ? 0 : headerOffset();
      scrollToY(target.getBoundingClientRect().top + window.scrollY - offset);
      window.history.pushState(null, "", `#${id}`);
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      if (lenis) {
        registerLenis(null);
        lenis.destroy();
      }
    };
  }, []);

  return null;
}
