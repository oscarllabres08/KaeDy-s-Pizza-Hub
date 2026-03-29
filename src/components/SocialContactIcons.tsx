import { Facebook, Mail, Twitter, Instagram } from 'lucide-react';
import { MessengerBrandIcon } from './MessengerBrandIcon';

const KAEDYS_EMAIL = 'kaedyspizzahub17@gmail.com';

const links = {
  facebook: 'https://www.facebook.com/profile.php?id=100089472924463',
  messenger: 'https://m.me/100089472924463',
  gmailCompose: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(KAEDYS_EMAIL)}`,
  /** Replace with your X profile when you have one */
  twitter: 'https://x.com',
  /** Replace with your Instagram profile when you have one */
  instagram: 'https://www.instagram.com',
} as const;

/** Per-platform rings + icon color (stroke uses currentColor). */
const btn = {
  facebook:
    'inline-flex items-center justify-center rounded-full border border-[#1877F2]/40 bg-black/40 p-3 text-[#1877F2] transition hover:border-[#1877F2]/70 hover:bg-[#1877F2]/10 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/45 shrink-0',
  messenger:
    'inline-flex items-center justify-center rounded-full border border-[#0084FF]/40 bg-black/40 p-3 text-[#0084FF] transition hover:border-[#0084FF]/70 hover:bg-[#0084FF]/10 focus:outline-none focus:ring-2 focus:ring-[#0084FF]/45 shrink-0',
  gmail:
    'inline-flex items-center justify-center rounded-full border border-[#EA4335]/40 bg-black/40 p-3 text-[#EA4335] transition hover:border-[#EA4335]/70 hover:bg-[#EA4335]/10 focus:outline-none focus:ring-2 focus:ring-[#EA4335]/45 shrink-0',
  twitter:
    'inline-flex items-center justify-center rounded-full border border-[#1DA1F2]/40 bg-black/40 p-3 text-[#1DA1F2] transition hover:border-[#1DA1F2]/70 hover:bg-[#1DA1F2]/10 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/45 shrink-0',
} as const;

type SocialContactIconsProps = {
  className?: string;
  iconClassName?: string;
};

export function SocialContactIcons({ className = '', iconClassName = 'h-6 w-6' }: SocialContactIconsProps) {
  return (
    <div className={`flex flex-nowrap items-center justify-center gap-3 sm:gap-5 ${className}`}>
      <a
        href={links.facebook}
        target="_blank"
        rel="noreferrer"
        className={btn.facebook}
        aria-label="Facebook"
      >
        <Facebook className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.messenger}
        target="_blank"
        rel="noreferrer"
        className={btn.messenger}
        aria-label="Messenger"
      >
        <MessengerBrandIcon className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.gmailCompose}
        target="_blank"
        rel="noreferrer"
        className={btn.gmail}
        aria-label={`Gmail — message ${KAEDYS_EMAIL}`}
      >
        <Mail className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.twitter}
        target="_blank"
        rel="noreferrer"
        className={btn.twitter}
        aria-label="X (Twitter)"
      >
        <Twitter className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.instagram}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#E4405F]/50 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Instagram"
      >
        <span className="inline-flex items-center justify-center rounded-full bg-black/90 p-[10px] text-white">
          <Instagram className={`${iconClassName} shrink-0`} />
        </span>
      </a>
    </div>
  );
}
