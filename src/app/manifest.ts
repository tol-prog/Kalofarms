import type { MetadataRoute } from "next";

// Makes the app installable on a phone's home screen (Add to Home Screen /
// "Install app" — this is what Android's Chrome install prompt reads).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalo Farm System",
    short_name: "Kalo Farms",
    description: "Farm management system for Kalo Farms — livestock, inventory, accounting, plantings, market and climate.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f4",
    theme_color: "#3a8a3f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
