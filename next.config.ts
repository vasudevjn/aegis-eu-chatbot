import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // default image host (Cloudinary); add your own host here
      },
    ],
  },
  // One deployment, two experiences: the static presentation site (public/presentation)
  // is served at "/", and the chatbot lives at "/chat" (app/chat/page.tsx).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/presentation/index.html" }],
    };
  },
};

export default nextConfig;
