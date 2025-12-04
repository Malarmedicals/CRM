import { Analytics } from '@vercel/analytics/next'

export function ConditionalAnalytics() {
  // Only load analytics in production
  // The Analytics component from @vercel/analytics/next is designed to
  // gracefully handle cases where the script isn't available
  // (e.g., local development, non-Vercel deployments)
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return <Analytics />
}

