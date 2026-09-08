"""
SentinelAI Email Protection Unit Tests
Verifies static disposable domain blocking, free consumer domain admin restrictions,
and DRF serializer JSON response formatting.
"""

import unittest
from backend.validators import validate_real_corporate_email
from backend.serializers import UserRegistrationSerializer
from rest_framework.exceptions import ValidationError

class TestEmailValidator(unittest.TestCase):

    def test_disposable_email_rejection(self):
        """Verify that known disposable domains are rejected immediately."""
        disposable_samples = [
            'user@mailinator.com',
            'test@tempmail.com',
            'john@10minutemail.com',
            'anon@guerrillamail.com',
            'hacker@yopmail.com',
            'user@sharklasers.com',
            'fake@trashmail.com'
        ]
        for email in disposable_samples:
            with self.assertRaises(ValidationError) as ctx:
                validate_real_corporate_email(email, is_admin=False)
            self.assertIn("disposable email domains are blocked", str(ctx.exception.detail[0]))

    def test_free_email_admin_rejection(self):
        """Verify that free email domains are blocked for Admin accounts."""
        free_samples = [
            'admin@gmail.com',
            'admin@yahoo.com',
            'lead@hotmail.com',
            'soc@outlook.com'
        ]
        for email in free_samples:
            with self.assertRaises(ValidationError) as ctx:
                validate_real_corporate_email(email, is_admin=True)
            self.assertIn("Admin Console requires a verified corporate email domain", str(ctx.exception.detail[0]))

    def test_valid_corporate_email_pass(self):
        """Verify that legitimate corporate emails pass validation."""
        valid_samples = [
            'sarah.connor@sentinel.ai',
            'sec.lead@crowdstrike.com',
            'admin@microsoft.com'
        ]
        for email in valid_samples:
            result = validate_real_corporate_email(email, is_admin=False)
            self.assertEqual(result, email)

    def test_drf_serializer_disposable_rejection(self):
        """Verify DRF Serializer outputs clean JSON error format."""
        payload = {
            "email": "attacker@mailinator.com",
            "password": "Password123!",
            "role": "employee"
        }
        serializer = UserRegistrationSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertIn("disposable email domains are blocked", str(serializer.errors["email"][0]))

if __name__ == '__main__':
    unittest.main()
