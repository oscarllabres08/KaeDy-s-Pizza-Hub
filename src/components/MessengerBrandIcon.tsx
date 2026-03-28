type MessengerBrandIconProps = {
  className?: string;
};

export function MessengerBrandIcon({ className }: MessengerBrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5 5.25h11.75a1.75 1.75 0 011.75 1.75v6.5a1.75 1.75 0 01-1.75 1.75h-4.05l-3.95 3.95v-3.95H5a1.75 1.75 0 01-1.75-1.75V7a1.75 1.75 0 011.75-1.75z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14.35 8.15 10.4 13.1h2.65L11.5 17.9l4.35-6.05h-2.55l.85-3.7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
