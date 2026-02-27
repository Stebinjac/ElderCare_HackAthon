'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Loader2, Pill, Info, AlertCircle, Upload, CheckCircle, Camera, X, Save } from 'lucide-react';

interface ExtractedMed {
    name: string;
    dosage: string;
    frequency: string;
    timing: string[];
    stock_count: number;
    daily_dose: number;
}

export default function PrescriptionsPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [medications, setMedications] = useState<ExtractedMed[]>([]);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPEG, PNG, etc.)');
            return;
        }
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setMedications([]);
        setSavedSuccess(false);
        setError(null);
    };

    const analyze = async () => {
        if (!selectedFile) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('prescription', selectedFile);
            const res = await fetch('/api/prescriptions/analyze', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Analysis failed');
            setMedications(data.medications || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const save = async () => {
        if (!medications.length) return;
        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.append('confirm', 'true');
            fd.append('extractedData', JSON.stringify(medications));
            const res = await fetch('/api/prescriptions/analyze', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSavedSuccess(true);
            setMedications([]);
            setPreview(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Prescription Analyzer</h2>
                <p className="text-muted-foreground font-medium">Upload a prescription photo — AI will extract medicines and save them automatically.</p>
            </div>

            {/* Success Banner */}
            {savedSuccess && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="font-semibold">Medications saved successfully! You can now view them in your medication list.</p>
                </div>
            )}

            {/* Upload Zone */}
            <Card
                className={`p-12 border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 bg-card/50'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
            >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <div className="text-center space-y-4">
                    {preview ? (
                        <div className="relative inline-block">
                            <img src={preview} alt="Prescription" className="max-h-48 rounded-xl mx-auto shadow-lg" />
                            <button
                                onClick={e => { e.stopPropagation(); setPreview(null); setSelectedFile(null); setMedications([]); }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                                <Camera className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-foreground">Drop prescription image here</p>
                                <p className="text-muted-foreground mt-1">or click to browse — supports JPEG, PNG, WEBP</p>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Analyze Button */}
            {selectedFile && !medications.length && (
                <div className="flex justify-center">
                    <Button onClick={analyze} disabled={isAnalyzing} size="lg" className="gap-2 px-8">
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {isAnalyzing ? 'Analyzing with AI…' : 'Analyze Prescription'}
                    </Button>
                </div>
            )}

            {/* Extracted Results */}
            {medications.length > 0 && (
                <Card className="p-8 shadow-xl border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-foreground">Extracted Medications</h3>
                        <Button onClick={save} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving…' : 'Save All'}
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {medications.map((med, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-background/50 rounded-xl border border-border/50">
                                <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                                    <Pill className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-foreground">{med.name}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded">{med.dosage}</span>
                                        <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded">{med.frequency}</span>
                                        {med.timing?.length > 0 && (
                                            <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded">
                                                ⏰ {med.timing.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        Review before saving. AI may make errors — always consult your doctor.
                    </p>
                </Card>
            )}

            {/* Info */}
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-foreground/70">
                    Always consult your doctor before making changes to your medication schedule. The extraction provided here is AI-assisted and for informational purposes only.
                </p>
            </div>
        </div>
    );
}
