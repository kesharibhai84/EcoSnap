import React, { useEffect, useRef } from 'react';

const CloudflareTurnstile = ({ onVerify }) => {
  const turnstileRef = useRef(null);

  useEffect(() => {
    // Load the Cloudflare Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.body.appendChild(script);

    // Define the callback function globally
    window.onTurnstileCallback = (token) => {
      if (onVerify) {
        onVerify(token);
      }
    };

    return () => {
      document.body.removeChild(script);
      delete window.onTurnstileCallback;
    };
  }, [onVerify]);

  return (
    <div
      ref={turnstileRef}
      className="cf-turnstile"
      data-sitekey="0x4AAAAAABD7WDeFVIS9xjsn"
      data-callback="onTurnstileCallback"
      data-theme="light"
      style={{ margin: '20px 0' }}
    />
  );
};

export default CloudflareTurnstile; 