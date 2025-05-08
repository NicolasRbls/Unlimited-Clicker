from app import db
from datetime import datetime
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec les statistiques du joueur
    stats = db.relationship('PlayerStats', backref='user', lazy=True, uselist=False)
    
    def __repr__(self):
        return f'<User {self.username}>'

class PlayerStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    clicks = db.Column(db.Integer, default=0)
    total_clicks = db.Column(db.BigInteger, default=0)
    click_power = db.Column(db.Float, default=1.0)
    passive_income = db.Column(db.Float, default=0.0)
    prestige_level = db.Column(db.Integer, default=0)
    prestige_multiplier = db.Column(db.Float, default=1.0)
    game_data_json = db.Column(db.Text, default='{}')
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_game_data(self):
        return json.loads(self.game_data_json)
    
    def set_game_data(self, data):
        self.game_data_json = json.dumps(data)
    
    def __repr__(self):
        return f'<PlayerStats user_id={self.user_id} clicks={self.clicks}>'

class Upgrade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    base_cost = db.Column(db.Integer, nullable=False)
    click_power_bonus = db.Column(db.Float, default=0.0)
    passive_income_bonus = db.Column(db.Float, default=0.0)
    unlocked_at_clicks = db.Column(db.Integer, default=0)
    
    def calculate_cost(self, owned):
        return int(self.base_cost * (1.15 ** owned))
    
    def __repr__(self):
        return f'<Upgrade {self.name}>'