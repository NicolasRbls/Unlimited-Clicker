# Script PowerShell pour créer la structure du projet Unlimited Clicker
# (tout dans le dossier où ce script est exécuté)

# Définir le chemin racine du projet sur le dossier courant
$projectRoot = "."

# Créer l'arborescence des dossiers
$folders = @(
    "app",
    "templates",
    "static",
    "static\css",
    "static\js",
    "static\js\modules",
    "static\img"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path "$projectRoot\$folder" -Force | Out-Null
    Write-Host "Dossier créé: $folder"
}

# Créer les fichiers de base (vides)
$files = @(
    "app\__init__.py",
    "app\routes.py",
    "app\models.py",
    "app\utils.py",
    "templates\base.html",
    "templates\index.html",
    "templates\stats.html",
    "templates\admin.html",
    "templates\login.html",
    "templates\register.html",
    "static\css\style.css",
    "static\js\game.js",
    "static\js\utils.js",
    "static\js\stats.js",
    "static\js\admin.js",
    "static\js\modules\clicker.js",
    "static\js\modules\upgrades.js",
    "static\js\modules\prestige.js",
    "config.py",
    ".env",
    "run.py",
    "requirements.txt",
    "README.md"
)

foreach ($file in $files) {
    New-Item -ItemType File -Path "$projectRoot\$file" -Force | Out-Null
    Write-Host "Fichier créé: $file"
}

# Ajouter une image de placeholder pour le clicker
$placeholderContent = "Placeholder pour l'image du clicker"
Set-Content -Path "$projectRoot\static\img\clicker.png" -Value $placeholderContent

# Remplir requirements.txt avec les dépendances nécessaires
$requirementsContent = @"
Flask==2.3.3
Flask-SQLAlchemy==3.1.1
python-dotenv==1.0.0
gunicorn==21.2.0
"@
Set-Content -Path "$projectRoot\requirements.txt" -Value $requirementsContent

# Créer un .env de base
$envContent = @"
FLASK_APP=run.py
FLASK_ENV=development
BASE_PATH=/
SECRET_KEY=change_this_to_something_secure
"@
Set-Content -Path "$projectRoot\.env" -Value $envContent

Write-Host "Structure du projet Unlimited Clicker créée avec succès dans $(Resolve-Path $projectRoot)!" -ForegroundColor Green
