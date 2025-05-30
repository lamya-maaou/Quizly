# Quizly

## Description

Quizly est une application moderne et interactive de création et de gestion de quiz, conçue pour les enseignants et les étudiants. Elle permet de générer automatiquement des quiz à partir de contenus pédagogiques (PDF), d'évaluer la compréhension des cours, et de suivre la progression individuelle et collective via des tableaux de bord.

## Fonctionnalités Principales

### Pour les Enseignants

- **Upload de PDF :** Interface drag-and-drop avec prévisualisation et prise en charge de PDF textuels et scannés (OCR).
- **Génération Automatique de Quiz :** Création de QCM et questions ouvertes à partir du texte extrait du PDF.
- **Quiz de Programmation :** Sélection de langages (Python, Java, JavaScript) et génération de snippets de code à trous.
- **Partage de Quiz :** Génération de QR codes et de liens uniques, avec restriction d'accès par date ou limite de participants.
- **Tableaux de Bord :** Visualisation des résultats par étudiant et par thème, avec export des données en CSV/PDF.

### Pour les Étudiants

- **Accès aux Quiz :** Scan de QR code ou saisie d'un code d'accès, avec une interface responsive (web et mobile).
- **Génération de Quiz Personnels :** Upload de PDF pour créer des quiz de révision automatiques.
- **Quiz de Code :** Éditeur en ligne avec coloration syntaxique et auto-complétion, offrant un feedback immédiat.
- **Suivi de Progression :** Tableau de bord individuel avec des statistiques (taux de réussite, temps passé) et comparaison anonyme avec la moyenne de la classe.

### Administration

- **Gestion des Comptes :** Gestion des rôles (enseignants/étudiants) et sécurisation des données (chiffrement, sauvegardes automatiques).
- **Historique :** Suivi des quiz et des résultats pour une analyse approfondie.

## Technologies Utilisées

- **Frontend :** React avec des composants personnalisés et des icônes de `react-icons`.
- **Backend :** Django REST pour une API robuste et sécurisée.
- **Base de Données :** Stockage des données utilisateurs, quiz, et activités.

## Installation et Démarrage

### Prérequis

- Node.js (v14 ou supérieur)
- Python (v3.8 ou supérieur)
- Django (v3.2 ou supérieur)

### Étapes d'Installation

1. **Cloner le Répertoire :**

   ```bash
   git clone https://github.com/votre-username/Quizly.git
   cd Quizly
   ```

2. **Installer les Dépendances Frontend :**

   ```bash
   cd frontend
   npm install
   ```

3. **Installer les Dépendances Backend :**

   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Configurer la Base de Données :**

   ```bash
   python manage.py migrate
   ```

5. **Lancer le Serveur de Développement :**

   ```bash
   # Backend
   python manage.py runserver

   # Frontend
   cd ../frontend
   npm start
   ```

6. **Accéder à l'Application :**
   Ouvrez votre navigateur et accédez à `http://localhost:3000`.

## Utilisation

- **Connexion :** Utilisez vos identifiants pour vous connecter à l'application.
- **Création de Quiz :** Les enseignants peuvent télécharger des PDF pour générer automatiquement des quiz.
- **Accès aux Quiz :** Les étudiants peuvent accéder aux quiz via QR code ou liens partageables.
- **Suivi de Progression :** Consultez les tableaux de bord pour suivre la progression individuelle et collective.

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Contact

Pour toute question ou suggestion, n'hésitez pas à nous contacter à [votre-email@example.com](mailto:votre-email@example.com).
