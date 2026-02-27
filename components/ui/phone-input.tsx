"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const COUNTRIES = [
    { code: "+1", label: "US (+1)", flag: "🇺🇸" },
    { code: "+44", label: "UK (+44)", flag: "🇬🇧" },
    { code: "+91", label: "IN (+91)", flag: "🇮🇳" },
    { code: "+61", label: "AU (+61)", flag: "🇦🇺" },
    { code: "+971", label: "AE (+971)", flag: "🇦🇪" },
    // Add more as needed
]

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onPhoneChange: (value: string) => void;
}

export function PhoneInput({ value, onPhoneChange, className, ...props }: PhoneInputProps) {
    const [countryCode, setCountryCode] = React.useState("+91")
    const [phoneNumber, setPhoneNumber] = React.useState("")
    const [isOpen, setIsOpen] = React.useState(false)

    // Parse incoming value which might be "+91 1234567890" or just "1234567890"
    React.useEffect(() => {
        if (!value) return;
        const parts = value.split(" ");
        if (parts.length > 1 && parts[0].startsWith("+")) {
            setCountryCode(parts[0]);
            setPhoneNumber(parts.slice(1).join(" "));
        } else {
            setPhoneNumber(value);
        }
    }, [value]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPart = e.target.value.replace(/[^0-9]/g, "");
        setPhoneNumber(newPart);
        onPhoneChange(`${countryCode} ${newPart}`);
    };

    const handleCountrySelect = (code: string) => {
        setCountryCode(code);
        onPhoneChange(`${code} ${phoneNumber}`);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative flex h-14 w-full rounded-xl border border-border/50 bg-background/50 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-full items-center gap-2 border-r border-border/50 px-4 font-bold text-foreground/70 hover:bg-secondary/30 rounded-l-xl transition-colors"
                >
                    <span>{COUNTRIES.find(c => c.code === countryCode)?.flag}</span>
                    <span>{countryCode}</span>
                    <ChevronDown className="w-4 h-4" />
                </button>

                {isOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-border shadow-2xl bg-card p-2 animate-in fade-in zoom-in-95 duration-200">
                        {COUNTRIES.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => handleCountrySelect(country.code)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
                            >
                                <span>{country.flag}</span>
                                <span>{country.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <input
                {...props}
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="flex-1 bg-transparent px-4 outline-hidden placeholder:text-muted-foreground/50"
            />
        </div>
    )
}
