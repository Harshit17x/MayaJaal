import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MayaJaal — Border Video Analytics",
  description: "Intelligent Border Video Analytics Platform • Real-time surveillance for a secure tomorrow",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo/apple-touch-icon.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
