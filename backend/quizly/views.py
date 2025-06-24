from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AdminUser, AdminLog
from .serializers import AdminUserSerializer, AdminLogSerializer
from django.utils import timezone
from auth_app.models import CustomUser
from student_space.models import Quiz, QuizResult

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'adminuser')

@api_view(['POST'])
def admin_login(request):
    print("Tentative de connexion admin...")
    print("Données reçues:", request.data)
    
    email = request.data.get('email')
    password = request.data.get('password')
    print(f"Email reçu: {email}")

    if not email or not password:
        print("Email ou mot de passe manquant")
        return Response(
            {'error': 'Email et mot de passe requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        print("Recherche de l'utilisateur...")
        user = CustomUser.objects.get(email=email)
        print(f"Utilisateur trouvé: {user.email}, rôle: {user.role}")
        
        if not user.check_password(password):
            print("Mot de passe incorrect")
            return Response(
                {'error': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            print("Compte désactivé")
            return Response(
                {'error': 'Compte désactivé'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            print("Recherche des droits admin...")
            admin_user = AdminUser.objects.get(user=user)
            print(f"Admin trouvé: {admin_user}, super_admin: {admin_user.is_super_admin}")
            
            admin_user.last_login = timezone.now()
            admin_user.save()

            # Créer le log de connexion
            AdminLog.objects.create(
                admin=admin_user,
                action='LOGIN',
                ip_address=request.META.get('REMOTE_ADDR')
            )

            refresh = RefreshToken.for_user(user)
            print("Token généré avec succès")
            
            response_data = {
                'error': False,
                'message': 'Login successful',
                'data': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role,
                        'is_active': user.is_active,
                        'email_verified': user.email_verified
                    }
                }
            }
            print("Réponse finale:", response_data)
            return Response(response_data)
            
        except AdminUser.DoesNotExist:
            print("L'utilisateur n'a pas les droits admin")
            return Response(
                {'error': 'Accès non autorisé. Vous n\'avez pas les droits d\'administrateur.'},
                status=status.HTTP_403_FORBIDDEN
            )
    except CustomUser.DoesNotExist:
        print("Utilisateur non trouvé")
        return Response(
            {'error': 'Email ou mot de passe incorrect'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        print("Erreur inattendue:", str(e))
        return Response(
            {'error': 'Une erreur est survenue lors de la connexion'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard(request):
    try:
        admin_user = request.user.adminuser
        stats = {
            'teachers': CustomUser.objects.filter(role='teacher').count(),
            'students': CustomUser.objects.filter(role='student').count(),
            'quizzes': Quiz.objects.count(),
            'users': CustomUser.objects.count(),
            # Pour compatibilité avec l'ancien frontend
            'total_teachers': CustomUser.objects.filter(role='teacher').count(),
            'total_students': CustomUser.objects.filter(role='student').count(),
            'total_quizzes': Quiz.objects.count(),
            'total_users': CustomUser.objects.count(),
        }
        return Response(stats)
    except AdminUser.DoesNotExist:
        return Response(
            {'error': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_logs(request):
    try:
        admin_user = request.user.adminuser
        logs = AdminLog.objects.all().order_by('-created_at')
        serializer = AdminLogSerializer(logs, many=True)
        return Response(serializer.data)
    except AdminUser.DoesNotExist:
        return Response(
            {'error': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_users(request):
    try:
        admin_user = request.user.adminuser
        users = CustomUser.objects.all()
        user_data = [{
            'id': user.id,
            'username': user.email,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        } for user in users]
        return Response(user_data)
    except AdminUser.DoesNotExist:
        return Response(
            {'error': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_detail(request, user_id):
    try:
        print(f"\n=== Mise à jour utilisateur {user_id} ===")
        print("Méthode:", request.method)
        print("Données reçues:", request.data)
        
        admin_user = request.user.adminuser
        user = CustomUser.objects.get(id=user_id)
        print(f"Utilisateur trouvé: {user.email}")

        if request.method == 'PATCH':
            # Update user fields
            if 'username' in request.data:
                user.username = request.data['username']
            if 'email' in request.data:
                user.email = request.data['email']
            if 'role' in request.data:
                user.role = request.data['role']
            if 'is_active' in request.data:
                print(f"Mise à jour is_active: {request.data['is_active']}")
                user.is_active = bool(request.data['is_active'])
            if 'password' in request.data and request.data['password']:
                user.set_password(request.data['password'])
            
            print(f"État avant sauvegarde - is_active: {user.is_active}")
            user.save()
            print(f"État après sauvegarde - is_active: {user.is_active}")
            
            # Log the action
            AdminLog.objects.create(
                admin=admin_user,
                action='MANAGE_USER',
                details={'user_id': user.id, 'action': 'update', 'fields_updated': list(request.data.keys())}
            )
            
            return Response({
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active
            })
            
        elif request.method == 'DELETE':
            # Log the action before deleting
            AdminLog.objects.create(
                admin=admin_user,
                action='MANAGE_USER',
                details={'user_id': user.id, 'action': 'delete'}
            )
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except CustomUser.DoesNotExist:
        print(f"Utilisateur {user_id} non trouvé")
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except AdminUser.DoesNotExist:
        print("Admin non trouvé")
        return Response(
            {'error': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )
    except Exception as e:
        print(f"Erreur lors de la mise à jour: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_create(request):
    try:
        admin_user = request.user.adminuser
        data = request.data
        
        # Validate required fields
        required_fields = ['email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if user already exists
        if CustomUser.objects.filter(email=data['email']).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new user
        user = CustomUser.objects.create_user(
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=data['role']
        )
        
        # Log the action
        AdminLog.objects.create(
            admin=admin_user,
            action='MANAGE_USER',
            details={'user_id': user.id, 'action': 'create'}
        )
        
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active
        }, status=status.HTTP_201_CREATED)
        
    except AdminUser.DoesNotExist:
        return Response(
            {'error': 'Accès non autorisé'},
            status=status.HTTP_403_FORBIDDEN
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_quizzes(request):
    try:
        admin_user = request.user.adminuser
        from student_space.models import Quiz as StudentQuiz
        from teacher_space.models import Quiz as TeacherQuiz
        quizzes = []
        for quiz in StudentQuiz.objects.all().order_by('-date_creation'):
            quizzes.append({
                'id': f'student_{quiz.id}',
                'titre': quiz.titre,
                'description': quiz.description,
                'date_creation': quiz.date_creation,
                'author': '-',
            })
        for quiz in TeacherQuiz.objects.all().order_by('-date_creation'):
            quizzes.append({
                'id': f'teacher_{quiz.id}',
                'titre': quiz.titre,
                'description': quiz.description,
                'date_creation': quiz.date_creation,
                'author': '-',
            })
        quizzes = sorted(quizzes, key=lambda x: x['date_creation'], reverse=True)
        return Response(quizzes)
    except AdminUser.DoesNotExist:
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_quiz_history(request):
    try:
        admin_user = request.user.adminuser
        results = QuizResult.objects.select_related('student', 'quiz').order_by('-date_taken')
        data = []
        for result in results:
            data.append({
                'id': result.id,
                'student': result.student.get_full_name() or result.student.email,
                'quiz_title': result.quiz.titre,
                'score': f"{result.score}/{result.total_questions}",
                'date_taken': result.date_taken,
            })
        return Response(data)
    except AdminUser.DoesNotExist:
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN) 