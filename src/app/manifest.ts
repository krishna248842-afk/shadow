import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shadow — AI Social Commerce',
    short_name: 'Shadow',
    description: 'The AI operating system for your Meesho reselling business: ads to sales to payouts, on autopilot.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B12',
    theme_color: '#0B0B12',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
