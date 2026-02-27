'use client';

import { AgentCard } from '@/components/agents/AgentCard';
import { Brain, ClipboardCheck, Activity, Siren, MessageSquare, Bot, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

const agents = [
    {
        agentNumber: 1,
        icon: Brain,
        name: 'Mental Wellness Agent',
        description: 'Your compassionate AI companion. Detects emotional distress, provides support, and suggests calming activities. Always here to listen.',
        href: '/dashboard/agents/mental-wellness',
        color: 'violet' as const,
        status: 'online' as const,
    },
    {
        agentNumber: 2,
        icon: ClipboardCheck,
        name: 'Personal Assistant Agent',
        description: 'Manages medication reminders, appointments, and daily health tasks. Ask any health-related question and get clear answers.',
        href: '/dashboard/agents/personal-assistant',
        color: 'emerald' as const,
        status: 'online' as const,
    },
    {
        agentNumber: 3,
        icon: Activity,
        name: 'Health Monitoring Agent',
        description: 'Continuously analyzes vitals — heart rate, blood pressure, glucose, and SpO₂. Flags abnormalities and escalates when needed.',
        href: '/dashboard/agents/health-monitoring',
        color: 'primary' as const,
        status: 'online' as const,
    },
    {
        agentNumber: 4,
        icon: Siren,
        name: 'Emergency Decision Agent',
        description: 'Autonomous emergency response. Evaluates severity, selects best hospital, determines ambulance need, and generates medical summaries.',
        href: '/dashboard/agents/emergency',
        color: 'rose' as const,
        status: 'standby' as const,
    },
    {
        agentNumber: 5,
        icon: MessageSquare,
        name: 'Communication Agent',
        description: 'Instantly notifies family, hospital, and ambulance during emergencies. Generates tailored messages for each recipient.',
        href: '/dashboard/agents/communication',
        color: 'amber' as const,
        status: 'standby' as const,
    },
];

const workflowSteps = [
    { step: 1, label: 'Health Monitoring Agent scans vitals', icon: Activity },
    { step: 2, label: 'Emergency Decision Agent evaluates the situation', icon: Siren },
    { step: 3, label: 'Best hospital & ambulance are selected', icon: Zap },
    { step: 4, label: 'Communication Agent alerts family & hospital', icon: MessageSquare },
    { step: 5, label: 'Personal Assistant updates schedules', icon: ClipboardCheck },
    { step: 6, label: 'Mental Wellness Agent provides emotional support', icon: Brain },
];

export default function AgentsHubPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-violet-500/10 border border-primary/20 p-8 md:p-10 shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg flex-shrink-0">
                        <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary font-bold text-xs tracking-widest uppercase mb-3">
                            <Zap className="w-3 h-3" /> Multi-Agent AI System
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">AgentCare</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            Five specialized AI agents working autonomously to monitor your health, provide emotional support, and respond to emergencies — 24/7 without human supervision.
                        </p>
                    </div>
                </div>

                {/* Live Status Bar */}
                <div className="relative mt-8 flex flex-wrap gap-4">
                    {[
                        { label: 'Agents Online', value: '3/5', color: 'text-emerald-500' },
                        { label: 'Monitoring Active', value: 'Yes', color: 'text-primary' },
                        { label: 'Emergency Status', value: 'All Clear', color: 'text-emerald-500' },
                        { label: 'Last Analysis', value: 'Just now', color: 'text-muted-foreground' },
                    ].map((stat) => (
                        <div key={stat.label} className="px-4 py-2 rounded-xl bg-background/60 border border-border/50 backdrop-blur">
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Cards Grid */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-6">Active Agents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <AgentCard key={agent.agentNumber} {...agent} />
                    ))}
                </div>
            </div>

            {/* Agent Workflow */}
            <Card className="p-8 border-border/50 bg-card/50 backdrop-blur shadow-xl">
                <h3 className="text-xl font-bold text-foreground mb-2">Agent Workflow</h3>
                <p className="text-muted-foreground mb-8 text-sm">How the agents collaborate in an emergency scenario</p>
                <div className="relative">
                    {/* Connector line */}
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-violet-500 to-amber-500 hidden md:block" />
                    <div className="space-y-5">
                        {workflowSteps.map(({ step, label, icon: Icon }) => (
                            <div key={step} className="flex items-center gap-5 group">
                                <div className="relative w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center flex-shrink-0 z-10 group-hover:bg-primary/20 group-hover:border-primary/60 transition-all">
                                    <Icon className="w-5 h-5 text-primary" />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                                        {step}
                                    </span>
                                </div>
                                <p className="text-foreground/80 font-medium group-hover:text-foreground transition-colors">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
