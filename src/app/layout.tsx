import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalo Farm System",
  description: "Farm management system for Kalo Farms — livestock, inventory, accounting, plantings, market and climate.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    // Lets the app run full-screen (no browser chrome) once added to an
    // iPhone's home screen — Android's install behavior is driven by
    // manifest.ts above.
    capable: true,
    title: "Kalo Farms",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#3a8a3f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[--color-app-bg] text-[--color-app-text]">
        {children}
      </body>
    </html>
  );
}
