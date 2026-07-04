import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ferguson SOT — Mission Control",
  description:
    "Single Source of Truth dashboard for Ferguson Education & Migration",
  icons: { icon: "/ferguson-logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProviders>
      <html
        lang="en"
        className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-background text-foreground">
          {children}
        </body>
      </html>
    </AppProviders>
  );
}
