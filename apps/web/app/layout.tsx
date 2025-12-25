import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyLuxuryNetwork - Luxury Marketplace",
  description: "Buy and sell luxury goods - Watches, Jewelry, Vehicles & More",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
