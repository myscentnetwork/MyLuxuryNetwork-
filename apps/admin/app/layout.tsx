import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/src/components/common/Toast";

export const metadata: Metadata = {
  title: "MyLuxuryNetwork Admin",
  description: "Admin Panel for MyLuxuryNetwork Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
