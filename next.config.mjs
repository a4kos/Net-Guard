/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "out",
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  },
  // Disable features that don't work with static export
  trailingSlash: true
};

export default nextConfig;
