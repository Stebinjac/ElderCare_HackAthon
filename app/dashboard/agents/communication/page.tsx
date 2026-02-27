'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, CheckCircle2, Loader2, Users, Hospital, Ambulance, ArrowLeft, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationMessage {
    recipient: string;
    subject: string;
    message: string;
    urgencyLevel: string;
    channel: string;
}

interface CommunicationData {
    familyMessage: NotificationMessage;
    hospitalMessage: NotificationMessage;
    ambulanceMessage: NotificationMessage;
    notificationSent: boolean;
    timestamp: string;
    summary: string;
}

const urgencyColors = {
    URGENT: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    CRITICAL: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    IMMEDIATE: 'bg-rose-600/20 text-rose-700 border-rose-600/30',
};

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'SMS/WhatsApp': MessageSquare,
    'Phone/System': Hospital,
    'Radio/Phone': Ambulance,
};

export default function CommunicationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState<CommunicationData | null>(null);
    const [hasDecision, setHasDecision] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('emergencyDecision');
        if (stored) setHasDecision(true);
    }, []);

    const handleGenerate = async () => {
        const stored = sessionStorage.getItem('emergencyDecision');
        if (!stored) return;

        setIsLoading(true);
        setNotifications(null);

        try {
            const response = await fetch('/api/agents/communication', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emergencyDecision: JSON.parse(stored),
                    patientName: 'Patient',
                }),
            });

            const data = await response.json();
            if (response.ok && data.data) {
                setNotifications(data.data);
            }
        } catch {
            // fail silently
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        setSent(true);
        // In a real system this would dispatch actual notifications
    };

    const messageCards = notifications ? [
        { key: 'family', data: notifications.familyMessage, icon: Users, color: 'violet', border: 'border-violet-500/30', bg: 'bg-violet-500/5', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-500' },
        { key: 'hospital', data: notifications.hospitalMessage, icon: Hospital, color: 'primary', border: 'border-primary/30', bg: 'bg-primary/5', iconBg: 'bg-primary/15', iconColor: 'text-primary' },
        { key: 'ambulance', data: notifications.ambulanceMessage, icon: Ambulance, color: 'rose', border: 'border-rose-500/30', bg: 'bg-rose-500/5', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-500' },
    ] : [];

    if (!hasDecision && !isLoading && !notifications) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-foreground">Communication Agent</h2>
                        <p className="text-sm text-muted-foreground">Agent 5 · Emergency Notifications · Standby</p>
                    </div>
                </div>
                <Card className="p-12 border-dashed border-2 border-amber-500/20 bg-amber-500/5 text-center shadow-md">
                    <Bell className="w-12 h-12 text-amber-400 mx-auto mb-4 opacity-60" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Awaiting Emergency Data</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        This agent activates after the Emergency Decision Agent evaluates a situation. Please complete the health monitoring and emergency evaluation steps first.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard/agents/health-monitoring">
                            <Button variant="outline" className="gap-2 font-semibold">Go to Health Monitoring <ChevronRight className="w-4 h-4" /></Button>
                        </Link>
                        <Link href="/dashboard/agents/emergency">
                            <Button className="gap-2 bg-rose-600 hover:bg-rose-700 font-bold">Emergency Agent <ChevronRight className="w-4 h-4" /></Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-foreground">Communication Agent</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-sm text-muted-foreground">Agent 5 · Notifications Active</p>
                        </div>
                    </div>
                </div>
                <Link href="/dashboard/agents/emergency">
                    <Button variant="outline" size="sm" className="gap-2 font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Back to Emergency
                    </Button>
                </Link>
            </div>

            {/* Generate Button */}
            {!notifications && !isLoading && (
                <Card className="p-8 border-amber-500/20 bg-amber-500/5 text-center shadow-md">
                    <MessageSquare className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Generate Emergency Notifications</h3>
                    <p className="text-muted-foreground mb-6">The agent will create tailored messages for your family, the hospital, and ambulance dispatch.</p>
                    <Button
                        onClick={handleGenerate}
                        className="h-12 px-10 font-bold bg-amber-600 hover:bg-amber-700 gap-2 shadow-lg"
                    >
                        <Send className="w-5 h-5" /> Generate All Notifications
                    </Button>
                </Card>
            )}

            {isLoading && (
                <Card className="p-10 text-center border-amber-500/20 bg-amber-500/5 shadow-md">
                    <Loader2 className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-spin" />
                    <p className="font-bold text-foreground text-lg">Communication Agent Working...</p>
                    <p className="text-muted-foreground mt-1">Generating personalized notification messages</p>
                </Card>
            )}

            {notifications && (
                <div className="space-y-5">
                    {/* Status Banner */}
                    <div className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border font-medium',
                        sent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    )}>
                        {sent ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        <p className="text-sm">{sent ? '✅ All notifications dispatched successfully.' : notifications.summary}</p>
                    </div>

                    {/* Message Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {messageCards.map(({ key, data, icon: Icon, border, bg, iconBg, iconColor }) => {
                            const ChannelIcon = channelIcons[data.channel] || MessageSquare;
                            const urgencyStyles = urgencyColors[data.urgencyLevel as keyof typeof urgencyColors] || urgencyColors.URGENT;
                            return (
                                <Card key={key} className={cn('p-6 border shadow-md', border, bg)}>
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
                                                <Icon className={cn('w-5 h-5', iconColor)} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">To</p>
                                                <p className="font-bold text-sm text-foreground">{data.recipient}</p>
                                            </div>
                                        </div>
                                        <span className={cn('text-[10px] font-black px-2 py-1 rounded-full border uppercase', urgencyStyles)}>
                                            {data.urgencyLevel}
                                        </span>
                                    </div>

                                    {/* Subject */}
                                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">{data.subject}</p>

                                    {/* Message Body */}
                                    <div className="p-3 rounded-xl bg-background/70 border border-border/40 mb-4">
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{data.message}</p>
                                    </div>

                                    {/* Channel */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ChannelIcon className="w-3.5 h-3.5" />
                                        Via {data.channel}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground text-center">Generated at {notifications.timestamp}</p>

                    {/* Send Button */}
                    {!sent && (
                        <Button
                            onClick={handleSend}
                            className="w-full h-14 text-lg font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-3 shadow-2xl hover:shadow-amber-500/30 transition-all text-white"
                        >
                            <Send className="w-6 h-6" /> Dispatch All Notifications
                        </Button>
                    )}

                    {sent && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-xl font-extrabold text-foreground">All Notifications Sent!</p>
                            <p className="text-muted-foreground text-sm text-center max-w-sm">Family, hospital, and ambulance have been notified. Help is on the way.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
