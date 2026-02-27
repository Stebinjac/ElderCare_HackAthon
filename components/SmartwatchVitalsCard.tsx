"use client"

import { Card } from '@/components/ui/card';
import { useWatchSimulator } from '@/hooks/useWatchSimulator';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SmartwatchVitalsCardProps {
    showControls?: boolean;
}

export function SmartwatchVitalsCard({ showControls = true }: SmartwatchVitalsCardProps) {
    const { vitals, isManual, decreaseVitals, increaseVitals, resetToAuto } = useWatchSimulator();
    const [timeAgo, setTimeAgo] = useState('just now');

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.floor((new Date().getTime() - vitals.lastSync.getTime()) / 1000);
            if (diff < 60) setTimeAgo(`${diff}s ago`);
            else setTimeAgo(`${Math.floor(diff / 60)}m ago`);
        }, 1000);
        return () => clearInterval(interval);
    }, [vitals.lastSync]);

    const getStatusColor = (type: string, value: number | string) => {
        if (type === 'heartRate') {
            const hr = value as number;
            if (hr > 100 || hr < 60) return 'text-red-600';
            return 'text-green-600';
        }
        if (type === 'spo2') {
            const s = value as number;
            if (s < 95) return 'text-red-600';
            return 'text-green-600';
        }
        if (type === 'bloodPressure') {
            const bp = value as string;
            const [sys, dia] = bp.split('/').map(Number);
            if (sys > 130 || dia > 90 || sys < 90 || dia < 60) return 'text-red-600';
            return 'text-green-600';
        }
        return 'text-green-600';
    };

    const isCritical = (type: string, value: number | string) => {
        const color = getStatusColor(type, value);
        return color === 'text-red-600';
    };

    const items = [
        { icon: "❤️", label: "Heart Rate", value: vitals.heartRate, unit: "bpm", type: 'heartRate' },
        { icon: "🫁", label: "SpO₂", value: vitals.spo2, unit: "%", type: 'spo2' },
        { icon: "🩸", label: "Blood Pressure", value: vitals.bloodPressure, unit: "", type: 'bloodPressure' },
    ];

    const hasAnyCritical = items.some(item => isCritical(item.type, item.value));

    return (
        <Card className="bg-white p-6 rounded-[32px] shadow-xl w-full max-w-md border-none relative overflow-hidden group">
            <div className={cn(
                "absolute top-0 left-0 w-full h-1.5 transition-colors duration-500",
                hasAnyCritical ? "bg-red-500" : "bg-linear-to-r from-green-500 to-emerald-600"
            )} />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className={cn(
                        "font-black flex items-center gap-2 text-lg transition-colors duration-500",
                        hasAnyCritical ? "text-red-600" : "text-green-600"
                    )}>
                        <span className={cn(
                            "w-2.5 h-2.5 rounded-full animate-pulse",
                            hasAnyCritical ? "bg-red-500" : "bg-green-500"
                        )} />
                        {hasAnyCritical ? "CRITICAL ALERT" : "ElderCare Watch Connected"}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                        {showControls ? "Manual Vital Control" : "Live Patient Vitals"}
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full border transition-colors duration-500",
                    hasAnyCritical ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
                )}>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter",
                        hasAnyCritical ? "text-red-600" : "text-green-600"
                    )}>{hasAnyCritical ? "Critical" : "Stable"}</span>
                </div>
            </div>

            <div className="space-y-6">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover/item:scale-110 transition-transform duration-300">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn(
                                        "text-3xl font-black tracking-tighter transition-colors duration-500",
                                        getStatusColor(item.type, item.value)
                                    )}>
                                        {item.value}
                                    </span>
                                    {item.unit && <span className="text-xs font-bold text-gray-400">{item.unit}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className={cn(
                                "w-2 h-2 rounded-full mb-1",
                                getStatusColor(item.type, item.value).replace('text-', 'bg-')
                            )} />
                            <span className={cn(
                                "text-[10px] font-bold uppercase italic",
                                isCritical(item.type, item.value) ? "text-red-500" : "text-gray-300"
                            )}>{isCritical(item.type, item.value) ? "Critical" : "Stable"}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Manual Controls - Only show if showControls is true */}
            {showControls && (
                <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex gap-2">
                        <button
                            onClick={decreaseVitals}
                            className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors border border-red-100"
                        >
                            Decrease
                        </button>
                        <button
                            onClick={increaseVitals}
                            className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors border border-blue-100"
                        >
                            Increase
                        </button>
                    </div>
                    <button
                        onClick={resetToAuto}
                        className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95"
                    >
                        Reset to Normal Vitals
                    </button>
                </div>
            )}

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Last synced:</span>
                    <span className="text-xs font-black text-gray-600">{timeAgo}</span>
                </div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic group-hover:text-primary transition-colors">
                    v2.5.0-alert-ready
                </div>
            </div>
        </Card>
    );
}
