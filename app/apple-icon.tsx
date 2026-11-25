import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/lib/brandIcon';

// iOS "Add to Home Screen" icon (iOS rounds the corners itself).
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<BrandIcon size={180} radius={0} />, size);
}
