/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    // GLB uploads (photo-to-3D scans) go through server actions
    serverActions: { bodySizeLimit: "64mb" },
  },
};
export default nextConfig;
