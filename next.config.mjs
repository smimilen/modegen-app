/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  // Serve landing HTML files from public/ at their paths
  async rewrites() {
    return [
      { source: '/',              destination: '/index.html' },
      { source: '/portfolio',     destination: '/portfolio.html' },
      { source: '/models',        destination: '/models.html' },
    ]
  },
}
export default nextConfig
