import { IntentType, ParsedIntent, ConversationState } from '../types';

// Keywords for each intent type
const BOOK_KEYWORDS = ['book', 'schedule', 'make', 'set up', 'arrange', 'create', 'new appointment'];
const RESCHEDULE_KEYWORDS = ['reschedule', 'move', 'change', 'shift', 'postpone', 'modify', 'update'];
const CANCEL_KEYWORDS = ['cancel', 'delete', 'remove', 'drop', 'clear'];
const SLOT_SELECTION_PATTERNS = [
    /\b(first|1st|option\s*1|slot\s*1|one)\b/i,
    /\b(second|2nd|option\s*2|slot\s*2|two)\b/i,
];
const CONFIRM_KEYWORDS = ['yes', 'confirm', 'okay', 'ok', 'sure', 'correct', 'right', 'yep', 'yeah'];

// Parse user message to determine intent
export function parseIntent(
    message: string,
    currentState?: ConversationState
): ParsedIntent {
    const lowerMessage = message.toLowerCase().trim();

    // First check if we're waiting for slot selection
    if (currentState?.pendingSlots && currentState.pendingSlots.length > 0) {
        // Check for slot selection
        for (let i = 0; i < SLOT_SELECTION_PATTERNS.length; i++) {
            if (SLOT_SELECTION_PATTERNS[i].test(lowerMessage)) {
                return {
                    type: 'SELECT_SLOT',
                    slotIndex: i,
                };
            }
        }
    }

    // Check for confirmation
    if (currentState?.awaitingConfirmation) {
        for (const keyword of CONFIRM_KEYWORDS) {
            if (lowerMessage.includes(keyword)) {
                return { type: 'CONFIRM' };
            }
        }
    }

    // Check for cancellation intent
    for (const keyword of CANCEL_KEYWORDS) {
        if (lowerMessage.includes(keyword)) {
            return { type: 'CANCEL' };
        }
    }

    // Check for reschedule intent
    for (const keyword of RESCHEDULE_KEYWORDS) {
        if (lowerMessage.includes(keyword)) {
            return { type: 'RESCHEDULE' };
        }
    }

    // Check for booking intent
    for (const keyword of BOOK_KEYWORDS) {
        if (lowerMessage.includes(keyword)) {
            return { type: 'BOOK' };
        }
    }

    // Default to unknown
    return { type: 'UNKNOWN' };
}

// Get intent display name for user-facing messages
export function getIntentName(type: IntentType): string {
    switch (type) {
        case 'BOOK':
            return 'book an appointment';
        case 'RESCHEDULE':
            return 'reschedule an appointment';
        case 'CANCEL':
            return 'cancel an appointment';
        case 'SELECT_SLOT':
            return 'select a time slot';
        case 'CONFIRM':
            return 'confirm';
        default:
            return 'unknown action';
    }
}

// Check if the message contains appointment/meeting context
export function hasAppointmentContext(message: string): boolean {
    const contextKeywords = ['appointment', 'meeting', 'slot', 'time', 'session', 'call'];
    const lowerMessage = message.toLowerCase();
    return contextKeywords.some(keyword => lowerMessage.includes(keyword));
}
