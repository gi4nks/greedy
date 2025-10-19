import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Greedy",
  description: "A simple D&D campaign management system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="corporate" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-base-200">
        <Navigation />
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
