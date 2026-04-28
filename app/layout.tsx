import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BridgeAI — Crack Placements From Any College",
  description: "Real questions. Live AI feedback. Daily GD battles. One score that proves you're ready.",
  openGraph: {
    title: "BridgeAI — Crack Placements From Any College",
    description: "Real questions. Live AI feedback. Daily GD battles. One score that proves you're ready.",
    type: "website",
    url: "https://bridge-app.vercel.app",
    images: [
      {
        url: "https://bridge-app.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "BRIDGE - AI Placement Prep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BRIDGE - AI Placement Prep",
    description: "India's smartest placement prep platform",
    images: ["https://bridge-app.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/images/logo_favicon_512.png",
    apple: "/images/logo_favicon_512.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/logo_favicon_512.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/logo_favicon_512.png" />
        <link rel="icon" href="/images/logo_favicon_512.png" />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-900 transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {/* Auth bypass test badge */}
        {process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && (
          <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white text-xs px-3 py-2 rounded-full font-bold shadow-lg animate-pulse">
            🔓 AUTH BYPASSED - TESTING MODE
          </div>
        )}
      </body>
    </html>
  );
}
