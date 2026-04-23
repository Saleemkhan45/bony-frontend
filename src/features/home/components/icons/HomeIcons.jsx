function IconBase({ children, className, strokeWidth = 1.9, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function AtSignIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M15.2 12v1.3c0 1.1.9 2 2 2 1.2 0 2.2-1 2.2-2.2V12a7.4 7.4 0 1 0-2.9 5.9" />
      <circle cx="12" cy="11.6" r="2.6" />
    </IconBase>
  );
}

export function CheckCircleIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.2 2.4 2.4 5-5.1" />
    </IconBase>
  );
}

export function ChevronLeftIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m15 6-6 6 6 6" />
    </IconBase>
  );
}

export function ChevronRightIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function GlobeIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.5c2.1 2.2 3.3 5.3 3.3 8.5s-1.2 6.3-3.3 8.5c-2.1-2.2-3.3-5.3-3.3-8.5s1.2-6.3 3.3-8.5Z" />
    </IconBase>
  );
}

export function HashIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M8 4 6.5 20" />
      <path d="M15.5 4 14 20" />
      <path d="M4.5 9.2h15" />
      <path d="M3.8 14.8h15" />
    </IconBase>
  );
}

export function MailIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="m4.4 7 7.2 6.2a.6.6 0 0 0 .8 0L19.6 7" />
    </IconBase>
  );
}

export function MonitorPlayIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="4.5" width="17" height="12" rx="2.2" />
      <path d="m10 8.9 5 3.1-5 3.1Z" />
      <path d="M8.5 19.5h7" />
    </IconBase>
  );
}

export function PhoneCallIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M6.8 4.5h3l1.3 3.2a2 2 0 0 1-.4 2L9.3 11a12.8 12.8 0 0 0 3.7 3.7l1.3-1.4a2 2 0 0 1 2-.4l3.2 1.3v3c0 1.1-.9 2-2 2A13.5 13.5 0 0 1 4.8 6.5c0-1.1.9-2 2-2Z" />
      <path d="M14.8 5.8a4.2 4.2 0 0 1 3.4 3.4" />
      <path d="M14.8 3.5a6.5 6.5 0 0 1 5.7 5.7" />
    </IconBase>
  );
}

export function SendIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m20 4-8.8 16-2.2-6.6L2.5 11 20 4Z" />
      <path d="m9.1 13.4 5.8-5.8" />
    </IconBase>
  );
}

export function ShieldCheckIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3.6 4.7 6.8v5.5c0 4 2.4 6.3 7.3 8.2 4.9-1.9 7.3-4.2 7.3-8.2V6.8L12 3.6Z" />
      <path d="m9 12.1 2 2 4-4.1" />
    </IconBase>
  );
}

export function StarIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m12 4.3 2.3 4.8 5.2.8-3.8 3.8.9 5.3-4.6-2.5L7.4 19l.9-5.3-3.8-3.8 5.2-.8L12 4.3Z" />
    </svg>
  );
}

export function VideoIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="6.2" width="12.8" height="11.6" rx="2.1" />
      <path d="m16.3 10.3 4.8-2v7.4l-4.8-2Z" />
    </IconBase>
  );
}

export function XIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m6.4 6.4 11.2 11.2" />
      <path d="M17.6 6.4 6.4 17.6" />
    </IconBase>
  );
}
