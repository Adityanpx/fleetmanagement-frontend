import type { MetadataRoute } from 'next';

/** Lets owners "Add to Home Screen" and open BulkerTrack full-screen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BulkerTrack — Fleet Manager',
    short_name: 'BulkerTrack',
    description: 'Trips, diesel, expenses and payments for your bulker fleet.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafafa',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
