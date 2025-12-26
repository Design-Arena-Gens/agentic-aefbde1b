/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    serverComponentsExternalPackages: [
      "@napi-rs/canvas",
      "fluent-ffmpeg",
      "@ffmpeg-installer/ffmpeg",
    ],
  },
};

export default nextConfig;
