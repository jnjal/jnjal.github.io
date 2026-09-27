const ICONS = {
  school: (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
      <path d="M22 9v6" />
    </>
  ),
  music: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="13.5" width="4.5" height="7" rx="2" />
      <rect x="17" y="13.5" width="4.5" height="7" rx="2" />
    </>
  ),
  pulse: (
    <>
      <path d="M3 12h3.5l2-5.5L12 18l2.6-6H21" />
    </>
  ),
  screen: (
    <>
      <rect x="2.5" y="4.5" width="19" height="13" rx="2" />
      <path d="M9.8 8.6 14 11l-4.2 2.4z" />
      <path d="M8.5 21h7" />
      <path d="M12 17.5V21" />
    </>
  ),
  code: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.6 6-3.2 12" />
    </>
  ),
  game: (
    <>
      <path d="M17.32 6H6.68a4 4 0 0 0-3.98 3.6L2 14.4a2.5 2.5 0 0 0 4.56 1.75L8 14h8l1.44 2.15A2.5 2.5 0 0 0 22 14.4l-.7-4.8A4 4 0 0 0 17.32 6Z" />
      <path d="M6 11h4M8 9v4" />
      <path d="M15 12h.01M18 10h.01" />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
};

export default function Icon({ name, size = 22, className = "" }) {
  const shape = ICONS[name];
  if (!shape) return null;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}
