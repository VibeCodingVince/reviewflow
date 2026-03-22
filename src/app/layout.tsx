import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "RankClerk — AI-Powered GBP Management",
  description:
    "Your AI clerk manages your Google Business Profile 24/7. Automated review replies, fake review detection, performance monitoring, and weekly optimization.",
  openGraph: {
    title: "RankClerk — AI-Powered GBP Management",
    description:
      "Your AI clerk manages your Google Business Profile 24/7. Automated review replies, fake review detection, performance monitoring, and weekly optimization.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
