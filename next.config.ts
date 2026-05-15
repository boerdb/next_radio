import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    skipWaiting: false,
    clientsClaim: true,
    importScripts: ["/pwa-sw-extras.js"],
    runtimeCaching: [
      {
        // Override default API cache so metadata endpoints always hit network.
        // Keeping cacheName "apis" makes this rule replace the built-in API rule.
        urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) => {
          if (!sameOrigin || !url.pathname.startsWith("/api/")) return false;
          if (url.pathname.startsWith("/api/auth/callback")) return false;
          return true;
        },
        handler: "NetworkOnly",
        method: "GET",
        options: {
          cacheName: "apis",
        },
      },
    ],
  },
  extendDefaultRuntimeCaching: true,
});

const nextConfig: NextConfig = {
  // HMR / dev assets when testing on phone via LAN IP (e.g. http://192.168.1.120:3000)
  allowedDevOrigins: ["192.168.1.120", "192.168.*"],
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "benswebradio.nl" },
      { protocol: "https", hostname: "stream.benswebradio.nl" },
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is2-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is3-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is4-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is5-ssl.mzstatic.com" },
      { protocol: "https", hostname: "coverartarchive.org" },
      { protocol: "https", hostname: "images.coverartarchive.org" },
      { protocol: "https", hostname: "openweathermap.org" },
    ],
  },
};

export default withPWA(nextConfig);
