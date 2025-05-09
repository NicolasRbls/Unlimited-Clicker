/**
 * Module de gestion des clics
 */
class ClickerModule {
    constructor(game) {
        this.game = game;
        this.clickElement = document.getElementById('clicker');
        this.clickCountElement = document.getElementById('click-count');
        this.clickPowerElement = document.getElementById('click-power');
        this.passiveIncomeElement = document.getElementById('passive-income');
        
        this.setupEventListeners();
        this.startPassiveGeneration();
    }
    
    setupEventListeners() {
        // Événement de clic sur l'élément cliquable
        this.clickElement.addEventListener('click', (event) => {
            const rect = this.clickElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Calculer le gain de clics
            const clickValue = this.calculateClickValue();
            
            // Ajouter les clics au compteur
            this.game.addClicks(clickValue);
            
            // Créer une animation de clic
            createClickAnimation(event.clientX, event.clientY, clickValue);
            
            // Mettre à jour l'affichage
            this.updateDisplay();
        });
    }
    
    calculateClickValue() {
        // La valeur de base du clic multipliée par la puissance de clic et le multiplicateur de prestige
        return this.game.clickPower * this.game.prestigeMultiplier;
    }
    
    startPassiveGeneration() {
        // Générer des clics passifs toutes les secondes
        setInterval(() => {
            if (this.game.passiveIncome > 0) {
                const passiveValue = this.game.passiveIncome * this.game.prestigeMultiplier;
                this.game.addClicks(passiveValue);
                this.updateDisplay();
            }
        }, 1000);
    }
    
    updateDisplay() {
        // Mettre à jour le compteur de clics
        this.clickCountElement.textContent = formatNumber(this.game.clicks);
        
        // Mettre à jour l'affichage de la puissance de clic
        this.clickPowerElement.textContent = formatDecimal(this.calculateClickValue());
        
        // Mettre à jour l'affichage du revenu passif
        this.passiveIncomeElement.textContent = formatDecimal(this.game.passiveIncome * this.game.prestigeMultiplier);
    }
}