from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import click
from flask.cli import with_appcontext

db = SQLAlchemy()

def create_app():
    # Crée l’appli et charge la config
    app = Flask(__name__)
    from config import Config
    app.config.from_object(Config)

    # Initialise SQLAlchemy
    db.init_app(app)

    # Enregistre le blueprint principal sous BASEPATH
    from app.routes import main_bp
    app.register_blueprint(main_bp, url_prefix=app.config['BASE_PATH'])

    # Injection de basepath dans les templates
    @app.context_processor
    def inject_basepath():
        return dict(basepath=app.config['BASE_PATH'])

    # Ajoute la commande init-db au CLI
    register_commands(app)

    return app


@click.command('init-db')
@with_appcontext
def init_db_command():
    """Crée toutes les tables en base de données."""
    # Crée le dossier parent si nécessaire
    from pathlib import Path
    db_file = Path(db.engine.url.database)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    # Puis crée les tables
    db.create_all()
    from app.utils import init_db as populate_upgrades
    populate_upgrades(db)
    click.echo('✅ Base de données initialisée.')


def register_commands(app):
    """Ajoute les commandes CLI personnalisées à l’application."""
    app.cli.add_command(init_db_command)
