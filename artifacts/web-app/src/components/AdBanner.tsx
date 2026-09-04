import { useEffect, useRef } from "react";
import { usePremium } from "../hooks/usePremium";

interface AdBannerProps {
  slot?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

export function AdBanner({ slot, format = "auto", responsive = true, className = "" }: AdBannerProps) {
  const { isPremium } = usePremium();
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only load script and push ads for non-premium (free) users
    if (isPremium) return;

    // Check if script is already present
    const scriptId = "google-adsense-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7082208582343630";
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Try pushing ad once component mounted
    if (!pushedRef.current && adRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    }
  }, [isPremium]);

  if (isPremium) {
    return null;
  }

  return (
    <div className={`w-full overflow-hidden bg-black/40 border border-white/10 rounded-xl p-2.5 my-2.5 text-center ${className}`}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5 flex items-center justify-between px-1">
        <span>Werbung</span>
        <span className="text-[9px] text-zinc-600">CLYVEN Free</span>
      </div>
      <div className="min-h-[90px] w-full flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", minWidth: "250px" }}
          data-ad-client="ca-pub-7082208582343630"
          {...(slot ? { "data-ad-slot": slot } : {})}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
