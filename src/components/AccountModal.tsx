import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  LogIn,
  LogOut,
  Package,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import {
  formatAuthErrorMessage,
  signInWithGoogle,
  signOutUser,
  type AuthSessionState,
} from '../services/authService';
import type { AppRoute } from '../types/store';

interface AccountModalProps {
  open: boolean;
  authState: AuthSessionState;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  authState,
  onClose,
  onNavigate,
}) => {
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const formatted = formatAuthErrorMessage(err);
      if (formatted) {
        setErrorMsg(formatted);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOutUser();
    } finally {
      setBusy(false);
    }
  };

  const { user, isAdmin } = authState;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Customer Account"
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
              {user ? 'Your Account' : 'Customer Sign In'}
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

        {errorMsg && (
          <p className="mt-4 rounded-xl bg-[#FDF0F3] border border-[#E7B5C6] px-4 py-2.5 text-xs text-[#8C1D5E]">
            {errorMsg}
          </p>
        )}

        {user ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-white p-5 border border-[#EFE3E9]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#21593A]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Signed In</span>
              </div>
              <p className="mt-1.5 font-serif text-xl font-semibold text-[#2A1121]">
                {user.displayName || 'STARLITES Customer'}
              </p>
              <p className="text-xs text-[#7A5B6B]">{user.email}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate({ view: 'orders' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#5A0D3F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7A1554]"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>My Orders</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B4C4] px-4 py-2 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs leading-relaxed text-[#4E2A3E]">
              Sign in with Google to save your delivery address and track all your orders across
              devices—or shop and place orders directly as a guest at checkout.
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#5A0D3F] py-3 px-5 text-xs font-semibold text-white hover:bg-[#7A1554] transition-colors disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              <span>{busy ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate({ view: 'orders' });
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#D4B4C4] bg-white py-2.5 px-5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
            >
              <Package className="h-4 w-4" />
              <span>Track an Existing Order</span>
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#EFE3E9] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#7A5B6B]">
            <ShieldCheck className="h-4 w-4 text-[#C59B48]" />
            <span>{isAdmin ? 'Admin Access Verified' : 'Store Owner Portal'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate({ view: 'admin' });
            }}
            className="text-xs font-semibold text-[#5A0D3F] underline underline-offset-4 hover:text-[#8C1D5E]"
          >
            {isAdmin ? 'Open Admin Dashboard' : 'Owner Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
