'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ConversationState, SlotOption, ChatResponse } from '@/lib/types';
import VoiceInput from './VoiceInput';
import SlotSuggestions from './SlotSuggestions';

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'agent',
            content: "👋 Hello! I'm your appointment scheduling assistant.\n\nI can help you:\n• **Book** a new appointment\n• **Reschedule** an existing appointment\n• **Cancel** an appointment\n\nJust speak or type your request!",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionState, setSessionState] = useState<ConversationState>({
        currentIntent: null,
    });
    const [pendingSlots, setPendingSlots] = useState<SlotOption[] | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle sending a message
    const handleSend = async (text?: string) => {
        const messageText = text || inputValue.trim();
        if (!messageText || isLoading) return;

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setPendingSlots(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    sessionState,
                }),
            });

            const data: ChatResponse = await response.json();

            // Add agent response
            const agentMessage: Message = {
                id: `agent-${Date.now()}`,
                role: 'agent',
                content: data.reply,
                timestamp: new Date(),
                suggestedSlots: data.suggestedSlots,
            };

            setMessages((prev) => [...prev, agentMessage]);
            setSessionState(data.newState);

            if (data.suggestedSlots && data.suggestedSlots.length > 0) {
                setPendingSlots(data.suggestedSlots);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'agent',
                content: 'I apologize, but I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle slot selection
    const handleSlotSelect = (index: number) => {
        const slotText = index === 0 ? 'Option 1' : 'Option 2';
        handleSend(slotText);
    };

    // Handle voice input result
    const handleVoiceResult = (transcript: string) => {
        setInputValue(transcript);
        // Optionally auto-send after voice input
        // handleSend(transcript);
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-6rem)] flex flex-col px-4">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto chat-scrollbar py-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message-bubble flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50 rounded-bl-md'
                                }`}
                        >
                            <div
                                className="text-sm leading-relaxed whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                    __html: message.content
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\n/g, '<br/>')
                                }}
                            />
                            <div
                                className={`text-xs mt-2 ${message.role === 'user'
                                        ? 'text-blue-100'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}
                            >
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Slot suggestions */}
                {pendingSlots && pendingSlots.length > 0 && !isLoading && (
                    <SlotSuggestions slots={pendingSlots} onSelect={handleSlotSelect} />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="py-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                    <VoiceInput onResult={handleVoiceResult} disabled={isLoading} />

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type or speak your message..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || isLoading}
                        className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md shadow-blue-500/25"
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
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </button>
                </div>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
                    Press Enter to send • Click microphone for voice input
                </p>
            </div>
        </div>
    );
}
