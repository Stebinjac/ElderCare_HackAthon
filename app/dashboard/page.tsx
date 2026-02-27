"use client"
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Calendar, FileText, Heart, Loader2 } from 'lucide-react';
import { SmartwatchVitalsCard } from '@/components/SmartwatchVitalsCard';

export default function DashboardPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard/stats');
                const data = await response.json();
                if (response.ok) {
                    setStats(data.stats);
                    setRecentActivity(data.recentActivity);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getIcon = (label: string) => {
        switch (label) {
            case 'Total Reports': return FileText;
            case 'Last Checkup': return Calendar;
            case 'Upcoming': return Heart;
            default: return Activity;
        }
    };

    const getColors = (label: string) => {
        switch (label) {
            case 'Total Reports': return { color: 'text-primary', bg: 'bg-primary/10' };
            case 'Last Checkup': return { color: 'text-accent', bg: 'bg-accent/10' };
            case 'Upcoming': return { color: 'text-primary', bg: 'bg-primary/10' };
            default: return { color: 'text-primary', bg: 'bg-primary/10' };
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Banner */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-2 p-8 bg-linear-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/20 shadow-xl overflow-hidden relative group h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
                    <div className="space-y-3 relative">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Welcome back!</h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                            Your health profile is looking stable today. Here's a quick look at your recent metrics and upcoming schedule.
                        </p>
                    </div>
                </Card>
                <div className="lg:col-span-1">
                    <SmartwatchVitalsCard />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i} className="p-8 flex items-center justify-center border-border/50 bg-card/50 backdrop-blur h-48">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </Card>
                    ))
                ) : (
                    stats.map((stat, idx) => {
                        const Icon = getIcon(stat.label);
                        const { color, bg } = getColors(stat.label);
                        return (
                            <Card
                                key={idx}
                                className="p-8 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50 bg-card/50 backdrop-blur"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className={`p-5 rounded-2xl ${bg} shadow-inner`}>
                                        <Icon className={`w-8 h-8 ${color}`} />
                                    </div>
                                </div>
                                <p className="text-muted-foreground font-medium text-lg mb-2">{stat.label}</p>
                                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Recent Activity */}
            <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-foreground">Recent Activity</h3>
                    <button className="text-primary font-semibold hover:underline">View all</button>
                </div>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map((activity, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-5 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-all group border border-transparent hover:border-primary/10"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <div>
                                        <p className="font-bold text-foreground text-lg">{activity.action}</p>
                                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-foreground">{activity.result}</p>
                                    <p className={`text-xs font-semibold uppercase tracking-wider ${activity.trend === 'high' ? 'text-destructive' : 'text-primary'
                                        }`}>
                                        {activity.trend}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent activity found. Upload a report to get started.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
