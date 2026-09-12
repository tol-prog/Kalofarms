import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalo Farm System",
  description: "Farm management system for Kalo Farms — livestock, inventory, accounting, plantings, market and climate.",
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
