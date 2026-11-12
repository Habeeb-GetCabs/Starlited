import React from 'react';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { CATEGORIES } from '../services/catalogLogic';
import type { AppRoute } from '../types/store';
import { StarlitesLogo } from './StarlitesLogo';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#34082C] text-[#F4E6EE]">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1 flex flex-col items-start">
            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="text-left focus-visible:outline-2 focus-visible:outline-[#C59B48] rounded-lg"
              aria-label="STARLITES CLOTHING Home"
            >
              <StarlitesLogo variant="dark" />
            </button>
            <p className="mt-4 text-xs leading-relaxed text-[#D8C1CE]">
              Fashion for every version of you. Thoughtfully designed everyday ethnic, lounge,
              maternity, and occasion styles from Tiruchirappalli.
            </p>
            <p className="mt-3 text-xs text-[#E8C97E]">
              Managing Director: Nandhini Devi
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-white mb-4">
              Shop
            </h3>
            <ul className="space-y-2 text-xs text-[#DFC8D5]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'shop', category: 'all', collection: 'new' })}
                  className="hover:text-white transition-colors text-left"
                >
                  New Arrivals
                </button>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => onNavigate({ view: 'shop', category: cat.slug })}
                    className="hover:text-white transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-white mb-4">
              Help
            </h3>
            <ul className="space-y-2.5 text-xs text-[#DFC8D5]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'orders' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'faq' })}
                  className="hover:text-white transition-colors text-left"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'returns' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Returns &amp; Refunds
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'shipping' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'size-guide' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Size Guide
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'care' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Care Instructions
                </button>
              </li>
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-white mb-4">
              About
            </h3>
            <ul className="space-y-2.5 text-xs text-[#DFC8D5]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'story' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Our Story
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'privacy' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'terms' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'info', page: 'contact' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Get In Touch */}
          <div>
            <h3 className="font-sans text-sm font-semibold tracking-wide text-white mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-3 text-xs text-[#DFC8D5]">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#E8C97E] mt-0.5" />
                <a href="tel:+918807732182" className="hover:text-white tabular-nums">
                  +91 8807732182
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#E8C97E] mt-0.5" />
                <a href="mailto:starlitesclothing@gmail.com" className="hover:text-white break-all">
                  starlitesclothing@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#E8C97E] mt-0.5" />
                <span>E-Pudur, Tiruchirappalli, Tamil Nadu, India</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Instagram className="h-4 w-4 shrink-0 text-[#E8C97E] mt-0.5" />
                <span>@Starlites_offical</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#280521]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D5BBC9]">
          <p>
            © 2026 STARLITES CLOTHING. All Rights Reserved. | Together We Shine
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'admin' })}
            className="text-[11px] text-[#C8A8BA] underline underline-offset-4 hover:text-white transition-colors"
          >
            Store Owner Portal
          </button>
        </div>
      </div>
    </footer>
  );
};
