import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "ReviewFlow — AI-Powered Google Review Responses",
  description:
    "Never miss a Google review again. AI-generated, brand-voice replies posted automatically.",
  openGraph: {
    title: "ReviewFlow — AI-Powered Google Review Responses",
    description:
      "Never miss a Google review again. AI-generated, brand-voice replies posted automatically.",
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
