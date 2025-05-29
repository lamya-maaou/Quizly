import google.generativeai as genai
import json
import re
import random
import time
import logging
import os
from typing import Dict, Optional
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        try:
            # Vérifier si la clé API est définie dans les paramètres Django
            api_key = settings.GEMINI_API_KEY
            print("\n=== GeminiService Initialization ===")
            print(f"API Key from settings: {api_key[:5]}..." if api_key else "No API key found in settings")
            
            # Configuration de l'API
            genai.configure(api_key=api_key)
            
            # Utiliser le modèle gemini-2.0-flash
            model_name = 'models/gemini-2.0-flash'
            print(f"Using model: {model_name}")
            
            self.model = genai.GenerativeModel(
                model_name,
                generation_config={
                    'temperature': 0.5,
                    'top_p': 0.8,
                    'top_k': 20,
                    'max_output_tokens': 2000
                }
            )
            # Test simple pour vérifier que l'API fonctionne
            test_response = self.model.generate_content("Test")
            print("API test successful")
            
            print("GeminiService initialized successfully")
        except Exception as e:
            print(f"Error initializing GeminiService: {str(e)}")
            print(f"Error type: {type(e)}")
            print(f"Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
            raise

    def _truncate_text(self, text: str, max_words: int = 1500) -> str:
        """Tronque le texte à un nombre maximal de mots"""
        words = text.split()
        return ' '.join(words[:max_words])

    def generate_quiz_from_text(self, text: str, difficulty: str = "medium") -> Optional[Dict]:
        """
        Génère un quiz avec EXACTEMENT 3 questions basées sur le texte fourni.
        """
        print(f"\n=== Starting Quiz Generation ===")
        print(f"Difficulty: {difficulty}")
        print(f"Input text length: {len(text)} characters")
        
        if not text.strip():
            print("Error: Empty text provided")
            return None
            
        cache_key = f"quiz_{hash(text)}_{difficulty}"
        cached_quiz = cache.get(cache_key)
        if cached_quiz:
            print("Returning cached quiz")
            return cached_quiz

        safe_text = self._truncate_text(text)
        print(f"Truncated text length: {len(safe_text)} characters")

        prompt = f"""Tu es un expert en création de quiz pédagogiques. Crée un quiz en JSON avec EXACTEMENT 3 questions.

Règles ABSOLUES :
1. Structure REQUISE :
{{
  "title": "Titre du quiz",
  "description": "Description concise",
  "questions": [
    {{
      "enonce": "Question claire et précise",
      "choix": [
        {{ "texte": "Option1", "is_correct": false }},
        {{ "texte": "Option2", "is_correct": true }},
        {{ "texte": "Option3", "is_correct": false }},
        {{ "texte": "Option4", "is_correct": false }}
      ]
    }}
  ]
}}

2. Contraintes :
- EXACTEMENT 3 QUESTIONS
- Difficulté: {difficulty.lower()}
- 4 options par question
- Une seule réponse correcte par question (is_correct: true)
- Chaque question DOIT explicitement faire référence au texte ci-dessous
- Format JSON PUR (pas de ```json)

3. Texte source :
{safe_text}
"""

        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                print(f"\nAttempt {attempt + 1} of {max_attempts}")
                response = self.model.generate_content(prompt)
                print(f"Received response from Gemini API")
                print(f"Response text: {response.text[:200]}...")
                
                quiz_data = self._parse_response(response.text)
                print(f"Successfully parsed response as JSON")

                if self._validate_quiz(quiz_data, safe_text):
                    print("Quiz validation successful")
                    cache.set(cache_key, quiz_data, timeout=86400)
                    return quiz_data
                else:
                    print("Quiz validation failed")

            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {str(e)}")
                if hasattr(e, 'response'):
                    print(f"API Response: {e.response}")
                time.sleep(1)

        print(f"Failed after {max_attempts} attempts")
        return None

    def _parse_response(self, response_text: str) -> Dict:
        """Nettoie et parse la réponse JSON"""
        print("Parsing response text")
        cleaned = re.sub(r'^```(json)?|```$', '', response_text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r'//.*?$', '', cleaned, flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Cleaned text: {cleaned}")
            raise ValueError("Format JSON invalide")

    def _validate_quiz(self, quiz_data: Dict, source_text: str) -> bool:
        """Valide la structure et la pertinence du quiz"""
        print("Validating quiz data")
        try:
            if not isinstance(quiz_data.get('questions'), list):
                raise ValueError("Format de questions invalide")

            if len(quiz_data['questions']) != 3:
                raise ValueError(f"3 questions requises (reçu: {len(quiz_data['questions'])})")

            source_lower = source_text.lower()
            for i, q in enumerate(quiz_data['questions'], 1):
                print(f"Validating question {i}")
                # Validation structurelle
                if not all(key in q for key in ['enonce', 'choix']):
                    raise ValueError(f"Question {i} incomplète")

                if len(q['choix']) != 4:
                    raise ValueError(f"Question {i} doit avoir 4 options")

                # Vérifier qu'il y a exactement une réponse correcte
                correct_answers = sum(1 for c in q['choix'] if c.get('is_correct', False))
                if correct_answers != 1:
                    raise ValueError(f"Question {i} doit avoir exactement une réponse correcte")

                # Validation de pertinence
                question_lower = q['enonce'].lower()
                keywords = set(word for word in source_lower.split() if len(word) > 4)
                question_words = set(word for word in question_lower.split() if len(word) > 3)
                
                if not (keywords & question_words):
                    raise ValueError(f"Question {i} non reliée au texte source")

            print("Quiz validation successful")
            return True

        except ValueError as e:
            print(f"Quiz validation failed: {e}")
            return False