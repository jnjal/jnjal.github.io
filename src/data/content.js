// همه‌ی محتوای شخصی سایت اینجاست — تغییر این فایل یعنی تغییر سایت،
// بدون نیاز به دست زدن به کامپوننت‌ها.

export const PROFILE = {
  name: "جنجال",
  role: "توسعه‌دهنده فول‌استک و بات‌نویس",
  tagline: "دانشجوی مهندسی کامپیوتر — چیزایی برای اینترنت می‌سازم.",
  location: "ایران",
  timezone: "Asia/Tehran",
  gmtLabel: "GMT+3:30",
  email: "hey@jnjal.dev",
};

export const NAV_ITEMS = [
  { to: "/", label: "خانه" },
  { to: "/about", label: "درباره" },
  { to: "/projects", label: "پروژه‌ها" },
  { to: "/lab", label: "آزمایشگاه" },
  { to: "/now", label: "الان" },
  { to: "/notes", label: "یادداشت‌ها" },
  { to: "/anime", label: "انیمه" },
  { to: "/music", label: "موزیک" },
  { to: "/guestbook", label: "دفتر مهمان" },
];

export const SOCIAL_LINKS = [
  { label: "گیت‌هاب", href: "https://github.com/jnjal" },
  { label: "تلگرام", href: "#" },
  { label: "ایمیل", href: `mailto:${PROFILE.email}` },
];

export const PROJECTS = [
  {
    id: 1,
    title: "پورتفولیو شخصی",
    category: "Frontend",
    year: "2026",
    desc: "همین سایتی که الان داخلشی — با React و Vite، دیپلوی روی GitHub Pages و Cloudflare با CI/CD خودکار.",
    tags: ["React", "Vite", "CSS"],
    link: "https://jnjal.github.io",
    featured: true,
  },
  {
    id: 2,
    title: "Habit Tracker Bot",
    category: "Telegram Bot",
    year: "2026",
    desc: "بات تلگرامی ردیاب عادت با سیستم XP و لول، استریک، فصل‌های ۲۲ روزه، ۲۲ دستاورد، ژورنال با تگ حالت روحی و کوچینگ هوشمند با مدل AI.",
    tags: ["Cloudflare Workers", "D1", "Telegram Bot API"],
    link: "#",
    featured: true,
  },
  {
    id: 3,
    title: "claude-rtl",
    category: "Chrome Extension",
    year: "2026",
    desc: "افزونه کروم برای اصلاح چیدمان راست‌چین و شخصی‌سازی فونت‌ها در وبسایت Claude برای کاربران فارسی‌زبان.",
    tags: ["CSS", "JavaScript", "Chrome Extension"],
    link: "https://github.com/jnjal/claude-rtl",
    featured: false,
  },
  {
    id: 4,
    title: "aistudio-rtl",
    category: "Chrome Extension",
    year: "2026",
    desc: "افزونه کروم برای اصلاح چیدمان راست‌چین و شخصی‌سازی فونت‌ها در وبسایت گوگل AI Studio برای کاربران فارسی‌زبان.",
    tags: ["JavaScript", "Chrome Extension"],
    link: "#",
    featured: false,
  },
  {
    id: 5,
    title: "poodlin",
    category: "Frontend",
    year: "2026",
    desc: "ساخت و توسعه فرانت یه سایت با React، TypeScript و Next.js.",
    tags: ["TypeScript", "Next.js", "React"],
    link: "https://github.com/jnjal/poodlin",
    featured: false,
  },
];

export const SKILLS = [
  { name: "Cloudflare Workers", level: 90 },
  { name: "JavaScript", level: 90 },
  { name: "React & Vite", level: 82 },
  { name: "TypeScript", level: 70 },
  { name: "Rust", level: 55 },
];

export const TOOLS = [
  "Cloudflare Workers", "D1", "JavaScript", "TypeScript", "React",
  "Vite", "CSS", "Rust", "Telegram Bot API", "Git", "VS Code",
];

// این بخش رو زیاد به‌روزرسانی می‌کنم — همه‌چی از یه‌جا میاد.
export const NOW = {
  updatedAt: "۲۶ شهریور ۱۴۰۵",
  items: [
    { emoji: "💻", label: "در حال ساخت", value: "Habit Tracker Bot", detail: "سیستم XP، استریک و کوچینگ با AI" },
    { emoji: "📚", label: "در حال یادگیری", value: "TypeScript عمیق‌تر", detail: "و کمی Rust کنار دستم" },
    { emoji: "🎌", label: "در حال تماشا", value: "Bleach", detail: "قسمت ۲۱۰" },
    { emoji: "🎮", label: "در حال بازی", value: "Minecraft", detail: "یه سرور کوچیک با دوستام" },
    { emoji: "🎧", label: "در حال گوش دادن", value: "Aimer", detail: "Zankyou Sanka" },
  ],
};

export const NOTES = [
  {
    date: "۲۶ شهریور ۱۴۰۵",
    text: "امروز تصمیم گرفتم پورتفولیومو تبدیل کنم به یه وبسایت شخصی واقعی. یه‌جایی بین دفترچه‌خاطرات و کدنویسی.",
  },
  {
    date: "۱۹ شهریور ۱۴۰۵",
    text: "بالاخره اون باگ آزاردهنده‌ی مدیریت کاربرا رو فیکس کردم. راه‌حلش دو خط بود، پیدا کردنش دو روز.",
  },
  {
    date: "۱۲ شهریور ۱۴۰۵",
    text: "دارم فکر می‌کنم لایه ریت‌لیمیتینگ رو با D1 بازنویسی کنم. Workers حافظه بین ریکوئست‌ها نگه نمی‌داره و یادم رفته بود.",
  },
  {
    date: "۰۳ شهریور ۱۴۰۵",
    text: "یه شب تا صبح فقط داشتم روی یه دکمه کار می‌کردم. فقط یه دکمه. ارزششو داشت.",
  },
  {
    date: "۲۷ مرداد ۱۴۰۵",
    text: "Re:Zero رو برای بار سوم شروع کردم. بار سوم بهتر از دوباره‌ست، قول می‌دم.",
  },
];

export const ANIME = {
  watching: { title: "Bleach", detail: "قسمت ۲۱۰ — تیبت آرک" },
  favorites: [
    { title: "Re:Zero", note: "همیشه یه بار دیگه شروعش می‌کنم" },
    { title: "Death Note", note: "بهترین بازی موش و گربه‌ای که دیدم" },
    { title: "Berserk", note: "سنگین، ولی زیبا" },
    { title: "One Piece", note: "پروژه بلندمدت زندگیمه" },
  ],
};

export const MUSIC = {
  nowPlaying: { artist: "Aimer", track: "Zankyou Sanka", note: "معمولاً وقت کد زدن شب‌ها" },
  recent: [
    { artist: "Radiohead", track: "Everything In Its Right Place" },
    { artist: "Yorushika", track: "またね" },
    { artist: "Yoasobi", track: "アイドル" },
  ],
};

export const LAB_EXPERIMENTS = [
  { id: "001", title: "دکمه مایع", key: "liquid" },
  { id: "002", title: "نشانگر مغناطیسی", key: "magnetic" },
  { id: "003", title: "کارت شیشه‌ای", key: "glass" },
  { id: "004", title: "اعوجاج متن", key: "distortion" },
];

export const GUESTBOOK_SEED = [
  { name: "یه مهمان", message: "سایتت باحاله 😂", ts: Date.now() - 1000 * 60 * 60 * 24 * 3 },
  { name: "یه مهمان دیگه", message: "اون آزمایش دکمه مایعه رو دوست داشتم.", ts: Date.now() - 1000 * 60 * 60 * 24 },
];

export const HUMAN_TOUCHES = [
  "آخرین به‌روزرسانی: یه‌جایی همین اواخر",
  "احتمالاً دارم به یه چیزی بیش از حد فکر می‌کنم",
  "ساخته‌شده با قهوه بیش از حد",
  "این صفحه شاید اصلاً نیازی نبود وجود داشته باشه",
];
