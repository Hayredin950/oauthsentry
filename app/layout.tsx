import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ScanProvider } from '@/lib/scan-context'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'OAuthSentry — Find AI tools that breach you first',
  description:
    'Production-ready security agent that continuously scans OAuth apps, third-party AI integrations, and npm dependencies against live threat feeds. Automatically files Linear tickets and posts Slack alerts for critical findings. Built with Next.js 16, AI SDK 6, Workflow SDK, and Chat SDK.',
  generator: 'v0.app',
  keywords: ['OAuth security', 'AI risk scanner', 'supply chain security', 'threat intelligence', 'Linear integration', 'Slack alerts', 'CVE monitoring'],
  authors: [{ name: 'OAuthSentry Team' }],
  openGraph: {
    title: 'OAuthSentry — Find AI tools that breach you first',
    description: 'Production-ready security agent that scans OAuth apps against live threat feeds. Files Linear tickets and Slack alerts automatically.',
    type: 'website',
    locale: 'en_US',
    siteName: 'OAuthSentry',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OAuthSentry — Find AI tools that breach you first',
    description: 'Security agent that scans OAuth apps against live threat feeds. Auto-files Linear tickets and Slack alerts.',
  },
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

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ScanProvider>
              <SiteHeader />
              {children}
            </ScanProvider>
          </TooltipProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
