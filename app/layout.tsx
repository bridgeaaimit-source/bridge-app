import type { Metadata } from "next";
import { Syne, DM_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import FramerMotionProvider from "@/components/FramerMotionProvider";
import ClientSupportWidget from "@/components/ClientSupportWidget";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BridgeAI — India's AI Placement Readiness & Campus Hiring Platform",
  description: "Simulate real mock interviews, participate in daily group discussions, ATS-optimize resumes, and monitor placement metrics with BridgeAI.",
  openGraph: {
    title: "BridgeAI — India's AI Placement Readiness & Campus Hiring Platform",
    description: "Simulate real mock interviews, participate in daily group discussions, ATS-optimize resumes, and monitor placement metrics with BridgeAI.",
    type: "website",
    url: "https://bridge-app.vercel.app",
    images: [
      {
        url: "https://bridge-app.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "BridgeAI Placement Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BridgeAI Placement Platform",
    description: "India's primary AI placement readiness & campus hiring platform",
    images: ["https://bridge-app.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/images/logo_favicon_512.png",
    apple: "/images/logo_favicon_512.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/logo_favicon_512.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/logo_favicon_512.png" />
        <link rel="icon" href="/images/logo_favicon_512.png" />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-900 transition-colors" suppressHydrationWarning>
        <ThemeProvider>
          <FramerMotionProvider>
            {children}
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
          </FramerMotionProvider>
        </ThemeProvider>
        <ClientSupportWidget />

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
