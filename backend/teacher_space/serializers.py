from rest_framework import serializers
from .models import Module, PDF, Quiz, Question, Choix

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'name', 'display_name', 'teacher', 'created_at']
        extra_kwargs = {
            'teacher': {'read_only': True},
            'name': {'write_only': True}  # Hide the lowercase version from API responses
        }

    def to_representation(self, instance):
        """Use display_name for all output representations"""
        return {
            'id': instance.id,
            'name': instance.display_name,  # Always show the properly formatted name
            'teacher': instance.teacher.id,
            'created_at': instance.created_at
        }

    def update(self, instance, validated_data):
        """Handle both name and display_name during updates"""
        if 'name' in validated_data:
            # Store the original input in display_name
            validated_data['display_name'] = validated_data['name']
            # Store lowercase version in name
            validated_data['name'] = validated_data['name'].lower()
        return super().update(instance, validated_data)
    
    

class PDFSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDF
        fields = ['id', 'module', 'titre', 'fichier', 'date_upload']
        read_only_fields = ['titre', 'date_upload']

class ChoixSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choix
        fields = ['id', 'texte', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choix = ChoixSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'enonce', 'choix']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True) 

    class Meta:
        model = Quiz
        fields = ['id', 'module', 'titre', 'description', 'date_creation', 'questions']

######################## Added
class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ['id', 'titre', 'description', 'date_creation', 'questions']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        quiz = Quiz.objects.create(**validated_data)
        
        for question_data in questions_data:
            choix_data = question_data.pop('choix')
            question = Question.objects.create(quiz=quiz, **question_data)
            
            for choix in choix_data:
                Choix.objects.create(question=question, **choix)
        
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions')
        instance.titre = validated_data.get('titre', instance.titre)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        # Mise à jour des questions existantes
        for question_data in questions_data:
            question_id = question_data.get('id', None)
            if question_id:
                question = Question.objects.get(id=question_id, quiz=instance)
                question.enonce = question_data.get('enonce', question.enonce)
                question.save()
                
                # Mise à jour des choix existants
                for choix_data in question_data.get('choix', []):
                    choix_id = choix_data.get('id', None)
                    if choix_id:
                        choix = Choix.objects.get(id=choix_id, question=question)
                        choix.texte = choix_data.get('texte', choix.texte)
                        choix.is_correct = choix_data.get('is_correct', choix.is_correct)
                        choix.save()
                    else:
                        Choix.objects.create(question=question, **choix_data)
            else:
                # Création d'une nouvelle question
                new_question = Question.objects.create(quiz=instance, enonce=question_data['enonce'])
                for choix_data in question_data.get('choix', []):
                    Choix.objects.create(question=new_question, **choix_data)
        
        return instance
    
class GeneratedQuizSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'titre', 'description', 'date_creation', 'is_generated', 'questions']

    def get_questions(self, obj):
        questions = []
        for question in obj.questions.all():
            choices = []
            correct_index = 0
            for i, choice in enumerate(question.choix.all()):
                choices.append({
                    'id': choice.id,
                    'text': choice.texte,
                    'is_correct': choice.is_correct
                })
                if choice.is_correct:
                    correct_index = i
            
            questions.append({
                'id': question.id,
                'text': question.enonce,
                'choices': choices,
                'correct_answer': correct_index
            })
        return questions
    
class QuizListSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'titre', 'description', 'date_creation', 'questions_count']

    def get_questions_count(self, obj):
        return obj.questions.count()
    