import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, User, X } from 'lucide-react';
import type { AppRoute } from '../types/store';

interface AccountDemoModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const AccountDemoModal: React.FC<AccountDemoModalProps> = ({
  open,
  onClose,
  onNavigate,
}) => {
  const [demoName, setDemoName] = useState('');
  const [signedInName, setSignedInName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) return;
    setSignedInName(demoName.trim());
    setDemoName('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Customer Account Demo"
    >
      <div
        className="fixed inset-0 bg-[#2A1121]/45 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#FDFBF9] p-6 sm:p-7 border border-[#EFE3E9] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#EFE3E9]">
          <div className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-[#5A0D3F]" />
            <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
              Account Preview (Demo)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F8EEF2] text-[#5A0D3F]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-[#F8EEF2] px-4 py-3 text-xs text-[#5A0D3F] flex items-start gap-2">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Frontend demonstration only. Customer authentication and order tracking will connect to
            a secure backend in Phase 2.
          </span>
        </div>

        {signedInName ? (
          <div className="mt-5 rounded-2xl bg-white p-5 border border-[#EFE3E9]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8C1D5E]">
              Demo Session Active
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-[#2A1121]">
              Welcome, {signedInName}
            </p>
            <p className="mt-1 text-xs text-[#7A5B6B]">
              Your shopping bag and wishlist remain saved locally in this browser.
            </p>
            <button
              type="button"
              onClick={() => setSignedInName(null)}
              className="mt-4 rounded-full border border-[#5A0D3F] px-4 py-1.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
            >
              Sign Out Demo
            </button>
          </div>
        ) : (
          <form onSubmit={handleDemoSignIn} className="mt-5 space-y-3">
            <label htmlFor="demo-account-name" className="block text-xs font-semibold text-[#2A1121]">
              Try Demo Greeting (Optional)
            </label>
            <input
              id="demo-account-name"
              type="text"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              placeholder="Enter your name for demo preview"
              className="w-full rounded-xl border border-[#DFC9D4] bg-white px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#5A0D3F] py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
            >
              Preview Customer Greeting
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#EFE3E9] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#7A5B6B]">
            <ShieldCheck className="h-4 w-4 text-[#C59B48]" />
            <span>Store owner tools</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate({ view: 'admin' });
            }}
            className="text-xs font-semibold text-[#5A0D3F] underline underline-offset-4 hover:text-[#8C1D5E]"
          >
            Open Demo Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
};
