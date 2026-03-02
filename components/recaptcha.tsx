'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

export function ReCaptcha({ onVerify, onExpire, theme = 'light', size = 'normal' }: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    if (!siteKey) {
      console.error('NEXT_PUBLIC_RECAPTCHA_SITE_KEY not configured');
      return;
    }

    // Script zaten yüklü mü kontrol et
    const existingScript = document.querySelector('script[src*="recaptcha"]');
    
    const renderCaptcha = () => {
      if (containerRef.current && window.grecaptcha && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'expired-callback': () => {
              onExpire?.();
            },
            theme,
            size,
          });
          setIsLoaded(true);
        } catch (error) {
          // Widget zaten render edilmiş olabilir
          console.log('reCAPTCHA already rendered');
        }
      }
    };

    if (existingScript && window.grecaptcha) {
      window.grecaptcha.ready(renderCaptcha);
    } else if (!existingScript) {
      window.onRecaptchaLoad = () => {
        window.grecaptcha.ready(renderCaptcha);
      };

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup
      widgetIdRef.current = null;
    };
  }, [onVerify, onExpire, theme, size]);

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} />
      {!isLoaded && (
        <div className="h-[78px] w-[304px] bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <span className="text-sm text-gray-500">reCAPTCHA yükleniyor...</span>
        </div>
      )}
    </div>
  );
}
