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
      {
        // Never cache radio streams (long-lived ICY connections break with SW caches).
        urlPattern: ({ url }: { url: URL }) => {
          const host = url.hostname;
          if (host === "stream.benswebradio.nl") return true;
          if (host === "192.168.1.81") return true;
          if (host === "192.168.1.232") return true;
          if (host === "benswebradio.nl" && url.pathname.startsWith("/listen/")) return true;
          if (host === "icecast.omroep.nl") return true;
          if (host.endsWith("181fm.com") || host.includes("cdnstream1.com")) return true;
          if (host.includes("streamtheworld.com")) return true;
          if (host === "stream.sublime.nl") return true;
          return false;
        },
        handler: "NetworkOnly",
        method: "GET",
        options: {
          cacheName: "radio-streams",
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
      { protocol: "https", hostname: "cdn-metadata.mediahuisradio.nl" },
    ],
  },
};

export default withPWA(nextConfig);
