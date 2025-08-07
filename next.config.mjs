/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only allow localhost for development (internal uploads are served from same domain)
    domains: ['localhost'],
    // Default Next.js image optimization for internal uploads
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
