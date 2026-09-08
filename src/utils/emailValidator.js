/**
 * SentinelAI Email Security Validator Utility
 * Contains comprehensive static sets for Disposable/Temporary Email domains
 * and Free Consumer Email domains for corporate/admin enforcement.
 */

// 1. Curated List of 80+ Common Disposable / Throwaway / Temporary Email Domains
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'fakeinbox.com',
  'throwawaymail.com',
  'getairmail.com',
  'maildrop.cc',
  'getnada.com',
  'inboxalias.com',
  'crazymailing.com',
  'mytemp.email',
  'tempail.com',
  'nada.ltd',
  'disposable.com',
  'tempinbox.com',
  'mohmal.com',
  'emailondeck.com',
  'generator.email',
  'burnermail.io',
  'discard.email',
  'spamgourmet.com',
  'tempmailaddress.com',
  'minutemail.com',
  'dropmail.me',
  'anonymbox.com',
  'tmpmail.net',
  'tmpmail.org',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailinater.com',
  'reallymymail.com',
  'reconmail.com',
  'safetymail.info',
  'sentrymail.com',
  'trashymail.com',
  'zippymail.info',
  '0815.ru',
  '10minut.com.pl',
  '20minutemail.com',
  '30minutemail.com',
  'byom.de',
  'crapmail.org',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'tinypm.com',
  'mailnesia.com',
  'mailcatch.com',
  'harakirimail.com',
  'receive-mail.com',
  'mail4trash.com',
  'tempmailo.com',
  'disposablemail.com'
]);

// 2. Free Consumer Email Domains (Restricted for Privileged Admin Access)
export const FREE_CONSUMER_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'gmx.net'
]);

/**
 * Validates an email address against security rules.
 * @param {string} email - The email string to evaluate.
 * @param {boolean} isAdmin - Whether the request is for Admin Console.
 * @returns {object} Validation result object.
 */
export function validateEmailSecurity(email, isAdmin = false) {
  if (!email || !email.includes('@')) {
    return {
      isValid: false,
      isDisposable: false,
      isFreeEmailForAdmin: false,
      errorMessage: null
    };
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      isDisposable: false,
      isFreeEmailForAdmin: false,
      errorMessage: 'Invalid email syntax.'
    };
  }

  const domain = parts[1].trim();

  // Tier 1: Check Disposable Email Blocklist
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      isDisposable: true,
      isFreeEmailForAdmin: false,
      domain: domain,
      errorMessage: '⚠️ Disposable email addresses are prohibited. Please provide a verified organizational or standard email.'
    };
  }

  // Tier 2: Check Admin Corporate Domain Requirement
  if (isAdmin && FREE_CONSUMER_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      isDisposable: false,
      isFreeEmailForAdmin: true,
      domain: domain,
      errorMessage: '⚠️ Admin Console requires a verified corporate email domain. Free email providers (Gmail, Yahoo, Hotmail) are restricted for privileged clearance.'
    };
  }

  return {
    isValid: true,
    isDisposable: false,
    isFreeEmailForAdmin: false,
    domain: domain,
    errorMessage: null
  };
}
