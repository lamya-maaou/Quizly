from django.urls import path
from . import views

urlpatterns = [
    path('after-login/', views.after_login_redirect, name='after_login'),
    path('modules/check/', views.check_teacher_modules, name='check_teacher_modules'),
    path('modules/create/', views.create_module, name='create_module'),
    path('modules/check-unique/', views.check_module_unique, name='check-module-unique'),
    path('modules/', views.teacher_modules, name='teacher_modules'),
     # Add these new paths for update and delete functionality
    path('modules/<int:module_id>/update/', views.update_module, name='update_module'),
    path('modules/<int:module_id>/delete/', views.delete_module, name='delete_module'),
    path('modules/<int:pk>/', views.module_detail, name='module-detail'),  # Changé 'id' en 'pk'
    path('modules/<int:module_id>/latest_pdf/', views.get_latest_pdf, name='latest-pdf'),
    path('modules/<int:module_id>/upload/', views.upload_pdfs, name='upload-pdfs'),
    # PDFs
    path('api/teacher/modules/<int:id>/pdfs/', views.module_pdfs, name='module-pdfs'),
    path('api/teacher/modules/<int:module_id>/pdfs/<int:pdf_id>/', views.delete_pdf, name='delete-pdf'),
    path('modules/<int:module_id>/generate_quiz/', views.generate_quiz, name='generate-quiz'),
     path('quizzes/<int:quiz_id>/update/', views.update_quiz, name='update-quiz'),
    # Quizzes
    path('modules/<int:module_id>/quizzes/', views.module_quizzes, name='module-quizzes'),
    path('quizzes/<int:quiz_id>/', views.get_quiz_detail, name='quiz-detail'),
     # url pour suppression des questions
    path('questions/<int:question_id>/delete/', views.delete_question, name='delete_question'),
    # url pour partager les quizzes
    path('quizzes/<int:quiz_id>/share/', views.share_quiz, name='share_quiz'),
    path('quiz/<int:quiz_id>/access/<uuid:token>/', views.quiz_access_view, name='quiz_access_view'),
    
   
]