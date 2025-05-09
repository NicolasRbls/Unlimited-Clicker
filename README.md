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
Unlimited-Clicker/
│
├── app/
│   ├── __init__.py
│   ├── routes.py
│   ├── models.py
│   ├── database.db
│   └── utils.py
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── stats.html
│   └── admin.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── game.js
│   │   ├── modules/
│   │   │   ├── clicker.js
│   │   │   ├── upgrades.js
│   │   │   └── prestige.js
│   │   └── utils.js
│   └── img/
│       └── clicker.png
│
├── config.py
├── .env
├── run.py
└── README.md
```

## Licence

Sous licence MIT.
