import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'service_account.json');

let serviceAccountCredentials: {
    client_email: string;
    private_key: string;
    project_id: string;
} | null = null;

function getServiceAccountCredentials() {
    if (serviceAccountCredentials) {
        return serviceAccountCredentials;
    }

    try {
        const content = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
        serviceAccountCredentials = JSON.parse(content);
        return serviceAccountCredentials;
    } catch (error) {
        console.error('Error loading service account:', error);
        throw new Error('Failed to load service account credentials');
    }
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
