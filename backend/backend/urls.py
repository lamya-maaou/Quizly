"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('django-admin/', admin.site.urls),  # Renommé pour éviter la confusion
    path('api/auth/', include('auth_app.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/', include('quizly.urls')),  # URLs de notre application admin

     path('', views.index, name='index'),  # la landing page
     path('api/teacher/', include('teacher_space.urls')),
     path('api/student/', include('student_space.urls')),

    # Redirections pour les URLs courantes
    path('login/', RedirectView.as_view(url='/api/auth/login/', permanent=True), name='login-redirect'),
    path('signup/', RedirectView.as_view(url='/api/auth/signup/', permanent=True), name='signup-redirect'),
    path('verify-email/', RedirectView.as_view(url='/api/auth/verify-email/', permanent=True), name='verify-email-redirect'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


