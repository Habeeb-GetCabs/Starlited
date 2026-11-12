import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { resolveAssetUrl } from '../data/assets';
import { getImageObjectUrl } from '../services/imageStorageService';
import type { ProductImageRef } from '../types/store';

interface ResolvedImageProps {
  image?: ProductImageRef | null;
  assetKey?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ResolvedImage: React.FC<ResolvedImageProps> = ({
  image,
  assetKey,
  alt,
  className = 'h-full w-full object-cover',
  loading = 'lazy',
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (assetKey) return resolveAssetUrl(assetKey);
    if (!image) return null;
    if (image.source === 'asset') return resolveAssetUrl(image.assetKey);
    if (image.source === 'url') return image.url ?? null;
    return null;
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);

    if (assetKey) {
      setResolvedSrc(resolveAssetUrl(assetKey));
      return;
    }

    if (!image) {
      setResolvedSrc(null);
      return;
    }

    if (image.source === 'asset') {
      setResolvedSrc(resolveAssetUrl(image.assetKey));
      return;
    }

    if (image.source === 'url') {
      setResolvedSrc(image.url ?? null);
      return;
    }

    if (image.source === 'indexeddb') {
      getImageObjectUrl(image.id).then((url) => {
        if (active) {
          setResolvedSrc(url);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [image, assetKey]);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#F8EEF2] via-[#FDFBF9] to-[#F3E5EC] p-4 text-center text-[#5A0D3F]"
        role="img"
        aria-label={alt}
      >
        <Sparkles className="mb-2 h-6 w-6 text-[#C59B48]" />
        <span className="font-serif text-xs font-medium leading-snug text-[#5A0D3F]/80 line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
