'use client';

import { useState, useEffect, useCallback } from 'react';

interface VoiceInputProps {
    onResult: (transcript: string) => void;
    disabled?: boolean;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionClass {
    new(): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionClass;
        webkitSpeechRecognition: SpeechRecognitionClass;
    }
}

export default function VoiceInput({ onResult, disabled }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognitionAPI) {
            setIsSupported(true);
            const recognitionInstance = new SpeechRecognitionAPI();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onstart = () => {
                setIsListening(true);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            recognitionInstance.onerror = () => {
                setIsListening(false);
            };

            recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            setRecognition(recognitionInstance);
        }
    }, [onResult]);

    const toggleListening = useCallback(() => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.error('Speech recognition error:', error);
            }
        }
    }, [recognition, isListening]);

    if (!isSupported) {
        return (
            <button
                disabled
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center cursor-not-allowed"
                title="Voice input not supported in this browser"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                </svg>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={toggleListening}
                disabled={disabled}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isListening
                        ? 'bg-red-500 text-white scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
            >
                {isListening ? (
                    <svg
                        className="w-5 h-5 animate-pulse"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <rect x="6" y="4" width="4" height="16" rx="2" />
                        <rect x="14" y="4" width="4" height="16" rx="2" />
                    </svg>
                ) : (
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                    </svg>
                )}
            </button>

            {/* Recording indicator ring */}
            {isListening && (
                <div className="absolute inset-0 rounded-xl border-2 border-red-500 recording-pulse pointer-events-none" />
            )}
        </div>
    );
}
