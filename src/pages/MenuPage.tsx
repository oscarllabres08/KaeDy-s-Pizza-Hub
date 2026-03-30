import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useBuyNow } from '../contexts/BuyNowContext';
import { MenuItem, supabase } from '../lib/supabase';

type MenuPageProps = {
  onNavigate: (page: string) => void;
};

export default function MenuPage({ onNavigate }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { startBuyNow } = useBuyNow();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMenuItems((data || []) as MenuItem[]);
      } catch (error) {
        console.error('Error loading menu items', error);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, []);

  const isItemAvailable = (item: MenuItem) => {
    return item.is_available;
  };

  const normalizeLabel = (value: string) => value.trim().toLowerCase();

  const getMainCategoryLabel = (item: MenuItem) =>
    item.category === 'Others' ? item.custom_category?.trim() || 'Others' : item.category?.trim() || 'Others';

  const preferredMainCategories = ['Pizza', 'All Day Silog Meals', 'Chicken', 'Nasi Goreng', 'Drinks'];
  const foundCategories = Array.from(
    new Set(
      menuItems
        .map((item) => getMainCategoryLabel(item))
        .filter((value): value is string => !!value)
    )
  );
  const categories = [
    'All',
    ...preferredMainCategories.filter((category) => foundCategories.includes(category)),
    ...foundCategories
      .filter((category) => !preferredMainCategories.includes(category))
      .sort((a, b) => a.localeCompare(b)),
  ];

  const subcategoryOptions =
    selectedCategory === 'All'
      ? []
      : Array.from(
          menuItems
            .filter((item) => getMainCategoryLabel(item) === selectedCategory)
            .reduce((map, item) => {
              const raw = item.subcategory?.trim() || '';
              if (!raw) return map;
              const key = normalizeLabel(raw);
              if (!map.has(key)) map.set(key, raw);
              return map;
            }, new Map<string, string>())
            .values()
        ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    setSelectedSubcategory('All');
  }, [selectedCategory]);

  useEffect(() => {
    if (!searchExpanded) return;
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [searchExpanded]);

  useEffect(() => {
    if (!searchExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchExpanded(false);
        setSearch('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchExpanded]);

  const filteredItems = menuItems.filter((item) => {
    const mainCategory = getMainCategoryLabel(item);
    const itemSubcategory = item.subcategory?.trim() || '';
    const matchesCategory =
      selectedCategory === 'All' ? true : mainCategory === selectedCategory;
    const matchesSubcategory =
      selectedSubcategory === 'All'
        ? true
        : normalizeLabel(itemSubcategory) === normalizeLabel(selectedSubcategory);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.custom_category || '').toLowerCase().includes(q) ||
      (item.subcategory || '').toLowerCase().includes(q);
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const handleAddToCart = (item: MenuItem) => {
    if (!user) {
      onNavigate('auth');
      return;
    }

    const qty = quantities[item.id] && quantities[item.id] > 0 ? quantities[item.id] : 1;
    for (let i = 0; i < qty; i++) {
      addToCart(item);
    }
    setAddedItems((prev) => new Set(prev).add(item.id));
    // reset quantity back to 1 for this item
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 2000);
  };

  const handleBuyNow = (item: MenuItem) => {
    if (!user) {
      onNavigate('auth');
      return;
    }

    const qty = quantities[item.id] && quantities[item.id] > 0 ? quantities[item.id] : 1;
    startBuyNow(item, qty);
    // reset quantity back to 1 for this item
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
    // Buy Now: go straight to checkout (separate from Cart — cart items stay untouched)
    onNavigate('checkout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-neutral-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6 kae-animate-menu-reveal">
          <h1 className="text-2xl md:text-3xl font-bold text-heading-primary shrink-0 tracking-tight">
            Menu
          </h1>
          <div className="flex-1 flex justify-end min-w-0">
            <div
              className={[
                'flex items-center h-12 w-full overflow-hidden border border-yellow-500/40 bg-neutral-900/95 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-[max-width,border-radius,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                searchExpanded
                  ? 'max-w-lg rounded-xl pl-3 pr-2 ring-1 ring-yellow-400/25 shadow-[0_8px_32px_rgba(234,179,8,0.08)]'
                  : 'max-w-[3rem] rounded-full justify-center hover:bg-neutral-800/80 hover:border-yellow-400/55 active:scale-[0.97]',
              ].join(' ')}
            >
              {searchExpanded ? (
                <>
                  <Search
                    className="w-5 h-5 text-yellow-400 shrink-0 mr-2"
                    aria-hidden
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for pizza, meals, or drinks..."
                    className="flex-1 min-w-0 bg-transparent text-gray-100 placeholder:text-gray-500 text-sm py-2 focus:outline-none"
                    aria-label="Search menu"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchExpanded(false);
                      setSearch('');
                    }}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-yellow-300 hover:bg-white/5 transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" strokeWidth={2.25} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchExpanded(true)}
                  className="w-full h-full flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-colors"
                  aria-expanded={false}
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" strokeWidth={2.25} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto kae-animate-menu-reveal [animation-delay:85ms]">
          <div className="flex gap-2 pb-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                }}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm flex-none transition-all duration-300 ease-out ${
                  selectedCategory === category
                    ? 'bg-yellow-400 text-black shadow-md ring-2 ring-yellow-400/50 scale-[1.02]'
                    : 'bg-neutral-800 text-gray-200 hover:bg-neutral-700 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {subcategoryOptions.length > 0 && (
          <div className="mb-6 overflow-x-auto kae-animate-menu-reveal [animation-delay:130ms]">
            <div className="flex gap-3 pb-2 min-w-max">
              <button
                type="button"
                onClick={() => setSelectedSubcategory('All')}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs flex-none transition-all duration-300 ease-out ${
                  selectedSubcategory === 'All'
                    ? 'bg-yellow-400 text-black shadow-md ring-2 ring-yellow-400/50 scale-[1.02]'
                    : 'bg-neutral-800 text-gray-200 hover:bg-neutral-700 hover:scale-[1.02] active:scale-95'
                }`}
              >
                All {selectedCategory}
              </button>
              {subcategoryOptions.map((subcategory) => (
                <button
                  key={subcategory}
                  type="button"
                  onClick={() => setSelectedSubcategory(subcategory)}
                  className={`px-4 py-1.5 rounded-lg font-semibold text-xs flex-none transition-all duration-300 ease-out ${
                    selectedSubcategory === subcategory
                      ? 'bg-yellow-400 text-black shadow-md ring-2 ring-yellow-400/50 scale-[1.02]'
                      : 'bg-neutral-800 text-gray-200 hover:bg-neutral-700 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-gray-300 animate-fadeIn motion-reduce:animate-none">
            Loading menu...
          </div>
        ) : (
          <div
            key={`${selectedCategory}-${selectedSubcategory}`}
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-stretch"
          >
            {filteredItems.map((item, index) => {
              const available = isItemAvailable(item);
              const quantity = quantities[item.id] ?? 1;
              const openPreview = () => setPreviewItem(item);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={openPreview}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openPreview();
                    }
                  }}
                  aria-label={`View details: ${item.name}`}
                  className="group bg-neutral-900 rounded-lg shadow-md overflow-hidden border border-yellow-500/20 flex flex-col h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 kae-animate-menu-card"
                  style={{ animationDelay: `${Math.min(index, 24) * 42}ms` }}
                >
                  <div className="w-full shrink-0 pointer-events-none">
                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black px-2 py-0.5 text-xs rounded-full font-bold">
                        ₱{item.price}
                      </div>
                      {!available && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-200 text-gray-800">
                            Not available today
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs sm:text-sm font-bold text-heading-secondary mb-0.5 leading-tight line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 mb-1 leading-tight line-clamp-1 shrink-0">
                      {item.category === 'Others' ? item.custom_category || 'Others' : item.category}
                      {item.subcategory ? ` > ${item.subcategory}` : ''}
                    </p>
                    <p
                      title={item.description}
                      className="text-gray-300 text-[11px] leading-snug mb-1.5 line-clamp-2 overflow-hidden text-ellipsis break-words shrink-0"
                    >
                      {item.description}
                    </p>
                    {available ? (
                      <>
                        <div
                          className="mb-1.5 flex items-center justify-between gap-0 mt-auto pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-gray-300">Quantity</span>
                          <div className="flex items-center gap-1.5 bg-black/40 rounded-full px-1 py-0.1 border border-yellow-500/40">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: Math.max(1, (prev[item.id] ?? 1) - 1),
                                }))
                              }
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-900 text-yellow-300 hover:bg-neutral-800 text-[10px]"
                            >
                              -
                            </button>
                            <span className="min-w-[1.4rem] text-center text-xs font-semibold text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: Math.min(99, (prev[item.id] ?? 1) + 1),
                                }))
                              }
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-900 text-yellow-300 hover:bg-neutral-800 text-[10px]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div
                          className="flex gap-1.5 pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className={`flex-1 min-h-[1.85rem] sm:min-h-[2rem] rounded-md text-[10px] sm:text-[11px] font-semibold transition-all px-1.5 py-0.5 leading-tight text-center whitespace-normal line-clamp-2 ${
                              addedItems.has(item.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-yellow-400 text-black hover:bg-yellow-300'
                            }`}
                          >
                            {addedItems.has(item.id) ? 'Added' : 'Add to Order'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBuyNow(item)}
                            className="flex-1 min-h-[1.85rem] sm:min-h-[2rem] rounded-md text-[10px] sm:text-[11px] font-semibold border border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 transition-all px-1.5 py-0.5 leading-tight text-center whitespace-nowrap"
                          >
                            Buy Now
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-auto w-full py-2 rounded-md text-xs font-semibold text-center bg-gray-300 text-gray-700">
                        Currently Unavailable
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 kae-animate-menu-backdrop">
            <div className="bg-neutral-900 rounded-2xl max-w-md w-full overflow-hidden border border-yellow-500/40 kae-animate-menu-modal">
              <div className="relative w-full bg-black/60" style={{ paddingTop: '100%' }}>
                <img
                  src={previewItem.image_url}
                  alt={previewItem.name}
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs"
                >
                  Close
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-heading-secondary">
                    {previewItem.name}
                  </h3>
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                    ₱{previewItem.price}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  {previewItem.description}
                </p>
                {isItemAvailable(previewItem) ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(previewItem);
                      setPreviewItem(null);
                    }}
                    className="w-full py-2 rounded-md text-sm font-semibold bg-yellow-400 text-black hover:bg-yellow-300 transition-all"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-md text-xs font-semibold text-center bg-gray-300 text-gray-700">
                    This item is currently unavailable
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
