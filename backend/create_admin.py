import os
import django
import sys

# Ajouter le chemin du projet au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from auth_app.models import CustomUser
from quizly.models import AdminUser

def create_admin_user():
    # Vérifier si l'utilisateur admin existe déjà
    admin_email = "admin@quizly.com"
    try:
        user = CustomUser.objects.get(email=admin_email)
        print(f"L'utilisateur {admin_email} existe déjà.")
    except CustomUser.DoesNotExist:
        # Créer l'utilisateur admin
        user = CustomUser.objects.create_user(
            email=admin_email,
            password="admin123",  # Mot de passe par défaut
            first_name="Admin",
            last_name="Quizly",
            role="admin",
            is_active=True,
            email_verified=True
        )
        print(f"Utilisateur {admin_email} créé avec succès.")

    # Vérifier si l'AdminUser existe déjà
    try:
        admin_user = AdminUser.objects.get(user=user)
        print(f"L'utilisateur {admin_email} est déjà un administrateur.")
    except AdminUser.DoesNotExist:
        # Créer l'AdminUser
        admin_user = AdminUser.objects.create(
            user=user,
            is_super_admin=True
        )
        print(f"L'utilisateur {admin_email} a été promu administrateur.")

if __name__ == "__main__":
    create_admin_user() 