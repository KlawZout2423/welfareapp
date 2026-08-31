/**
 * Utility functions for Ghanaian phone number sanitization and validation.
 */

/**
 * Known placeholder / fake numbers that should be filtered out
 */
const PLACEHOLDER_NUMBERS = [
  '0240000000',
  '0200000000',
  '0500000000',
  '0000000000',
  '1234567890',
  '+233240000000',
  '+233200000000',
  '+233500000000'
];

/**
 * Cleans and standardizes phone number inputs into E.164 standard format (+233...).
 * @param {string} phoneStr Raw input string
 * @returns {string} Sanitized phone number or empty string if invalid
 */
export function sanitizeGhanaPhone(phoneStr) {
  if (!phoneStr || typeof phoneStr !== 'string') return '';

  // Remove spaces, hyphens, parentheses, and trailing spaces
  let cleaned = phoneStr.replace(/[\s\-\(\)]/g, '').trim();

  // If starts with 0 (e.g., "0241234567"), convert to "+233241234567"
  if (/^0[2357]\d{8}$/.test(cleaned)) {
    cleaned = `+233${cleaned.substring(1)}`;
  } 
  // If starts with "233" without leading "+" (e.g., "233241234567")
  else if (/^233[2357]\d{8}$/.test(cleaned)) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Validates whether a phone number is valid and not a placeholder.
 * @param {string} phoneStr Raw or sanitized phone number
 * @returns {boolean} True if valid mobile number for SMS dispatch
 */
export function isValidPhone(phoneStr) {
  const sanitized = sanitizeGhanaPhone(phoneStr);
  if (!sanitized) return false;

  // Check against known placeholder numbers
  const digitsOnly = sanitized.replace(/\+/g, '');
  if (PLACEHOLDER_NUMBERS.includes(digitsOnly) || PLACEHOLDER_NUMBERS.includes(`+${digitsOnly}`)) {
    return false;
  }

  // Must match E.164 Ghanaian format (+233 followed by 9 digits) or generic E.164 (+1 to +999 followed by digits)
  const ghanaE164Regex = /^\+233[2357]\d{8}$/;
  const genericE164Regex = /^\+[1-9]\d{9,14}$/;

  return ghanaE164Regex.test(sanitized) || genericE164Regex.test(sanitized);
}

/**
 * Takes an array of raw phone numbers, sanitizes them, deduplicates, and filters out invalid numbers.
 * @param {string[]} phoneArray Array of phone number strings
 * @returns {{ validNumbers: string[], invalidNumbers: string[] }}
 */
export function processPhoneNumbers(phoneArray) {
  if (!Array.isArray(phoneArray)) return { validNumbers: [], invalidNumbers: [] };

  const validNumbers = new Set();
  const invalidNumbers = [];

  for (const raw of phoneArray) {
    const sanitized = sanitizeGhanaPhone(raw);
    if (isValidPhone(sanitized)) {
      validNumbers.add(sanitized);
    } else if (raw && raw.trim()) {
      invalidNumbers.push(raw.trim());
    }
  }

  return {
    validNumbers: Array.from(validNumbers),
    invalidNumbers
  };
}
