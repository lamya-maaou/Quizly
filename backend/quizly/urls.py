from django.urls import path
from . import views

urlpatterns = [
    # ... vos URLs existantes ...
    
    # URLs d'administration
    path('admin/login/', views.admin_login, name='admin_login'),
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/logs/', views.admin_logs, name='admin_logs'),
    
    # URLs de gestion des utilisateurs
    path('admin/users/', views.admin_users, name='admin_users'),
    path('admin/users/create/', views.admin_user_create, name='admin_user_create'),
    path('admin/users/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),
    path('admin/users/<int:user_id>/delete/', views.admin_user_delete, name='admin_user_delete'),
    path('admin/quizzes/', views.admin_quizzes, name='admin_quizzes'),
    path('admin/quiz-history/', views.admin_quiz_history, name='admin_quiz_history'),
] 