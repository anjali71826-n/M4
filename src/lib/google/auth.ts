import { google } from 'googleapis';

// Get service account credentials from environment variables
let serviceAccountCredentials: {
    client_email: string;
    private_key: string;
    project_id: string;
} | null = null;

function getServiceAccountCredentials() {
    if (serviceAccountCredentials) {
        return serviceAccountCredentials;
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.GOOGLE_PROJECT_ID;

    if (!clientEmail || !privateKey || !projectId) {
        throw new Error(
            'Missing required environment variables: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID'
        );
    }

    serviceAccountCredentials = {
        client_email: clientEmail,
        private_key: privateKey,
        project_id: projectId,
    };

    return serviceAccountCredentials;
}

// Create JWT auth client for Google APIs
export function getGoogleAuth(scopes: string[]) {
    const credentials = getServiceAccountCredentials();

    if (!credentials) {
        throw new Error('Service account credentials not found');
    }

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes,
    });

    return auth;
}

// Get Calendar API client
export function getCalendarClient() {
    const auth = getGoogleAuth([
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ]);

    return google.calendar({ version: 'v3', auth });
}

// Get Sheets API client
export function getSheetsClient() {
    const auth = getGoogleAuth([
        'https://www.googleapis.com/auth/spreadsheets',
    ]);

    return google.sheets({ version: 'v4', auth });
}

// Get Gmail API client (for sending emails)
export function getGmailAuth() {
    const auth = getGoogleAuth([
        'https://www.googleapis.com/auth/gmail.send',
    ]);

    return auth;
}

// Calendar ID from environment
export function getCalendarId(): string {
    return process.env.GOOGLE_CALENDAR_ID || '';
}

// Spreadsheet ID from environment
export function getSpreadsheetId(): string {
    return process.env.GOOGLE_SPREADSHEET_ID || '';
}

// Email addresses from environment
export function getEmailConfig() {
    return {
        senderEmail: process.env.GMAIL_SENDER_EMAIL || '',
        advisorEmail: process.env.ADVISOR_EMAIL || '',
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
    };
}
