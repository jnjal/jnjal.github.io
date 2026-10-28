// یک نمونه‌ی مشترک از اسکرول نرم، تا هر جای سایت (نویگیشن، لینک‌های داخلی)
// از همین استفاده کنه و رفتار یک‌دست بمونه.
let lenis = null;

const respectsReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const registerLenis = (instance) => {
  lenis = instance;
};

export const getLenis = () => lenis;

// اسکرول برنامه‌ای: با Lenis اگه فعاله، وگرنه رفتار نیتیو مرورگر
export function scrollToY(top, { immediate = false } = {}) {
  const jump = immediate || respectsReducedMotion();

  if (lenis) {
    lenis.scrollTo(top, { immediate: jump, duration: jump ? 0 : undefined });
    return;
  }

  window.scrollTo({ top, behavior: jump ? "auto" : "smooth" });
}

// فاصله‌ی امن از هدر ثابت، برای وقتی که به یه سکشن می‌پریم
export function headerOffset() {
  const nav = document.querySelector(".nav");
  return (nav?.offsetHeight || 64) + 10;
}
