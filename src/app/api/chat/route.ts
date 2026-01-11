import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse, ConversationState, SlotOption } from '@/lib/types';
import { parseIntent } from '@/lib/agent/intent-parser';
import {
    parseDateTime,
    combineDateAndTime,
    isDateInPast,
    formatDateTime,
    parseRescheduleDates
} from '@/lib/agent/date-parser';
import {
    createInitialState,
    resetState,
    setPendingSlots,
    getSelectedSlot,
    setOriginalEvent,
    clearPendingSlots
} from '@/lib/agent/conversation';
import {
    checkAvailability,
    findNextAvailableSlots,
    createEvent,
    findEventByDate,
    updateEvent,
    deleteEvent,
    getEndTime,
} from '@/lib/google/calendar';
import { logBooking, logReschedule, logCancellation } from '@/lib/google/sheets';
import {
    sendBookingConfirmation,
    sendRescheduleConfirmation,
    sendCancellationConfirmation
} from '@/lib/google/gmail';

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
    try {
        const body: ChatRequest = await request.json();
        const { message, sessionState } = body;

        // Initialize state if not provided
        const currentState: ConversationState = sessionState || createInitialState();

        // Parse the user's intent
        const intent = parseIntent(message, currentState);

        // Handle based on intent type
        switch (intent.type) {
            case 'SELECT_SLOT':
                return handleSlotSelection(message, currentState, intent.slotIndex!);

            case 'BOOK':
                return handleBooking(message, currentState);

            case 'RESCHEDULE':
                return handleReschedule(message, currentState);

            case 'CANCEL':
                return handleCancellation(message, currentState);

            case 'CONFIRM':
                return handleConfirmation(message, currentState);

            default:
                return NextResponse.json({
                    reply: "I'm your appointment scheduling assistant. I can help you:\n\n• **Book** an appointment: \"Book an appointment on Monday at 2pm\"\n• **Reschedule** an appointment: \"Reschedule my appointment to Tuesday at 3pm\"\n• **Cancel** an appointment: \"Cancel my appointment on Wednesday\"\n\nHow can I help you today?",
                    newState: currentState,
                    success: true,
                });
        }
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({
            reply: 'I apologize, but I encountered an error processing your request. Please try again.',
            newState: createInitialState(),
            success: false,
        });
    }
}

// Handle booking intent
async function handleBooking(
    message: string,
    state: ConversationState
): Promise<NextResponse<ChatResponse>> {
    const { date, time } = parseDateTime(message);

    if (!date) {
        return NextResponse.json({
            reply: "I'd be happy to book an appointment for you. Could you please specify the date? For example, \"January 20th\" or \"next Monday\".",
            newState: { ...state, currentIntent: 'BOOK' },
            success: true,
        });
    }

    if (!time) {
        return NextResponse.json({
            reply: `Great! I can see you want to book for ${formatDate(date)}. What time would you prefer? For example, \"at 2pm\" or \"at 10:30am\".`,
            newState: { ...state, currentIntent: 'BOOK', targetDate: date.toISOString() },
            success: true,
        });
    }

    const appointmentTime = combineDateAndTime(date, time);

    // Check if date is in the past
    if (isDateInPast(appointmentTime)) {
        return NextResponse.json({
            reply: "I can't book appointments in the past. Please choose a future date and time.",
            newState: state,
            success: false,
        });
    }

    const endTime = getEndTime(appointmentTime);

    // Check availability
    try {
        const isAvailable = await checkAvailability(appointmentTime, endTime);

        if (isAvailable) {
            // Book the appointment
            const event = await createEvent(
                'Appointment - Voice Scheduler',
                appointmentTime,
                endTime
            );

            const formattedDateTime = formatDateTime(appointmentTime);

            // Log to sheets and send email with proper error handling
            try {
                await logBooking(message, formattedDateTime);
                console.log('✅ Logged to sheets successfully');
            } catch (logError) {
                console.error('❌ Failed to log to sheets:', logError);
            }

            try {
                const emailSent = await sendBookingConfirmation(formattedDateTime);
                console.log(emailSent ? '✅ Email sent successfully' : '⚠️ Email not sent');
            } catch (emailError) {
                console.error('❌ Failed to send email:', emailError);
            }

            return NextResponse.json({
                reply: `✅ **Appointment Confirmed!**\n\n📅 **Date:** ${formattedDateTime}\n\nYour appointment has been successfully booked. You'll receive a confirmation email shortly.`,
                newState: resetState(),
                success: true,
            });
        } else {
            // Find alternative slots
            const availableSlots = await findNextAvailableSlots(date, 2);

            if (availableSlots.length === 0) {
                return NextResponse.json({
                    reply: `I'm sorry, but there are no available slots on ${formatDate(date)}. Would you like to try a different date?`,
                    newState: state,
                    success: true,
                });
            }

            return NextResponse.json({
                reply: `The requested time is not available. Here are the next available slots for ${formatDate(date)}:`,
                suggestedSlots: availableSlots,
                newState: setPendingSlots(state, availableSlots, 'BOOK'),
                success: true,
            });
        }
    } catch (error) {
        console.error('Booking error:', error);
        return NextResponse.json({
            reply: 'I encountered an error while checking availability. Please try again.',
            newState: state,
            success: false,
        });
    }
}

// Handle slot selection
async function handleSlotSelection(
    message: string,
    state: ConversationState,
    slotIndex: number
): Promise<NextResponse<ChatResponse>> {
    const selectedSlot = getSelectedSlot(state, slotIndex);

    if (!selectedSlot) {
        return NextResponse.json({
            reply: "I couldn't find that slot. Could you please select from the available options?",
            newState: state,
            success: false,
        });
    }

    const startTime = new Date(selectedSlot.start);
    const endTime = new Date(selectedSlot.end);
    const formattedDateTime = formatDateTime(startTime);

    try {
        if (state.currentIntent === 'RESCHEDULE' && state.originalEvent) {
            // Update the existing event
            await updateEvent(state.originalEvent.id, startTime, endTime);

            const oldDateTime = new Date(state.originalEvent.start);
            const formattedOldDateTime = formatDateTime(oldDateTime);

            // Log and send email with proper error handling
            try {
                await logReschedule(message, formattedDateTime);
                console.log('✅ Logged reschedule to sheets');
            } catch (logError) {
                console.error('❌ Failed to log reschedule:', logError);
            }

            try {
                await sendRescheduleConfirmation(formattedOldDateTime, formattedDateTime);
                console.log('✅ Reschedule email sent');
            } catch (emailError) {
                console.error('❌ Failed to send reschedule email:', emailError);
            }

            return NextResponse.json({
                reply: `✅ **Appointment Rescheduled!**\n\n📅 **New Time:** ${formattedDateTime}\n\nYour appointment has been successfully moved from ${formattedOldDateTime}.`,
                newState: resetState(),
                success: true,
            });
        } else {
            // Create new booking
            await createEvent('Appointment - Voice Scheduler', startTime, endTime);

            // Log and send email with proper error handling
            try {
                await logBooking(message, formattedDateTime);
                console.log('✅ Logged booking to sheets');
            } catch (logError) {
                console.error('❌ Failed to log booking:', logError);
            }

            try {
                await sendBookingConfirmation(formattedDateTime);
                console.log('✅ Booking email sent');
            } catch (emailError) {
                console.error('❌ Failed to send booking email:', emailError);
            }

            return NextResponse.json({
                reply: `✅ **Appointment Confirmed!**\n\n📅 **Date:** ${formattedDateTime}\n\nYour appointment has been successfully booked.`,
                newState: resetState(),
                success: true,
            });
        }
    } catch (error) {
        console.error('Slot selection error:', error);
        return NextResponse.json({
            reply: 'I encountered an error booking the selected slot. Please try again.',
            newState: clearPendingSlots(state),
            success: false,
        });
    }
}

// Handle reschedule intent
async function handleReschedule(
    message: string,
    state: ConversationState
): Promise<NextResponse<ChatResponse>> {
    const { originalDate, newDate, newTime } = parseRescheduleDates(message);

    // If we have an original event in state, use that
    if (state.originalEvent && newDate && newTime) {
        const newAppointmentTime = combineDateAndTime(newDate, newTime);
        const newEndTime = getEndTime(newAppointmentTime);

        if (isDateInPast(newAppointmentTime)) {
            return NextResponse.json({
                reply: "I can't reschedule to a time in the past. Please choose a future date and time.",
                newState: state,
                success: false,
            });
        }

        const isAvailable = await checkAvailability(newAppointmentTime, newEndTime);

        if (isAvailable) {
            await updateEvent(state.originalEvent.id, newAppointmentTime, newEndTime);
            const formattedDateTime = formatDateTime(newAppointmentTime);
            const oldDateTime = formatDateTime(new Date(state.originalEvent.start));

            try {
                await logReschedule(message, formattedDateTime);
                console.log('✅ Logged reschedule to sheets');
            } catch (logError) {
                console.error('❌ Failed to log reschedule:', logError);
            }

            try {
                await sendRescheduleConfirmation(oldDateTime, formattedDateTime);
                console.log('✅ Reschedule email sent');
            } catch (emailError) {
                console.error('❌ Failed to send reschedule email:', emailError);
            }

            return NextResponse.json({
                reply: `✅ **Appointment Rescheduled!**\n\n📅 **New Time:** ${formattedDateTime}\n\nYour appointment has been moved from ${oldDateTime}.`,
                newState: resetState(),
                success: true,
            });
        } else {
            const availableSlots = await findNextAvailableSlots(newDate, 2);

            return NextResponse.json({
                reply: `The requested time is not available. Here are alternative slots:`,
                suggestedSlots: availableSlots,
                newState: setPendingSlots(
                    setOriginalEvent(state, state.originalEvent),
                    availableSlots,
                    'RESCHEDULE'
                ),
                success: true,
            });
        }
    }

    // Try to find the original appointment
    if (!originalDate) {
        const parsed = parseDateTime(message);
        if (parsed.date) {
            try {
                const event = await findEventByDate(parsed.date);
                if (event) {
                    return NextResponse.json({
                        reply: `I found your appointment on ${formatDateTime(new Date(event.start.dateTime))}. When would you like to reschedule it to?`,
                        newState: setOriginalEvent({ ...state, currentIntent: 'RESCHEDULE' }, event as any),
                        success: true,
                    });
                } else {
                    return NextResponse.json({
                        reply: `I couldn't find an appointment on ${formatDate(parsed.date)}. Please check the date and try again.`,
                        newState: state,
                        success: false,
                    });
                }
            } catch (error) {
                console.error('Error finding event:', error);
            }
        }

        return NextResponse.json({
            reply: "To reschedule, please tell me which appointment you'd like to move. For example: \"Reschedule my appointment on Monday to Tuesday at 3pm\".",
            newState: { ...state, currentIntent: 'RESCHEDULE' },
            success: true,
        });
    }

    // Find the original event
    try {
        const event = await findEventByDate(originalDate);

        if (!event) {
            return NextResponse.json({
                reply: `I couldn't find an appointment on ${formatDate(originalDate)}. Please check the date and try again.`,
                newState: state,
                success: false,
            });
        }

        // If we have the new date/time, try to reschedule
        if (newDate && newTime) {
            const newAppointmentTime = combineDateAndTime(newDate, newTime);
            const newEndTime = getEndTime(newAppointmentTime);

            if (isDateInPast(newAppointmentTime)) {
                return NextResponse.json({
                    reply: "I can't reschedule to a time in the past. Please choose a future date and time.",
                    newState: setOriginalEvent(state, event as any),
                    success: false,
                });
            }

            const isAvailable = await checkAvailability(newAppointmentTime, newEndTime);

            if (isAvailable) {
                await updateEvent(event.id, newAppointmentTime, newEndTime);
                const formattedDateTime = formatDateTime(newAppointmentTime);
                const oldDateTime = formatDateTime(new Date(event.start.dateTime));

                try {
                    await logReschedule(message, formattedDateTime);
                    console.log('✅ Logged reschedule to sheets');
                } catch (logError) {
                    console.error('❌ Failed to log reschedule:', logError);
                }

                try {
                    await sendRescheduleConfirmation(oldDateTime, formattedDateTime);
                    console.log('✅ Reschedule email sent');
                } catch (emailError) {
                    console.error('❌ Failed to send reschedule email:', emailError);
                }

                return NextResponse.json({
                    reply: `✅ **Appointment Rescheduled!**\n\n📅 **New Time:** ${formattedDateTime}\n\nYour appointment has been moved from ${oldDateTime}.`,
                    newState: resetState(),
                    success: true,
                });
            } else {
                const availableSlots = await findNextAvailableSlots(newDate, 2);

                return NextResponse.json({
                    reply: `The requested time is not available. Here are alternative slots:`,
                    suggestedSlots: availableSlots,
                    newState: setPendingSlots(
                        setOriginalEvent(state, event as any),
                        availableSlots,
                        'RESCHEDULE'
                    ),
                    success: true,
                });
            }
        }

        // Ask for new date/time
        return NextResponse.json({
            reply: `I found your appointment on ${formatDateTime(new Date(event.start.dateTime))}. When would you like to reschedule it to?`,
            newState: setOriginalEvent({ ...state, currentIntent: 'RESCHEDULE' }, event as any),
            success: true,
        });
    } catch (error) {
        console.error('Reschedule error:', error);
        return NextResponse.json({
            reply: 'I encountered an error while trying to reschedule. Please try again.',
            newState: state,
            success: false,
        });
    }
}

// Handle cancellation intent
async function handleCancellation(
    message: string,
    state: ConversationState
): Promise<NextResponse<ChatResponse>> {
    const { date } = parseDateTime(message);

    if (!date) {
        return NextResponse.json({
            reply: "Which appointment would you like to cancel? Please specify the date, for example: \"Cancel my appointment on Monday\" or \"Cancel appointment on January 20th\".",
            newState: { ...state, currentIntent: 'CANCEL' },
            success: true,
        });
    }

    try {
        const event = await findEventByDate(date);

        if (!event) {
            return NextResponse.json({
                reply: `I couldn't find an appointment on ${formatDate(date)}. Please check the date and try again.`,
                newState: state,
                success: false,
            });
        }

        const formattedDateTime = formatDateTime(new Date(event.start.dateTime));

        // Delete the event
        await deleteEvent(event.id);

        // Log and send email with proper error handling
        try {
            await logCancellation(message, formattedDateTime);
            console.log('✅ Logged cancellation to sheets');
        } catch (logError) {
            console.error('❌ Failed to log cancellation:', logError);
        }

        try {
            await sendCancellationConfirmation(formattedDateTime);
            console.log('✅ Cancellation email sent');
        } catch (emailError) {
            console.error('❌ Failed to send cancellation email:', emailError);
        }

        return NextResponse.json({
            reply: `✅ **Appointment Cancelled**\n\nYour appointment on ${formattedDateTime} has been cancelled. A confirmation email has been sent.`,
            newState: resetState(),
            success: true,
        });
    } catch (error) {
        console.error('Cancellation error:', error);
        return NextResponse.json({
            reply: 'I encountered an error while cancelling the appointment. Please try again.',
            newState: state,
            success: false,
        });
    }
}

// Handle confirmation
async function handleConfirmation(
    message: string,
    state: ConversationState
): Promise<NextResponse<ChatResponse>> {
    // If awaiting confirmation for something specific, handle it
    if (state.awaitingConfirmation && state.targetDate && state.targetTime) {
        const date = new Date(state.targetDate);
        const appointmentTime = combineDateAndTime(date, state.targetTime);
        const endTime = getEndTime(appointmentTime);

        await createEvent('Appointment - Voice Scheduler', appointmentTime, endTime);
        const formattedDateTime = formatDateTime(appointmentTime);

        try {
            await logBooking(message, formattedDateTime);
            console.log('✅ Logged confirmation to sheets');
        } catch (logError) {
            console.error('❌ Failed to log confirmation:', logError);
        }

        try {
            await sendBookingConfirmation(formattedDateTime);
            console.log('✅ Confirmation email sent');
        } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
        }

        return NextResponse.json({
            reply: `✅ **Appointment Confirmed!**\n\n📅 **Date:** ${formattedDateTime}\n\nYour appointment has been booked.`,
            newState: resetState(),
            success: true,
        });
    }

    return NextResponse.json({
        reply: "I'm not sure what you'd like to confirm. Could you please provide more details?",
        newState: state,
        success: true,
    });
}

// Helper to format date for display
function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}
