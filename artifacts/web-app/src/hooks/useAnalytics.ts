/**
 * Custom hook for Google Analytics tracking
 * Usage: const analytics = useAnalytics();
 * analytics.trackEvent('button_click', { button_name: 'signup' })
 */

export function useAnalytics() {
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    }
  };

  const trackPageView = (pageTitle?: string, pagePath?: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-4LB0D7F7XJ', {
        page_title: pageTitle,
        page_path: pagePath,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
  };
}
