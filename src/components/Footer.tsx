import { Pizza } from 'lucide-react';
import { PrivacyTermsLinks } from './PrivacyTermsLinks';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 mt-auto border-t border-yellow-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10 md:py-8 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <Pizza className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-heading-primary">KaeDy's Pizza Hub</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Serving the finest pizzas since 2023. Made with love and the freshest ingredients.
            </p>
          </div>

          <div className="hidden md:block" />
          <PrivacyTermsLinks layout="footer" />
        </div>

        <div className="border-t border-yellow-500/40 mt-5 pt-4 md:mt-8 md:pt-6 text-center text-sm text-gray-500">
          <p>&copy; 2023 KaeDy's Pizza Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
