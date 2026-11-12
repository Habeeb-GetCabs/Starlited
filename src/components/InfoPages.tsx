import React from 'react';
import { ArrowLeft, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import type { AppRoute } from '../types/store';
import { ResolvedImage } from './ResolvedImage';
import { StarlitesLogo } from './StarlitesLogo';

interface InfoPagesProps {
  page:
    | 'story'
    | 'size-guide'
    | 'care'
    | 'shipping'
    | 'returns'
    | 'privacy'
    | 'terms'
    | 'faq'
    | 'contact';
  onNavigate: (route: AppRoute) => void;
}

const SIZE_CHART_ROWS = [
  { size: 'XS', bust: '32"', waist: '26"', hip: '35"' },
  { size: 'S', bust: '34"', waist: '28"', hip: '37"' },
  { size: 'M', bust: '36"', waist: '30"', hip: '39"' },
  { size: 'L', bust: '38"', waist: '32"', hip: '41"' },
  { size: 'XL', bust: '40"', waist: '34"', hip: '43"' },
  { size: 'XXL', bust: '42"', waist: '36"', hip: '45"' },
];

export const InfoPages: React.FC<InfoPagesProps> = ({ page, onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <button
        type="button"
        onClick={() => onNavigate({ view: 'home' })}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A0D3F] hover:underline mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Home</span>
      </button>

      {page === 'story' && (
        <div className="rounded-3xl bg-white p-7 sm:p-10 border border-[#EFE3E9] space-y-6">
          <StarlitesLogo variant="light" />
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#5A0D3F]">
            Our Story — Together We Shine
          </h1>
          <div className="aspect-[16/9] overflow-hidden rounded-2xl">
            <ResolvedImage
              assetKey="prod_story_rack"
              alt="STARLITES CLOTHING studio rack"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#3D162D]">
            Guided by Managing Director <strong>Nandhini Devi</strong> in E-Pudur, Tiruchirappalli,
            STARLITES CLOTHING was born from a simple promise: <em>Fashion for every version of
            you.</em> Whether you are stepping into college, working through a busy weekday, resting
            at home, or celebrating motherhood, you deserve clothing that breathes with Indian
            weather and flatters naturally.
          </p>
          <p className="text-sm sm:text-base leading-relaxed text-[#3D162D]">
            Our curated catalog spans nine essentials—from soft everyday innerwear and teen-friendly
            tops (14+) to coordinated two-piece and three-piece sets, pure-cotton nighties, cozy
            pajamas, nursing-friendly maternity wear, flared umbrella long tops, and tiered maxi
            dresses.
          </p>
        </div>
      )}

      {page === 'size-guide' && (
        <div className="rounded-3xl bg-white p-7 sm:p-10 border border-[#EFE3E9] space-y-6">
          <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
            STARLITES Size Guide
          </h1>
          <p className="text-sm text-[#4E2A3E]">
            All measurements are body measurements in inches. If you are between sizes, we recommend
            sizing up for relaxed everyday cotton fits.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse tabular-nums">
              <thead>
                <tr className="border-b border-[#EFE3E9] bg-[#FAF3F6] text-[#5A0D3F]">
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold">Bust</th>
                  <th className="py-3 px-4 font-semibold">Waist</th>
                  <th className="py-3 px-4 font-semibold">Hip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EAEF]">
                {SIZE_CHART_ROWS.map((row) => (
                  <tr key={row.size}>
                    <td className="py-3 px-4 font-semibold text-[#5A0D3F]">{row.size}</td>
                    <td className="py-3 px-4">{row.bust}</td>
                    <td className="py-3 px-4">{row.waist}</td>
                    <td className="py-3 px-4">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {page === 'care' && (
        <div className="rounded-3xl bg-white p-7 sm:p-10 border border-[#EFE3E9] space-y-4">
          <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
            Fabric &amp; Care Instructions
          </h1>
          <ul className="list-disc pl-5 space-y-2.5 text-sm text-[#3D162D]">
            <li>Wash 100% cotton and hand-block printed garments separately in cold water with mild detergent.</li>
            <li>Dry dark plum, maroon, and indigo shades inside out in gentle shade to preserve rich tones.</li>
            <li>Use low-heat steam ironing for embroidered three-piece sets and organza dupattas.</li>
            <li>For seamless innerwear and maternity ribs, use a delicate laundry bag and avoid harsh bleach.</li>
          </ul>
        </div>
      )}

      {(page === 'shipping' || page === 'returns' || page === 'faq' || page === 'privacy' || page === 'terms') && (
        <div className="rounded-3xl bg-white p-7 sm:p-10 border border-[#EFE3E9] space-y-4">
          <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
            {page === 'shipping' && 'Shipping Policy'}
            {page === 'returns' && 'Returns & Refunds'}
            {page === 'faq' && 'Frequently Asked Questions'}
            {page === 'privacy' && 'Privacy Policy'}
            {page === 'terms' && 'Terms & Conditions'}
          </h1>
          <div className="space-y-3 text-sm leading-relaxed text-[#3D162D]">
            {page === 'shipping' && (
              <>
                <p>Orders above ₹999 qualify for complimentary shipping across India. Orders under ₹999 carry a flat ₹79 standard shipping fee.</p>
                <p>Dispatches are prepared from our studio in E-Pudur, Tiruchirappalli within 24–48 business hours.</p>
              </>
            )}
            {page === 'returns' && (
              <>
                <p>We offer a 7-day hassle-free size exchange or return on unworn garments with original tags intact (excluding innerwear for hygiene reasons).</p>
                <p>Reach us on +91 8807732182 or email starlitesclothing@gmail.com to initiate an exchange.</p>
              </>
            )}
            {page === 'faq' && (
              <>
                <p><strong>What sizes do you carry?</strong> Most tops, sets, nightwear, and dresses range from XS / S up to XXL, plus Free Size options.</p>
                <p><strong>How do I inquire about bulk or boutique orders?</strong> Call or WhatsApp our Tiruchirappalli studio directly at 8807732182.</p>
              </>
            )}
            {page === 'privacy' && (
              <p>In this frontend storefront preview, cart, wishlist, and catalog drafts are stored locally in your browser (localStorage and IndexedDB) and are never transmitted to external servers.</p>
            )}
            {page === 'terms' && (
              <p>All product descriptions, prices in INR (₹), and promotional previews displayed on this STARLITES CLOTHING storefront are subject to stock availability.</p>
            )}
          </div>
        </div>
      )}

      {page === 'contact' && (
        <div className="rounded-3xl bg-white p-7 sm:p-10 border border-[#EFE3E9] space-y-6">
          <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
            Contact STARLITES CLOTHING
          </h1>
          <p className="text-sm text-[#4E2A3E]">
            Managing Director: <strong>Nandhini Devi</strong> · Together We Shine
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-[#FAF3F6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#5A0D3F]">
                <Phone className="h-4 w-4" />
                <span>Phone &amp; WhatsApp</span>
              </div>
              <p className="tabular-nums text-[#2A1121]">+91 8807732182</p>
            </div>
            <div className="rounded-2xl bg-[#FAF3F6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#5A0D3F]">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p className="text-[#2A1121]">starlitesclothing@gmail.com</p>
            </div>
            <div className="rounded-2xl bg-[#FAF3F6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#5A0D3F]">
                <MapPin className="h-4 w-4" />
                <span>Studio Address</span>
              </div>
              <p className="text-[#2A1121]">E-Pudur, Tiruchirappalli, Tamil Nadu, India</p>
            </div>
            <div className="rounded-2xl bg-[#FAF3F6] p-5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#5A0D3F]">
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </div>
              <p className="text-[#2A1121]">@Starlites_offical</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
