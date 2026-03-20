import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { FloatingBookButton } from "@/components/layout/floating-book-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const display = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400"
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lubbocklawnpros.com"),
  title: {
    default: "Lubbock Lawn Pros | Same-Day Mowing & Expert Treatments in Lubbock",
    template: "%s | Lubbock Lawn Pros"
  },
  description:
    "Production-ready lawn care website for Lubbock, Texas. Same-day mowing, fertilization, weed control, aeration, bundles, and subscriptions from Billy & Josh.",
  keywords: [
    "Lubbock lawn care",
    "Lubbock lawn mowing",
    "Lubbock lawn treatments",
    "same-day mowing Lubbock",
    "Billy and Josh lawn care",
    "West Texas lawn service"
  ],
  openGraph: {
    title: "Lubbock Lawn Pros",
    description:
      "Same-Day Mowing & Expert Treatments in Lubbock — Book in 60 Seconds.",
    type: "website",
    locale: "en_US",
    url: "https://lubbocklawnpros.com",
    siteName: "Lubbock Lawn Pros",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lubbock Lawn Pros"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Lubbock Lawn Pros",
    description:
      "Same-Day Mowing & Expert Treatments in Lubbock — Book in 60 Seconds.",
    images: ["/opengraph-image"]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-sans`}>
        <div className="min-h-screen">
          <SiteHeader
            user={
              session?.user
                ? {
                    name: session.user.name,
                    username: session.user.username
                  }
                : null
            }
          />
          <main>{children}</main>
          <SiteFooter />
          <FloatingBookButton />
        </div>
      </body>
    </html>
  );
}
