from django.shortcuts import render
from django.views.generic import TemplateView
from django.conf import settings
import os

class IndexView(TemplateView):
    template_name = 'index.html'

    def get(self, request, *args, **kwargs):
        # Vérifier si le fichier index.html existe dans le dossier build
        index_path = os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')
        if not os.path.exists(index_path):
            print(f"Warning: index.html not found at {index_path}")
            return render(request, 'index.html', {'error': 'Frontend build not found'})
        
        return super().get(request, *args, **kwargs)

def index(request):
    return IndexView.as_view()(request)
