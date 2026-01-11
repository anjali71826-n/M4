'use client';

import { SlotOption } from '@/lib/types';

interface SlotSuggestionsProps {
    slots: SlotOption[];
    onSelect: (index: number) => void;
}

export default function SlotSuggestions({ slots, onSelect }: SlotSuggestionsProps) {
    return (
        <div className="flex flex-col gap-3 animate-fade-in">
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-1">
                Select an available time slot:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                {slots.map((slot, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(index)}
                        className="slot-card flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                    Option {index + 1}
                                </p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {slot.label}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Available
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Select →
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
