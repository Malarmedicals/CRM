import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import LayoutWrapper from '@/components/layout/layout-wrapper'
import { ConditionalAnalytics } from '@/components/analytics'
import { Toaster } from "@/components/ui/toaster"

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Admin CRM | Medicine Management',
  description: 'Comprehensive CRM for pharmacy and medicine management',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ThemeProvider>
        <ConditionalAnalytics />
        <Toaster />
      </body>
    </html>
  )
}
