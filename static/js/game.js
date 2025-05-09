/**
 * Classe principale du jeu Unlimited Clicker
 */
class UnlimitedClicker {
    constructor() {
        // État du jeu
        this.clicks = 0;
        this.totalClicks = 0;
        this.clickPower = 1.0;
        this.passiveIncome = 0.0;
        this.prestigeLevel = 0;
        this.prestigeMultiplier = 1.0;
        
        // Clé de sauvegarde localStorage
        this.localStorageKey = 'unlimited-clicker-save';
        
        // Initialiser les modules
        this.initModules();
        
        // Charger l'état du jeu
        this.loadGameState();
        
        // Configurer les événements
        this.setupEventListeners();
        
        // Mettre à jour l'affichage initial
        this.updateDisplay();
        
        // Sauvegarde automatique
        setInterval(() => this.saveGameState(), 60000); // Toutes les 60 secondes
    }
    
    initModules() {
        // Module de clic
        this.clickerModule = new ClickerModule(this);
        
        // Module d'améliorations
        this.upgradesModule = new UpgradesModule(this);
        
        // Module de prestige
        this.prestigeModule = new PrestigeModule(this);
    }
    
    setupEventListeners() {
        // Bouton de sauvegarde
        document.getElementById('save-game').addEventListener('click', () => {
            this.saveGameState();
            alert('Jeu sauvegardé avec succès !');
        });
        
        // Bouton de chargement
        document.getElementById('load-game').addEventListener('click', () => {
            this.loadGameState();
            alert('Jeu chargé avec succès !');
        });
        
        // Bouton de réinitialisation
        document.getElementById('reset-game').addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser le jeu ? Toute progression sera perdue.')) {
                this.resetGameState();
                alert('Jeu réinitialisé avec succès !');
            }
        });
    }
    
    addClicks(amount) {
        this.clicks += amount;
        this.totalClicks += amount;
        this.updateDisplay();
    }
    
    removeClicks(amount) {
        this.clicks = Math.max(0, this.clicks - amount);
        this.updateDisplay();
    }
    
    updateDisplay() {
        // Mettre à jour l'affichage des modules
        this.clickerModule.updateDisplay();
        this.prestigeModule.updateDisplay();
        this.upgradesModule.renderUpgrades();
    }
    
    async saveGameState() {
        // État du jeu à sauvegarder
        const gameState = {
            clicks: this.clicks,
            totalClicks: this.totalClicks,
            clickPower: this.clickPower,
            passiveIncome: this.passiveIncome,
            prestigeLevel: this.prestigeLevel,
            prestigeMultiplier: this.prestigeMultiplier,
            ownedUpgrades: this.upgradesModule.getOwnedUpgrades(),
            timestamp: Date.now()
        };
        
        // Sauvegarder dans localStorage
        saveToLocalStorage(this.localStorageKey, gameState);
        
        // Si connecté, sauvegarder sur le serveur
        if (CONFIG.userLoggedIn) {
            try {
                await fetchAPI(CONFIG.apiEndpoints.save, 'POST', gameState);
            } catch (error) {
                console.error('Erreur lors de la sauvegarde sur le serveur:', error);
            }
        }
    }
    
    async loadGameState() {
        let gameState = null;
        
        // Si connecté, charger depuis le serveur
        if (CONFIG.userLoggedIn) {
            try {
                const response = await fetchAPI(CONFIG.apiEndpoints.load);
                
                if (response.success) {
                    gameState = response.data;
                }
            } catch (error) {
                console.error('Erreur lors du chargement depuis le serveur:', error);
            }
        }
        
        // Si pas de données du serveur, charger depuis localStorage
        if (!gameState) {
            gameState = loadFromLocalStorage(this.localStorageKey);
        }
        
        // Appliquer l'état du jeu chargé
        if (gameState) {
            this.clicks = gameState.clicks || 0;
            this.totalClicks = gameState.totalClicks || 0;
            this.clickPower = gameState.clickPower || 1.0;
            this.passiveIncome = gameState.passiveIncome || 0.0;
            this.prestigeLevel = gameState.prestigeLevel || 0;
            this.prestigeMultiplier = gameState.prestigeMultiplier || 1.0;
            
            // Charger les améliorations possédées
            if (gameState.ownedUpgrades) {
                this.upgradesModule.setOwnedUpgrades(gameState.ownedUpgrades);
            }
            
            // Calculer les gains offline
            this.calculateOfflineProgress(gameState.timestamp);
            
            // Mettre à jour l'affichage
            this.updateDisplay();
        }
    }
    
    resetGameState() {
        // Réinitialiser toutes les valeurs
        this.clicks = 0;
        this.totalClicks = 0;
        this.clickPower = 1.0;
        this.passiveIncome = 0.0;
        this.prestigeLevel = 0;
        this.prestigeMultiplier = 1.0;
        
        // Réinitialiser les améliorations
        this.upgradesModule.setOwnedUpgrades({});
        
        // Supprimer la sauvegarde
        removeFromLocalStorage(this.localStorageKey);
        
        // Si connecté, supprimer sur le serveur
        if (CONFIG.userLoggedIn) {
            fetchAPI(CONFIG.apiEndpoints.save, 'POST', { reset: true })
                .catch(error => console.error('Erreur lors de la réinitialisation sur le serveur:', error));
        }
        
        // Mettre à jour l'affichage
        this.updateDisplay();
    }
    
    calculateOfflineProgress(lastTimestamp) {
        // Si pas de timestamp ou pas de revenu passif, ignorer
        if (!lastTimestamp || this.passiveIncome <= 0) {
            return;
        }
        
        // Calculer le temps écoulé en secondes
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastTimestamp) / 1000);
        
        // Limiter à 24 heures maximum
        const maxOfflineSeconds = 24 * 60 * 60;
        const actualSeconds = Math.min(elapsedSeconds, maxOfflineSeconds);
        
        // Calculer les clics générés en offline
        if (actualSeconds > 0) {
            const offlineClicks = this.passiveIncome * this.prestigeMultiplier * actualSeconds;
            
            if (offlineClicks > 0) {
                this.addClicks(offlineClicks);
                
                // Afficher un message
                const timeString = actualSeconds > 3600 
                    ? `${Math.floor(actualSeconds / 3600)} heures et ${Math.floor((actualSeconds % 3600) / 60)} minutes`
                    : `${Math.floor(actualSeconds / 60)} minutes et ${actualSeconds % 60} secondes`;
                
                alert(`Bienvenue ! Pendant votre absence de ${timeString}, vous avez généré ${formatNumber(offlineClicks)} clics !`);
            }
        }
    }
}

// Initialiser le jeu au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.game = new UnlimitedClicker();
});