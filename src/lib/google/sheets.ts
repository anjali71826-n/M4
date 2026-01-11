import { getSheetsClient, getSpreadsheetId } from './auth';
import { LogEntry } from '../types';

const SHEET_NAME = 'Appointments';

// Ensure the Appointments sheet exists, create if not
async function ensureSheetExists(): Promise<void> {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    try {
        // Try to get the spreadsheet to see if Appointments sheet exists
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        const sheetExists = spreadsheet.data.sheets?.some(
            (sheet) => sheet.properties?.title === SHEET_NAME
        );

        if (!sheetExists) {
            // Create the Appointments sheet
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: SHEET_NAME,
                                },
                            },
                        },
                    ],
                },
            });

            // Add headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${SHEET_NAME}!A1:F1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Timestamp', 'User Request', 'Action', 'Appointment DateTime', 'Status', 'Booking Code']],
                },
            });

            console.log('✅ Created Appointments sheet with headers');
        }
    } catch (error) {
        console.error('Error ensuring sheet exists:', error);
        throw error;
    }
}

// Log an action to Google Sheets
export async function logAction(entry: LogEntry): Promise<void> {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    try {
        // First ensure the sheet exists
        await ensureSheetExists();

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${SHEET_NAME}!A:F`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    entry.timestamp,
                    entry.userRequest,
                    entry.actionTaken,
                    entry.appointmentDateTime,
                    entry.status,
                    entry.bookingCode || '',
                ]],
            },
        });
        console.log('✅ Successfully logged to Google Sheets');
    } catch (error) {
        console.error('❌ Error logging to sheets:', error);
        throw error; // Re-throw so caller knows it failed
    }
}

// Log a booking action
export async function logBooking(
    userRequest: string,
    appointmentDateTime: string,
    bookingCode?: string
): Promise<void> {
    await logAction({
        timestamp: new Date().toISOString(),
        userRequest,
        actionTaken: 'BOOKED',
        appointmentDateTime,
        status: 'Confirmed',
        bookingCode,
    });
}

// Log a reschedule action
export async function logReschedule(
    userRequest: string,
    newAppointmentDateTime: string,
    bookingCode?: string
): Promise<void> {
    await logAction({
        timestamp: new Date().toISOString(),
        userRequest,
        actionTaken: 'RESCHEDULED',
        appointmentDateTime: newAppointmentDateTime,
        status: 'Updated',
        bookingCode,
    });
}

// Log a cancellation action
export async function logCancellation(
    userRequest: string,
    appointmentDateTime: string,
    bookingCode?: string
): Promise<void> {
    await logAction({
        timestamp: new Date().toISOString(),
        userRequest,
        actionTaken: 'CANCELLED',
        appointmentDateTime,
        status: 'Cancelled',
        bookingCode,
    });
}
