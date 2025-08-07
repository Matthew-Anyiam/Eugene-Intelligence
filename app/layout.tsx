import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Eugene Intelligence",
    template: "%s | Eugene Intelligence",
  },
  description: "AI-powered search engine and intelligence platform",
  keywords: ["AI", "search", "intelligence", "research", "academic", "web search"],
  authors: [{ name: "Eugene Intelligence Team" }],
  creator: "Eugene Intelligence",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "Eugene Intelligence",
    description: "AI-powered search engine and intelligence platform",
    siteName: "Eugene Intelligence",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eugene Intelligence",
    description: "AI-powered search engine and intelligence platform",
    creator: "@eugene_intelligence",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}