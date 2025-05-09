from functools import wraps
from flask import session, redirect, url_for, flash
from werkzeug.security import generate_password_hash

# Décorateur pour protéger les routes qui nécessitent une connexion
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Vous devez être connecté pour accéder à cette page')
            return redirect(url_for('main.login'))
        return f(*args, **kwargs)
    return decorated_function

def is_admin(user_id):
    """Vérifie si un utilisateur est administrateur"""
    from app.models import User
    user = User.query.get(user_id)
    return user and user.is_admin

def admin_required(f):
    """Décorateur pour protéger les routes d'administration"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Vous devez être connecté pour accéder à cette page.')
            return redirect(url_for('main.login'))
        
        if not is_admin(session['user_id']):
            flash('Accès refusé. Vous devez être administrateur pour accéder à cette page.')
            return redirect(url_for('main.index'))
            
        return f(*args, **kwargs)
    return decorated_function

def init_db(db):
    """
    Initialise la base de données :
    - Insère un jeu d'upgrades par défaut s'il n'existe pas encore.
    - Crée un utilisateur 'admin' avec ses statistiques si absent.
    """
    from app.models import Upgrade, User, PlayerStats

    session = db.session

    # 1) Insérer les upgrades par défaut
    if not session.query(Upgrade).first():
        default_upgrades = [
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
        session.bulk_save_objects(default_upgrades)

    # 2) Créer l'utilisateur admin + ses stats
    admin = session.query(User).filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', is_admin=True)
        admin.set_password('nico')
        session.add(admin)

        # Flush pour générer admin.id sans commiter définitivement
        session.flush()

        admin_stats = PlayerStats(user_id=admin.id)
        session.add(admin_stats)

        print("Utilisateur admin créé avec le mot de passe 'nico'")

    # 3) Commit final (création du schéma fait ailleurs)
    session.commit()
