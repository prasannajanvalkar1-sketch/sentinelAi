import unittest
from backend.serializers import (
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailOTPVerifySerializer
)

class TestOTPAndResetSerializers(unittest.TestCase):
    def test_password_reset_request_valid(self):
        serializer = PasswordResetRequestSerializer(data={"email": "sarah.connor@sentinel.ai"})
        self.assertTrue(serializer.is_valid())

    def test_password_reset_request_disposable_email(self):
        serializer = PasswordResetRequestSerializer(data={"email": "hacker@tempmail.com"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_password_reset_confirm_mismatch(self):
        data = {
            "email": "sarah.connor@sentinel.ai",
            "otp": "849201",
            "new_password": "NewPassword@2026",
            "confirm_password": "DifferentPassword@2026"
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("confirm_password", serializer.errors)

    def test_password_reset_confirm_valid(self):
        data = {
            "email": "sarah.connor@sentinel.ai",
            "otp": "849201",
            "new_password": "NewPassword@2026",
            "confirm_password": "NewPassword@2026"
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_email_otp_verify_valid(self):
        serializer = EmailOTPVerifySerializer(data={"email": "sarah.connor@sentinel.ai", "otp": "849201"})
        self.assertTrue(serializer.is_valid())

if __name__ == '__main__':
    unittest.main()
