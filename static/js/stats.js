/**
 * Script pour la page de statistiques
 */
document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const statClicks = document.getElementById('stat-clicks');
    const statTotalClicks = document.getElementById('stat-total-clicks');
    const statClickPower = document.getElementById('stat-click-power');
    const statPassive = document.getElementById('stat-passive');
    const statPrestigeLevel = document.getElementById('stat-prestige-level');
    const statPrestigeMult = document.getElementById('stat-prestige-mult');
    const achievementsContainer = document.getElementById('achievements-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    
    // Liste des réalisations
    const achievements = [
        { id: 1, name: 'Premier Clic', description: 'Cliquez pour la première fois', requirement: totalClicks => totalClicks >= 1 },
        { id: 2, name: 'Centenaire', description: 'Atteignez 100 clics', requirement: totalClicks => totalClicks >= 100 },
        { id: 3, name: 'Millénaire', description: 'Atteignez 1,000 clics', requirement: totalClicks => totalClicks >= 1000 },
        { id: 4, name: 'Million', description: 'Atteignez 1,000,000 clics', requirement: totalClicks => totalClicks >= 1000000 },
        { id: 5, name: 'Prestige', description: 'Effectuez votre premier prestige', requirement: (_, prestigeLevel) => prestigeLevel >= 1 },
        { id: 6, name: 'Prestige Maître', description: 'Atteignez le niveau de prestige 5', requirement: (_, prestigeLevel) => prestigeLevel >= 5 },
        { id: 7, name: 'Puissance Max', description: 'Atteignez une puissance de clic de 100', requirement: (_, __, clickPower) => clickPower >= 100 },
        { id: 8, name: 'Revenus Passifs', description: 'Atteignez 10 clics par seconde passivement', requirement: (_, __, ___, passiveIncome) => passiveIncome >= 10 },
        { id: 9, name: 'Passif Maximal', description: 'Atteignez 100 clics par seconde passivement', requirement: (_, __, ___, passiveIncome) => passiveIncome >= 100 },
        { id: 10, name: 'Milliardaire', description: 'Atteignez 1,000,000,000 clics au total', requirement: totalClicks => totalClicks >= 1000000000 },
    ];
    
    // Charger les données du jeu
    loadGameData();
    
    // Charger le classement si connecté
    if (CONFIG.userLoggedIn) {
        loadLeaderboard();
    }
    
    async function loadGameData() {
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
            gameState = loadFromLocalStorage('unlimited-clicker-save');
        }
        
        // Afficher les statistiques
        if (gameState) {
            statClicks.textContent = formatNumber(gameState.clicks || 0);
            statTotalClicks.textContent = formatNumber(gameState.totalClicks || 0);
            statClickPower.textContent = formatDecimal(gameState.clickPower || 1.0);
            statPassive.textContent = formatDecimal(gameState.passiveIncome || 0.0);
            statPrestigeLevel.textContent = gameState.prestigeLevel || 0;
            statPrestigeMult.textContent = `x${formatDecimal(gameState.prestigeMultiplier || 1.0)}`;
            
            // Afficher les réalisations
            renderAchievements(gameState);
        } else {
            // Afficher des valeurs par défaut
            statClicks.textContent = '0';
            statTotalClicks.textContent = '0';
            statClickPower.textContent = '1.0';
            statPassive.textContent = '0.0';
            statPrestigeLevel.textContent = '0';
            statPrestigeMult.textContent = 'x1.0';
        }
    }
    
    function renderAchievements(gameState) {
        // Vider le conteneur
        achievementsContainer.innerHTML = '';
        
        // Vérifier chaque réalisation
        achievements.forEach(achievement => {
            const totalClicks = gameState.totalClicks || 0;
            const prestigeLevel = gameState.prestigeLevel || 0;
            const clickPower = gameState.clickPower || 1.0;
            const passiveIncome = gameState.passiveIncome || 0.0;
            
            // Vérifier si la réalisation est débloquée
            const isUnlocked = achievement.requirement(totalClicks, prestigeLevel, clickPower, passiveIncome);
            
            // Créer l'élément de réalisation
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            // Contenu de la réalisation
            achievementElement.innerHTML = `
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                ${isUnlocked ? '<div class="badge">✓</div>' : ''}
            `;
            
            // Ajouter au conteneur
            achievementsContainer.appendChild(achievementElement);
        });
    }
    
    async function loadLeaderboard() {
        try {
            // Exemple de structure pour le leaderboard
            const response = await fetchAPI('/api/leaderboard');
            
            if (response.success && response.leaderboard) {
                renderLeaderboard(response.leaderboard);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du classement:', error);
            leaderboardContainer.innerHTML = '<p>Impossible de charger le classement pour le moment.</p>';
        }
    }
    
    function renderLeaderboard(leaderboardData) {
        // Créer le tableau de classement
        const leaderboardTable = document.createElement('table');
        leaderboardTable.className = 'leaderboard-table';
        
        // En-tête du tableau
        leaderboardTable.innerHTML = `
            <thead>
                <tr>
                    <th>Rang</th>
                    <th>Joueur</th>
                    <th>Clics totaux</th>
                    <th>Niveau Prestige</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        // Corps du tableau
        const tbody = leaderboardTable.querySelector('tbody');
        
        leaderboardData.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.username}</td>
                <td>${formatNumber(player.totalClicks)}</td>
                <td>${player.prestigeLevel}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Ajouter au conteneur
        leaderboardContainer.innerHTML = '';
        leaderboardContainer.appendChild(leaderboardTable);
    }
});