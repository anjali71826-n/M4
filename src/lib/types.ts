// Conversation state types
export interface ConversationState {
    currentIntent: 'BOOK' | 'RESCHEDULE' | 'CANCEL' | null;
    pendingSlots?: SlotOption[];
    originalEvent?: {
        id: string;
        summary: string;
        start: string;
        end: string;
    };
    awaitingConfirmation?: boolean;
    targetDate?: string;
    targetTime?: string;
}

export interface SlotOption {
    label: string;
    start: string;
    end: string;
}

// Chat message types
export interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    suggestedSlots?: SlotOption[];
}

// API request/response types
export interface ChatRequest {
    message: string;
    sessionState?: ConversationState;
}

export interface ChatResponse {
    reply: string;
    suggestedSlots?: SlotOption[];
    newState: ConversationState;
    success: boolean;
}

// Intent types
export type IntentType = 'BOOK' | 'RESCHEDULE' | 'CANCEL' | 'SELECT_SLOT' | 'CONFIRM' | 'UNKNOWN';

export interface ParsedIntent {
    type: IntentType;
    date?: Date;
    time?: string;
    slotIndex?: number;
    originalDate?: Date;
    newDate?: Date;
    newTime?: string;
}

// Calendar event types
export interface CalendarEvent {
    id: string;
    summary: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
}

// Sheets log entry
export interface LogEntry {
    timestamp: string;
    userRequest: string;
    actionTaken: string;
    appointmentDateTime: string;
    status: string;
}
