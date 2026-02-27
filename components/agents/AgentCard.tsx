"use client"

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface AgentCardProps {
    agentNumber: number;
    icon: LucideIcon;
    name: string;
    description: string;
    href: string;
    color: 'violet' | 'emerald' | 'primary' | 'rose' | 'amber';
    status: 'online' | 'standby' | 'offline';
}

const colorMap = {
    violet: {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        icon: 'text-violet-500',
        badge: 'bg-violet-500/10 text-violet-600',
        hover: 'hover:border-violet-500/40',
        number: 'bg-violet-500/10 text-violet-500',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: 'text-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-600',
        hover: 'hover:border-emerald-500/40',
        number: 'bg-emerald-500/10 text-emerald-500',
    },
    primary: {
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        icon: 'text-primary',
        badge: 'bg-primary/10 text-primary',
        hover: 'hover:border-primary/40',
        number: 'bg-primary/10 text-primary',
    },
    rose: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        icon: 'text-rose-500',
        badge: 'bg-rose-500/10 text-rose-600',
        hover: 'hover:border-rose-500/40',
        number: 'bg-rose-500/10 text-rose-500',
    },
    amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        icon: 'text-amber-500',
        badge: 'bg-amber-500/10 text-amber-600',
        hover: 'hover:border-amber-500/40',
        number: 'bg-amber-500/10 text-amber-500',
    },
};

const statusConfig = {
    online: { label: 'Online', dot: 'bg-emerald-500', text: 'text-emerald-600' },
    standby: { label: 'Standby', dot: 'bg-amber-500', text: 'text-amber-600' },
    offline: { label: 'Offline', dot: 'bg-red-500', text: 'text-red-600' },
};

export function AgentCard({ agentNumber, icon: Icon, name, description, href, color, status }: AgentCardProps) {
    const c = colorMap[color];
    const s = statusConfig[status];

    return (
        <Link href={href}>
            <Card className={cn(
                'group p-6 border transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 relative overflow-hidden',
                c.border, c.hover
            )}>
                {/* Top gradient accent */}
                <div className={cn('absolute top-0 left-0 right-0 h-0.5', c.bg.replace('/10', ''))} />

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Agent Number */}
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-black', c.number)}>
                            {agentNumber}
                        </div>
                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', s.dot)} />
                            <span className={cn('text-xs font-bold uppercase tracking-widest', s.text)}>{s.label}</span>
                        </div>
                    </div>
                    <ChevronRight className={cn('w-4 h-4 transition-transform group-hover:translate-x-1', c.icon)} />
                </div>

                {/* Icon */}
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', c.bg)}>
                    <Icon className={cn('w-7 h-7', c.icon)} />
                </div>

                {/* Content */}
                <h3 className="font-extrabold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                    {name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </Card>
        </Link>
    );
}
