'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // You can send metrics to your analytics service here
    // For now, we'll just log them to the console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric)
    }
    
    // Example: Send to Google Analytics
    // window.gtag('event', metric.name, {
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   event_label: metric.id,
    //   non_interaction: true,
    // })
  })

  return null
}