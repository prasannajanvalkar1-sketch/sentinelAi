"""
SentinelAI Cyber Defense Platform - DRF Serializers
attaching validate_real_corporate_email to UserRegistrationSerializer.
"""

from rest_framework import serializers
from .validators import validate_real_corporate_email

class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        help_text="Corporate email address. Disposable and temporary domains are strictly blocked."
    )
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        required=True
    )
    role = serializers.ChoiceField(
        choices=[('employee', 'Employee Portal'), ('admin', 'Admin Console')],
        default='employee'
    )
    mfa_code = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=6
    )

    def validate_email(self, value):
        """
        Field-level validator for email using SentinelAI validate_real_corporate_email.
        """
        # Determine if role is admin from context or initial_data
        role = self.initial_data.get('role', 'employee')
        is_admin = role == 'admin'

        # Apply multi-tier corporate email validation
        validated_email = validate_real_corporate_email(value, is_admin=is_admin)
        return validated_email

    def validate(self, data):
        """
        Object-level validation for Admin MFA requirement.
        """
        role = data.get('role', 'employee')
        mfa_code = data.get('mfa_code', '')

        if role == 'admin' and not mfa_code:
            raise serializers.ValidationError({
                "mfa_code": ["2FA / TOTP Security Token is required for Admin clearance."]
            })

        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return validate_real_corporate_email(value)


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(min_length=6, max_length=6, required=True)
    new_password = serializers.CharField(min_length=8, required=True)
    confirm_password = serializers.CharField(min_length=8, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": ["Passwords do not match."]
            })
        return data


class EmailOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(min_length=6, max_length=6, required=True)

