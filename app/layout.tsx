import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/Providers";

const siteTitle = "LinkHive";
const siteDescription = "Build and share beautiful link pages with LinkHive.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  metadataBase:
    typeof process !== "undefined"
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
      : undefined,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteTitle} – Open Graph Image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
