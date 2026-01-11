// Date parsing utilities for natural language date/time extraction

interface ParsedDateTime {
    date: Date | null;
    time: string | null;
    error?: string;
}

// Month names for parsing
const MONTHS: { [key: string]: number } = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
};

// Day names for relative parsing
const DAYS: { [key: string]: number } = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
};

// Parse natural language date/time from message
export function parseDateTime(message: string): ParsedDateTime {
    const lowerMessage = message.toLowerCase();
    let date: Date | null = null;
    let time: string | null = null;

    // Parse relative dates
    if (lowerMessage.includes('today')) {
        date = new Date();
    } else if (lowerMessage.includes('tomorrow')) {
        date = new Date();
        date.setDate(date.getDate() + 1);
    } else if (lowerMessage.includes('day after tomorrow')) {
        date = new Date();
        date.setDate(date.getDate() + 2);
    }

    // Parse "next [day]" pattern
    const nextDayMatch = lowerMessage.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
    if (nextDayMatch) {
        const targetDay = DAYS[nextDayMatch[1].toLowerCase()];
        if (targetDay !== undefined) {
            date = getNextDayOfWeek(targetDay);
        }
    }

    // Parse "this [day]" pattern
    const thisDayMatch = lowerMessage.match(/this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
    if (thisDayMatch) {
        const targetDay = DAYS[thisDayMatch[1].toLowerCase()];
        if (targetDay !== undefined) {
            date = getThisDayOfWeek(targetDay);
        }
    }

    // Parse explicit date formats: "January 15", "Jan 15th", "15 January", "15th of January"
    const explicitDatePatterns = [
        /(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i,
        /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s*(\d{1,2})(?:st|nd|rd|th)?/i,
    ];

    for (const pattern of explicitDatePatterns) {
        const match = lowerMessage.match(pattern);
        if (match) {
            let day: number;
            let month: number;

            if (isNaN(parseInt(match[1]))) {
                // Month first format
                month = MONTHS[match[1].toLowerCase()];
                day = parseInt(match[2]);
            } else {
                // Day first format
                day = parseInt(match[1]);
                month = MONTHS[match[2].toLowerCase()];
            }

            if (!isNaN(day) && month !== undefined) {
                date = new Date();
                date.setMonth(month);
                date.setDate(day);

                // If the date is in the past, assume next year
                if (date < new Date()) {
                    date.setFullYear(date.getFullYear() + 1);
                }
            }
            break;
        }
    }

    // Parse time: "at 2pm", "at 2:30 pm", "at 14:00"
    const timePatterns = [
        /(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?/i,
        /(?:at\s+)?(\d{1,2})\s*(am|pm)/i,
    ];

    for (const pattern of timePatterns) {
        const match = lowerMessage.match(pattern);
        if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2] && !isNaN(parseInt(match[2])) ? parseInt(match[2]) : 0;
            const meridiem = match[3] || match[2];

            if (meridiem) {
                if (meridiem.toLowerCase() === 'pm' && hours < 12) {
                    hours += 12;
                } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
                    hours = 0;
                }
            }

            time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            break;
        }
    }

    return { date, time };
}

// Get the next occurrence of a day of week
function getNextDayOfWeek(dayOfWeek: number): Date {
    const date = new Date();
    const currentDay = date.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7; // At least 1 day ahead
    date.setDate(date.getDate() + daysUntil);
    return date;
}

// Get this week's occurrence of a day
function getThisDayOfWeek(dayOfWeek: number): Date {
    const date = new Date();
    const currentDay = date.getDay();
    const diff = dayOfWeek - currentDay;
    date.setDate(date.getDate() + diff);
    return date;
}

// Combine date and time into a single Date object
export function combineDateAndTime(date: Date, time: string): Date {
    const result = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

// Validate that date is not in the past
export function isDateInPast(date: Date): boolean {
    const now = new Date();
    return date < now;
}

// Format date for display
export function formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

// Format just the date
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

// Format just the time
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

// Parse "from X to Y" for rescheduling
export function parseRescheduleDates(message: string): {
    originalDate: Date | null;
    newDate: Date | null;
    newTime: string | null;
} {
    const lowerMessage = message.toLowerCase();

    // Split message by "to" to get old and new dates
    const parts = lowerMessage.split(/\s+to\s+/);

    if (parts.length >= 2) {
        const originalParsed = parseDateTime(parts[0]);
        const newParsed = parseDateTime(parts[1]);

        return {
            originalDate: originalParsed.date,
            newDate: newParsed.date,
            newTime: newParsed.time,
        };
    }

    // Fallback: try to find any date in the message
    const parsed = parseDateTime(message);
    return {
        originalDate: parsed.date,
        newDate: null,
        newTime: parsed.time,
    };
}
