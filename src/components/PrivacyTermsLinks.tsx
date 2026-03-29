import { useState } from 'react';
import { LegalModal } from './LegalModal';

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
    'text-sm text-yellow-200/90 underline underline-offset-4 transition-all duration-200 hover:text-yellow-100 active:scale-[0.98]';

  return (
    <>
      <div
        className={
          layout === 'footer'
            ? `text-center md:text-right space-y-2 ${className}`
            : `flex flex-wrap items-center justify-center gap-x-8 gap-y-2 ${className}`
        }
      >
        <button
          type="button"
          onClick={() => setShowPrivacy(true)}
          className={layout === 'footer' ? `block md:ml-auto ${linkBtn}` : linkBtn}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          onClick={() => setShowTerms(true)}
          className={layout === 'footer' ? `block md:ml-auto ${linkBtn}` : linkBtn}
        >
          Terms &amp; Conditions
        </button>
      </div>

      <LegalModal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-auto rounded-xl border border-yellow-500/20 bg-black/40 p-4 text-sm text-gray-200">
          <p>We collect your account and order data so we can provide online ordering and delivery services.</p>
          <ul className="list-disc space-y-1 pl-5">
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
            className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-black transition-all duration-200 hover:bg-yellow-300 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </LegalModal>

      <LegalModal open={showTerms} onClose={() => setShowTerms(false)} title="Terms and Conditions">
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-auto rounded-xl border border-yellow-500/20 bg-black/40 p-4 text-sm text-gray-200">
          <p>By placing an order on this website, you agree to the following terms:</p>
          <ul className="list-disc space-y-1 pl-5">
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
            className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-black transition-all duration-200 hover:bg-yellow-300 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </LegalModal>
    </>
  );
}
