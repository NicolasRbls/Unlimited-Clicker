from functools import wraps
from flask import session, redirect, url_for, flash

# Décorateur pour protéger les routes qui nécessitent une connexion
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Vous devez être connecté pour accéder à cette page')
            return redirect(url_for('main.login'))
        return f(*args, **kwargs)
    return decorated_function

# Initialisation de la base de données avec des valeurs par défaut
def init_db(db):
    from app.models import Upgrade
    
    # Vérifier si la base de données contient déjà des upgrades
    if Upgrade.query.first() is None:
        # Ajouter des améliorations par défaut
        upgrades = [
            Upgrade(
                name="Meilleur curseur",
                description="Double la puissance de clic",
                base_cost=10,
                click_power_bonus=1.0,
                passive_income_bonus=0.0,
                unlocked_at_clicks=0
            ),
            Upgrade(
                name="Auto-clicker basique",
                description="Génère 0.1 clic par seconde",
                base_cost=50,
                click_power_bonus=0.0,
                passive_income_bonus=0.1,
                unlocked_at_clicks=10
            ),
            Upgrade(
                name="Curseur d'or",
                description="Quadruple la puissance de clic",
                base_cost=500,
                click_power_bonus=3.0,
                passive_income_bonus=0.0,
                unlocked_at_clicks=100
            ),
            Upgrade(
                name="Auto-clicker avancé",
                description="Génère 1 clic par seconde",
                base_cost=1000,
                click_power_bonus=0.0,
                passive_income_bonus=1.0,
                unlocked_at_clicks=200
            ),
            Upgrade(
                name="Curseur de diamant",
                description="Augmente la puissance de clic x10",
                base_cost=10000,
                click_power_bonus=10.0,
                passive_income_bonus=0.0,
                unlocked_at_clicks=1000
            ),
            Upgrade(
                name="Usine à clics",
                description="Génère 10 clics par seconde",
                base_cost=50000,
                click_power_bonus=0.0,
                passive_income_bonus=10.0,
                unlocked_at_clicks=5000
            ),
        ]
        
        for upgrade in upgrades:
            db.session.add(upgrade)
        
        db.session.commit()