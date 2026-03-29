import { useState } from 'react';

type PrivacyTermsLinksProps = {
  /** Extra classes on the link row wrapper */
  className?: string;
  /** `footer` = stack, right-aligned on md; `center` = horizontal row under social icons */
  layout?: 'footer' | 'center';
};

export function PrivacyTermsLinks({ className = '', layout = 'center' }: PrivacyTermsLinksProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const linkBtn =
    'text-sm text-yellow-200/90 hover:text-yellow-100 underline underline-offset-4 transition-colors';

  return (
    <>
      <div
        className={
          layout === 'footer'
            ? `text-center md:text-right space-y-2 ${className}`
            : `flex flex-wrap items-center justify-center gap-x-8 gap-y-2 ${className}`
        }
      >
        <button type="button" onClick={() => setShowPrivacy(true)} className={layout === 'footer' ? `block md:ml-auto ${linkBtn}` : linkBtn}>
          Privacy Policy
        </button>
        <button type="button" onClick={() => setShowTerms(true)} className={layout === 'footer' ? `block md:ml-auto ${linkBtn}` : linkBtn}>
          Terms &amp; Conditions
        </button>
      </div>

      {showPrivacy && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-950 border border-yellow-500/35 shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6">
              <h3 className="text-xl font-bold text-yellow-300">Privacy Policy</h3>
              <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-yellow-500/20 bg-black/40 p-4 text-sm text-gray-200 space-y-3">
                <p>We collect your account and order data so we can provide online ordering and delivery services.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Collected information may include name, username, email, phone number, and delivery address.</li>
                  <li>Order details, payment references, and payment proof uploads are processed for order verification.</li>
                  <li>Data is used for order fulfillment, customer support, and service improvement.</li>
                  <li>Only authorized personnel may access order/payment details for operational purposes.</li>
                  <li>We do not sell your personal data.</li>
                </ul>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacy(false)}
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-950 border border-yellow-500/35 shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6">
              <h3 className="text-xl font-bold text-yellow-300">Terms and Conditions</h3>
              <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-yellow-500/20 bg-black/40 p-4 text-sm text-gray-200 space-y-3">
                <p>By placing an order on this website, you agree to the following terms:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>All orders are considered final once submitted.</li>
                  <li>
                    <strong>No cancellation of orders</strong> is allowed after order placement, including paid and unpaid orders.
                  </li>
                  <li>
                    <strong>No refund</strong> policy applies once payment has been verified and/or order preparation has started.
                  </li>
                  <li>Customers must provide accurate delivery and contact information.</li>
                  <li>GCash payments may be verified via reference number and proof of payment before confirmation.</li>
                </ul>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
