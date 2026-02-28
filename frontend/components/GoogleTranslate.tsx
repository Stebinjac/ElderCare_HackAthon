'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export function GoogleTranslate() {
    useEffect(() => {
        // We add a global function that Google's script will call when it loads
        // We append the options to configure which languages are available
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,ml,hi,ta,te,mr,ur', // English, Malayalam, Hindi, Tamil, Telugu, Marathi, Urdu
                    autoDisplay: false,
                },
                'google_translate_element'
            );
        };
    }, []);

    return (
        <>
            <div id="google_translate_element" className="hidden"></div>
            <Script
                src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                strategy="afterInteractive"
            />
        </>
    );
}

// Add TypeScript declarations for the global window objects Google uses
declare global {
    interface Window {
        googleTranslateElementInit: () => void;
        google: any;
    }
}
