from django.shortcuts import render
from django.shortcuts import redirect
from student_space.models import Module
from .serializers import ModuleSerializer, QuizSerializer, QuizListSerializer
# Create your views here.
# Vue de redirection après login
def after_login_redirect(request):
    if request.user.is_authenticated:
        if request.user.role == 'student':
            modules = Module.objects.filter(student=request.user)
            if modules.exists():
                return redirect('/student/categories')  # url vers la liste des modules
            else:
                return redirect('/student-create-category')  # url vers la création de module
        elif request.user.role == 'student':
            return redirect('student_dashboard')  # par exemple
        elif request.user.role == 'admin':
            return redirect('admin_dashboard')  # par exemple
    else:
        return redirect('login')
# Vues pour les modules
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_student_categories(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Unauthorized access'}, status=403)
    
    # Vérifie si ce student a des modules
    has_modules = Module.objects.filter(student=user).exists()
    
    return Response({'has_modules': has_modules})

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_category(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name')
    if not name:
        return Response({'error': 'Category name is required'}, status=status.HTTP_400_BAD_REQUEST)

    normalized_name = name.lower().strip().replace(' ', '')
    
    if Module.objects.filter(normalized_name=normalized_name, student=user).exists():
        return Response(
            {'error': 'You already have a category with this name'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        module = Module.objects.create(name=name, student=user)
        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_categories(request):
    if request.user.role != 'student':
        return Response({'error': 'Unauthorized'}, status=403)
    
    modules = Module.objects.filter(student=request.user)
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)  # Renvoyer directement les données sérialisées

######################## Part of drag and drop and generate quiz
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_detail(request, pk):
    try:
        module = Module.objects.get(id=pk, student=request.user)
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
from .models import PDF, Quiz, Question, Choix
from .serializers import PDFSerializer, QuizSerializer, QuestionSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_pdfs(request, module_id):
    try:
        module = Module.objects.get(id=module_id, student=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)

    if 'file' not in request.FILES:  # Changé de 'files' à 'file'
        return Response({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    pdf = PDF.objects.create(
        titre=file.name,
        fichier=file,
        module=module
    )
    return Response(PDFSerializer(pdf).data, status=201)

##################
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_pdfs(request, module_id):
    try:
        module = Module.objects.get(id=module_id, student=request.user)
        pdfs = PDF.objects.filter(module=module)
        serializer = PDFSerializer(pdfs, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
    
    ########################## Ajouté
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_pdf(request, module_id, pdf_id):
    try:
        pdf = PDF.objects.get(id=pdf_id, module__id=module_id, module__student=request.user)
        pdf.fichier.delete()  # Supprime le fichier physique
        pdf.delete()         # Supprime l'entrée en base
        return Response(status=204)
    except PDF.DoesNotExist:
        return Response({'error': 'PDF not found'}, status=404)

#################### LLM

# Assurez-vous que ces imports sont tout en haut de votre fichier views.py
from PyPDF2 import PdfReader
from .serializers import (
    PDFSerializer, 
    QuizSerializer, 
   
)
from .services.gemini_service import GeminiService
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module, PDF, Quiz, Question, Choix
from .serializers import QuizSerializer



from rest_framework.response import Response
from PyPDF2 import PdfReader  # Assure-toi que cette importation est présente
from .models import Module, PDF, Quiz, Question, Choix, QuizResult
from .serializers import QuizSerializer
from .services import gemini_service  # Remplace par le bon chemin si nécessaire


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, module_id):
    if request.user.role != 'student':
        return Response({'error': 'Unauthorized'}, status=403)

    try:
        module = Module.objects.get(id=module_id, student=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found or not yours'}, status=404)

    # Vérifie qu'un PDF est uploadé
    if not PDF.objects.filter(module=module).exists():
        return Response({'error': 'No PDF uploaded for this module'}, status=400)

    # Récupère le texte du dernier PDF uploadé
    latest_pdf = PDF.objects.filter(module=module).order_by('-date_upload').first()
    full_text = ""
    
    try:
        reader = PdfReader(latest_pdf.fichier)
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return Response({'error': 'Could not extract text from PDF'}, status=400)

    # Génère le quiz avec votre service Gemini
    gemini = GeminiService()
    quiz_data = gemini.generate_quiz_from_text(full_text)
    
    if not quiz_data or 'questions' not in quiz_data:
        return Response({'error': 'Failed to generate quiz from text'}, status=500)

    # Crée le quiz dans la base de données
    try:
        quiz = Quiz.objects.create(
            module=module,
            titre=quiz_data.get('title', f'Quiz pour {module.name}')[:100],
            description=quiz_data.get('description', '')[:500],
            is_generated=True
        )

        questions = []
        for q in quiz_data['questions']:
            question = Question.objects.create(
                quiz=quiz,
                enonce=q['enonce'][:500]
            )
            
            choices = []
            for choice in q['choix']:
                choice_obj = Choix.objects.create(
                    question=question,
                    texte=choice['texte'][:200],
                    is_correct=choice['is_correct']
                )
                choices.append({
                    'id': choice_obj.id,
                    'text': choice_obj.texte,
                    'is_correct': choice_obj.is_correct
                })
            
            questions.append({
                'id': question.id,
                'text': question.enonce,
                'choices': choices
            })

        return Response({
            'id': quiz.id,
            'title': quiz.titre,
            'description': quiz.description,
            'is_generated': True,
            'questions': questions
        }, status=201)

    except Exception as e:
        print(f"Error saving quiz: {e}")
        return Response({'error': str(e)}, status=500)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__student=request.user)
        
        # The answers are sent as a dictionary where keys are question IDs and values are choice IDs
        answers = request.data
        print(f"Received answers: {answers}")  # Debug log
        
        score = 0
        total_questions = quiz.questions.count()
        question_results = []

        for question in quiz.questions.all():
            selected_choice_id = answers.get(str(question.id))
            print(f"Question {question.id}: selected_choice_id = {selected_choice_id}")  # Debug log
            
            correct_choice = question.choix.filter(is_correct=True).first()
            print(f"Question {question.id}: correct_choice = {correct_choice.id if correct_choice else None}")  # Debug log
            
            result = {
                'question_id': question.id,
                'question_text': question.enonce,
                'selected_choice': None,
                'correct_choice': {
                    'id': correct_choice.id,
                    'text': correct_choice.texte
                },
                'is_correct': False
            }
            
            if selected_choice_id:
                try:
                    selected_choice = question.choix.get(id=selected_choice_id)
                    result['selected_choice'] = {
                        'id': selected_choice.id,
                        'text': selected_choice.texte
                    }
                    if selected_choice.is_correct:
                        score += 1
                        result['is_correct'] = True
                        print(f"Question {question.id}: Correct answer!")  # Debug log
                    else:
                        print(f"Question {question.id}: Incorrect answer")  # Debug log
                except Choix.DoesNotExist:
                    print(f"Question {question.id}: Choice {selected_choice_id} not found")  # Debug log
                    pass
            
            question_results.append(result)

        # Calculate percentage
        percentage = int((score / total_questions) * 100) if total_questions > 0 else 0
        print(f"Final score: {score}/{total_questions} ({percentage}%)")  # Debug log

        # Save the result
        QuizResult.objects.create(
            quiz=quiz,
            student=request.user,
            score=score,
            total_questions=total_questions
        )

        return Response({
            'score': score,
            'total_questions': total_questions,
            'percentage': percentage,
            'question_results': question_results
        }, status=200)

    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=404)
    except Exception as e:
        print(f"Error in submit_quiz: {str(e)}")  # Debug log
        return Response({'error': str(e)}, status=400)

################pour verifier l'unicité du module
from rest_framework import status
import re


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_category_unique(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

    name = request.query_params.get('name', '').strip()
    if not name:
        return Response(
            {'error': 'Module name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    normalized_name = name.lower().strip().replace(' ', '')
    exists = Module.objects.filter(normalized_name=normalized_name, student=user).exists()
    return Response({'is_unique': not exists})

########### CRUD Categories
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Module
from .serializers import ModuleSerializer

# ... (your existing views)

import logging
logger = logging.getLogger(__name__)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_category(request, category_id):
    logger.info(f"Update request received for module {category_id}")
    logger.info(f"Request data: {request.data}")
    logger.info(f"User: {request.user}")
    
    try:
        module = Module.objects.get(id=category_id, student=request.user)
        
        # Prepare data for serializer
        data = {
            'name': request.data.get('name', module.name),
            'normalized_name': request.data.get('name', module.normalized_name)
        }
        
        serializer = ModuleSerializer(module, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            logger.info("Module updated successfully")
            return Response(serializer.data)
        else:
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Module.DoesNotExist as e:
        logger.error(f"Module not found: {e}")
        return Response(
            {"error": "Module not found or you don't have permission"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_category(request, category_id):
    try:
        module = Module.objects.get(id=category_id, student=request.user)
    except Module.DoesNotExist:
        return Response(
            {"error": "Category not found or you don't have permission to delete it."},
            status=status.HTTP_404_NOT_FOUND
        )

    module.delete()
    return Response(
        {"message": "Category deleted successfully."},
        status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_quizzes(request, module_id):
    try:
        module = Module.objects.get(id=module_id, student=request.user)
        quizzes = Quiz.objects.filter(module=module).order_by('-date_creation')
        serializer = QuizListSerializer(quizzes, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_detail(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__student=request.user)
        questions = []
        for question in quiz.questions.all():
            choices = []
            for choice in question.choix.all():
                choices.append({
                    'id': choice.id,
                    'texte': choice.texte,
                    'is_correct': choice.is_correct
                })
            questions.append({
                'id': question.id,
                'enonce': question.enonce,
                'choix': choices
            })
        
        return Response({
            'id': quiz.id,
            'titre': quiz.titre,
            'description': quiz.description,
            'questions': questions
        })
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_quiz_results(request):
    try:
        # Récupérer tous les résultats de quiz de l'étudiant
        results = QuizResult.objects.filter(student=request.user).select_related('quiz', 'quiz__module')
        
        # Calculer les statistiques
        total_quizzes = results.count()
        total_questions = sum(result.total_questions for result in results)
        total_correct = sum(result.score for result in results)
        
        # Calculer la moyenne globale
        average_score = (total_correct / total_questions * 100) if total_questions > 0 else 0
        
        # Trouver le meilleur score
        best_score = results.order_by('-score').first()
        best_score_data = {
            'quiz_title': best_score.quiz.titre if best_score else None,
            'score': best_score.score if best_score else 0,
            'total': best_score.total_questions if best_score else 0,
            'percentage': int((best_score.score / best_score.total_questions * 100)) if best_score else 0
        }
        
        # Calculer les statistiques par module
        module_stats = {}
        for result in results:
            module_name = result.quiz.module.name
            if module_name not in module_stats:
                module_stats[module_name] = {
                    'total_quizzes': 0,
                    'total_questions': 0,
                    'total_correct': 0
                }
            module_stats[module_name]['total_quizzes'] += 1
            module_stats[module_name]['total_questions'] += result.total_questions
            module_stats[module_name]['total_correct'] += result.score
        
        # Calculer les moyennes par module
        for module_name, stats in module_stats.items():
            stats['average'] = int((stats['total_correct'] / stats['total_questions'] * 100)) if stats['total_questions'] > 0 else 0
        
        # Formater les résultats
        formatted_results = []
        for result in results:
            formatted_results.append({
                'id': result.id,
                'quiz_title': result.quiz.titre,
                'module_name': result.quiz.module.name,
                'score': result.score,
                'total_questions': result.total_questions,
                'percentage': int((result.score / result.total_questions) * 100) if result.total_questions > 0 else 0,
                'date_taken': result.date_taken
            })
        
        return Response({
            'results': formatted_results,
            'statistics': {
                'total_quizzes': total_quizzes,
                'total_questions': total_questions,
                'total_correct': total_correct,
                'average_score': int(average_score),
                'best_score': best_score_data,
                'module_stats': module_stats
            }
        }, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=400)