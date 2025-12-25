import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyLuxury Network | Premium Luxury Store",
  description: "Discover premium luxury products from verified resellers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-luxury-black">
        {children}
      </body>
    </html>
  );
}
