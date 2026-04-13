import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import OfflineBanner from "@/components/OfflineBanner";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUST Academic Operations Tracker",
  description: "Task tracking system for Academic Directorate and Development Teams",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#003366",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistrar />
        <OfflineBanner />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
