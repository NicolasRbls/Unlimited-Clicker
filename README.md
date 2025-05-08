# Unlimited Clicker

Un jeu de clicker simple développé avec Flask.

## Installation

1. Cloner le dépôt :

   ```bash
   git clone <URL_DU_DEPOT>
   cd Unlimited-Clicker
   ```
2. Créer un environnement virtuel et l'activer :

   ```bash
   python -m venv venv
   . venv/bin/activate  # ou venv\Scripts\activate sur Windows
   ```
3. Installer les dépendances :

   ```bash
   pip install -r requirements.txt
   ```

## Configuration

* Copier le fichier `.env` et ajuster les variables si nécessaire :

  ```ini
  FLASK_APP=run.py
  FLASK_ENV=development
  BASE_PATH=/
  SECRET_KEY=change_this_to_something_secure
  ```

## Lancement du serveur

```bash
flask run
```

Le jeu sera accessible à l'adresse [http://localhost:5000](http://localhost:5000).

## Structure du projet

```
app/           # Code de l'application (routes, modèles, utils)
templates/     # Templates Jinja2
static/        # Fichiers statiques (CSS, JS, images)
config.py      # Configuration de l'application
run.py         # Point d'entrée de l'application
requirements.txt
README.md
```

## Licence

Sous licence MIT.
