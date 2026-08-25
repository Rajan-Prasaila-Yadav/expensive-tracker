from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, GoogleAuthView, ProfileView, SettingsView, ChangePasswordView, ActiveSessionsView,
    ForgotPasswordView, VerifyOTPView, ResetPasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('google/', GoogleAuthView.as_view(), name='auth-google'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('settings/', SettingsView.as_view(), name='auth-settings'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('sessions/', ActiveSessionsView.as_view(), name='auth-sessions'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
]
