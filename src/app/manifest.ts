import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trạm Êm',
    short_name: 'Trạm Êm',
    description: 'Nơi cảm xúc được lắng nghe, thấu hiểu và chữa lành mỗi ngày',
    start_url: '/',
    display: 'standalone',
    background_color: '#130b1e',
    theme_color: '#8b6aad',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
