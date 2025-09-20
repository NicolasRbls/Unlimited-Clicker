/**
 * Module de gestion des améliorations avec interface moderne
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
        this.upgradesContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('buy-upgrade') || 
                event.target.closest('.buy-upgrade')) {
                const button = event.target.closest('.buy-upgrade');
                const upgradeId = parseInt(button.dataset.id);
                this.buyUpgrade(upgradeId);
            }
        });
    }
    
    renderUpgrades() {
        this.upgrades.forEach(upgrade => {
            const upgradeElement = this.upgradesContainer.querySelector(`.upgrade-item[data-id="${upgrade.id}"]`);
            
            if (upgradeElement) {
                this.updateUpgradeElement(upgradeElement, upgrade);
            }
        });
        
        // Réorganiser les améliorations par disponibilité
        this.organizeUpgrades();
    }
    
    updateUpgradeElement(element, upgrade) {
        const owned = this.ownedUpgrades[upgrade.id] || 0;
        const currentCost = this.calculateUpgradeCost(upgrade, owned);
        const canAfford = this.game.clicks >= currentCost;
        const isUnlocked = this.game.totalClicks >= upgrade.unlockedAtClicks;
        
        // Mettre à jour les valeurs
        const costElement = element.querySelector('.cost-value');
        const ownedElement = element.querySelector('.owned-value');
        const buyButton = element.querySelector('.buy-upgrade');
        
        if (costElement) costElement.textContent = formatNumber(currentCost);
        if (ownedElement) ownedElement.textContent = owned;
        
        // État du bouton
        if (buyButton) {
            buyButton.disabled = !canAfford || !isUnlocked;
            
            if (!isUnlocked) {
                buyButton.innerHTML = `🔒 Requis: ${formatNumber(upgrade.unlockedAtClicks)} clics`;
                buyButton.classList.add('locked');
            } else if (!canAfford) {
                buyButton.innerHTML = `💰 Insuffisant`;
                buyButton.classList.remove('locked');
                buyButton.classList.add('insufficient');
            } else {
                buyButton.innerHTML = `🛒 Acheter`;
                buyButton.classList.remove('locked', 'insufficient');
            }
        }
        
        // Classes CSS pour l'état
        element.classList.toggle('upgrade-locked', !isUnlocked);
        element.classList.toggle('upgrade-affordable', canAfford && isUnlocked);
        element.classList.toggle('upgrade-owned', owned > 0);
        
        // Affichage conditionnel
        if (isUnlocked) {
            element.style.display = 'block';
            element.style.opacity = '1';
        } else {
            element.style.display = 'none';
        }
    }
    
    organizeUpgrades() {
        const upgradeElements = Array.from(this.upgradesContainer.querySelectorAll('.upgrade-item'));
        
        // Trier par: débloquées > abordables > prix croissant
        upgradeElements.sort((a, b) => {
            const aId = parseInt(a.dataset.id);
            const bId = parseInt(b.dataset.id);
            const aUpgrade = this.upgrades.find(u => u.id === aId);
            const bUpgrade = this.upgrades.find(u => u.id === bId);
            
            if (!aUpgrade || !bUpgrade) return 0;
            
            const aUnlocked = this.game.totalClicks >= aUpgrade.unlockedAtClicks;
            const bUnlocked = this.game.totalClicks >= bUpgrade.unlockedAtClicks;
            
            // Débloquées en premier
            if (aUnlocked !== bUnlocked) {
                return bUnlocked ? 1 : -1;
            }
            
            if (aUnlocked && bUnlocked) {
                const aOwned = this.ownedUpgrades[aId] || 0;
                const bOwned = this.ownedUpgrades[bId] || 0;
                const aCost = this.calculateUpgradeCost(aUpgrade, aOwned);
                const bCost = this.calculateUpgradeCost(bUpgrade, bOwned);
                const aAffordable = this.game.clicks >= aCost;
                const bAffordable = this.game.clicks >= bCost;
                
                // Abordables en premier
                if (aAffordable !== bAffordable) {
                    return bAffordable ? 1 : -1;
                }
                
                // Puis par prix croissant
                return aCost - bCost;
            }
            
            return aUpgrade.unlockedAtClicks - bUpgrade.unlockedAtClicks;
        });
        
        // Réorganiser dans le DOM
        upgradeElements.forEach(element => {
            this.upgradesContainer.appendChild(element);
        });
    }
    
    calculateUpgradeCost(upgrade, owned) {
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
        
        if (this.game.clicks >= cost && this.game.totalClicks >= upgrade.unlockedAtClicks) {
            // Animation d'achat
            this.playPurchaseEffect(upgradeId, cost);
            
            // Soustraire le coût
            this.game.removeClicks(cost);
            
            // Mettre à jour le nombre d'améliorations possédées
            this.ownedUpgrades[upgradeId] = owned + 1;
            
            // Appliquer les bonus
            if (upgrade.clickPowerBonus > 0) {
                this.game.clickPower += upgrade.clickPowerBonus;
                this.showBonusNotification('Puissance de clic', `+${upgrade.clickPowerBonus}`);
            }
            
            if (upgrade.passiveIncomeBonus > 0) {
                this.game.passiveIncome += upgrade.passiveIncomeBonus;
                this.showBonusNotification('Production passive', `+${upgrade.passiveIncomeBonus}/sec`);
            }
            
            // Mettre à jour l'affichage
            this.renderUpgrades();
            this.game.updateDisplay();
            
            // Sauvegarder l'état du jeu
            this.game.saveGameState();
            
            // Effets sonores/visuels
            this.celebratePurchase();
        }
    }
    
    playPurchaseEffect(upgradeId, cost) {
        const upgradeElement = this.upgradesContainer.querySelector(`.upgrade-item[data-id="${upgradeId}"]`);
        
        if (upgradeElement) {
            // Animation de l'élément
            upgradeElement.style.animation = 'purchaseGlow 0.8s ease-out';
            
            setTimeout(() => {
                upgradeElement.style.animation = '';
            }, 800);
            
            // Particules de succès
            const rect = upgradeElement.getBoundingClientRect();
            this.createPurchaseParticles(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                cost
            );
        }
    }
    
    createPurchaseParticles(x, y, cost) {
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'purchase-particle';
            particle.style.position = 'fixed';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.borderRadius = '50%';
            particle.style.background = '#39ff14';
            particle.style.boxShadow = '0 0 10px #39ff14';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1001';
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 80 + Math.random() * 40;
            const vx = Math.cos(angle) * distance;
            const vy = Math.sin(angle) * distance;
            
            particle.style.setProperty('--vx', `${vx}px`);
            particle.style.setProperty('--vy', `${vy}px`);
            particle.style.animation = 'purchaseParticleExplosion 1.5s ease-out forwards';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.remove();
                }
            }, 1500);
        }
    }
    
    showBonusNotification(type, value) {
        const notification = document.createElement('div');
        notification.className = 'bonus-notification';
        notification.innerHTML = `
            <div class="bonus-icon">⚡</div>
            <div class="bonus-text">
                <div class="bonus-type">${type}</div>
                <div class="bonus-value">${value}</div>
            </div>
        `;
        
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.zIndex = '1500';
        notification.style.pointerEvents = 'none';
        notification.style.animation = 'bonusNotificationSlide 3s ease-out forwards';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    celebratePurchase() {
        // Vibration sur mobile
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Effet de confettis léger
        this.createConfetti();
    }
    
    createConfetti() {
        const colors = ['#ff6600', '#00ffff', '#39ff14', '#bf00ff'];
        const confettiCount = 20;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '6px';
            confetti.style.height = '6px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '1000';
            confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentElement) {
                    confetti.remove();
                }
            }, 4000);
        }
    }
    
    getOwnedUpgrades() {
        return this.ownedUpgrades;
    }
    
    setOwnedUpgrades(ownedUpgrades) {
        this.ownedUpgrades = ownedUpgrades || {};
        
        // Recalculer les stats totales
        this.game.clickPower = 1.0;
        this.game.passiveIncome = 0.0;
        
        // Appliquer tous les bonus
        for (const [upgradeId, count] of Object.entries(this.ownedUpgrades)) {
            const upgrade = this.upgrades.find(u => u.id === parseInt(upgradeId));
            if (upgrade && count > 0) {
                this.game.clickPower += upgrade.clickPowerBonus * count;
                this.game.passiveIncome += upgrade.passiveIncomeBonus * count;
            }
        }
        
        this.renderUpgrades();
    }
}

// Styles CSS pour les nouvelles animations
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .upgrade-locked {
            opacity: 0.6;
            filter: grayscale(0.8);
        }
        
        .upgrade-affordable {
            border-color: var(--neon-green) !important;
            box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
        }
        
        .upgrade-owned::before {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 20px;
            height: 20px;
            background: var(--neon-green);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
        }
        
        .buy-upgrade.locked {
            background: var(--dark-accent) !important;
            cursor: not-allowed;
        }
        
        .buy-upgrade.insufficient {
            background: linear-gradient(135deg, #ff6b6b, #ee5a52) !important;
        }
        
        @keyframes purchaseGlow {
            0%, 100% { 
                box-shadow: 0 0 5px rgba(57, 255, 20, 0.3);
                transform: scale(1);
            }
            50% { 
                box-shadow: 0 0 30px rgba(57, 255, 20, 0.8);
                transform: scale(1.05);
            }
        }
        
        @keyframes purchaseParticleExplosion {
            0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(var(--vx), var(--vy)) scale(0);
                opacity: 0;
            }
        }
        
        @keyframes bonusNotificationSlide {
            0% {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
            }
            15%, 85% {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            100% {
                transform: translateX(-50%) translateY(-20px);
                opacity: 0;
            }
        }
        
        @keyframes confettiFall {
            to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        
        .bonus-notification {
            background: var(--glass-bg);
            border: 1px solid var(--neon-green);
            border-radius: 15px;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            backdrop-filter: blur(20px);
        }
        
        .bonus-icon {
            font-size: 1.5rem;
            color: var(--neon-green);
        }
        
        .bonus-type {
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-transform: uppercase;
        }
        
        .bonus-value {
            color: var(--neon-green);
            font-weight: bold;
            font-size: 1.1rem;
        }
    `;
    document.head.appendChild(style);
});