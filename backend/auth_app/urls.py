from django.urls import path
from .views import RegisterView, LoginView, VerifyEmailView, ResendVerificationView,PasswordResetConfirmView,PasswordResetRequestView,PasswordResetView


urlpatterns = [
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('password/reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password/reset/complete/', PasswordResetView.as_view(), name='password-reset-complete'),
]
