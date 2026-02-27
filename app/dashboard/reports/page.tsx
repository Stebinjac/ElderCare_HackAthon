'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Search, FileText, Check, X, Loader2, History, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportData {
    id: string;
    fileName: string;
    likelyDate: string;
    tests: { name: string; result: string; status: string }[];
    createdAt: string;
}

export default function ReportsPage() {
    const [reports, setReports] = useState<ReportData[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingReport, setPendingReport] = useState<any>(null);
    const [selectedDetailReport, setSelectedDetailReport] = useState<ReportData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch history on load
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/reports/history');
            const data = await response.json();
            if (response.ok) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/reports/extract', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok) {
                setPendingReport(data.data);
            } else {
                alert(data.error || 'Failed to extract PDF');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Server error during upload');
        } finally {
            setIsUploading(false);
        }
    };

    const saveReport = async () => {
        if (!pendingReport) return;
        setIsSaving(true);

        try {
            const response = await fetch('/api/reports/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingReport),
            });

            if (response.ok) {
                setPendingReport(null);
                fetchHistory(); // Refresh history
            } else {
                alert('Failed to save report');
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredReports = reports.filter(r =>
        r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.likelyDate.includes(searchQuery)
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Medical Reports</h2>
                    <p className="text-muted-foreground mt-1">Manage and track your lab results effortlessly</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search reports..."
                            className="pl-10 h-12 bg-card border-border/50 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            {!pendingReport && !selectedDetailReport && (
                <Card className="p-10 border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group relative overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                    />
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {isUploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Upload className="w-8 h-8 text-primary" />}
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground">
                                {isUploading ? 'Analysing PDF...' : 'Click to upload lab report'}
                            </p>
                            <p className="text-muted-foreground mt-1">Upload PDF format (Supported: Blood test, Lipid profile, etc.)</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Pending Report Review */}
            {pendingReport && (
                <Card className="p-8 border-primary/30 bg-card shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/20 rounded-xl">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{pendingReport.fileName}</h3>
                                <p className="text-sm text-muted-foreground">Extracted on {new Date(pendingReport.uploadDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setPendingReport(null)}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {pendingReport.tests.map((test: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl border border-border/50 bg-secondary/20 hover:border-primary/50 transition-colors">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{test.name}</p>
                                <div className="flex justify-between items-end">
                                    <p className="text-2xl font-black text-foreground">{test.result}</p>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                        test.status === 'Normal' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    )}>{test.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <Info className="w-4 h-4" />
                            Please verify the values before saving.
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setPendingReport(null)}>Discard</Button>
                            <Button className="font-bold px-8 bg-linear-to-r from-primary to-accent" onClick={saveReport} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Selected Detail Report View */}
            {selectedDetailReport && (
                <Card className="p-8 border-border shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-secondary/30 rounded-xl">
                                <History className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedDetailReport.fileName}</h3>
                                <p className="text-sm text-muted-foreground">Recorded {new Date(selectedDetailReport.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDetailReport(null)}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedDetailReport.tests.map((test, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-secondary/10 border border-border/30 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-foreground/80">{test.name}</h4>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-black uppercase",
                                        test.status === 'Normal' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    )}>{test.status}</span>
                                </div>
                                <p className="text-3xl font-black text-foreground">{test.result}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex justify-end">
                        <Button variant="outline" onClick={() => setSelectedDetailReport(null)} className="h-11 px-8 font-bold">
                            Close Review
                        </Button>
                    </div>
                </Card>
            )}

            {/* Reports List */}
            <Card className="overflow-hidden border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                <div className="p-6 border-b border-border/50 bg-secondary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">Report History</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{reports.length} Reports Found</p>
                </div>
                <Table>
                    <TableHeader className="bg-secondary/20">
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="font-bold">Test Date</TableHead>
                            <TableHead className="font-bold">Filename</TableHead>
                            <TableHead className="font-bold text-center">Indicators</TableHead>
                            <TableHead className="font-bold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReports.map((report) => (
                            <TableRow key={report.id} className="border-border/50 hover:bg-secondary/20 transition-colors group">
                                <TableCell className="font-medium">{report.likelyDate}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 font-semibold text-foreground/80">
                                        <FileText className="w-4 h-4 text-primary" />
                                        {report.fileName}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-1">
                                        {report.tests.slice(0, 3).map((t, i) => (
                                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
                                                {t.name}
                                            </span>
                                        ))}
                                        {report.tests.length > 3 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{report.tests.length - 3}</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="font-bold text-primary group-hover:bg-primary/10 transition-all gap-2"
                                        onClick={() => {
                                            setSelectedDetailReport(report);
                                            setPendingReport(null);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        View Full
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredReports.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium">
                                    No reports found. Upload a PDF to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
