from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, current_app, flash
from app.models import User, PlayerStats, Upgrade
from app import db
from app.utils import login_required, admin_required  # Importer les décorateurs
import json
from datetime import datetime
from sqlalchemy import func

# Créer un blueprint pour les routes principales
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def redirect_to_base_path():
    """Redirige la racine vers le chemin de base configuré"""
    return redirect(url_for('main.index'))

@main_bp.route('/Unlimited-Clicker/')
def index():
    """Page principale du jeu"""
    upgrades = Upgrade.query.all()
    return render_template('index.html', upgrades=upgrades)

@main_bp.route('/stats')
def stats():
    """Page des statistiques du joueur"""
    return render_template('stats.html')

@main_bp.route('/admin')
@admin_required  # Utilise le décorateur admin_required correctement importé
def admin():
    """Page d'administration (protégée)"""
    # Récupérer les données pour la page d'admin
    users = User.query.all()
    upgrades = Upgrade.query.all()
    
    # Calculer les statistiques globales
    total_clicks = db.session.query(func.sum(PlayerStats.total_clicks)).scalar() or 0
    users_count = User.query.count()
    
    # Pour les upgrades achetés, on pourrait ajouter un champ ou l'estimer d'après les données de jeu
    total_upgrades = Upgrade.query.count()  # Simplifié pour l'exemple
    
    return render_template('admin.html',
                          users=users,
                          upgrades=upgrades,
                          users_count=users_count,
                          total_clicks=total_clicks,
                          total_upgrades=total_upgrades)

# API Routes pour l'administration
@main_bp.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    """Récupère la liste des utilisateurs pour l'admin"""
    users = User.query.all()
    users_data = []
    
    for user in users:
        stats = user.stats
        users_data.append({
            'id': user.id,
            'username': user.username,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_admin': user.is_admin,
            'total_clicks': stats.total_clicks if stats else 0,
            'prestige_level': stats.prestige_level if stats else 0
        })
    
    return jsonify({'success': True, 'users': users_data})

@main_bp.route('/api/admin/upgrades', methods=['GET'])
@admin_required
def admin_get_upgrades():
    """Récupère la liste des améliorations pour l'admin"""
    upgrades = Upgrade.query.all()
    upgrades_data = []
    
    for upgrade in upgrades:
        upgrades_data.append({
            'id': upgrade.id,
            'name': upgrade.name,
            'description': upgrade.description,
            'base_cost': upgrade.base_cost,
            'click_power_bonus': upgrade.click_power_bonus,
            'passive_income_bonus': upgrade.passive_income_bonus,
            'unlocked_at_clicks': upgrade.unlocked_at_clicks
        })
    
    return jsonify({'success': True, 'upgrades': upgrades_data})

@main_bp.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_get_stats():
    """Récupère les statistiques globales pour l'admin"""
    users_count = User.query.count()
    total_clicks = db.session.query(func.sum(PlayerStats.total_clicks)).scalar() or 0
    total_upgrades = Upgrade.query.count()  # Simplifié
    
    return jsonify({
        'success': True,
        'stats': {
            'users_count': users_count,
            'total_clicks': total_clicks,
            'total_upgrades': total_upgrades
        }
    })

@main_bp.route('/api/admin/users/update', methods=['POST'])
@admin_required
def admin_update_user():
    """Met à jour un utilisateur (admin)"""
    data = request.json
    user_id = data.get('id')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Utilisateur non trouvé'})
    
    # Mettre à jour les champs permis
    if 'username' in data:
        user.username = data['username']
    
    # Gérer les stats si elles existent
    if user.stats:
        if 'total_clicks' in data:
            user.stats.total_clicks = data['total_clicks']
            user.stats.clicks = min(data['total_clicks'], user.stats.clicks)  # Limiter les clics actuels
        
        if 'prestige_level' in data:
            user.stats.prestige_level = data['prestige_level']
    
    db.session.commit()
    return jsonify({'success': True})

@main_bp.route('/api/admin/users/delete', methods=['POST'])
@admin_required
def admin_delete_user():
    """Supprime un utilisateur (admin)"""
    data = request.json
    user_id = data.get('id')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Utilisateur non trouvé'})
    
    # Ne pas permettre de supprimer l'admin principal
    if user.username == 'admin':
        return jsonify({'success': False, 'message': 'Impossible de supprimer l\'administrateur principal'})
    
    # Supprimer les stats associées
    if user.stats:
        db.session.delete(user.stats)
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True})

@main_bp.route('/api/admin/upgrades/add', methods=['POST'])
@admin_required
def admin_add_upgrade():
    """Ajoute une amélioration (admin)"""
    data = request.json
    
    new_upgrade = Upgrade(
        name=data.get('name', 'Nouvelle amélioration'),
        description=data.get('description', ''),
        base_cost=data.get('base_cost', 100),
        click_power_bonus=data.get('click_power_bonus', 0),
        passive_income_bonus=data.get('passive_income_bonus', 0),
        unlocked_at_clicks=data.get('unlocked_at_clicks', 0)
    )
    
    db.session.add(new_upgrade)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'upgrade': {
            'id': new_upgrade.id,
            'name': new_upgrade.name,
            'description': new_upgrade.description,
            'base_cost': new_upgrade.base_cost,
            'click_power_bonus': new_upgrade.click_power_bonus,
            'passive_income_bonus': new_upgrade.passive_income_bonus,
            'unlocked_at_clicks': new_upgrade.unlocked_at_clicks
        }
    })

@main_bp.route('/api/admin/upgrades/update', methods=['POST'])
@admin_required
def admin_update_upgrade():
    """Met à jour une amélioration (admin)"""
    data = request.json
    upgrade_id = data.get('id')
    
    upgrade = Upgrade.query.get(upgrade_id)
    if not upgrade:
        return jsonify({'success': False, 'message': 'Amélioration non trouvée'})
    
    # Mettre à jour les champs
    if 'name' in data:
        upgrade.name = data['name']
    
    if 'description' in data:
        upgrade.description = data['description']
    
    if 'base_cost' in data:
        upgrade.base_cost = data['base_cost']
    
    if 'click_power_bonus' in data:
        upgrade.click_power_bonus = data['click_power_bonus']
    
    if 'passive_income_bonus' in data:
        upgrade.passive_income_bonus = data['passive_income_bonus']
    
    if 'unlocked_at_clicks' in data:
        upgrade.unlocked_at_clicks = data['unlocked_at_clicks']
    
    db.session.commit()
    return jsonify({'success': True})

@main_bp.route('/api/admin/upgrades/delete', methods=['POST'])
@admin_required
def admin_delete_upgrade():
    """Supprime une amélioration (admin)"""
    data = request.json
    upgrade_id = data.get('id')
    
    upgrade = Upgrade.query.get(upgrade_id)
    if not upgrade:
        return jsonify({'success': False, 'message': 'Amélioration non trouvée'})
    
    db.session.delete(upgrade)
    db.session.commit()
    return jsonify({'success': True})

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

# Routes d'authentification (sécurisées avec hachage)
@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):  # Utilisation de la méthode de vérification
            session['user_id'] = user.id
            
            # Définir le flag admin si l'utilisateur est admin
            if user.is_admin:
                session['admin'] = True
                
            user.last_login = datetime.utcnow()
            db.session.commit()
            return redirect(url_for('main.index'))
        
        # Échec de connexion
        return render_template('login.html', error='Nom d\'utilisateur ou mot de passe incorrect')
    
    return render_template('login.html')

@main_bp.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('admin', None)  # Supprimer aussi le flag admin
    return redirect(url_for('main.index'))

@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Vérifier si les mots de passe correspondent
        if password != confirm_password:
            return render_template('register.html', error='Les mots de passe ne correspondent pas')
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return render_template('register.html', error='Nom d\'utilisateur déjà pris')
        
        # Créer un nouvel utilisateur avec le mot de passe haché
        new_user = User(username=username)
        new_user.set_password(password)  # Utiliser la méthode pour hacher le mot de passe
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

@main_bp.route('/test-template')
def test_template():
    """Test si Flask peut rendre un template simple"""
    return render_template('base.html')

@main_bp.route('/api/admin/user/<int:user_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_user(user_id):
    """Page d'édition d'un utilisateur"""
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        username = request.form.get('username')
        is_admin = request.form.get('is_admin') == 'on'
        
        if username and username != user.username:
            # Vérifier si le nom d'utilisateur est déjà pris
            if User.query.filter_by(username=username).first() and username != user.username:
                flash('Ce nom d\'utilisateur est déjà pris.')
                return redirect(url_for('main.edit_user', user_id=user_id))
            user.username = username
        
        user.is_admin = is_admin
        db.session.commit()
        flash('Utilisateur modifié avec succès.')
        return redirect(url_for('main.admin'))
    
    return render_template('admin.html', user=user)

@main_bp.route('/api/admin/user/<int:user_id>/delete')
@admin_required
def delete_user(user_id):
    """Supprime un utilisateur"""
    user = User.query.get_or_404(user_id)
    if user.id == session.get('user_id'):
        flash('Vous ne pouvez pas supprimer votre propre compte.')
        return redirect(url_for('main.admin'))
    
    db.session.delete(user)
    db.session.commit()
    flash('Utilisateur supprimé avec succès.')
    return redirect(url_for('main.admin'))

@main_bp.route('/api/admin/upgrade/<int:upgrade_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_upgrade(upgrade_id):
    """Page d'édition d'une amélioration"""
    upgrade = Upgrade.query.get_or_404(upgrade_id)
    
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        base_cost = request.form.get('base_cost', type=int)
        click_power_bonus = request.form.get('click_power_bonus', type=float)
        passive_income_bonus = request.form.get('passive_income_bonus', type=float)
        unlocked_at_clicks = request.form.get('unlocked_at_clicks', type=int)
        
        if name:
            upgrade.name = name
        if description:
            upgrade.description = description
        if base_cost is not None:
            upgrade.base_cost = base_cost
        if click_power_bonus is not None:
            upgrade.click_power_bonus = click_power_bonus
        if passive_income_bonus is not None:
            upgrade.passive_income_bonus = passive_income_bonus
        if unlocked_at_clicks is not None:
            upgrade.unlocked_at_clicks = unlocked_at_clicks
        
        db.session.commit()
        flash('Amélioration modifiée avec succès.')
        return redirect(url_for('main.admin'))
    
    return render_template('admin.html', upgrade=upgrade)

@main_bp.route('/api/admin/upgrade/<int:upgrade_id>/delete')
@admin_required
def delete_upgrade(upgrade_id):
    """Supprime une amélioration"""
    upgrade = Upgrade.query.get_or_404(upgrade_id)
    
    db.session.delete(upgrade)
    db.session.commit()
    flash('Amélioration supprimée avec succès.')
    return redirect(url_for('main.admin'))