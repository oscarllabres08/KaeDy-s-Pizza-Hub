import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Heart, Megaphone, Pizza } from 'lucide-react';
import { SocialContactIcons } from '../components/SocialContactIcons';
import { PrivacyTermsLinks } from '../components/PrivacyTermsLinks';
import { HomeReelsSection } from '../components/HomeReelsSection';
import { HomeGallerySection } from '../components/HomeGallerySection';
import { supabase, Announcement, promoCardImagePublicUrl } from '../lib/supabase';

type HomePageProps = {
  onNavigate: (page: string) => void;
};

function announcementKind(a: Announcement): 'card' | 'marquee' {
  return a.promo_type === 'marquee' ? 'marquee' : 'card';
}

/** Text for the hero ticker (marquee-type promos only on the site). */
function formatMarqueeTicker(a: Announcement): string {
  const t = a.title?.trim();
  const c = a.content?.trim();
  if (t && c) return `${t} — ${c}`;
  return c || t || '';
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [promoCardIndex, setPromoCardIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(40);

    if (data) setAnnouncements(data);
  };

  const activeAnnouncements = announcements.filter((a) => a.active);
  const cardAnnouncements = activeAnnouncements.filter((a) => announcementKind(a) === 'card');
  const marqueePromo = activeAnnouncements.find((a) => announcementKind(a) === 'marquee');
  const marqueeText = marqueePromo ? formatMarqueeTicker(marqueePromo) : '';
  const nCardPromos = cardAnnouncements.length;

  useEffect(() => {
    setPromoCardIndex((i) => (nCardPromos === 0 ? 0 : Math.min(i, nCardPromos - 1)));
  }, [nCardPromos]);

  const goNextPromoCard = useCallback(() => {
    if (nCardPromos < 2) return;
    setPromoCardIndex((i) => Math.min(i + 1, nCardPromos - 1));
  }, [nCardPromos]);

  const goPrevPromoCard = useCallback(() => {
    if (nCardPromos < 2) return;
    setPromoCardIndex((i) => Math.max(i - 1, 0));
  }, [nCardPromos]);

  const onPromoCardTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onPromoCardTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || nCardPromos < 2) {
      touchStartX.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -40) {
      setPromoCardIndex((i) => Math.min(i + 1, nCardPromos - 1));
    } else if (dx > 40) {
      setPromoCardIndex((i) => Math.max(i - 1, 0));
    }
  };

  const canPromoPrev = nCardPromos > 1 && promoCardIndex > 0;
  const canPromoNext = nCardPromos > 1 && promoCardIndex < nCardPromos - 1;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-black to-neutral-900">
      {/* Mobile layout */}
      <div className="lg:hidden w-full min-w-0">
        <div className="relative h-[46vh] bg-black flex items-end justify-center pb-6 overflow-hidden">
          <img
            src="/assets/store.jpg"
            alt="KaeDy's Pizza Hub Store"
            className="absolute inset-0 w-full h-full object-cover opacity-100"
          />
          {marqueeText ? (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-2 pt-0">
              <div className="mx-auto max-w-6xl overflow-hidden rounded-md border border-yellow-400/40 bg-black/80 backdrop-blur-sm">
                <div className="marquee-track text-heading-secondary text-[11px] font-semibold py-2 whitespace-nowrap">
                  <span className="pl-4 pr-16">{marqueeText}</span>
                  <span className="pl-4 pr-16" aria-hidden="true">
                    {marqueeText}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-4 pb-10">
          {/* Promo update card(s) — swipe or arrows when multiple */}
          <div className="mt-4 relative rounded-2xl border border-yellow-500/30 bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 pt-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center w-3 h-3 shrink-0 rounded-full bg-green-400 border border-green-200 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
                <span className="text-xs font-black text-green-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]">
                  ACTIVE • PROMO UPDATE
                </span>
              </div>
              {nCardPromos > 1 ? (
                <div className="flex items-center gap-1.5 shrink-0 text-heading-secondary/90">
                  <span className="text-[10px] font-semibold tabular-nums">
                    {promoCardIndex + 1}/{nCardPromos}
                  </span>
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </div>
              ) : null}
            </div>
            {canPromoPrev ? (
              <button
                type="button"
                onClick={goPrevPromoCard}
                className="absolute left-1 top-[58%] z-10 -translate-y-1/2 p-1 text-yellow-400 hover:text-yellow-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 rounded-md"
                aria-label="Previous promo"
              >
                <ChevronLeft className="w-6 h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
              </button>
            ) : null}
            {canPromoNext ? (
              <button
                type="button"
                onClick={goNextPromoCard}
                className="absolute right-1 top-[58%] z-10 -translate-y-1/2 p-1 text-yellow-400 hover:text-yellow-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 rounded-md"
                aria-label="Next promo"
              >
                <ChevronRight className="w-6 h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
              </button>
            ) : null}

            <div className="overflow-hidden pl-2 pr-2 pb-4 pt-2">
              {nCardPromos === 0 ? (
                <div className="px-2 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-heading-primary font-extrabold">No Active Promo</div>
                      <div className="text-sm text-gray-200 mt-1">Check back soon for updates.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="touch-pan-y select-none"
                  onTouchStart={onPromoCardTouchStart}
                  onTouchEnd={onPromoCardTouchEnd}
                >
                  <div
                    className="flex w-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${promoCardIndex * 100}%)` }}
                  >
                    {cardAnnouncements.map((p) => {
                      const heroUrl = promoCardImagePublicUrl(p.card_image_path, p.created_at);
                      return (
                        <div key={p.id} className="min-w-full shrink-0 basis-full px-2">
                          {heroUrl ? (
                            <div className="relative min-h-[136px] rounded-xl overflow-hidden border border-yellow-500/25 shadow-inner">
                              <img
                                src={heroUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
                              <div className="relative z-10 p-3 flex flex-col justify-end min-h-[136px]">
                                <div className="text-heading-primary font-extrabold leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                                  {p.title}
                                </div>
                                <div className="text-sm text-gray-100 mt-1 line-clamp-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                                  {p.content}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                                <Megaphone className="w-5 h-5 text-yellow-300" />
                              </div>
                              <div className="min-w-0 flex-1 pb-0.5">
                                <div className="text-heading-primary font-extrabold leading-snug">{p.title}</div>
                                <div className="text-sm text-gray-200 mt-1 line-clamp-4">{p.content}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {nCardPromos > 1 ? (
              <div className="flex justify-center gap-1.5 pb-3 pt-0">
                {cardAnnouncements.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPromoCardIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === promoCardIndex ? 'w-5 bg-yellow-400' : 'w-1.5 bg-yellow-500/35 hover:bg-yellow-500/55'
                    }`}
                    aria-label={`Promo ${i + 1} of ${nCardPromos}`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Stat cards */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-yellow-500/10 bg-neutral-900/70 p-4 text-center">
              <Heart className="w-8 h-8 mx-auto text-yellow-300" />
              <div className="mt-1 text-heading-primary font-extrabold text-lg">4.8</div>
              <div className="text-[11px] text-heading-secondary/90">Rating</div>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-neutral-900/70 p-4 text-center">
              <Pizza className="w-8 h-8 mx-auto text-yellow-300" />
              <div className="mt-1 text-heading-primary font-extrabold text-lg">500+</div>
              <div className="text-[11px] text-heading-secondary/90">Orders</div>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-neutral-900/70 p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-300" />
              <div className="mt-1 text-heading-primary font-extrabold text-lg">Fast</div>
              <div className="text-[11px] text-heading-secondary/90">Delivery</div>
            </div>
          </div>

          <HomeReelsSection className="mt-7" onNavigate={onNavigate} />

          <HomeGallerySection className="mt-8" onNavigate={onNavigate} />

          {/* Why choose us (first on mobile) */}
          <div className="mt-9">
            <div className="text-heading-primary font-black text-3xl tracking-tight">WHY CHOOSE US</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="text-heading-secondary font-extrabold">Fresh Ingredients</div>
                  <div className="text-sm text-gray-200 mt-1">
                    We use only the freshest, highest-quality ingredients in every pizza
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="text-heading-secondary font-extrabold">Fast Delivery</div>
                  <div className="text-sm text-gray-200 mt-1">
                    Hot and fresh pizza delivered to your door in no time
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="text-heading-secondary font-extrabold">Made with Love</div>
                  <div className="text-sm text-gray-200 mt-1">
                    Every pizza is crafted with passion and care
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our story */}
          <div className="mt-7">
            <div className="text-heading-primary font-black text-3xl tracking-tight">OUR STORY</div>
            <div className="mt-3 rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
              <div className="text-heading-secondary font-extrabold">Founded in 2023</div>
              <div className="text-gray-200 text-sm mt-2 leading-relaxed">
                KaeDy&apos;s Pizza Hub has been serving not just pizzas, but comforting budget meals,
                crispy chicken, and refreshing milk tea to our community. What started as a small family
                business has grown into a beloved local favorite.
              </div>
              <div className="text-gray-200 text-sm mt-3 leading-relaxed">
                We believe in using only the freshest ingredients and recipes crafted with care. Every order is made with love to keep you full and satisfied.
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="text-heading-primary font-black text-3xl tracking-tight">STORE</div>
            <div className="mt-3 rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
              <img
                src="/assets/store1.jpg"
                alt="KaeDy's Pizza Hub physical store"
                className="w-full h-auto max-h-[42vh] rounded-xl object-cover object-center"
                loading="lazy"
              />
            </div>

            <div className="mt-3 rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <iframe
                  title="Store location preview"
                  src="https://www.google.com/maps?q=13.55826591577359,123.27199911382527&z=17&output=embed"
                  className="w-full h-44"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-heading-secondary font-extrabold">Map Preview</div>
                  <div className="text-[11px] text-gray-300 truncate">
                    13.55826591577359, 123.27199911382527
                  </div>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=13.55826591577359,123.27199911382527"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-yellow-400 text-black text-xs font-extrabold hover:bg-yellow-300 transition-colors"
                  aria-label="Open directions to KaeDy's Pizza Hub in Google Maps"
                  title="Open Google Maps directions"
                >
                  Open Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout (existing) */}
      <div className="hidden lg:block w-full min-w-0 overflow-x-hidden">
        <div className="relative h-[90vh] flex items-end justify-center bg-black pb-10">
          <img
            src="/assets/store.jpg"
            alt="KaeDy's Pizza Hub Store"
            className="absolute inset-0 w-full h-full object-cover opacity-100  "
          />
          {marqueeText ? (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-4 pt-0 md:px-6 md:pb-6">
              <div className="mx-auto max-w-6xl overflow-hidden rounded-md border border-yellow-400/40 bg-black/75 backdrop-blur-sm">
                <div className="marquee-track text-heading-secondary text-xs md:text-sm font-semibold py-2 whitespace-nowrap">
                  <span className="pl-6 pr-24 md:pr-40">{marqueeText}</span>
                  <span className="pl-6 pr-24 md:pr-40" aria-hidden="true">
                    {marqueeText}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          <div
            className={`relative z-10 text-center text-white px-4 animate-fadeIn ${
              marqueeText ? 'mb-14 md:mb-16' : ''
            }`}
          >
            <button
              onClick={() => onNavigate('menu')}
              className="bg-yellow-400 text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#ffe85a] transition-all transform hover:scale-110 shadow-2xl animate-bounce"
            >
              Order Now
            </button>
          </div>
        </div>

        {cardAnnouncements.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-6 md:mb-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-yellow-300" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-heading-primary">
                Latest Announcements
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {cardAnnouncements.map((announcement) => {
                const heroUrl = promoCardImagePublicUrl(announcement.card_image_path, announcement.created_at);
                return (
                  <div
                    key={announcement.id}
                    className={`group rounded-2xl border border-yellow-500/30 shadow-lg overflow-hidden transition-all ${
                      heroUrl
                        ? 'hover:border-yellow-400/60'
                        : 'bg-neutral-900/70 hover:border-yellow-400/60 hover:bg-neutral-900/90'
                    }`}
                  >
                    {heroUrl ? (
                      <div className="relative min-h-[15rem]">
                        <img
                          src={heroUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25" />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/25 text-green-200 border border-green-500/40 backdrop-blur-sm">
                            Active now
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-500/25 text-yellow-100 border border-yellow-500/40 backdrop-blur-sm">
                            Promo Update
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <h3 className="text-xl font-bold text-heading-primary mb-2 leading-tight drop-shadow-md">
                            {announcement.title}
                          </h3>
                          <p className="text-gray-100 leading-relaxed drop-shadow">
                            {announcement.content}
                          </p>
                          <p className="mt-3 text-xs text-gray-300">
                            {new Date(announcement.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 md:p-6">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-300 border border-green-500/30 mb-3">
                          Active now
                        </div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-500/15 text-yellow-200 border border-yellow-500/30 mb-3 ml-2">
                          Promo Update
                        </div>
                        <h3 className="text-xl font-bold text-heading-secondary mb-2 leading-tight">
                          {announcement.title}
                        </h3>
                        <p className="text-gray-200 leading-relaxed">
                          {announcement.content}
                        </p>
                        <p className="mt-4 text-xs text-gray-400">
                          {new Date(announcement.created_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          <HomeReelsSection onNavigate={onNavigate} />
          <HomeGallerySection className="mt-10 max-w-4xl mx-auto" onNavigate={onNavigate} />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-6 text-heading-primary">
            Why Choose Us?
          </h2>
          <div className="space-y-3">
            <div className="text-center px-3 py-2">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Pizza className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-heading-secondary">Fresh Ingredients</h3>
              <p className="text-sm text-gray-300">
                We use only the freshest, highest-quality ingredients in every pizza
              </p>
            </div>

            <div className="text-center px-3 py-2">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-heading-secondary">Fast Delivery</h3>
              <p className="text-sm text-gray-300">
                Hot and fresh pizza delivered to your door in no time
              </p>
            </div>

            <div className="text-center px-3 py-2">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-heading-secondary">Made with Love</h3>
              <p className="text-sm text-gray-300">
                Every pizza is crafted with passion and care
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8">
          <h2 className="text-3xl font-bold text-center mb-6 text-heading-primary">Our Story</h2>
          <div className="rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.25)] max-w-4xl mx-auto">
            <div className="text-heading-secondary font-extrabold text-lg">Founded in 2023</div>
            <p className="text-gray-200 mt-3 leading-relaxed">
              KaeDy&apos;s Pizza Hub has been serving not just pizzas, but comforting budget meals,
              crispy chicken, and refreshing milk tea to our community. What started as a small family
              business has grown into a beloved local favorite.
            </p>
            <p className="text-gray-200 mt-4 leading-relaxed">
              We believe in using only the freshest ingredients and recipes crafted with care. Every order is made with love to keep you full and satisfied.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-3xl font-bold text-center mb-6 text-heading-primary">Store</h2>
          <div className="rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-3 md:p-4 overflow-hidden max-w-4xl mx-auto shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
            <img
              src="/assets/store1.jpg"
              alt="KaeDy's Pizza Hub physical store"
              className="w-full h-auto max-h-[min(56vh,520px)] rounded-xl object-cover object-center"
              loading="lazy"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-3 md:p-4 overflow-hidden max-w-4xl mx-auto shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <iframe
                title="Store location preview"
                src="https://www.google.com/maps?q=13.55826591577359,123.27199911382527&z=17&output=embed"
                className="w-full h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-heading-secondary font-extrabold">Map Preview</div>
                <div className="text-xs text-gray-300 truncate">
                  Open Google Maps for route from your location
                </div>
              </div>
              <a
                href="https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=13.55826591577359,123.27199911382527"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-4 py-2 rounded-xl bg-yellow-400 text-black text-xs font-extrabold hover:bg-yellow-300 transition-colors"
                aria-label="Open directions to KaeDy's Pizza Hub in Google Maps"
                title="Open Google Maps directions"
              >
                Open Directions
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-yellow-500/20 bg-black/30 px-4 py-10 lg:py-12">
        <div className="mx-auto max-w-2xl flex flex-col items-center">
          <SocialContactIcons />
          <PrivacyTermsLinks layout="center" className="mt-6" />
        </div>
      </section>

      <style>{`
        @keyframes kaedys-marquee-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: inline-flex;
          min-width: 200%;
          animation: kaedys-marquee-left 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
