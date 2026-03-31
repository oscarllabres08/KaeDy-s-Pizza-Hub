import { lazy, Suspense, useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { AuthProvider, useAuth, SUSPENDED_NOTICE_STORAGE_KEY } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { BuyNowProvider } from './contexts/BuyNowContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AuthForm = lazy(() => import('./components/AuthForm'));

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-gradient-to-br from-black to-neutral-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400" />
    </div>
  );
}

type PageId =
  | 'home'
  | 'menu'
  | 'game'
  | 'gallery'
  | 'about'
  | 'contact'
  | 'cart'
  | 'checkout'
  | 'profile'
  | 'auth';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [suspendedBanner, setSuspendedBanner] = useState<string | null>(null);
  const { loading, profilesLoaded, user } = useAuth();

  useEffect(() => {
    if (user) {
      setSuspendedBanner(null);
      return;
    }
    try {
      const n = sessionStorage.getItem(SUSPENDED_NOTICE_STORAGE_KEY);
      if (n) {
        setSuspendedBanner(n);
        sessionStorage.removeItem(SUSPENDED_NOTICE_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as PageId | '';
    if (hash && ['home', 'menu', 'game', 'gallery', 'about', 'contact', 'cart', 'checkout', 'profile', 'auth'].includes(hash)) {
      setCurrentPage(hash as PageId);
    }

    const onHashChange = () => {
      const newHash = window.location.hash.replace('#', '') as PageId | '';
      if (newHash && ['home', 'menu', 'game', 'gallery', 'about', 'contact', 'cart', 'checkout', 'profile', 'auth'].includes(newHash)) {
        setCurrentPage(newHash as PageId);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = (page: PageId | string) => {
    const target = page as PageId;
    setCurrentPage(target);
    window.location.hash = `#${target}`;
  };

  let content: JSX.Element;
  switch (currentPage) {
    case 'home':
      content = <HomePage onNavigate={handleNavigate} />;
      break;
    case 'menu':
      content = <MenuPage onNavigate={handleNavigate} />;
      break;
    case 'game':
      content = <GamePage onNavigate={handleNavigate} />;
      break;
    case 'gallery':
      content = <GalleryPage />;
      break;
    case 'about':
      content = <AboutPage />;
      break;
    case 'contact':
      content = <ContactPage />;
      break;
    case 'cart':
      content = <CartPage onNavigate={handleNavigate} />;
      break;
    case 'checkout':
      content = <CartPage onNavigate={handleNavigate} startInCheckout />;
      break;
    case 'profile':
      content = <ProfilePage />;
      break;
    case 'auth':
      content = (
        <AuthForm
          onSuccess={() => {
            setCurrentPage('home');
          }}
        />
      );
      break;
    default:
      content = <HomePage onNavigate={handleNavigate} />;
  }

  // Only block initial boot. After profiles are loaded once, keep the app mounted
  // even if background refreshes temporarily set `loading=true`, to avoid losing page state (game).
  if (loading && !profilesLoaded) {
    return (
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center bg-gradient-to-br from-black to-neutral-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col pt-16 bg-gradient-to-br from-black to-neutral-900">
      {suspendedBanner ? (
        <div
          role="alert"
          className="fixed top-16 left-0 right-0 z-[60] px-3 pt-2 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-xl border border-red-400/45 bg-red-950/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <p className="flex-1 text-sm text-red-100 leading-snug">{suspendedBanner}</p>
            <button
              type="button"
              onClick={() => setSuspendedBanner(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/20"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 min-w-0 pb-24 md:pb-0 w-full">
        <Suspense fallback={<PageFallback />}>{content}</Suspense>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BuyNowProvider>
          <AppContent />
        </BuyNowProvider>
      </CartProvider>
    </AuthProvider>
  );
}
