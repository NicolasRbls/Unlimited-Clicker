/**
 * Utilitaires pour le jeu Unlimited Clicker
 */

// Formattage des nombres
function formatNumber(number) {
    if (number >= 1000000000000) {
        return (number / 1000000000000).toFixed(1) + 'T';
    } else if (number >= 1000000000) {
        return (number / 1000000000).toFixed(1) + 'B';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    } else {
        return number.toFixed(0);
    }
}

// Formattage des décimaux
function formatDecimal(number, decimals = 1) {
    return number.toFixed(decimals);
}

// Sauvegarde dans le localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde dans localStorage:', error);
        return false;
    }
}

// Chargement depuis le localStorage
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Erreur lors du chargement depuis localStorage:', error);
        return null;
    }
}

// Supprimer du localStorage
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression depuis localStorage:', error);
        return false;
    }
}

// Fonction d'API fetch avec gestion d'erreurs
async function fetchAPI(url, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        return { success: false, error: error.message };
    }
}

// Création d'éléments d'animation
function createClickAnimation(x, y, value) {
    const element = document.createElement('div');
    element.className = 'click-animation';
    element.textContent = '+' + formatNumber(value);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    document.body.appendChild(element);
    
    // Supprimer l'élément après l'animation
    setTimeout(() => {
        element.remove();
    }, 500);
}