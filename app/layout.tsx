import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLAMMES HOTSPOT",
  description: "Wi-Fi Hotspot Management Platform by FLAMMES TECH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
