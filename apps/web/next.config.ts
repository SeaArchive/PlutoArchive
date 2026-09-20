import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ytpoqdhujdhfwijevsuz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
export default config;
