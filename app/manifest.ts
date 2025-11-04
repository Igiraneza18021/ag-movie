import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agasobanuye Movies - Stream Movies & TV Shows',
    short_name: 'Agasobanuye Movies',
    description: 'Your ultimate destination for streaming movies and TV shows',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/image.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/image.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['entertainment', 'video', 'movies', 'tv'],
    lang: 'en',
    orientation: 'portrait',
  }
}
