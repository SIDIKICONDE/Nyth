import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Nythweb - Tutoriels et Documentation",
  description: "Découvrez comment utiliser Nythweb grâce à nos tutoriels détaillés, guides pratiques et documentation complète.",
  keywords: "Nythweb, tutoriels, documentation, guides, apprentissage, application",
  authors: [{ name: "Nythweb Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Nythweb - Tutoriels et Documentation",
    description: "Découvrez comment utiliser Nythweb grâce à nos tutoriels détaillés",
    url: "https://nythweb.com",
    siteName: "Nythweb",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nythweb - Plateforme de tutoriels",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nythweb - Tutoriels et Documentation",
    description: "Découvrez comment utiliser Nythweb grâce à nos tutoriels détaillés",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={`${inter.className} antialiased custom-scrollbar`}>
        {children}
      </body>
    </html>
  )
}