import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScaleable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "HubIdeas",
  description: "Keep your ideas and todos in flow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HubIdeas",
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body
        className="antialiased"
        data-env={process.env.NEXT_PUBLIC_IS_STAGING === 'true' ? 'staging' : undefined}
      >
        <ServiceWorkerProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <main className="min-h-screen">
                {children}
              </main>
            </ThemeProvider>
          </AuthProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
