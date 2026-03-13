import type { Metadata } from 'next'
// 1. Import Poppins from Google Fonts
import { Poppins, Space_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'
import './globals.css'

// 2. Configure Poppins
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"], 
  variable: "--font-poppins" 
})

// Keeping Space Mono for technical data/risk scores
const spaceMono = Space_Mono({ 
  weight: ["400", "700"], 
  subsets: ["latin"], 
  variable: "--font-space-mono" 
})

export const metadata: Metadata = {
  title: 'Lift Ed Temporal - Student Dropout Prediction',
  description: 'Expert system for predicting and preventing student dropout in Malawian primary schools using machine learning.',
  // Removed generator: 'v0.app' to clear branding
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font variables here */}
      <body className={`${poppins.variable} ${spaceMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}