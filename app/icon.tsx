import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/lib/brandIcon';

// Used for the browser tab, Android home screen and the install prompt.
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  // Full-bleed square so Android's maskable crop never shows a transparent corner.
  return new ImageResponse(<BrandIcon size={512} radius={0} />, size);
}
