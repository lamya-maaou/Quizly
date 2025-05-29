import google.generativeai as genai
import json
import re
import random
import time
import logging
from typing import Dict, Optional
from django.conf import settings
from django.core.cache import cache

# Configuration du logging
logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Vérification des modèles disponibles
            models = genai.list_models()
            available_models = [model.name for model in models]
            print(f"Available models: {available_models}")
            
            # Utiliser le modèle gemini-2.0-flash
            model_name = 'models/gemini-2.0-flash'
            print(f"Using model: {model_name}")
            
            self.model = genai.GenerativeModel(
                model_name,
                generation_config={
                    'temperature': 0.5,  # Plus factuel pour un quiz académique
                    'top_p': 0.8,
                    'top_k': 20,
                    'max_output_tokens': 2000  # Optimisé pour réduire les coûts
                }
            )
        except Exception as e:
            print(f"Error initializing GeminiService: {str(e)}")
            raise

    def _truncate_text(self, text: str, max_words: int = 1500) -> str:
        """Tronque le texte à un nombre maximal de mots"""
        words = text.split()
        return ' '.join(words[:max_words])

    def generate_quiz_from_text(self, text: str, difficulty: str = "medium") -> Optional[Dict]:
        """
        Génère un quiz avec EXACTEMENT 3 questions basées sur le texte fourni.
        """
        # Vérification du cache
        cache_key = f"quiz_{hash(text)}_{difficulty}"
        cached_quiz = cache.get(cache_key)
        if cached_quiz:
            logger.info("Quiz récupéré depuis le cache")
            return cached_quiz

        # Tronquage du texte
        safe_text = self._truncate_text(text)

        # Prompt optimisé avec exemple
        prompt = f"""Tu es un expert en création de quiz pédagogiques. Crée un quiz en JSON avec EXACTEMENT 3 questions.

Exemple de sortie attendue :
{{
  "title": "Quiz sur la Révolution Française",
  "description": "Questions sur les événements clés",
  "questions": [
    {{
      "enonce": "Quand a eu lieu la prise de la Bastille ?",
      "choix": [
        {{ "texte": "5 mai 1789", "is_correct": false }},
        {{ "texte": "14 juillet 1789", "is_correct": true }},
        {{ "texte": "26 août 1789", "is_correct": false }},
        {{ "texte": "21 janvier 1793", "is_correct": false }}
      ]
    }}
  ]
}}

Règles ABSOLUES :
- EXACTEMENT 3 QUESTIONS
- Difficulté: {difficulty.lower()}
- 4 options par question
- Une seule réponse correcte par question (is_correct: true)
- Questions BASÉES sur le texte ci-dessous
- Format JSON PUR (pas de ```json)
- IMPORTANT: Assurez-vous que chaque question fait référence à des informations spécifiques du texte

Texte source :
{safe_text}
"""

        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                response = self.model.generate_content(prompt)
                quiz_data = self._parse_response(response.text)

                # Validation
                if self._validate_quiz(quiz_data, safe_text):
                    cache.set(cache_key, quiz_data, timeout=86400)  # Cache 24h
                    return quiz_data

            except Exception as e:
                logger.error(f"Tentative {attempt + 1} échouée : {str(e)}")
                time.sleep(1)  # Délai anti-rate limit

        logger.warning("Échec après %d tentatives", max_attempts)
        return None

    def _parse_response(self, response_text: str) -> Dict:
        """Nettoie et parse la réponse JSON"""
        cleaned = re.sub(r'^```(json)?|```$', '', response_text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r'//.*?$', '', cleaned, flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Aucun JSON valide trouvé")

    def _validate_quiz(self, quiz_data: Dict, source_text: str) -> bool:
        """Valide la structure ET la pertinence du quiz"""
        try:
            # Validation structurelle
            if not isinstance(quiz_data.get('questions'), list):
                raise ValueError("Format de questions invalide")

            if len(quiz_data['questions']) != 3:
                raise ValueError(f"3 questions requises (reçu: {len(quiz_data['questions'])})")

            for i, q in enumerate(quiz_data['questions'], 1):
                if not all(key in q for key in ['enonce', 'choix']):
                    raise ValueError(f"Question {i} incomplète")

                if len(q['choix']) != 4:
                    raise ValueError(f"Question {i} doit avoir 4 options")

                # Vérifier qu'il y a exactement une réponse correcte
                correct_answers = sum(1 for c in q['choix'] if c.get('is_correct', False))
                if correct_answers != 1:
                    raise ValueError(f"Question {i} doit avoir exactement une réponse correcte")

                # Validation de la pertinence
                if not self._is_question_relevant(q['enonce'], source_text):
                    raise ValueError(f"Question {i} hors sujet")

            return True

        except ValueError as e:
            logger.warning(f"Quiz invalide : {e}")
            return False

    def _is_question_relevant(self, question: str, source_text: str) -> bool:
        """Vérifie que la question est liée au texte source"""
        # Extraire les mots-clés significatifs du texte source
        source_words = set(word.lower() for word in source_text.split() if len(word) > 3)
        question_words = set(word.lower() for word in question.split() if len(word) > 3)
        
        # Vérifier si au moins un mot-clé significatif est présent
        common_words = source_words & question_words
        return len(common_words) >= 1  # Au moins 1 mot-clé en commun

    def _ensure_answer_distribution(self, quiz_data: Dict):
        """Rééquilibre les positions des réponses correctes"""
        positions = [q['correct_answer'] for q in quiz_data['questions']]
        if max(positions.count(i) for i in range(4)) > 2:  # Si une position domine
            logger.info("Rééquilibrage des réponses...")
            for q in quiz_data['questions']:
                options = q['options']
                correct_text = options[q['correct_answer']]
                random.shuffle(options)
                q['correct_answer'] = options.index(correct_text)