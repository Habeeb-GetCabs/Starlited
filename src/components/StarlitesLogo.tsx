import React from 'react';

interface StarlitesLogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
}

export const StarlitesLogo: React.FC<StarlitesLogoProps> = ({
  variant = 'light',
  compact = false,
  className = '',
}) => {
  const isDark = variant === 'dark';
  const primaryText = isDark ? '#FFFFFF' : '#5A0D3F';
  const secondaryText = isDark ? '#F3E3EC' : '#4A1537';
  const taglineText = isDark ? '#D9C0CE' : '#6A2F53';
  const goldStroke = '#C59B48';

  const gradId = isDark ? 'starlites-swoosh-dark' : 'starlites-swoosh-light';
  const goldGradId = isDark ? 'starlites-gold-dark' : 'starlites-gold-light';

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 88 76"
        className={compact ? 'h-9 w-10 shrink-0' : 'h-12 w-14 shrink-0'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="10" y1="64" x2="78" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isDark ? '#D863A5' : '#4E0A38'} />
            <stop offset="48%" stopColor="#B11B6D" />
            <stop offset="100%" stopColor="#DF8A52" />
          </linearGradient>
          <linearGradient id={goldGradId} x1="28" y1="14" x2="62" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F1D07B" />
            <stop offset="100%" stopColor="#B88732" />
          </linearGradient>
        </defs>

        {/* Outer crescent swoosh */}
        <path
          d="M54 9C31 11 13 28 11 49C9.5 64 23 73 41 68C58 63.5 72 48 77 29C69 44 55 55 39 58C24 61 17 53 19 40C21.5 24 36 13 54 9Z"
          fill={`url(#${gradId})`}
        />

        {/* Inner secondary ribbon arc */}
        <path
          d="M65 18C60 35 46 49 28 53C23 54 19 52 17 49C22 57 32 60 44 56C59 51 70 36 74 20C71 19 68 18.5 65 18Z"
          fill={`url(#${goldGradId})`}
          opacity="0.92"
        />

        {/* Main 4-point champagne gold star */}
        <path
          d="M47 16L50.3 26.7L61 30L50.3 33.3L47 44L43.7 33.3L33 30L43.7 26.7L47 16Z"
          fill={`url(#${goldGradId})`}
        />

        {/* Accent smaller sparkles */}
        <path
          d="M32 18L33.5 22.5L38 24L33.5 25.5L32 30L30.5 25.5L26 24L30.5 22.5L32 18Z"
          fill="#E5B95C"
        />
        <path
          d="M64 12L65 15L68 16L65 17L64 20L63 17L60 16L63 15L64 12Z"
          fill="#E5B95C"
        />
      </svg>

      <span className="flex flex-col items-center leading-none">
        <span
          className="font-serif font-semibold tracking-[0.06em] whitespace-nowrap"
          style={{
            color: primaryText,
            fontSize: compact ? '1.15rem' : '1.45rem',
          }}
        >
          STARLITES
        </span>

        <span className="mt-1 flex items-center gap-1.5 w-full justify-center">
          <span className="h-[1px] flex-1 max-w-[18px]" style={{ backgroundColor: goldStroke }} />
          <span
            className="text-[9px] font-semibold tracking-[0.28em] uppercase whitespace-nowrap"
            style={{ color: secondaryText }}
          >
            CLOTHING
          </span>
          <span className="h-[1px] flex-1 max-w-[18px]" style={{ backgroundColor: goldStroke }} />
        </span>

        <span
          className="mt-1 text-[8px] font-medium tracking-[0.22em] uppercase whitespace-nowrap"
          style={{ color: taglineText }}
        >
          TOGETHER WE SHINE
        </span>
      </span>
    </span>
  );
};
