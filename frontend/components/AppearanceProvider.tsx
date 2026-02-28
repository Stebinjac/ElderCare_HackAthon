'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type TextSize = 'small' | 'default' | 'large';

interface AppearanceContextType {
    highContrast: boolean;
    setHighContrast: (value: boolean) => void;
    textSize: TextSize;
    setTextSize: (value: TextSize) => void;
    isMounted: boolean;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const [highContrast, setHighContrast] = useState(false);
    const [textSize, setTextSize] = useState<TextSize>('default');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Load preferences from localStorage on mount
        const savedHighContrast = localStorage.getItem('preference-high-contrast') === 'true';
        const savedTextSize = (localStorage.getItem('preference-text-size') as TextSize) || 'default';

        setHighContrast(savedHighContrast);
        setTextSize(savedTextSize);
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Persist to localStorage
        localStorage.setItem('preference-high-contrast', String(highContrast));
        localStorage.setItem('preference-text-size', textSize);

        // Apply high contrast class
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }

        // Apply text size modifier
        let fontSize = '16px'; // default equivalent to 1rem
        if (textSize === 'small') {
            fontSize = '14px';
        } else if (textSize === 'large') {
            fontSize = '20px';
        }
        document.documentElement.style.fontSize = fontSize;
    }, [highContrast, textSize, isMounted]);

    return (
        <AppearanceContext.Provider value={{ highContrast, setHighContrast, textSize, setTextSize, isMounted }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
}
