# auth_app/middleware.py
import json
from django.conf import settings

class RememberMeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Vérifie si c'est une requête de login
        if request.path == '/api/auth/login/' and request.method == 'POST':
            # Essaye de lire le body de la requête pour React/DRF
            try:
                body = json.loads(request.body.decode('utf-8'))
                remember_me = body.get('remember_me', False)
            except (json.JSONDecodeError, AttributeError):
                remember_me = False
            
            # Passe la requête à la vue
            response = self.get_response(request)
            
            # Si login réussi (status 200) et remember_me est True
            if response.status_code == 200 and remember_me:
                response.set_cookie(
                    'remember_me',
                    '1',
                    max_age=settings.REMEMBER_ME_COOKIE_AGE,
                    httponly=True,
                    secure=settings.SESSION_COOKIE_SECURE,
                    samesite='Lax'
                )
            return response
        
        # Pour toutes les autres requêtes
        return self.get_response(request)