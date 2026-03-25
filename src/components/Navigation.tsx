import { useState } from 'react';
import {
  ShoppingCart,
  User,
  LogOut,
  Home,
  UtensilsCrossed,
  Gamepad2,
  Images,
  Info,
  Phone,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

type NavigationProps = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();

  const publicPages = [
    { name: 'Home', id: 'home', Icon: Home },
    { name: 'Menu', id: 'menu', Icon: UtensilsCrossed },
    { name: 'Game', id: 'game', Icon: Gamepad2 },
    { name: 'Gallery', id: 'gallery', Icon: Images },
    { name: 'About', id: 'about', Icon: Info },
    { name: 'Contact', id: 'contact', Icon: Phone },
  ];

  const handleSignOutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="bg-black text-yellow-400 shadow-lg fixed w-full top-0 z-50 border-b border-yellow-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleNavigation('home')}
          >
            <img
              src="/assets/kaedypizza.jpg"
              alt="KaeDy's Pizza Hub"
              className="h-12 w-12 rounded-full border-2 border-yellow-400 shadow-md object-cover"
            />
            <span className="ml-3 text-xl font-bold text-yellow-300">KaeDy's Pizza Hub</span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {publicPages.map(page => (
              <button
                key={page.id}
                onClick={() => handleNavigation(page.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  currentPage === page.id
                    ? 'bg-yellow-400 text-black shadow-md'
                    : 'hover:bg-yellow-500 hover:text-black'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <page.Icon className="w-4 h-4" />
                  {page.name}
                </span>
              </button>
            ))}

            {user && (
              <>
                <button
                  onClick={() => handleNavigation('cart')}
                  className="relative px-3 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('profile')}
                  className="px-3 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition-all"
                >
                  <User className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSignOutClick}
                  className="px-3 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}

            {!user && (
              <button
                onClick={() => handleNavigation('auth')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentPage === 'auth'
                    ? 'bg-yellow-400 text-black shadow-md'
                    : 'hover:bg-yellow-500 hover:text-black'
                }`}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile: hamburger menu removed; bottom navigation handles navigation */}
          <div className="md:hidden flex items-center space-x-3" />
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="flex-1 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          />

          <div className="w-44 max-w-[58vw] bg-black border-l border-yellow-500/40 shadow-2xl">
            <div className="h-full px-3 pt-3 pb-4 flex flex-col">
              <div className="space-y-1">
              {publicPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavigation(page.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page.id
                      ? 'bg-yellow-400 text-black'
                      : 'text-yellow-300 hover:bg-yellow-500 hover:text-black'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <page.Icon className="w-5 h-5 shrink-0" />
                    <span>{page.name}</span>
                  </span>
                </button>
              ))}

              {user && (
                <>
                  <button
                    onClick={() => handleNavigation('profile')}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-yellow-300 hover:bg-yellow-500 hover:text-black transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <User className="w-5 h-5 shrink-0" />
                      <span>My Profile</span>
                    </span>
                  </button>
                </>
              )}
              </div>

              <div className="mt-auto pt-3 border-t border-yellow-500/25">
                {user ? (
                  <button
                    onClick={handleSignOutClick}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-yellow-300 hover:bg-yellow-500 hover:text-black transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 shrink-0" />
                      <span>Sign Out</span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigation('auth')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPage === 'auth'
                        ? 'bg-yellow-400 text-black'
                        : 'text-yellow-300 hover:bg-yellow-500 hover:text-black'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <LogIn className="w-5 h-5 shrink-0" />
                      <span>Sign In / Sign Up</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-yellow-500/40 shadow-2xl">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-yellow-300 mb-2">
                Sign out
              </h2>
              <p className="text-sm text-gray-200 mb-5">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-neutral-800 text-gray-100 hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-400 text-black hover:bg-yellow-300 shadow-md transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </nav>

      {/* Mobile bottom navigation (app-like) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 border-t border-yellow-500/40 backdrop-blur">
        <div className="grid grid-cols-5 items-center h-20 px-2">
          <button
            type="button"
            onClick={() => handleNavigation('home')}
            className={`flex flex-col items-center justify-center text-[10px] font-semibold transition-colors ${
              currentPage === 'home' ? 'text-yellow-300' : 'text-gray-500'
            }`}
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
            <span className="mt-0.5">HOME</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigation('menu')}
            className={`flex flex-col items-center justify-center text-[10px] font-semibold transition-colors ${
              currentPage === 'menu' ? 'text-yellow-300' : 'text-gray-500'
            }`}
            aria-label="Menu"
          >
            <UtensilsCrossed className="w-6 h-6" />
            <span className="mt-0.5">MENU</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigation('cart')}
            className="flex items-center justify-center"
            aria-label="Cart"
          >
            <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center border transition-all -translate-y-0 ${
                currentPage === 'cart' || currentPage === 'checkout'
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-yellow-400/15 text-yellow-300 border-yellow-500/30'
              }`}
            >
              <ShoppingCart className="w-7 h-7" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavigation('game')}
            className={`flex flex-col items-center justify-center text-[10px] font-semibold transition-colors ${
              currentPage === 'game' ? 'text-yellow-300' : 'text-gray-500'
            }`}
            aria-label="Game"
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="mt-0.5">GAME</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigation(user ? 'profile' : 'auth')}
            className={`flex flex-col items-center justify-center text-[10px] font-semibold transition-colors ${
              user
                ? currentPage === 'profile'
                  ? 'text-yellow-300'
                  : 'text-gray-500'
                : currentPage === 'auth'
                  ? 'text-yellow-300'
                  : 'text-gray-500'
            }`}
            aria-label="Profile"
          >
            <User className="w-6 h-6" />
            <span className="mt-0.5">PROFILE</span>
          </button>
        </div>
      </nav>
    </>
  );
}
