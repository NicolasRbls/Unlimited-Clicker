/**
 * Module de gestion des clics avec effets visuels modernes
 */
class ClickerModule {
    constructor(game) {
        this.game = game;
        this.clickElement = document.getElementById('clicker');
        this.clickCountElement = document.getElementById('click-count');
        this.clickPowerElement = document.getElementById('click-power');
        this.passiveIncomeElement = document.getElementById('passive-income');
        
        // Compteur d'effets pour éviter la surcharge
        this.effectCount = 0;
        this.maxEffects = 10;
        
        this.setupEventListeners();
        this.startPassiveGeneration();
    }
    
    setupEventListeners() {
        // Événement de clic sur l'élément cliquable
        this.clickElement.addEventListener('click', (event) => {
            this.handleClick(event);
        });
        
        // Effets visuels au survol
        this.clickElement.addEventListener('mouseenter', () => {
            this.clickElement.style.transform = 'scale(1.1)';
        });
        
        this.clickElement.addEventListener('mouseleave', () => {
            this.clickElement.style.transform = 'scale(1)';
        });
        
        // Support tactile pour mobile
        this.clickElement.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.handleClick(event);
        }, { passive: false });
    }
    
    handleClick(event) {
        // Calculer le gain de clics
        const clickValue = this.calculateClickValue();
        
        // Ajouter les clics au compteur
        this.game.addClicks(clickValue);
        
        // Créer des effets visuels
        this.createClickEffects(event, clickValue);
        
        // Animation de l'élément clicker
        this.animateClicker();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        // Son de clic (si disponible)
        this.playClickSound();
    }
    
    calculateClickValue() {
        // La valeur de base du clic multipliée par la puissance de clic et le multiplicateur de prestige
        return this.game.clickPower * this.game.prestigeMultiplier;
    }
    
    createClickEffects(event, value) {
        // Limitation des effets pour éviter la surcharge
        if (this.effectCount >= this.maxEffects) return;
        
        this.effectCount++;
        
        // Obtenir la position du clic
        const rect = this.clickElement.getBoundingClientRect();
        const x = event.clientX || (event.touches ? event.touches[0].clientX : rect.left + rect.width/2);
        const y = event.clientY || (event.touches ? event.touches[0].clientY : rect.top + rect.height/2);
        
        // Animation de texte flottant
        this.createFloatingText(x, y, value);
        
        // Particules d'explosion
        this.createClickParticles(x, y);
        
        // Onde de choc
        this.createShockwave(rect.left + rect.width/2, rect.top + rect.height/2);
        
        // Décrémenter le compteur après un délai
        setTimeout(() => {
            this.effectCount = Math.max(0, this.effectCount - 1);
        }, 1000);
    }
    
    createFloatingText(x, y, value) {
        const textElement = document.createElement('div');
        textElement.className = 'click-animation floating-text';
        textElement.textContent = '+' + formatNumber(value);
        textElement.style.left = `${x}px`;
        textElement.style.top = `${y}px`;
        textElement.style.position = 'fixed';
        textElement.style.zIndex = '1000';
        textElement.style.pointerEvents = 'none';
        textElement.style.fontSize = '1.5rem';
        textElement.style.fontWeight = 'bold';
        textElement.style.animation = 'floatUp 2s ease-out forwards';
        
        // Couleur basée sur la valeur
        if (value >= 1000) {
            textElement.style.background = 'linear-gradient(45deg, #ff6600, #ff0066)';
        } else if (value >= 100) {
            textElement.style.background = 'linear-gradient(45deg, #00ff00, #00ffff)';
        } else {
            textElement.style.background = 'linear-gradient(45deg, #00ffff, #bf00ff)';
        }
        textElement.style.webkitBackgroundClip = 'text';
        textElement.style.backgroundClip = 'text';
        textElement.style.webkitTextFillColor = 'transparent';
        textElement.style.textShadow = '0 0 20px currentColor';
        
        document.body.appendChild(textElement);
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            if (textElement.parentElement) {
                textElement.remove();
            }
        }, 2000);
    }
    
    createClickParticles(x, y) {
        const particleCount = Math.min(8, Math.max(3, Math.floor(this.calculateClickValue() / 10)));
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'click-particle';
            particle.style.position = 'fixed';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '999';
            
            // Couleurs aléatoires néon
            const colors = ['#00ffff', '#bf00ff', '#39ff14', '#ff6600'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            // Direction aléatoire
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const velocity = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--vx', `${vx}px`);
            particle.style.setProperty('--vy', `${vy}px`);
            particle.style.animation = 'particleExplosion 1s ease-out forwards';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.remove();
                }
            }, 1000);
        }
    }
    
    createShockwave(x, y) {
        const shockwave = document.createElement('div');
        shockwave.className = 'click-shockwave';
        shockwave.style.position = 'fixed';
        shockwave.style.left = `${x}px`;
        shockwave.style.top = `${y}px`;
        shockwave.style.width = '0';
        shockwave.style.height = '0';
        shockwave.style.border = '2px solid rgba(0, 255, 255, 0.6)';
        shockwave.style.borderRadius = '50%';
        shockwave.style.transform = 'translate(-50%, -50%)';
        shockwave.style.pointerEvents = 'none';
        shockwave.style.zIndex = '998';
        shockwave.style.animation = 'shockwaveExpand 0.6s ease-out forwards';
        
        document.body.appendChild(shockwave);
        
        setTimeout(() => {
            if (shockwave.parentElement) {
                shockwave.remove();
            }
        }, 600);
    }
    
    animateClicker() {
        // Animation de pulsation
        this.clickElement.style.animation = 'none';
        this.clickElement.offsetHeight; // Force reflow
        this.clickElement.style.animation = 'clickPulse 0.3s ease-out';
        
        // Retirer l'animation après
        setTimeout(() => {
            this.clickElement.style.animation = '';
        }, 300);
    }
    
    playClickSound() {
        // Placeholder pour le son - peut être implémenté avec Web Audio API
        // Pour l'instant, on utilise une vibration sur mobile si disponible
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    startPassiveGeneration() {
        // Générer des clics passifs toutes les secondes
        setInterval(() => {
            if (this.game.passiveIncome > 0) {
                const passiveValue = this.game.passiveIncome * this.game.prestigeMultiplier;
                this.game.addClicks(passiveValue);
                
                // Effet visuel pour le revenu passif
                if (passiveValue > 0) {
                    this.createPassiveEffect(passiveValue);
                }
                
                this.updateDisplay();
            }
        }, 1000);
    }
    
    createPassiveEffect(value) {
        // Effet discret pour le revenu passif
        const effect = document.createElement('div');
        effect.className = 'passive-income-effect';
        effect.textContent = `+${formatNumber(value)}`;
        effect.style.position = 'fixed';
        effect.style.right = '20px';
        effect.style.top = '50%';
        effect.style.color = '#39ff14';
        effect.style.fontSize = '1rem';
        effect.style.fontWeight = 'bold';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        effect.style.animation = 'passiveFloat 2s ease-out forwards';
        effect.style.textShadow = '0 0 10px #39ff14';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentElement) {
                effect.remove();
            }
        }, 2000);
    }
    
    updateDisplay() {
        // Mettre à jour le compteur de clics avec animation
        const currentValue = parseInt(this.clickCountElement.textContent.replace(/,/g, '')) || 0;
        const targetValue = this.game.clicks;
        
        if (targetValue !== currentValue) {
            this.animateCounterUpdate(currentValue, targetValue);
        }
        
        // Mettre à jour l'affichage de la puissance de clic
        this.clickPowerElement.textContent = formatDecimal(this.calculateClickValue());
        
        // Mettre à jour l'affichage du revenu passif
        const passiveValue = this.game.passiveIncome * this.game.prestigeMultiplier;
        this.passiveIncomeElement.textContent = formatDecimal(passiveValue);
        
        // Effets visuels basés sur les valeurs
        this.updateVisualEffects();
    }
    
    animateCounterUpdate(from, to) {
        const duration = 500; // ms
        const startTime = performance.now();
        const difference = to - from;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fonction d'easing
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            const currentValue = Math.floor(from + (difference * easeOutQuart));
            this.clickCountElement.textContent = formatNumber(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.clickCountElement.textContent = formatNumber(to);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    updateVisualEffects() {
        // Changer les effets visuels basés sur le nombre de clics
        const clicks = this.game.clicks;
        
        if (clicks >= 1000000) {
            this.clickElement.style.filter = 'drop-shadow(0 0 30px #ff6600) hue-rotate(180deg)';
        } else if (clicks >= 100000) {
            this.clickElement.style.filter = 'drop-shadow(0 0 25px #bf00ff)';
        } else if (clicks >= 10000) {
            this.clickElement.style.filter = 'drop-shadow(0 0 20px #39ff14)';
        } else {
            this.clickElement.style.filter = 'drop-shadow(0 0 20px #00ffff)';
        }
    }
}

// Ajout des styles CSS pour les animations via JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            50% {
                transform: translateY(-50px) scale(1.2);
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) scale(0.8);
                opacity: 0;
            }
        }
        
        @keyframes particleExplosion {
            0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(var(--vx), var(--vy)) scale(0);
                opacity: 0;
            }
        }
        
        @keyframes shockwaveExpand {
            0% {
                width: 0;
                height: 0;
                opacity: 0.8;
            }
            100% {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
        
        @keyframes clickPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes passiveFloat {
            0% {
                transform: translateX(0) translateY(0);
                opacity: 1;
            }
            100% {
                transform: translateX(-30px) translateY(-50px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});