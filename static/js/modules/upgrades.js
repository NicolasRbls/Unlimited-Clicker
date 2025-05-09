/**
 * Module de gestion des améliorations
 */
class UpgradesModule {
    constructor(game) {
        this.game = game;
        this.upgradesContainer = document.getElementById('upgrades-container');
        this.upgrades = [];
        this.ownedUpgrades = {};
        
        this.setupEventListeners();
        this.loadUpgrades();
    }
    
    async loadUpgrades() {
        try {
            // Charger les améliorations depuis l'API
            const response = await fetchAPI(CONFIG.apiEndpoints.upgrades);
            
            if (response.success) {
                this.upgrades = response.upgrades;
                this.renderUpgrades();
            } else {
                console.error('Erreur lors du chargement des améliorations:', response.message);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des améliorations:', error);
        }
    }
    
    setupEventListeners() {
        // Délégation d'événements pour les boutons d'achat
        this.upgradesContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('buy-upgrade')) {
                const upgradeId = parseInt(event.target.dataset.id);
                this.buyUpgrade(upgradeId);
            }
        });
    }
    
    renderUpgrades() {
        // Afficher les améliorations disponibles en fonction des clics actuels
        this.upgrades.forEach(upgrade => {
            const upgradeElement = this.upgradesContainer.querySelector(`.upgrade-item[data-id="${upgrade.id}"]`);
            
            if (upgradeElement) {
                // Mettre à jour les éléments existants
                const owned = this.ownedUpgrades[upgrade.id] || 0;
                const costElement = upgradeElement.querySelector('.cost span');
                const ownedElement = upgradeElement.querySelector('.owned span');
                const buyButton = upgradeElement.querySelector('.buy-upgrade');
                
                // Calculer le coût actuel
                const currentCost = this.calculateUpgradeCost(upgrade, owned);
                
                // Mettre à jour l'affichage
                costElement.textContent = formatNumber(currentCost);
                ownedElement.textContent = owned;
                
                // Activer/désactiver le bouton en fonction du coût
                buyButton.disabled = this.game.clicks < currentCost;
                
                // Afficher/masquer en fonction du déblocage
                if (this.game.totalClicks >= upgrade.unlockedAtClicks) {
                    upgradeElement.style.display = 'block';
                } else {
                    upgradeElement.style.display = 'none';
                }
            }
        });
    }
    
    calculateUpgradeCost(upgrade, owned) {
        // Formule de coût exponentiel: coût de base * (1.15 ^ owned)
        return Math.floor(upgrade.baseCost * Math.pow(1.15, owned));
    }
    
    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        
        if (!upgrade) {
            console.error(`Amélioration avec l'ID ${upgradeId} non trouvée`);
            return;
        }
        
        const owned = this.ownedUpgrades[upgradeId] || 0;
        const cost = this.calculateUpgradeCost(upgrade, owned);
        
        // Vérifier si le joueur a assez de clics
        if (this.game.clicks >= cost) {
            // Soustraire le coût
            this.game.removeClicks(cost);
            
            // Mettre à jour le nombre d'améliorations possédées
            this.ownedUpgrades[upgradeId] = owned + 1;
            
            // Appliquer les bonus
            if (upgrade.clickPowerBonus > 0) {
                this.game.clickPower += upgrade.clickPowerBonus;
            }
            
            if (upgrade.passiveIncomeBonus > 0) {
                this.game.passiveIncome += upgrade.passiveIncomeBonus;
            }
            
            // Mettre à jour l'affichage
            this.renderUpgrades();
            this.game.updateDisplay();
            
            // Sauvegarder l'état du jeu
            this.game.saveGameState();
        }
    }
    
    getOwnedUpgrades() {
        return this.ownedUpgrades;
    }
    
    setOwnedUpgrades(ownedUpgrades) {
        this.ownedUpgrades = ownedUpgrades || {};
        this.renderUpgrades();
    }
}