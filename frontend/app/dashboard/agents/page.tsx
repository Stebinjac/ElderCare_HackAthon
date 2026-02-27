"use client"
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, User, Loader2, MapPin, Calendar, AlertTriangle, Heart, Pill, Stethoscope, Mic, MicOff } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    actions?: ActionItem[];
}

interface ActionItem {
    tool: string;
    args: Record<string, any>;
    result: Record<string, any>;
}

const TOOL_ICONS: Record<string, any> = {
    find_nearest_hospital: MapPin,
    book_appointment: Calendar,
    send_emergency_alert: AlertTriangle,
    get_health_summary: Heart,
    get_medications: Pill,
    get_appointments: Stethoscope,
};

const TOOL_LABELS: Record<string, string> = {
    find_nearest_hospital: "Found Hospitals",
    book_appointment: "Booked Appointment",
    send_emergency_alert: "Sent Alert",
    get_health_summary: "Health Summary",
    get_medications: "Medications",
    get_appointments: "Appointments",
};

function ActionCard({ action }: { action: ActionItem }) {
    const Icon = TOOL_ICONS[action.tool] || Bot;
    const label = TOOL_LABELS[action.tool] || action.tool;

    return (
        <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{label}</span>
            </div>
            <div className="text-sm text-muted-foreground">
                {action.tool === "book_appointment" && action.result.success && (
                    <div className="space-y-1">
                        <p className="font-medium text-foreground">Dr. {action.result.doctor_name}</p>
                        <p>{action.result.date} at {action.result.time}</p>
                        <p className="text-xs">Status: {action.result.status}</p>
                    </div>
                )}
                {action.tool === "find_nearest_hospital" && action.result.hospitals && (
                    <div className="space-y-2">
                        {action.result.hospitals.slice(0, 3).map((h: any, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 mt-1 text-primary shrink-0" />
                                <div>
                                    <p className="font-medium text-foreground">
                                        {h.name} {h.distance !== undefined && h.distance !== null && (
                                            <span className="text-[10px] font-normal text-muted-foreground ml-1">
                                                · {h.distance} km away
                                            </span>
                                        )}
                                    </p>
                                    {h.maps_link && (
                                        <a href={h.maps_link} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline">
                                            Open in Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {action.tool === "send_emergency_alert" && (
                    <p className={action.result.success ? "text-green-600" : "text-red-500"}>
                        {action.result.success ? `Alert sent to ${action.result.sent_to}` : action.result.error}
                    </p>
                )}
                {action.tool === "get_health_summary" && action.result.latest_vitals && (
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">BP:</span> {action.result.latest_vitals.bp_systolic}/{action.result.latest_vitals.bp_diastolic}</div>
                        <div><span className="font-medium">HR:</span> {action.result.latest_vitals.heart_rate} bpm</div>
                        <div><span className="font-medium">SpO2:</span> {action.result.latest_vitals.spo2}%</div>
                    </div>
                )}
                {action.tool === "get_appointments" && action.result.appointments && (
                    <p>{action.result.total} appointment(s) found</p>
                )}
                {action.tool === "get_medications" && (
                    <p>{action.result.count} medication(s) on file</p>
                )}
            </div>
        </div>
    );
}

const SUGGESTIONS = [
    "What are my latest vitals?",
    "Book an appointment with my doctor",
    "Find the nearest hospital",
    "Send an emergency alert",
    "List my upcoming appointments",
    "What medications am I taking?",
];

export default function AgentCarePage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch user and load history on mount
    useEffect(() => {
        const initChat = async () => {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();

                    // Use email as unique ID for chat persistence
                    setUserId(data.user.email);

                    if (data.user.email) {
                        const docRef = doc(db, 'chats', data.user.email);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const chatData = docSnap.data();
                            if (chatData.history && Array.isArray(chatData.history)) {
                                setMessages(chatData.history);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
            }
        };

        initChat();

        // Proactively fetch location
        getCurrentLocation().then(loc => {
            if (loc) {
                console.log("[AgentCare] Proactive location obtained:", loc);
                setUserLocation(loc);
            }
        });

        // Cleanup: Stop any lingering media streams
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const getCurrentLocation = (): Promise<{ lat: number, lng: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("[AgentCare] Location detected:", pos.coords.latitude, pos.coords.longitude);
                    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    let errorMsg = "Unknown error";
                    if (err.code === err.PERMISSION_DENIED) errorMsg = "Permission denied";
                    else if (err.code === err.POSITION_UNAVAILABLE) errorMsg = "Position unavailable";
                    else if (err.code === err.TIMEOUT) errorMsg = "Timeout";
                    console.error("[AgentCare] Geolocation error:", errorMsg, err.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
    };

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Save to Firebase (Single Document Array)
        if (userId) {
            setDoc(doc(db, 'chats', userId), {
                history: arrayUnion({
                    ...userMessage,
                    timestamp: new Date().toISOString()
                })
            }, { merge: true }).catch((err: any) => console.error("Firebase store error:", err));
        }

        try {
            const lowercaseMsg = msg.toLowerCase();
            let location = userLocation;

            // Broad intent detection for location-related queries
            const locationIntentRegex = /\b(hospital|near|nearby|emergency|close|around|find|location|map|place|fetch|address)\b/i;

            if (locationIntentRegex.test(lowercaseMsg)) {
                console.log("[AgentCare] Location-related intent detected. Checking/Updating location...");
                if (!location) {
                    location = await getCurrentLocation();
                    if (location) setUserLocation(location);
                }
            }

            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    history,
                    lat: location?.lat,
                    lng: location?.lng
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to get response');
            }

            const data = await res.json();

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.response,
                actions: data.actions,
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Save to Firebase (Assistant response)
            if (userId) {
                setDoc(doc(db, 'chats', userId), {
                    history: arrayUnion({
                        ...assistantMessage,
                        timestamp: new Date().toISOString()
                    })
                }, { merge: true }).catch((err: any) => console.error("Firebase store error assistant:", err));
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please make sure the backend server is running at localhost:8000.',
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const startRecording = async () => {
        setVoiceError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks to release mic
                stream.getTracks().forEach(t => t.stop());
                streamRef.current = null;

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];

                if (audioBlob.size === 0) return;

                setIsTranscribing(true);
                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');

                    const res = await fetch('/api/stt', {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await res.json();

                    if (!res.ok || !data.transcript) {
                        setVoiceError(data.error || 'Could not transcribe audio. Please try again.');
                        return;
                    }

                    const transcript = data.transcript.trim();
                    if (transcript) {
                        // Auto-send transcript directly to agent — zero friction
                        await sendMessage(transcript);
                    }
                } catch (err) {
                    setVoiceError('Network error during transcription. Please try again.');
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setVoiceError('Microphone access denied. Please allow mic permissions in your browser.');
            } else {
                setVoiceError('Could not access microphone. Please check your device settings.');
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="p-6 rounded-full bg-primary/10 shadow-lg">
                            <Bot className="w-12 h-12 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">AgentCare AI</h2>
                            <p className="text-muted-foreground max-w-md">
                                I can check your vitals, book appointments with doctors, find nearby hospitals, and send emergency alerts. Just ask — or tap the mic and speak!
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(s)}
                                    className="p-3 text-sm text-left rounded-xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className={`max-w-[80%] ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3'
                                : 'bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {msg.actions.map((a, j) => (
                                            <ActionCard key={j} action={a} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-1">
                                    <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{input === "" ? "Detecting location & thinking..." : "Thinking & executing actions..."}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Voice Error Banner */}
            {voiceError && (
                <div className="mb-2 px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between gap-2">
                    <span>{voiceError}</span>
                    <button onClick={() => setVoiceError(null)} className="text-destructive/60 hover:text-destructive font-bold shrink-0">✕</button>
                </div>
            )}

            {/* Recording Status Banner */}
            {isRecording && (
                <div className="mb-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">Recording… Tap mic to stop and send</span>
                </div>
            )}

            {isTranscribing && (
                <div className="mb-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                    <span className="text-sm font-semibold text-primary">Transcribing your voice with Sarvam AI…</span>
                </div>
            )}

            {/* Location Status */}
            <div className="mb-2 flex items-center gap-2 px-1">
                <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {userLocation ? 'Location Active' : 'Fetching Location...'}
                </span>
                {!userLocation && (
                    <button
                        type="button"
                        onClick={() => getCurrentLocation().then(loc => loc && setUserLocation(loc))}
                        className="text-[10px] text-primary hover:underline ml-1"
                    >
                        Retry
                    </button>
                )}
            </div>

            {/* Input Bar */}
            <div className="border-t border-border pt-4">
                <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-3"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={isRecording ? "🎙 Listening... tap mic to stop" : "Ask AgentCare anything or tap the mic..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading || isRecording || isTranscribing}
                        className="flex-1 h-12 px-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base disabled:opacity-60"
                    />

                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={toggleRecording}
                        disabled={isLoading || isTranscribing}
                        title={isRecording ? "Stop recording" : "Start voice input"}
                        className={`
                            relative h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40 text-white'
                                : 'bg-secondary border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40'
                            }
                        `}
                    >
                        {isTranscribing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isRecording ? (
                            <>
                                <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-30" />
                                <MicOff className="w-5 h-5 relative" />
                            </>
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>

                    {/* Send Button */}
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim() || isRecording || isTranscribing}
                        className="h-12 w-12 rounded-xl p-0 bg-primary hover:bg-primary/90 shadow-lg shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">
                    Powered by Sarvam AI (Speech) · Groq LLaMA 3.3 70B (Agent)
                </p>
            </div>
        </div>
    );
}
