"use client"
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Database, Activity, Users, Zap } from 'lucide-react';

interface MCPEvent {
    id: string;
    source_agent: string;
    target_agent: string;
    event_type: string;
    patient_id: string;
    payload: any;
    processed: boolean;
    created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
    EMERGENCY_VITALS: 'text-red-400 bg-red-500/10',
    HOSPITAL_DECISION: 'text-orange-400 bg-orange-500/10',
    DISPATCH_CONFIRMED: 'text-yellow-400 bg-yellow-500/10',
    WELLNESS_CHECK: 'text-blue-400 bg-blue-500/10',
    NORMAL_LOG: 'text-green-400 bg-green-500/10',
    REFILL_ALERT: 'text-purple-400 bg-purple-500/10',
};

export default function AdminPanel() {
    const [events, setEvents] = useState<MCPEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetch('/api/admin/events')
            .then(r => r.json())
            .then(d => setEvents(d.events || []))
            .finally(() => setIsLoading(false));
    }, []);

    const eventTypes = ['ALL', ...Array.from(new Set(events.map(e => e.event_type)))];
    const filtered = filter === 'ALL' ? events : events.filter(e => e.event_type === filter);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Database className="w-8 h-8 text-primary" /> Admin Panel
                </h1>
                <p className="text-muted-foreground mt-1">MCP event audit log, system status, and configuration.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <p className="text-muted-foreground">Total MCP Events</p>
                    </div>
                    <p className="text-4xl font-bold text-foreground">{events.length}</p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-red-400" />
                        <p className="text-muted-foreground">Emergency Events</p>
                    </div>
                    <p className="text-4xl font-bold text-red-400">
                        {events.filter(e => e.event_type === 'EMERGENCY_VITALS').length}
                    </p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-green-400" />
                        <p className="text-muted-foreground">Agents Active</p>
                    </div>
                    <p className="text-4xl font-bold text-green-400">6</p>
                </Card>
            </div>

            {/* MCP Event Log */}
            <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-foreground">MCP Event Log</h2>
                    <div className="flex gap-2 flex-wrap">
                        {eventTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filter === type
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading event log...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No events yet. Trigger an emergency vital to see the agent chain in action.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filtered.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-start gap-4 p-4 bg-secondary/20 rounded-xl border border-border/30 hover:border-primary/20 transition-all"
                            >
                                <div className={`px-2 py-1 rounded-md text-xs font-bold shrink-0 ${SEVERITY_COLORS[event.event_type] || 'text-muted-foreground bg-secondary'}`}>
                                    {event.event_type}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">
                                        <span className="text-primary">{event.source_agent}</span>
                                        <span className="text-muted-foreground"> → </span>
                                        <span className="text-accent">{event.target_agent}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        Patient: {event.patient_id?.slice(0, 8)}...
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(event.created_at).toLocaleTimeString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(event.created_at).toLocaleDateString()}
                                    </p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${event.processed ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        {event.processed ? 'Processed' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
