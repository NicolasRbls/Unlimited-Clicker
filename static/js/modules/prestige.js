/**
 * Module de gestion du système de prestige
 */
class PrestigeModule {
    constructor(game) {
        this.game = game;
        this.prestigeButton = document.getElementById('prestige-button');
        this.prestigeLevelElement = document.getElementById('prestige-level');
        this.prestigeMultiplierElement = document.getElementById('prestige-multiplier');
        
        // Seuil de clics pour le prestige
        this.prestigeThreshold = 10000;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Événement de clic sur le bouton de prestige
        this.prestigeButton.addEventListener('click', () => {
            this.performPrestige();
        });
    }
    
    updateDisplay() {
        // Mettre à jour l'affichage du niveau de prestige
        this.prestigeLevelElement.textContent = this.game.prestigeLevel;
        
        // Mettre à jour l'affichage du multiplicateur de prestige
        this.prestigeMultiplierElement.textContent = `x${formatDecimal(this.game.prestigeMultiplier)}`;
        
        // Activer/désactiver le bouton de prestige
        const canPrestige = this.game.clicks >= this.calculatePrestigeThreshold();
        this.prestigeButton.disabled = !canPrestige;
        
        // Mettre à jour le texte du bouton
        this.prestigeButton.textContent = `Prestige (Requiert ${formatNumber(this.calculatePrestigeThreshold())} clics)`;
    }
    
    calculatePrestigeThreshold() {
        // Seuil de prestige qui augmente avec le niveau de prestige
        return this.prestigeThreshold * Math.pow(3, this.game.prestigeLevel);
    }
    
    calculatePrestigeMultiplier(level) {
        // Formule de multiplicateur de prestige: 1 + (niveau * 0.5)
        return 1 + (level * 0.5);
    }
    
    performPrestige() {
        // Vérifier si le joueur a assez de clics pour le prestige
        if (this.game.clicks >= this.calculatePrestigeThreshold()) {
            // Augmenter le niveau de prestige
            this.game.prestigeLevel++;
            
            // Calculer le nouveau multiplicateur
            this.game.prestigeMultiplier = this.calculatePrestigeMultiplier(this.game.prestigeLevel);
            
            // Réinitialiser les clics et les améliorations
            this.game.clicks = 0;
            this.game.upgradesModule.setOwnedUpgrades({});
            
            // Réinitialiser la puissance de clic et le revenu passif
            this.game.clickPower = 1.0;
            this.game.passiveIncome = 0.0;
            
            // Mettre à jour l'affichage
            this.updateDisplay();
            this.game.updateDisplay();
            
            // Afficher un message de succès
            alert(`Félicitations ! Vous avez atteint le niveau de prestige ${this.game.prestigeLevel} avec un multiplicateur de x${formatDecimal(this.game.prestigeMultiplier)} !`);
            
            // Sauvegarder l'état du jeu
            this.game.saveGameState();
        }
    }
}