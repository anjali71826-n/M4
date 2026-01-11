import { ConversationState, SlotOption } from '../types';

// Create initial empty conversation state
export function createInitialState(): ConversationState {
    return {
        currentIntent: null,
        pendingSlots: undefined,
        originalEvent: undefined,
        awaitingConfirmation: false,
        targetDate: undefined,
        targetTime: undefined,
    };
}

// Reset state after completing an action
export function resetState(): ConversationState {
    return createInitialState();
}

// Update state for pending slot selection
export function setPendingSlots(
    state: ConversationState,
    slots: SlotOption[],
    intent: 'BOOK' | 'RESCHEDULE'
): ConversationState {
    return {
        ...state,
        currentIntent: intent,
        pendingSlots: slots,
        awaitingConfirmation: false,
    };
}

// Update state for awaiting confirmation
export function setAwaitingConfirmation(
    state: ConversationState,
    targetDate: string,
    targetTime: string
): ConversationState {
    return {
        ...state,
        awaitingConfirmation: true,
        targetDate,
        targetTime,
    };
}

// Store original event for rescheduling
export function setOriginalEvent(
    state: ConversationState,
    event: { id: string; summary: string; start: string; end: string }
): ConversationState {
    return {
        ...state,
        originalEvent: event,
    };
}

// Clear pending slots after selection
export function clearPendingSlots(state: ConversationState): ConversationState {
    return {
        ...state,
        pendingSlots: undefined,
    };
}

// Get selected slot from pending slots
export function getSelectedSlot(
    state: ConversationState,
    index: number
): SlotOption | null {
    if (!state.pendingSlots || index >= state.pendingSlots.length) {
        return null;
    }
    return state.pendingSlots[index];
}

// Check if state has pending slots
export function hasPendingSlots(state: ConversationState): boolean {
    return !!state.pendingSlots && state.pendingSlots.length > 0;
}

// Check if state is awaiting confirmation
export function isAwaitingConfirmation(state: ConversationState): boolean {
    return !!state.awaitingConfirmation;
}

// Get current intent from state
export function getCurrentIntent(state: ConversationState): string | null {
    return state.currentIntent;
}
