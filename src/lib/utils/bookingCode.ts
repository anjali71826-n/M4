/**
 * Generates a unique booking code in the format XX-XXXX
 * Example: NL-A742, KP-B391, etc.
 * 
 * Format:
 * - 2 uppercase letters (prefix)
 * - Hyphen
 * - 1 uppercase letter + 3 digits (suffix)
 */
export function generateBookingCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    // Generate 2 random uppercase letters for prefix
    const prefix = letters[Math.floor(Math.random() * 26)] +
        letters[Math.floor(Math.random() * 26)];

    // Generate 1 letter + 3 digits for suffix
    const suffix = letters[Math.floor(Math.random() * 26)] +
        digits[Math.floor(Math.random() * 10)] +
        digits[Math.floor(Math.random() * 10)] +
        digits[Math.floor(Math.random() * 10)];

    return `${prefix}-${suffix}`;
}
