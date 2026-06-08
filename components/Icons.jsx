// Inline SVG icons — no component libraries per design rules.
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const UserIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

export const HeartIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M12 21s-7.5-4.7-9.7-9.2C.8 8.6 2.7 5 6.2 5c2.1 0 3.4 1.1 4.3 2.4l1.5 2 1.5-2C14.4 6.1 15.7 5 17.8 5c3.5 0 5.4 3.6 3.9 6.8C19.5 16.3 12 21 12 21Z" />
  </svg>
);

export const CartIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="17.5" cy="20" r="1.6" />
    <path d="M2.5 3.5h3l2.6 12h10.6l2.3-8.5H6.1" />
  </svg>
);

export const ChevronDown = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRight = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const ArrowRight = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
);

/* ── Hero refurbishment steps ── */

export const BrokenDeviceIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="3" y="4" width="18" height="13" rx="1.5" />
    <path d="M2 20h20" />
    <path d="m9 7 2.5 3-2 2 2.5 3" />
  </svg>
);

export const InspectIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.9-4.9" />
    <path d="m8 10.5 1.8 1.8 3.2-3.6" />
  </svg>
);

export const CleanIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M12 3c1.5 3.5 4 6 7 7-3 1-5.5 3.5-7 7-1.5-3.5-4-6-7-7 3-1 5.5-3.5 7-7Z" />
    <path d="M19 16.5c.5 1.2 1.3 2 2.5 2.5-1.2.5-2 1.3-2.5 2.5-.5-1.2-1.3-2-2.5-2.5 1.2-.5 2-1.3 2.5-2.5Z" />
  </svg>
);

export const CertifiedIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M12 2.5 14.7 5l3.6-.3.6 3.5 3.1 1.9-1.6 3.2 1.6 3.2-3.1 1.9-.6 3.5-3.6-.3L12 24l-2.7-2.4-3.6.3-.6-3.5L2 16.5l1.6-3.2L2 10.1l3.1-1.9.6-3.5 3.6.3L12 2.5Z" transform="scale(0.92) translate(1,0)" />
    <path d="m8.7 12.2 2.2 2.2 4.4-4.8" />
  </svg>
);

/* ── Policy strip ── */

export const ReturnIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M3 9V4.5M3 9h4.5M3 9l3.2-3.2A8.5 8.5 0 1 1 4 14.5" />
  </svg>
);

export const ShieldIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M12 2.5 20 6v5.5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3.5Z" />
    <path d="m8.7 11.7 2.2 2.2 4.4-4.6" />
  </svg>
);

export const LockIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="1.8" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <circle cx="12" cy="15.5" r="1.3" />
  </svg>
);

export const EraseIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <ellipse cx="12" cy="5.5" rx="8" ry="2.8" />
    <path d="M4 5.5v6c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-6" />
    <path d="M4 11.5v6c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-6" opacity="0.45" />
    <path d="m9.5 16.5 5-2.5" />
  </svg>
);

export const TruckIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M3 6.5h10v8H3z" />
    <path d="M13 9h4l3 3v2.5h-7z" />
    <circle cx="7" cy="17" r="1.6" />
    <circle cx="17" cy="17" r="1.6" />
  </svg>
);

export const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-3-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4 .2-.4.5-1.1.1-.2 0-.4 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2.2-.2 3.9a11 11 0 0 0 4.6 4.3c1.8.8 2.5.7 3.4.6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.7-.6Z" />
  </svg>
);

/* Brand mark — gear + forward chevron + recycle hint (vector recreation of logo) */
export const LogoMark = (props) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    {/* gear */}
    <g fill="currentColor">
      {[0, 45, 90, 135].map((deg) => (
        <rect key={deg} x="14.5" y="2" width="5" height="30" rx="1.5" transform={`rotate(${deg} 17 17)`} />
      ))}
      <circle cx="17" cy="17" r="11" />
    </g>
    <circle cx="17" cy="17" r="5.5" fill="white" />
    {/* forward chevron ribbon */}
    <path d="M27 6h8.5L30 17l10 25h-8.5L21.5 17 27 6Z" fill="currentColor" />
    {/* recycle hint */}
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M36.5 13.5l2.5-1.5 1.5 2.5" />
      <path d="M42.5 17.5l1.5 2.5-2.5 1.5" />
      <path d="M37.5 22.5h-3l1.5-2.5" />
    </g>
  </svg>
);

export const StarIcon = ({ filled = true, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.8 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" />
  </svg>
);

export const MenuIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ClipboardIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="5" y="4" width="14" height="17" rx="1.8" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4.5" />
  </svg>
);

/* ── Component icons for the inspection report / checkpoint cards ── */
export const MonitorIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M9 20h6M12 16v4" />
  </svg>
);
export const KeyboardIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M6 13h.01M16.5 13h.01M9 15.5h6" />
  </svg>
);
export const TrackpadIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 14v2" />
  </svg>
);
export const BatteryIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="3" y="8" width="16" height="8" rx="1.5" />
    <path d="M21 11v2" />
    <path d="M6 10.5v3" />
  </svg>
);
export const PlugIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M9 3v5M15 3v5" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0V8Z" />
    <path d="M12 17v4" />
  </svg>
);
export const SpeakerIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M4 9v6h3l5 4V5L7 9H4Z" />
    <path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10" />
  </svg>
);
export const CameraIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <circle cx="12" cy="12.5" r="3" />
    <path d="M8 6l1.2-2h5.6L16 6" />
  </svg>
);
export const HingeIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M5 4v16M5 4l9 2v12l-9 2" />
    <circle cx="5" cy="12" r="1.3" />
  </svg>
);
export const LaptopIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="4" y="5" width="16" height="10" rx="1.5" />
    <path d="M2 19h20l-1.5-2H3.5L2 19Z" />
  </svg>
);
export const DriveIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="3" y="7" width="18" height="10" rx="2" />
    <path d="M7 12h7" />
    <circle cx="17.5" cy="12" r="1" />
  </svg>
);
export const ChipIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
  </svg>
);
export const FanIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="1.6" />
    <path d="M12 10.5c0-3 .5-5.5-2-6.5M13.5 12c3 0 5.5-.5 6.5-3M12 13.5c0 3-.5 5.5 2 6.5M10.5 12c-3 0-5.5.5-6.5 3" />
  </svg>
);

export const PlusMinusIcon = ({ open, className = "" }) => (
  <svg viewBox="0 0 24 24" {...base} className={className} aria-hidden="true">
    <path d="M5 12h14" />
    <path
      d="M12 5v14"
      className={`origin-center transition-all duration-300 ${open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}
    />
  </svg>
);

/* Inspection component key → icon. Used by the inspection panel and the
   checkpoint cards so both stay visually consistent (no emoji). */
export const COMPONENT_ICONS = {
  display: MonitorIcon,
  keyboard: KeyboardIcon,
  trackpad: TrackpadIcon,
  battery: BatteryIcon,
  ports: PlugIcon,
  speakers: SpeakerIcon,
  webcam: CameraIcon,
  hinges: HingeIcon,
  body: LaptopIcon,
  storage: DriveIcon,
  ram: ChipIcon,
  cooling: FanIcon,
  datawipe: ShieldIcon,
  bios: ChipIcon,
};
