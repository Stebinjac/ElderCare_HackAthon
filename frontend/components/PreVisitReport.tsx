'use client';

import { FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PreVisitReportProps {
    report: string;
    compact?: boolean;
}

export default function PreVisitReport({ report, compact = false }: PreVisitReportProps) {
    const [isExpanded, setIsExpanded] = useState(!compact);

    if (!report) return null;

    // Parse markdown sections for nice rendering
    const renderMarkdown = (text: string) => {
        let isEvalSection = false;

        return text.split('\n').map((line, i) => {
            if (line.includes('## AI Interview Evaluation')) {
                isEvalSection = true;
                return (
                    <div key={i} className="mt-8 pt-6 border-t-2 border-dashed border-border">
                        <h2 className="text-xl font-black text-amber-600 tracking-tight mb-2 flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-amber-500/10">
                                <FileText className="w-5 h-5 text-amber-600" />
                            </span>
                            AI Self-Evaluation & Insights
                        </h2>
                    </div>
                );
            }

            if (line.startsWith('## ')) {
                isEvalSection = false;
                return (
                    <h2 key={i} className="text-xl font-black text-foreground tracking-tight mt-4 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {line.replace('## ', '')}
                    </h2>
                );
            }
            if (line.startsWith('### ')) {
                const title = line.replace('### ', '');
                const isQualityHeader = title.includes('Quality') || title.includes('Self-Evaluation');
                return (
                    <h3 key={i} className={`text-sm font-black uppercase tracking-widest mt-6 mb-2 ${isEvalSection
                            ? isQualityHeader ? 'text-blue-600' : 'text-amber-600'
                            : 'text-primary/70'
                        }`}>
                        {title}
                    </h3>
                );
            }
            if (line.startsWith('**') && line.includes(':**')) {
                const [label, ...rest] = line.split(':**');
                return (
                    <p key={i} className="text-sm leading-relaxed mb-1">
                        <span className="font-bold text-foreground">{label.replace(/\*\*/g, '')}:</span>
                        <span className="text-muted-foreground">{rest.join(':**').replace(/\*\*/g, '')}</span>
                    </p>
                );
            }
            if (line.startsWith('- **') || line.startsWith('* **')) {
                const cleaned = line.replace(/^[-*] /, '').replace(/\*\*/g, '');
                const [label, ...rest] = cleaned.split(':');
                return (
                    <div key={i} className="flex items-start gap-2 py-1">
                        <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isEvalSection ? 'bg-amber-500' : 'bg-primary'}`} />
                        <p className="text-sm">
                            <span className="font-bold text-foreground">{label}:</span>
                            <span className="text-muted-foreground">{rest.join(':')}</span>
                        </p>
                    </div>
                );
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                    <div key={i} className="flex items-start gap-2 py-1">
                        <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isEvalSection ? 'bg-amber-500/50' : 'bg-primary/50'}`} />
                        <p className="text-sm text-muted-foreground">{line.replace(/^[-*] /, '').replace(/\*\*/g, '')}</p>
                    </div>
                );
            }
            if (line.startsWith('---')) return null;
            if (line.trim() === '') return <div key={i} className="h-2" />;

            return (
                <p key={i} className={`text-sm leading-relaxed ${isEvalSection ? 'text-amber-700/80 italic bg-amber-500/5 p-3 rounded-lg border border-amber-500/10' : 'text-muted-foreground'}`}>
                    {line}
                </p>
            );
        });
    };

    if (compact) {
        return (
            <div className="border border-primary/20 rounded-2xl overflow-hidden bg-primary/5">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-primary/10 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider text-primary">Pre-Visit Report</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                    )}
                </button>
                {isExpanded && (
                    <div className="px-5 pb-4 border-t border-primary/10">
                        {renderMarkdown(report)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 rounded-3xl border border-primary/20 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black text-foreground tracking-tight">Pre-Visit Report</h3>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-0.5">
                {renderMarkdown(report)}
            </div>
        </div>
    );
}
