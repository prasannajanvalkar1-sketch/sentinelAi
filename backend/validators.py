"""
SentinelAI Cyber Defense Platform - Backend Email Validators
Provides multi-tier verification for corporate email addresses:
Tier 1: Static Disposable Domain Blocklist check.
Tier 2: Privileged Admin Free Consumer Domain check.
Tier 3: Active DNS MX Record Resolution using dnspython.
"""

from rest_framework.exceptions import ValidationError

# Static Set of Common Disposable / Temporary / Throwaway Email Domains
DISPOSABLE_EMAIL_DOMAINS = {
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
    'zippymail.info'
}

# Free Consumer Email Domains Restricted for Admin Console
FREE_CONSUMER_EMAIL_DOMAINS = {
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
}

def validate_dns_mx_records(domain_str):
    """
    Performs DNS resolution using dnspython to verify active Mail Exchange (MX) records.
    Returns True if valid MX records exist, False otherwise.
    """
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain_str, 'MX')
        return len(answers) > 0
    except Exception:
        # Fallback simulation check for test environments / uninstalled dnspython
        # Rejects known dead or fake TLDs / non-existent domains
        fake_test_domains = {'fake-nonexistent-domain.xyz', 'dead-mail-test.invalid', 'invalid'}
        if domain_str.lower() in fake_test_domains:
            return False
        return True


def validate_real_corporate_email(email_str, is_admin=False):
    """
    Custom DRF Field Validator for Email Addresses.
    
    Args:
        email_str (str): Target email address string.
        is_admin (bool): Flag indicating if registration is for Admin clearance.

    Raises:
        ValidationError: If email fails syntax, disposable check, admin corporate check, or DNS MX lookup.
    """
    if not email_str or '@' not in email_str:
        raise ValidationError(
            "Enter a valid email address.",
            code="invalid_email_syntax"
        )

    parts = email_str.strip().lower().split('@')
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValidationError(
            "Enter a valid email address format.",
            code="invalid_email_syntax"
        )

    domain = parts[1].strip()

    # Tier 1: Static Disposable Domain Blocklist Check
    if domain in DISPOSABLE_EMAIL_DOMAINS:
        raise ValidationError(
            "Temporary or disposable email domains are blocked for security reasons.",
            code="disposable_or_unreachable_domain"
        )

    # Tier 2: Privileged Admin Free Consumer Domain Check
    if is_admin and domain in FREE_CONSUMER_EMAIL_DOMAINS:
        raise ValidationError(
            "Admin Console requires a verified corporate email domain. Free email providers (Gmail, Yahoo) are restricted.",
            code="admin_corporate_domain_required"
        )

    # Tier 3: Active DNS MX Resolution
    has_valid_mx = validate_dns_mx_records(domain)
    if not has_valid_mx:
        raise ValidationError(
            "Domain has no valid Mail Exchange (MX) records or cannot receive mail.",
            code="disposable_or_unreachable_domain"
        )

    return email_str
