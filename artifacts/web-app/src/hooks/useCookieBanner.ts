import { useEffect } from "react";

export function useCookieBanner() {
  useEffect(() => {
    // Prevent duplicate initialization on HMR
    if ((window as any).__clyvenCookieBannerInit) return;
    (window as any).__clyvenCookieBannerInit = true;

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.id = "silktide-consent-manager-css";
    css.href = "https://cdn.jsdelivr.net/gh/silktide/consent-manager@v2.0.1/silktide-consent-manager.css";
    css.crossOrigin = "anonymous";
    document.head.appendChild(css);

    const style = document.createElement("style");
    style.id = "silktide-consent-manager-overrides";
    style.textContent = `
      #stcm-wrapper {
        --boxShadow: 0 10px 40px -10px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.08);
        --fontFamily: 'Inter', system-ui, sans-serif;
        --primaryColor: #ffffff;
        --backgroundColor: #111111;
        --textColor: #cccccc;
        --backdropBackgroundColor: rgba(0,0,0,0.5);
        --backdropBackgroundBlur: 4px;
        --iconColor: #000000;
        --iconBackgroundColor: #ffffff;
      }
      #stcm-wrapper .stcm-prompt-wrapper {
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 1rem !important;
      }
      #stcm-wrapper .stcm-button-primary {
        background-color: #ffffff !important;
        color: #000000 !important;
        font-weight: 600 !important;
        border-radius: 0.5rem !important;
      }
      #stcm-wrapper .stcm-button-secondary {
        background-color: rgba(255,255,255,0.05) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 0.5rem !important;
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/silktide/consent-manager@v2.0.1/silktide-consent-manager.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      (window as any).silktideConsentManager.init({
        backdrop: { show: false }, // Avoid modal backdrop on normal pages
        icon: { position: "bottomRight" },
        prompt: { position: "bottomRight" },
        consentTypes: [
          {
            id: "essential",
            label: "Essential",
            description: "<p>These cookies are necessary for the website to function properly and cannot be switched off.</p>",
            required: true,
          },
          {
            id: "analytics",
            label: "Analytics",
            description: "<p>These cookies help us improve the website by tracking which pages are most popular.</p>",
            defaultValue: true,
          },
          {
            id: "marketing",
            label: "Marketing",
            description: "<p>These cookies are used to show you relevant advertising and measure campaigns.</p>",
          },
        ],
        text: {
          prompt: {
            description: "<p>We use cookies to enhance your experience, deliver personalized content, and analyze our traffic.</p>",
            acceptAllButtonText: "Accept all",
            acceptAllButtonAccessibleLabel: "Accept all cookies",
            rejectNonEssentialButtonText: "Reject non-essential",
            rejectNonEssentialButtonAccessibleLabel: "Reject all non-essential cookies",
            preferencesButtonText: "Preferences",
            preferencesButtonAccessibleLabel: "Open preferences",
          },
          preferences: {
            title: "Cookie Preferences",
            description: "<p>We respect your right to privacy. You can choose which cookies you allow.</p>",
            saveButtonText: "Save and close",
            saveButtonAccessibleLabel: "Save preferences",
          },
        },
      });
    };
    document.body.appendChild(script);

    return () => {
      css.remove();
      style.remove();
      script.remove();
    };
  }, []);
}
