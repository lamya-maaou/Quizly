# serializers.py
from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'student'),
            is_active=False  # User inactive until email verification
        )
        
        # Generate and send verification email
        token = user.generate_verification_token()
        verification_url = self.context['request'].build_absolute_uri(
            reverse('verify-email') + f'?token={token}'
        )
        
        send_mail(
            'Verify Your Email Address',
            f'Please click the following link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, error_messages={
        'required': 'Email is required',
        'invalid': 'Please enter a valid email address'
    })
    password = serializers.CharField(write_only=True, required=True, error_messages={
        'required': 'Password is required'
    })

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = CustomUser.objects.get(email=email)
            print(f"User found: {user.email}")
            print(f"User is active: {user.is_active}")
            print(f"User email verified: {user.email_verified}")
            
            if not user.is_active:
                raise serializers.ValidationError({
                    "email": ["Your account is not active. Please verify your email first."]
                })
            
            if not user.email_verified:
                raise serializers.ValidationError({
                    "email": ["Please verify your email address before logging in."]
                })

            user = authenticate(request=self.context.get('request'),
                             email=email, password=password)
            
            if not user:
                print(f"Authentication failed for user: {email}")
                raise serializers.ValidationError({
                    "password": ["Invalid email or password."]
                })
            
            print(f"User authenticated successfully: {user.email}")
            return {
                'user': user
            }
            
        except CustomUser.DoesNotExist:
            print(f"User not found: {email}")
            raise serializers.ValidationError({
                "email": ["Invalid email or password."]
            })
        except Exception as e:
            print(f"Login error in serializer: {str(e)}")
            import traceback
            print(f"Serializer traceback: {traceback.format_exc()}")
            raise serializers.ValidationError({
                "non_field_errors": ["An error occurred during login. Please try again."]
            })

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data

class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)