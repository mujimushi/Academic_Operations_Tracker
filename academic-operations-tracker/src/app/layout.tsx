import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUST Academic Operations Tracker",
  description: "Task tracking system for Academic Directorate and Development Teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
