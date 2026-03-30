import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { supabase, GalleryImage } from '../lib/supabase';

const AUTO_INTERVAL_MS = 4800;

function ringNext(i: number, n: number) {
  return (i + 1) % n;
}

function ringPrev(i: number, n: number) {
  return (i - 1 + n) % n;
}

type EnterAnim = 'from-right' | 'from-left' | 'fade';

type HomeGallerySectionProps = {
  className?: string;
  onNavigate: (page: string) => void;
};

export function HomeGallerySection({ className = '', onNavigate }: HomeGallerySectionProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inView, setInView] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [enterAnim, setEnterAnim] = useState<EnterAnim>('fade');
  const [lightboxEnterAnim, setLightboxEnterAnim] = useState<EnterAnim>('fade');
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const lightboxOpenRef = useRef(false);

  useEffect(() => {
    lightboxOpenRef.current = lightboxOpen;
  }, [lightboxOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true });
        if (!cancelled) setImages((data || []) as GalleryImage[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(!!e?.isIntersecting),
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, images.length]);

  const n = images.length;
  const paused = hoverPause || !inView || lightboxOpen;

  const go = useCallback(
    (delta: number) => {
      if (n < 2) return;
      const anim: EnterAnim = delta > 0 ? 'from-right' : 'from-left';
      setEnterAnim(anim);
      if (lightboxOpenRef.current) setLightboxEnterAnim(anim);
      setIndex((i) => (i + delta + n) % n);
    },
    [n]
  );

  const goToIndex = useCallback(
    (target: number) => {
      if (n < 2 || target === index) return;
      let anim: EnterAnim;
      if (target === ringNext(index, n)) anim = 'from-right';
      else if (target === ringPrev(index, n)) anim = 'from-left';
      else anim = 'fade';
      setEnterAnim(anim);
      if (lightboxOpenRef.current) setLightboxEnterAnim(anim);
      setIndex(target);
    },
    [n, index]
  );

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setEnterAnim('from-right');
      if (lightboxOpenRef.current) setLightboxEnterAnim('from-right');
      setIndex((i) => (i + 1) % n);
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [n, paused]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || n < 2) {
      touchStartX.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -36) go(1);
    else if (dx > 36) go(-1);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (n > 1 && e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (n > 1 && e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, n, go]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  if (loading || n === 0) return null;

  const current = images[index];
  const canPrev = n > 1;
  const canNext = n > 1;

  const carouselAnimClass =
    enterAnim === 'from-right'
      ? 'kaedys-gallery-enter-right'
      : enterAnim === 'from-left'
        ? 'kaedys-gallery-enter-left'
        : 'kaedys-gallery-enter-fade';

  const lightboxAnimClass =
    lightboxEnterAnim === 'from-right'
      ? 'kaedys-gallery-enter-right'
      : lightboxEnterAnim === 'from-left'
        ? 'kaedys-gallery-enter-left'
        : 'kaedys-gallery-enter-fade';

  return (
    <section
      ref={sectionRef}
      className={`${className}`}
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
      aria-label="Photo gallery preview"
    >
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
            <Images className="h-4 w-4 text-yellow-300" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-[0.18em] text-heading-primary/95">GALLERY</div>
            <p className="text-[11px] text-heading-secondary/75 leading-snug truncate sm:whitespace-normal">
              Tap photo to enlarge · swipe or arrows · see all below
            </p>
          </div>
        </div>
        {n > 1 ? (
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-heading-secondary/90">
            {index + 1}/{n}
          </span>
        ) : null}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-neutral-900/90 to-black/80 shadow-[0_24px_56px_rgba(0,0,0,0.55)] ring-1 ring-yellow-500/10 aspect-[4/3] sm:aspect-[16/10] touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => {
            setLightboxEnterAnim('fade');
            setLightboxOpen(true);
          }}
          className="absolute inset-0 z-0 block h-full w-full cursor-zoom-in border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-400/80"
          aria-label="View photo full screen"
        >
          <img
            key={`${index}-${current.id}`}
            src={current.image_url}
            alt=""
            className={`pointer-events-none h-full w-full object-cover ${carouselAnimClass}`}
          />
        </button>

        {canPrev ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-yellow-500/40 bg-black/65 text-yellow-200 shadow-lg backdrop-blur-sm transition-transform active:scale-95 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-yellow-500/40 bg-black/65 text-yellow-200 shadow-lg backdrop-blur-sm transition-transform active:scale-95 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        ) : null}

        {n > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goToIndex(i)}
                className={`h-1.5 rounded-full transition-[width,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  i === index ? 'w-6 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.45)]' : 'w-1.5 bg-yellow-500/35 hover:bg-yellow-500/55'
                }`}
                aria-label={`Photo ${i + 1} of ${n}`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('gallery')}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/35 bg-yellow-500/[0.08] py-3.5 text-sm font-bold text-yellow-200 transition-all active:scale-[0.99] hover:border-yellow-400/50 hover:bg-yellow-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60"
      >
        <Images className="h-4 w-4 opacity-90" aria-hidden />
        See all photos
      </button>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery photo enlarged"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/92 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close full screen photo"
          />
          <div className="relative z-10 flex max-h-[min(92vh,100%)] w-full max-w-5xl flex-col items-center">
            <div className="relative flex w-full flex-1 items-center justify-center">
              {canPrev ? (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-yellow-500/50 bg-black/70 text-yellow-200 shadow-lg hover:bg-black/90 sm:left-1"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                </button>
              ) : null}
              <img
                key={`lb-${index}-${images[index].id}`}
                src={images[index].image_url}
                alt=""
                className={`max-h-[min(88vh,920px)] w-auto max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-yellow-500/20 ${lightboxAnimClass}`}
              />
              {canNext ? (
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-yellow-500/50 bg-black/70 text-yellow-200 shadow-lg hover:bg-black/90 sm:right-1"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-yellow-500/50 bg-black/85 text-yellow-200 shadow-lg hover:bg-black sm:right-5 sm:top-5"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            {n > 1 ? (
              <p className="mt-3 text-center text-xs font-medium text-yellow-200/80">
                {index + 1} / {n}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes kaedys-gallery-enter-right {
          from {
            opacity: 0.22;
            transform: translate3d(28px, 6px, 0) scale(1.06);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes kaedys-gallery-enter-left {
          from {
            opacity: 0.22;
            transform: translate3d(-28px, 6px, 0) scale(1.06);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes kaedys-gallery-enter-fade {
          from {
            opacity: 0.2;
            transform: scale(1.05);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .kaedys-gallery-enter-right {
          animation: kaedys-gallery-enter-right 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .kaedys-gallery-enter-left {
          animation: kaedys-gallery-enter-left 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .kaedys-gallery-enter-fade {
          animation: kaedys-gallery-enter-fade 0.52s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .kaedys-gallery-enter-right,
          .kaedys-gallery-enter-left,
          .kaedys-gallery-enter-fade {
            animation: kaedys-gallery-enter-fade 0.35s ease-out both;
          }
        }
      `}</style>
    </section>
  );
}
