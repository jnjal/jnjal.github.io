import { useEffect, useRef, useState } from "react";

// استخر ابزرورهای مشترک — به‌جای ساخت یه ابزرور برای هر المان.
// ابزرورها به تعداد threshold نگه داشته می‌شن (کل صفحه ~۵ تا، نه ۳۰+).
const buckets = new Map();

function getBucket(threshold) {
  const existing = buckets.get(threshold);
  if (existing) return existing;

  const targets = new Map();
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const cb = targets.get(entry.target);
        if (!cb) return;
        cb();
        obs.unobserve(entry.target);
        targets.delete(entry.target);
      });
    },
    { threshold }
  );

  const bucket = { obs, targets };
  buckets.set(threshold, bucket);
  return bucket;
}

// ref المان + آیا اومد توی دید (یکبار true می‌شه)
export default function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const { obs, targets } = getBucket(threshold);
    targets.set(node, () => setInView(true));
    obs.observe(node);

    return () => {
      targets.delete(node);
      obs.unobserve(node);
    };
  }, [threshold]);

  return [ref, inView];
}
