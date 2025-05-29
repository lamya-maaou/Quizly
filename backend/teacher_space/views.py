from django.shortcuts import render

# Create your views here.
from django.shortcuts import redirect
from teacher_space.models import Module

def after_login_redirect(request):
    if request.user.is_authenticated:
        if request.user.role == 'teacher':
            modules = Module.objects.filter(teacher=request.user)
            if modules.exists():
                return redirect('/teacher/modules')  # url vers la liste des modules
            else:
                return redirect('/teacher-create-module')  # url vers la création de module
        elif request.user.role == 'student':
            return redirect('student_dashboard')  # par exemple
        elif request.user.role == 'admin':
            return redirect('admin_dashboard')  # par exemple
    else:
        return redirect('login')  # sécurité : utilisateur non connecté

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_teacher_modules(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=403)
    
    # Vérifie si ce teacher a des modules
    has_modules = Module.objects.filter(teacher=user).exists()
    
    return Response({'has_modules': has_modules})

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer




from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Module
from .serializers import ModuleSerializer
import re

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_module(request):
    print("Create module request received")
    print("User:", request.user)
    print("User role:", request.user.role)
    print("Request data:", request.data)
    
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=403)

    original_name = request.data.get('name', '').strip()
    if not original_name:
        return Response({'error': 'Subject name is required'}, status=400)

    # Vérification d'unicité
    if Module.objects.filter(name=original_name.lower(), teacher=user).exists():
        return Response({'error': 'This subject already exists'}, status=409)

    try:
        module = Module(
            display_name=original_name,
            teacher=user
        )
        module.save()
        print("Module created successfully:", module)
        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=201)
    except Exception as e:
        print("Error creating module:", str(e))
        return Response({'error': str(e)}, status=400)


# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_modules(request):
    print("User:", request.user)
    print("User role:", request.user.role)
    print("User is authenticated:", request.user.is_authenticated)
    
    if request.user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)
    
    modules = Module.objects.filter(teacher=request.user)
    print("Found modules:", modules)
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)

################pour verifier l'unicité du module
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_module_unique(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

    name = request.query_params.get('name', '').strip().lower()
    name = re.sub(r'\s+', ' ', name)  # Normalisation comme dans la création
    
    if not name:
        return Response(
            {'error': 'Module name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exists = Module.objects.filter(name__iexact=name, teacher=user).exists()
    return Response({'is_unique': not exists})
############## Adde for crud modules
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
def update_module(request, module_id):
    logger.info(f"Update request received for module {module_id}")
    logger.info(f"Request data: {request.data}")
    logger.info(f"User: {request.user}")
    
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        
        # Prepare data for serializer
        data = {
            'name': request.data.get('name', module.name),
            'display_name': request.data.get('name', module.display_name)
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
def delete_module(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response(
            {"error": "Module not found or you don't have permission to delete it."},
            status=status.HTTP_404_NOT_FOUND
        )

    module.delete()
    return Response(
        {"message": "Module deleted successfully."},
        status=status.HTTP_204_NO_CONTENT
    )
################################## Ajouté


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
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

    if 'file' not in request.FILES:  # Changé de 'files' à 'file'
        return Response({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    pdf = PDF.objects.create(
        titre=file.name,
        fichier=file,
        module=module
    )
    return Response(PDFSerializer(pdf).data, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_quiz(request):
    if request.user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)

    titre = request.data.get('titre')
    description = request.data.get('description', '')
    module_id = request.data.get('module')

    if not titre or not module_id:
        return Response({'error': 'Title and module are required'}, status=400)

    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found or not yours'}, status=404)

    quiz = Quiz.objects.create(titre=titre, description=description, module=module)
    return Response(QuizSerializer(quiz).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_module_quizzes(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

    quizzes = Quiz.objects.filter(module=module)
    serializer = QuizSerializer(quizzes, many=True)
    return Response(serializer.data)


# Ajoutez ces vues si elles n'existent pas déjà

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_detail(request, pk):
    try:
        module = Module.objects.get(id=pk, teacher=request.user)
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

from .serializers import QuizListSerializer
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_quizzes(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        quizzes = Quiz.objects.filter(module=module).order_by('-date_creation')
        serializer = QuizListSerializer(quizzes, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_pdfs(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        pdfs = PDF.objects.filter(module=module)
        serializer = PDFSerializer(pdfs, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
    
    ########################## Ajouté
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_pdf(request, module_id, pdf_id):
    try:
        pdf = PDF.objects.get(id=pdf_id, module__id=module_id, module__teacher=request.user)
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
from .models import Module, PDF, Quiz, Question, Choix
from .serializers import QuizSerializer
from .services import gemini_service  # Remplace par le bon chemin si nécessaire


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, module_id):
    print("\n=== Starting Quiz Generation Process ===")
    print(f"Module ID: {module_id}")
    print(f"User: {request.user.email}")
    print(f"User Role: {request.user.role}")
    
    if request.user.role != 'teacher':
        print("Error: User is not a teacher")
        return Response(
            {"error": "Only teachers can generate quizzes"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        print(f"Found module: {module.name}")
    except Module.DoesNotExist:
        print("Error: Module not found")
        return Response(
            {"error": "Module not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Vérifier si un PDF est uploadé
    pdfs = PDF.objects.filter(module=module).order_by('-date_upload')
    if not pdfs.exists():
        print("Error: No PDF found for this module")
        return Response(
            {"error": "Please upload a PDF first"},
            status=status.HTTP_400_BAD_REQUEST
        )

    latest_pdf = pdfs.first()
    print(f"Found PDF: {latest_pdf.fichier.name}")

    try:
        # Lire le PDF
        pdf_path = latest_pdf.fichier.path
        print(f"Reading PDF from path: {pdf_path}")
        
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        print(f"Successfully extracted {len(text)} characters from PDF")
        if not text.strip():
            print("Error: No text could be extracted from PDF")
            return Response(
                {"error": "Could not extract text from PDF"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Générer le quiz
        print("Initializing GeminiService")
        gemini_service = GeminiService()
        print("Generating quiz from text")
        quiz_data = gemini_service.generate_quiz_from_text(text)
        
        if not quiz_data:
            print("Error: Failed to generate quiz data")
            return Response(
                {"error": "Failed to generate quiz from text"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print("Quiz data generated successfully")
        print(f"Quiz title: {quiz_data.get('title')}")
        print(f"Number of questions: {len(quiz_data.get('questions', []))}")

        # Créer le quiz
        quiz = Quiz.objects.create(
            module=module,
            titre=quiz_data['title'],
            description=quiz_data['description']
        )
        print(f"Created quiz with ID: {quiz.id}")

        # Créer les questions
        for q_data in quiz_data['questions']:
            question = Question.objects.create(
                quiz=quiz,
                enonce=q_data['enonce']
            )
            print(f"Created question: {question.enonce[:50]}...")

            # Créer les choix
            for choix_data in q_data['choix']:
                choice = Choix.objects.create(
                    question=question,
                    texte=choix_data['texte'],
                    is_correct=choix_data['is_correct']
                )
                print(f"Created choice: {choice.texte[:30]}... (correct: {choice.is_correct})")

        return Response({
            "message": "Quiz generated successfully",
            "quiz_id": quiz.id
        })

    except Exception as e:
        print(f"Error during quiz generation: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return Response(
            {"error": f"Failed to generate quiz: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

################## Added

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Quiz, Question, Choix
from .serializers import QuizSerializer, QuizDetailSerializer

@api_view(['PUT'])
@permission_classes([IsAuthenticated])

def update_quiz(request, quiz_id):
    try:
        # Accédez aux données avec request.data au lieu de request.POST
        quiz = Quiz.objects.get(id=quiz_id)
        
        # Mettez à jour les champs de base
        quiz.titre = request.data.get('title', quiz.titre)
        quiz.description = request.data.get('description', quiz.description)
        quiz.save()

        # Traitement des questions
        for question_data in request.data.get('questions', []):
            question_id = question_data.get('id')
            if question_id:
                # Mise à jour question existante
                question = Question.objects.get(id=question_id, quiz=quiz)
                question.enonce = question_data.get('text', question.enonce)
                question.save()

                # Mise à jour des choix
                for choice_data in question_data.get('choices', []):
                    choice_id = choice_data.get('id')
                    if choice_id:
                        choix = Choix.objects.get(id=choice_id)
                        choix.texte = choice_data.get('text', '')
                        choix.is_correct = choice_data.get('is_correct', False)
                        choix.save()
                    else:
                        Choix.objects.create(
                            question=question,
                            texte=choice_data.get('text', ''),
                            is_correct=choice_data.get('is_correct', False)
                        )
            else:
                # Création nouvelle question
                new_question = Question.objects.create(
                    quiz=quiz,
                    enonce=question_data.get('text', '')
                )
                for choice_data in question_data.get('choices', []):
                    Choix.objects.create(
                        question=new_question,
                        texte=choice_data.get('text', ''),
                        is_correct=choice_data.get('is_correct', False)
                    )

        return Response(QuizSerializer(quiz).data)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_detail(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizDetailSerializer(quiz)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=status.HTTP_404_NOT_FOUND)

    quiz.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# Dans views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_pdf_uploaded(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        has_pdf = PDF.objects.filter(module=module).exists()
        return Response({'has_pdf': has_pdf})
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_pdf(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        pdf = PDF.objects.filter(module=module).order_by('-date_upload').first()
        if pdf:
            return Response({
                'id': pdf.id,
                'name': pdf.titre,
                'url': request.build_absolute_uri(pdf.fichier.url)
            })
        return Response({'error': 'No PDF found'}, status=404)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
    
from .serializers import GeneratedQuizSerializer
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generated_quiz(request, module_id):
    """Récupère le dernier quiz généré pour un module"""
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        quiz = Quiz.objects.filter(module=module, is_generated=True).order_by('-date_creation').first()
        
        if not quiz:
            return Response({'error': 'No generated quiz found'}, status=404)
            
        serializer = GeneratedQuizSerializer(quiz)
        return Response(serializer.data)
        
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
###### pour la suppression de la question aussi cote backend 
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_question(request, question_id):
    try:
        question = Question.objects.get(id=question_id, quiz__module__teacher=request.user)
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Question.DoesNotExist:
        return Response({'error': 'Question not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
    
################## View pour gerer le partage du quiz
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view
from django.utils import timezone
from django.core.files.base import ContentFile
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from io import BytesIO
import qrcode
from .models import Quiz
import os
from django.conf import settings 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_quiz(request, quiz_id):
    try:
        # Récupération du quiz avec vérification des permissions
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
        
        # Traitement des restrictions - modification ici
        restrictions = request.data.get('restrictions', {})
        expiry_date = restrictions.get('expiry_date')
        max_participants = restrictions.get('max_participants')
        
        if expiry_date:
            quiz.expiry_date = expiry_date
        if max_participants is not None:
            quiz.max_participants = int(max_participants)
            quiz.current_participants = 0  # Réinitialisation du compteur
        
        # Génération de l'URL de partage
        share_url = request._request.build_absolute_uri(
            reverse('quiz_access_view', kwargs={
                'quiz_id': quiz.id,
                'token': str(quiz.share_token)
            })
        )
        
        # Génération du QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(share_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        
        # Sauvegarde du QR Code (correction de l'indentation ici)
        filename = f'qr_code_{quiz.id}.png'
        qr_path = os.path.join(settings.MEDIA_ROOT, 'qr_codes')
        os.makedirs(qr_path, exist_ok=True)

        quiz.qr_code.save(filename, ContentFile(buffer.getvalue()), save=True)
        
        # Mise à jour des métadonnées
        quiz.last_shared = timezone.now()
        quiz.access_restricted = bool(expiry_date or max_participants)
        quiz.save()
        
        # Construction de la réponse
        response_data = {
            'status': 'success',
            'share_url': share_url,
            'qr_code_url': request._request.build_absolute_uri(quiz.qr_code.url),
            'expiry_date': quiz.expiry_date,
            'max_participants': quiz.max_participants,
            'current_participants': quiz.current_participants
        }
        
        return Response(response_data)
        
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or access denied'}, status=404)
    except ValueError as e:
        return Response({'error': f'Invalid data format: {str(e)}'}, status=400)
    except Exception as e:
        return Response({'error': f'Server error: {str(e)}'}, status=500)
    

# Dans views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny  # Nouvel import

@api_view(['GET'])
@permission_classes([AllowAny])  # Autorise l'accès sans token
def quiz_access_view(request, quiz_id, token):
    try:
        quiz = Quiz.objects.get(id=quiz_id, share_token=token)
        if not quiz.is_accessible():
            return Response({'error': 'Quiz no longer available'}, status=403)
        return Response(QuizSerializer(quiz).data)
    except Quiz.DoesNotExist:
        return Response({'error': 'Invalid quiz link'}, status=404)