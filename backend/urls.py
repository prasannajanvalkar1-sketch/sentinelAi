from django.urls import path
from .views import (
    UserRegistrationAPIView,
    PasswordResetRequestAPIView,
    PasswordResetConfirmAPIView,
    EmailOTPVerifyAPIView
)

urlpatterns = [
    path('api/v1/pis/register/', UserRegistrationAPIView.as_view(), name='register'),
    path('api/auth/forgot-password/request-otp/', PasswordResetRequestAPIView.as_view(), name='request-otp'),
    path('api/auth/forgot-password/verify-otp/', PasswordResetConfirmAPIView.as_view(), name='verify-otp'),
    path('api/auth/verify-otp/', EmailOTPVerifyAPIView.as_view(), name='verify-email-otp'),
]
