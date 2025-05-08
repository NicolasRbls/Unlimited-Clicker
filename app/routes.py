from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, current_app
from app.models import User, PlayerStats, Upgrade
from app import db
import json
from datetime import datetime

# Créer un blueprint pour les routes principales
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Page principale du jeu"""
    # Liste des upgrades disponibles pour l'affichage
    upgrades = Upgrade.query.all()
    return render_template('index.html', upgrades=upgrades)

@main_bp.route('/stats')
def stats():
    """Page des statistiques du joueur"""
    return render_template('stats.html')

@main_bp.route('/admin')
def admin():
    """Page d'administration (protégée)"""
    # Exemple simple, à améliorer avec une authentification réelle
    if not session.get('admin'):
        return redirect(url_for('main.index'))
    return render_template('admin.html')

# API Routes
@main_bp.route('/api/save', methods=['POST'])
def save_game():
    """Sauvegarde l'état du jeu"""
    data = request.json
    
    # Option 1: Sauvegarde anonyme (sans login)
    if 'user_id' not in session:
        # Stocker les données pour une session temporaire
        session['game_data'] = json.dumps(data)
        return jsonify({'success': True, 'message': 'Jeu sauvegardé en session'})
    
    # Option 2: Sauvegarde avec utilisateur connecté
    else:
        user_id = session['user_id']
        player_stats = PlayerStats.query.filter_by(user_id=user_id).first()
        
        if not player_stats:
            # Créer de nouvelles stats si elles n'existent pas
            player_stats = PlayerStats(user_id=user_id)
            db.session.add(player_stats)
        
        # Mettre à jour les statistiques
        player_stats.clicks = data.get('clicks', 0)
        player_stats.total_clicks = data.get('totalClicks', 0)
        player_stats.click_power = data.get('clickPower', 1.0)
        player_stats.passive_income = data.get('passiveIncome', 0.0)
        player_stats.prestige_level = data.get('prestigeLevel', 0)
        player_stats.prestige_multiplier = data.get('prestigeMultiplier', 1.0)
        player_stats.set_game_data(data)
        player_stats.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Jeu sauvegardé en base de données'})

@main_bp.route('/api/load', methods=['GET'])
def load_game():
    """Charge l'état du jeu"""
    # Option 1: Chargement anonyme (depuis la session)
    if 'user_id' not in session:
        game_data = session.get('game_data', '{}')
        try:
            return jsonify({'success': True, 'data': json.loads(game_data)})
        except:
            return jsonify({'success': False, 'message': 'Données de jeu invalides'})
    
    # Option 2: Chargement avec utilisateur connecté
    else:
        user_id = session['user_id']
        player_stats = PlayerStats.query.filter_by(user_id=user_id).first()
        
        if not player_stats:
            return jsonify({'success': False, 'message': 'Aucune sauvegarde trouvée'})
        
        return jsonify({'success': True, 'data': player_stats.get_game_data()})

@main_bp.route('/api/upgrades', methods=['GET'])
def get_upgrades():
    """Récupère la liste des améliorations disponibles"""
    upgrades = Upgrade.query.all()
    upgrades_data = []
    
    for upgrade in upgrades:
        upgrades_data.append({
            'id': upgrade.id,
            'name': upgrade.name,
            'description': upgrade.description,
            'baseCost': upgrade.base_cost,
            'clickPowerBonus': upgrade.click_power_bonus,
            'passiveIncomeBonus': upgrade.passive_income_bonus,
            'unlockedAtClicks': upgrade.unlocked_at_clicks
        })
    
    return jsonify({'success': True, 'upgrades': upgrades_data})

# Routes d'authentification (basique pour l'exemple)
@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')  # À hacher dans une vraie application
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.password_hash == password:  # Vérification simplifiée
            session['user_id'] = user.id
            user.last_login = datetime.utcnow()
            db.session.commit()
            return redirect(url_for('main.index'))
        
        # Échec de connexion
        return render_template('login.html', error='Nom d\'utilisateur ou mot de passe incorrect')
    
    return render_template('login.html')

@main_bp.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('main.index'))

@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')  # À hacher dans une vraie application
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return render_template('register.html', error='Nom d\'utilisateur déjà pris')
        
        # Créer un nouvel utilisateur
        new_user = User(username=username, password_hash=password)
        db.session.add(new_user)
        db.session.commit()
        
        # Créer les statistiques initiales pour l'utilisateur
        new_stats = PlayerStats(user_id=new_user.id)
        db.session.add(new_stats)
        db.session.commit()
        
        # Connecter l'utilisateur
        session['user_id'] = new_user.id
        
        return redirect(url_for('main.index'))
    
    return render_template('register.html')