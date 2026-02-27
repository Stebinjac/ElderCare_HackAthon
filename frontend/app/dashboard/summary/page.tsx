"use client"
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Heart, FileText, CheckCircle2, Loader2, Table as TableIcon, Users, Mail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function HealthSummaryPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [insight, setInsight] = useState('');
    const [bloodDetails, setBloodDetails] = useState<any[]>([]);
    const [reportDate, setReportDate] = useState('');
    const [assignedDoctor, setAssignedDoctor] = useState<any>(null);

    useEffect(() => {
        const fetchSummaryData = async () => {
            try {
                const [summaryRes, doctorsRes] = await Promise.all([
                    fetch('/api/dashboard/summary'),
                    fetch('/api/patient/doctors')
                ]);

                const summaryData = await summaryRes.json();
                const doctorsData = await doctorsRes.json();

                if (summaryRes.ok) {
                    setMetrics(summaryData.metrics);
                    setInsight(summaryData.insight);
                    setBloodDetails(summaryData.recentBloodDetails);
                    setReportDate(summaryData.latestReportDate);
                }

                if (doctorsRes.ok) {
                    const firstDoctor = doctorsData.doctors?.find((d: any) => d.requestStatus === 'accepted');
                    setAssignedDoctor(firstDoctor || null);
                }
            } catch (error) {
                console.error('Failed to fetch summary data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummaryData();
    }, []);

    const getIcon = (label: string) => {
        if (label.includes('Pressure')) return Heart;
        if (label.includes('Sugar')) return Activity;
        return FileText;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-foreground tracking-tight">Health Summary</h2>
                    <p className="text-muted-foreground font-medium italic">Comprehensive snapshot of your medical health</p>
                </div>
                {assignedDoctor && (
                    <Card className="px-6 py-4 border-primary/20 bg-primary/5 flex items-center gap-4 rounded-2xl shadow-sm animate-in slide-in-from-right-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-primary/70 tracking-widest">{assignedDoctor.speciality || 'General Practitioner'}</p>
                            <p className="text-lg font-black text-foreground">{assignedDoctor.name}</p>
                        </div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i} className="p-10 flex items-center justify-center border-none bg-card group rounded-[40px] h-64">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </Card>
                    ))
                ) : (
                    metrics.map((metric, idx) => {
                        const Icon = getIcon(metric.label);
                        return (
                            <Card key={idx} className="p-10 hover:shadow-2xl transition-all border-none bg-card hover:bg-card/80 group rounded-[40px]">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <span
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                                            metric.status === 'Normal' ? 'bg-primary/20 text-primary' : 'bg-yellow-100 text-yellow-700'
                                        )}
                                    >
                                        {metric.status}
                                    </span>
                                </div>
                                <p className="text-muted-foreground font-bold text-lg mb-2">{metric.label}</p>
                                <p className="text-4xl font-black text-foreground">{metric.value}</p>
                                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    Trend: <span className="text-primary italic">{metric.trend}</span>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Health Insights</h3>
                </div>
                <div className="bg-secondary/30 p-8 rounded-3xl border border-primary/10">
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    ) : (
                        <p className="text-xl text-foreground leading-relaxed italic">
                            "{insight}"
                        </p>
                    )}
                </div>
            </Card>

            {/* Recent Blood Details Section */}
            {!isLoading && bloodDetails.length > 0 && (
                <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <TableIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-foreground">Recent Blood Details</h3>
                                <p className="text-sm text-muted-foreground">Full breakdown from report dated {reportDate}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border/50">
                        <Table>
                            <TableHeader className="bg-secondary/20">
                                <TableRow>
                                    <TableHead className="font-bold">Test Name</TableHead>
                                    <TableHead className="font-bold text-center">Result</TableHead>
                                    <TableHead className="font-bold text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bloodDetails.map((test, idx) => (
                                    <TableRow key={idx} className="hover:bg-secondary/10 transition-colors">
                                        <TableCell className="font-semibold text-lg">{test.name}</TableCell>
                                        <TableCell className="text-center font-bold text-xl">{test.result}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter",
                                                test.status === 'Normal' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                            )}>
                                                {test.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    );
}
