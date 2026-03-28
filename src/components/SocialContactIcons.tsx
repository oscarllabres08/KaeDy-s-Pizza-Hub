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

const btnClass =
  'inline-flex items-center justify-center rounded-full border border-yellow-500/25 bg-black/40 p-3 text-yellow-300 transition hover:border-yellow-400/50 hover:bg-yellow-500/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 shrink-0';

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
        className={btnClass}
        aria-label="Facebook"
      >
        <Facebook className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.messenger}
        target="_blank"
        rel="noreferrer"
        className={btnClass}
        aria-label="Messenger"
      >
        <MessengerBrandIcon className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.gmailCompose}
        target="_blank"
        rel="noreferrer"
        className={btnClass}
        aria-label={`Gmail — message ${KAEDYS_EMAIL}`}
      >
        <Mail className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.twitter}
        target="_blank"
        rel="noreferrer"
        className={btnClass}
        aria-label="X (Twitter)"
      >
        <Twitter className={`${iconClassName} shrink-0`} />
      </a>
      <a
        href={links.instagram}
        target="_blank"
        rel="noreferrer"
        className={btnClass}
        aria-label="Instagram"
      >
        <Instagram className={`${iconClassName} shrink-0`} />
      </a>
    </div>
  );
}
