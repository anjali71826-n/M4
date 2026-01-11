import { getCalendarClient, getCalendarId } from './auth';
import { CalendarEvent, SlotOption } from '../types';

const APPOINTMENT_DURATION_MINUTES = 30;
const BUSINESS_HOUR_START = 9; // 9 AM
const BUSINESS_HOUR_END = 18; // 6 PM

// Check if a specific time slot is available
export async function checkAvailability(
    startTime: Date,
    endTime: Date
): Promise<boolean> {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: calendarId }],
            },
        });

        const busy = response.data.calendars?.[calendarId]?.busy || [];
        return busy.length === 0;
    } catch (error) {
        console.error('Error checking availability:', error);
        throw error;
    }
}

// Find next N available slots on a given date
export async function findNextAvailableSlots(
    date: Date,
    count: number = 2
): Promise<SlotOption[]> {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    // Set up the date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(BUSINESS_HOUR_START, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(BUSINESS_HOUR_END, 0, 0, 0);

    try {
        // Get all busy times for the day
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                items: [{ id: calendarId }],
            },
        });

        const busySlots = response.data.calendars?.[calendarId]?.busy || [];
        const availableSlots: SlotOption[] = [];

        // Iterate through the day in 30-minute increments
        let currentTime = new Date(startOfDay);

        while (currentTime < endOfDay && availableSlots.length < count) {
            const slotEnd = new Date(currentTime.getTime() + APPOINTMENT_DURATION_MINUTES * 60000);

            // Check if this slot overlaps with any busy period
            const isAvailable = !busySlots.some((busy) => {
                const busyStart = new Date(busy.start!);
                const busyEnd = new Date(busy.end!);
                return currentTime < busyEnd && slotEnd > busyStart;
            });

            if (isAvailable && slotEnd <= endOfDay) {
                availableSlots.push({
                    label: formatSlotLabel(currentTime, slotEnd),
                    start: currentTime.toISOString(),
                    end: slotEnd.toISOString(),
                });
            }

            // Move to next slot
            currentTime = new Date(currentTime.getTime() + APPOINTMENT_DURATION_MINUTES * 60000);
        }

        return availableSlots;
    } catch (error) {
        console.error('Error finding available slots:', error);
        throw error;
    }
}

// Format slot for display
function formatSlotLabel(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };
    const startStr = start.toLocaleTimeString('en-US', options);
    const endStr = end.toLocaleTimeString('en-US', options);
    const dateStr = start.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    return `${dateStr}, ${startStr} - ${endStr}`;
}

// Create a new calendar event
export async function createEvent(
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string
): Promise<CalendarEvent> {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    try {
        const response = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: title,
                description: description || 'Appointment booked via Voice Scheduler',
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
            },
        });

        return {
            id: response.data.id!,
            summary: response.data.summary!,
            start: {
                dateTime: response.data.start?.dateTime!,
                timeZone: response.data.start?.timeZone,
            },
            end: {
                dateTime: response.data.end?.dateTime!,
                timeZone: response.data.end?.timeZone,
            },
        };
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

// Find event by date
export async function findEventByDate(date: Date): Promise<CalendarEvent | null> {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const response = await calendar.events.list({
            calendarId,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];

        if (events.length === 0) {
            return null;
        }

        // Return the first event found
        const event = events[0];
        return {
            id: event.id!,
            summary: event.summary || 'Appointment',
            start: {
                dateTime: event.start?.dateTime || event.start?.date!,
                timeZone: event.start?.timeZone,
            },
            end: {
                dateTime: event.end?.dateTime || event.end?.date!,
                timeZone: event.end?.timeZone,
            },
        };
    } catch (error) {
        console.error('Error finding event:', error);
        throw error;
    }
}

// Update/reschedule an event
export async function updateEvent(
    eventId: string,
    newStartTime: Date,
    newEndTime: Date
): Promise<CalendarEvent> {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    try {
        const response = await calendar.events.patch({
            calendarId,
            eventId,
            requestBody: {
                start: {
                    dateTime: newStartTime.toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
                end: {
                    dateTime: newEndTime.toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
            },
        });

        return {
            id: response.data.id!,
            summary: response.data.summary!,
            start: {
                dateTime: response.data.start?.dateTime!,
                timeZone: response.data.start?.timeZone,
            },
            end: {
                dateTime: response.data.end?.dateTime!,
                timeZone: response.data.end?.timeZone,
            },
        };
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

// Delete/cancel an event
export async function deleteEvent(eventId: string): Promise<void> {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    try {
        await calendar.events.delete({
            calendarId,
            eventId,
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

// Get end time based on start time and default duration
export function getEndTime(startTime: Date): Date {
    return new Date(startTime.getTime() + APPOINTMENT_DURATION_MINUTES * 60000);
}
