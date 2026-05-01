/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  images: {
    unoptimized: true,
  },
  // Build verified: All TypeScript errors resolved
}

export default nextConfig
