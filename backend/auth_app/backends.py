from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            print(f"\n=== Authentication Attempt ===")
            print(f"Email: {email}")
            
            # Vérifier si l'utilisateur existe avec l'email
            user = UserModel.objects.get(email=email)
            print(f"User found: {user.email}")
            print(f"User is active: {user.is_active}")
            print(f"Email verified: {user.email_verified}")
            
            # Vérifier le mot de passe
            if user.check_password(password):
                print(f"Password check successful for user: {user.email}")
                
                # Vérifier si l'utilisateur peut se connecter
                if not user.is_active:
                    print(f"User account is not active: {user.email}")
                    return None
                if not user.email_verified:
                    print(f"User email is not verified: {user.email}")
                    return None
                
                # Mettre à jour la dernière connexion
                user.update_last_login()
                return user
            else:
                print(f"Password check failed for user: {user.email}")
                return None
                
        except UserModel.DoesNotExist:
            print(f"No user found with email: {email}")
            return None
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            import traceback
            print(f"Authentication traceback: {traceback.format_exc()}")
            return None

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None 