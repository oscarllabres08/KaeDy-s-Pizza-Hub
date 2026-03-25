import { useEffect, useState } from 'react';
import { Pizza, Clock, Heart, Megaphone } from 'lucide-react';
import { supabase, Announcement } from '../lib/supabase';

type HomePageProps = {
  onNavigate: (page: string) => void;
};

export default function HomePage({ onNavigate }: HomePageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) setAnnouncements(data);
  };

  const activeAnnouncements = announcements.filter((announcement) => announcement.active);
  const latestPromo = activeAnnouncements[0];
  const promoText = latestPromo
    ? `PROMO: ${latestPromo.title} - ${latestPromo.content}`
    : 'PROMO: No active promo right now.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-neutral-900">
      {/* Mobile layout */}
      <div className="lg:hidden">
        <div className="relative h-[46vh] bg-black flex items-end justify-center pb-6 overflow-hidden">
          <img
            src="/assets/store.jpg"
            alt="KaeDy's Pizza Hub Store"
            className="absolute inset-0 w-full h-full object-cover opacity-100"
          />
        </div>

        <div className="px-4 pb-10">
          {/* Promo update card */}
          <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-black/60 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-green-400/20 border border-green-400/30" />
              <span className="text-xs font-bold text-yellow-300">ACTIVE • PROMO UPDATE</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="min-w-0">
                <div className="text-yellow-200 font-extrabold">
                  {latestPromo?.title || 'No Active Promo'}
                </div>
                <div className="text-sm text-gray-200 mt-1 line-clamp-2">
                  {latestPromo?.content || 'Check back soon for updates.'}
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-yellow-500/10 bg-neutral-900/70 p-4 text-center">
              <Heart className="w-8 h-8 mx-auto text-yellow-300" />
              <div className="mt-1 text-yellow-200 font-extrabold text-lg">4.8</div>
              <div className="text-[11px] text-yellow-200/80">Rating</div>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-neutral-900/70 p-4 text-center">
              <Pizza className="w-8 h-8 mx-auto text-yellow-300" />
              <div className="mt-1 text-yellow-200 font-extrabold text-lg">500+</div>
              <div className="text-[11px] text-yellow-200/80">Orders</div>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-neutral-900/70 p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-300" />
              <div className="mt-1 text-yellow-200 font-extrabold text-lg">Fast</div>
              <div className="text-[11px] text-yellow-200/80">Delivery</div>
            </div>
          </div>

          {/* Operating hours */}
          <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-black/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <div className="text-yellow-200 font-extrabold">Operating Hours</div>
                <div className="text-[12px] text-gray-300 mt-1">
                  Mon - Fri <span className="font-semibold text-yellow-200">9am - 9pm</span>
                </div>
                <div className="text-[12px] text-gray-300 mt-1">
                  Sat &amp; Sun <span className="font-semibold text-yellow-200">9am - 10pm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Our story */}
          <div className="mt-7">
            <div className="text-yellow-300 font-black text-3xl tracking-tight">OUR STORY</div>
            <div className="mt-3 rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-4">
              <div className="text-yellow-200 font-extrabold">Founded in 2023</div>
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

          {/* Why choose us */}
          <div className="mt-7">
            <div className="text-yellow-300 font-black text-3xl tracking-tight">WHY CHOOSE US</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-yellow-500/15 bg-neutral-900/60 p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="text-yellow-200 font-extrabold">Fresh Ingredients</div>
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
                  <div className="text-yellow-200 font-extrabold">Fast Delivery</div>
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
                  <div className="text-yellow-200 font-extrabold">Made with Love</div>
                  <div className="text-sm text-gray-200 mt-1">
                    Every pizza is crafted with passion and care
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout (existing) */}
      <div className="hidden lg:block">
        <div className="relative h-[90vh] flex items-end justify-center bg-black pb-10">
          <img
            src="/assets/store.jpg"
            alt="KaeDy's Pizza Hub Store"
            className="absolute inset-0 w-full h-full object-cover opacity-100  "
          />
          <div className="absolute top-4 left-0 right-0 z-10 px-3 md:px-6">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-md border border-yellow-400/40 bg-black/75 backdrop-blur-sm">
              <div className="marquee-track text-yellow-300 text-xs md:text-sm font-semibold py-2 whitespace-nowrap">
                <span className="pl-6 pr-24 md:pr-40">{promoText}</span>
                <span className="pl-6 pr-24 md:pr-40" aria-hidden="true">
                  {promoText}
                </span>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-center text-white px-4 animate-fadeIn">
            <button
              onClick={() => onNavigate('menu')}
              className="bg-yellow-400 text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#ffe85a] transition-all transform hover:scale-110 shadow-2xl animate-bounce"
            >
              Order Now
            </button>
          </div>
        </div>

        {activeAnnouncements.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-6 md:mb-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-yellow-300" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
                Latest Announcements
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {activeAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="group rounded-2xl border border-yellow-500/30 bg-neutral-900/70 p-5 md:p-6 shadow-lg hover:border-yellow-400/60 hover:bg-neutral-900/90 transition-all"
                >
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-300 border border-green-500/30 mb-3">
                    Active now
                  </div>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-500/15 text-yellow-200 border border-yellow-500/30 mb-3 ml-2">
                    Promo Update
                  </div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-2 leading-tight">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-200 leading-relaxed">
                    {announcement.content}
                  </p>
                  <p className="mt-4 text-xs text-gray-400">
                    {new Date(announcement.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-6 text-yellow-300">
            Why Choose Us?
          </h2>
          <div className="space-y-3">
            <div className="text-center px-3 py-2">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Pizza className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-yellow-300">Fresh Ingredients</h3>
              <p className="text-sm text-gray-300">
                We use only the freshest, highest-quality ingredients in every pizza
              </p>
            </div>

            <div className="text-center px-3 py-2">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-yellow-300">Fast Delivery</h3>
              <p className="text-sm text-gray-300">
                Hot and fresh pizza delivered to your door in no time
              </p>
            </div>

            <div className="text-center px-3 py-2">
              <div className="bg-yellow-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-yellow-300">Made with Love</h3>
              <p className="text-sm text-gray-300">
                Every pizza is crafted with passion and care
              </p>
            </div>
          </div>
        </div>
      </div>

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
