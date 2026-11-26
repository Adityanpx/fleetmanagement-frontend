import type { MetadataRoute } from 'next';

/** Lets owners "Add to Home Screen" and open Patil Logistics full-screen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Patil Logistics — Fleet Manager',
    short_name: 'Patil Logistics',
    description: 'Trips, diesel, expenses and payments for the Patil Logistics fleet.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafafa',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
