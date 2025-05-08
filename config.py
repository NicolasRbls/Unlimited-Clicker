import os
from pathlib import Path
from dotenv import load_dotenv

# Charge explicitement le .env à la racine du projet
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path, override=True)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
    BASE_PATH  = os.getenv("BASE_PATH") or "/Unlimited-Clicker"
    APPLICATION_ROOT = BASE_PATH

    # ← CALCUL DYNAMIQUE DU CHEMIN ABSOLU
    basedir = Path(__file__).parent.resolve()
    db_path = basedir / "app" / "database.db"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    DEBUG = os.getenv("FLASK_ENV") == "development"
