/**
 * Phone mask utility for Brazilian phone numbers:
 * Formats digits progressively into:
 * - 2 digits: (XX
 * - 3 to 6 digits: (XX) XXXX
 * - 7 to 10 digits: (XX) XXXX-XXXX (landline or typing)
 * - 11 digits: (XX) XXXXX-XXXX (mobile / WhatsApp)
 *
 * Can also format directly as:
 * formatPhone(value) -> (XX) XXXXX-XXXX
 */

export function maskPhone(value: string): string {
  if (!value) return '';

  // Extract only digits
  let digits = value.replace(/\D/g, '');

  // Strip country code if user typed +55 or 55 followed by 10 or 11 digits
  if (digits.length > 11 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  // Limit to 11 digits maximum (DDD + 9 digits)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Landline pattern: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Mobile / WhatsApp pattern: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Mask for contact inputs that can accept either an Email OR a Phone number
 * If user is typing an email (contains letters or @), it leaves it alone.
 * If user starts typing numeric digits, applies the phone mask automatically.
 */
export function maskPhoneOrEmail(value: string): string {
  if (!value) return '';
  // If contains @ or letters, assume email or text
  if (/[a-zA-Z@]/.test(value)) {
    return value;
  }
  // If digits or symbols commonly typed for phone
  return maskPhone(value);
}
