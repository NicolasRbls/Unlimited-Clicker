/**
 * Script pour la page d'administration d'Unlimited Clicker
 */
document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM pour la section utilisateurs
    const userTable = document.querySelector('.admin-section:nth-of-type(2) tbody');
    
    // Éléments du DOM pour la section améliorations
    const upgradeTable = document.querySelector('.admin-section:nth-of-type(3) tbody');
    const addUpgradeButton = document.getElementById('add-upgrade');
    
    // Éléments du DOM pour les statistiques
    const userCountElement = document.querySelector('.admin-stat-card:nth-of-type(1) .admin-stat-value');
    const totalClicksElement = document.querySelector('.admin-stat-card:nth-of-type(2) .admin-stat-value');
    const totalUpgradesElement = document.querySelector('.admin-stat-card:nth-of-type(3) .admin-stat-value');
    
    // Variables de suivi des données
    let users = [];
    let upgrades = [];
    
    // Initialisation
    loadAdminData();
    setupEventListeners();
    
    /**
     * Charge les données d'administration depuis le serveur
     */
    async function loadAdminData() {
        try {
            // Charger les données des utilisateurs
            const usersResponse = await fetchAPI('/api/admin/users');
            if (usersResponse.success) {
                users = usersResponse.users;
                renderUserTable();
            }
            
            // Charger les données des améliorations
            const upgradesResponse = await fetchAPI('/api/admin/upgrades');
            if (upgradesResponse.success) {
                upgrades = upgradesResponse.upgrades;
                renderUpgradeTable();
            }
            
            // Charger les statistiques générales
            const statsResponse = await fetchAPI('/api/admin/stats');
            if (statsResponse.success) {
                updateStatsDisplay(statsResponse.stats);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données d\'administration:', error);
            alert('Une erreur est survenue lors du chargement des données. Veuillez réessayer.');
        }
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    function setupEventListeners() {
        // Bouton d'ajout d'amélioration
        if (addUpgradeButton) {
            addUpgradeButton.addEventListener('click', () => {
                showUpgradeFormModal();
            });
        }
        
        // Délégation d'événements pour les boutons d'édition et de suppression d'utilisateurs
        if (userTable) {
            userTable.addEventListener('click', (event) => {
                const targetButton = event.target.closest('a');
                if (!targetButton) return;
                
                const userId = targetButton.getAttribute('data-user-id');
                
                if (targetButton.classList.contains('is-primary')) {
                    // Bouton Éditer
                    editUser(userId);
                } else if (targetButton.classList.contains('is-error')) {
                    // Bouton Supprimer
                    deleteUser(userId);
                }
            });
        }
        
        // Délégation d'événements pour les boutons d'édition et de suppression d'améliorations
        if (upgradeTable) {
            upgradeTable.addEventListener('click', (event) => {
                const targetButton = event.target.closest('a');
                if (!targetButton) return;
                
                const upgradeId = targetButton.getAttribute('data-upgrade-id');
                
                if (targetButton.classList.contains('is-primary')) {
                    // Bouton Éditer
                    editUpgrade(upgradeId);
                } else if (targetButton.classList.contains('is-error')) {
                    // Bouton Supprimer
                    deleteUpgrade(upgradeId);
                }
            });
        }
    }
    
    /**
     * Affiche les utilisateurs dans le tableau
     */
    function renderUserTable() {
        if (!userTable) return;
        
        userTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const createdDate = new Date(user.created_at).toLocaleString();
            const lastLoginDate = new Date(user.last_login).toLocaleString();
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${createdDate}</td>
                <td>${lastLoginDate}</td>
                <td>${formatNumber(user.total_clicks || 0)}</td>
                <td>
                    <a href="#" class="nes-btn is-primary" data-user-id="${user.id}">Éditer</a>
                    <a href="#" class="nes-btn is-error" data-user-id="${user.id}">Supprimer</a>
                </td>
            `;
            
            userTable.appendChild(row);
        });
    }
    
    /**
     * Affiche les améliorations dans le tableau
     */
    function renderUpgradeTable() {
        if (!upgradeTable) return;
        
        upgradeTable.innerHTML = '';
        
        upgrades.forEach(upgrade => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${upgrade.id}</td>
                <td>${upgrade.name}</td>
                <td>${upgrade.base_cost}</td>
                <td>${upgrade.click_power_bonus}</td>
                <td>${upgrade.passive_income_bonus}</td>
                <td>${upgrade.unlocked_at_clicks}</td>
                <td>
                    <a href="#" class="nes-btn is-primary" data-upgrade-id="${upgrade.id}">Éditer</a>
                    <a href="#" class="nes-btn is-error" data-upgrade-id="${upgrade.id}">Supprimer</a>
                </td>
            `;
            
            upgradeTable.appendChild(row);
        });
    }
    
    /**
     * Met à jour l'affichage des statistiques
     */
    function updateStatsDisplay(stats) {
        if (userCountElement) {
            userCountElement.textContent = stats.users_count;
        }
        
        if (totalClicksElement) {
            totalClicksElement.textContent = formatNumber(stats.total_clicks);
        }
        
        if (totalUpgradesElement) {
            totalUpgradesElement.textContent = stats.total_upgrades;
        }
    }
    
    /**
     * Fonction pour éditer un utilisateur
     */
    function editUser(userId) {
        const user = users.find(u => u.id == userId);
        
        if (!user) {
            console.error(`Utilisateur avec l'ID ${userId} non trouvé`);
            return;
        }
        
        // Créer une modale d'édition
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        modal.innerHTML = `
            <div class="admin-modal-content">
                <h3>Modifier l'utilisateur</h3>
                <form id="edit-user-form">
                    <div class="nes-field">
                        <label for="username">Nom d'utilisateur</label>
                        <input type="text" id="username" class="nes-input" value="${user.username}" required>
                    </div>
                    
                    <div class="nes-field">
                        <label for="total-clicks">Clics totaux</label>
                        <input type="number" id="total-clicks" class="nes-input" value="${user.total_clicks || 0}" min="0">
                    </div>
                    
                    <div class="nes-field">
                        <label for="prestige-level">Niveau de prestige</label>
                        <input type="number" id="prestige-level" class="nes-input" value="${user.prestige_level || 0}" min="0">
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="nes-btn is-primary">Enregistrer</button>
                        <button type="button" class="nes-btn is-error" id="cancel-edit">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer l'annulation
        document.getElementById('cancel-edit').addEventListener('click', () => {
            modal.remove();
        });
        
        // Gérer la soumission du formulaire
        document.getElementById('edit-user-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const updatedUser = {
                id: userId,
                username: document.getElementById('username').value,
                total_clicks: parseInt(document.getElementById('total-clicks').value),
                prestige_level: parseInt(document.getElementById('prestige-level').value)
            };
            
            try {
                const response = await fetchAPI('/api/admin/users/update', 'POST', updatedUser);
                
                if (response.success) {
                    // Mettre à jour l'utilisateur dans le tableau
                    const index = users.findIndex(u => u.id == userId);
                    if (index !== -1) {
                        users[index] = {...users[index], ...updatedUser};
                    }
                    
                    renderUserTable();
                    modal.remove();
                    alert('Utilisateur mis à jour avec succès !');
                } else {
                    alert(`Erreur: ${response.message}`);
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
                alert('Une erreur est survenue lors de la mise à jour de l\'utilisateur.');
            }
        });
    }
    
    /**
     * Fonction pour supprimer un utilisateur
     */
    function deleteUser(userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }
        
        fetchAPI(`/api/admin/users/delete`, 'POST', { id: userId })
            .then(response => {
                if (response.success) {
                    // Supprimer l'utilisateur du tableau
                    users = users.filter(u => u.id != userId);
                    renderUserTable();
                    
                    // Mettre à jour les statistiques
                    if (userCountElement) {
                        const currentCount = parseInt(userCountElement.textContent);
                        userCountElement.textContent = (currentCount - 1).toString();
                    }
                    
                    alert('Utilisateur supprimé avec succès !');
                } else {
                    alert(`Erreur: ${response.message}`);
                }
            })
            .catch(error => {
                console.error('Erreur lors de la suppression de l\'utilisateur:', error);
                alert('Une erreur est survenue lors de la suppression de l\'utilisateur.');
            });
    }
    
    /**
     * Fonction pour éditer une amélioration
     */
    function editUpgrade(upgradeId) {
        const upgrade = upgrades.find(u => u.id == upgradeId);
        
        if (!upgrade) {
            console.error(`Amélioration avec l'ID ${upgradeId} non trouvée`);
            return;
        }
        
        // Créer une modale d'édition
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        modal.innerHTML = `
            <div class="admin-modal-content">
                <h3>Modifier l'amélioration</h3>
                <form id="edit-upgrade-form">
                    <div class="nes-field">
                        <label for="name">Nom</label>
                        <input type="text" id="name" class="nes-input" value="${upgrade.name}" required>
                    </div>
                    
                    <div class="nes-field">
                        <label for="description">Description</label>
                        <input type="text" id="description" class="nes-input" value="${upgrade.description || ''}">
                    </div>
                    
                    <div class="nes-field">
                        <label for="base-cost">Coût de base</label>
                        <input type="number" id="base-cost" class="nes-input" value="${upgrade.base_cost}" min="1" required>
                    </div>
                    
                    <div class="nes-field">
                        <label for="click-power-bonus">Bonus de puissance de clic</label>
                        <input type="number" id="click-power-bonus" class="nes-input" value="${upgrade.click_power_bonus}" min="0" step="0.1">
                    </div>
                    
                    <div class="nes-field">
                        <label for="passive-income-bonus">Bonus de revenu passif</label>
                        <input type="number" id="passive-income-bonus" class="nes-input" value="${upgrade.passive_income_bonus}" min="0" step="0.1">
                    </div>
                    
                    <div class="nes-field">
                        <label for="unlocked-at-clicks">Débloqué à (clics)</label>
                        <input type="number" id="unlocked-at-clicks" class="nes-input" value="${upgrade.unlocked_at_clicks}" min="0">
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="nes-btn is-primary">Enregistrer</button>
                        <button type="button" class="nes-btn is-error" id="cancel-edit">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer l'annulation
        document.getElementById('cancel-edit').addEventListener('click', () => {
            modal.remove();
        });
        
        // Gérer la soumission du formulaire
        document.getElementById('edit-upgrade-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const updatedUpgrade = {
                id: upgradeId,
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                base_cost: parseInt(document.getElementById('base-cost').value),
                click_power_bonus: parseFloat(document.getElementById('click-power-bonus').value),
                passive_income_bonus: parseFloat(document.getElementById('passive-income-bonus').value),
                unlocked_at_clicks: parseInt(document.getElementById('unlocked-at-clicks').value)
            };
            
            try {
                const response = await fetchAPI('/api/admin/upgrades/update', 'POST', updatedUpgrade);
                
                if (response.success) {
                    // Mettre à jour l'amélioration dans le tableau
                    const index = upgrades.findIndex(u => u.id == upgradeId);
                    if (index !== -1) {
                        upgrades[index] = {...upgrades[index], ...updatedUpgrade};
                    }
                    
                    renderUpgradeTable();
                    modal.remove();
                    alert('Amélioration mise à jour avec succès !');
                } else {
                    alert(`Erreur: ${response.message}`);
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'amélioration:', error);
                alert('Une erreur est survenue lors de la mise à jour de l\'amélioration.');
            }
        });
    }
    
    /**
     * Fonction pour supprimer une amélioration
     */
    function deleteUpgrade(upgradeId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette amélioration ? Cette action est irréversible.')) {
            return;
        }
        
        fetchAPI(`/api/admin/upgrades/delete`, 'POST', { id: upgradeId })
            .then(response => {
                if (response.success) {
                    // Supprimer l'amélioration du tableau
                    upgrades = upgrades.filter(u => u.id != upgradeId);
                    renderUpgradeTable();
                    
                    // Mettre à jour les statistiques
                    if (totalUpgradesElement) {
                        const currentCount = parseInt(totalUpgradesElement.textContent);
                        totalUpgradesElement.textContent = (currentCount - 1).toString();
                    }
                    
                    alert('Amélioration supprimée avec succès !');
                } else {
                    alert(`Erreur: ${response.message}`);
                }
            })
            .catch(error => {
                console.error('Erreur lors de la suppression de l\'amélioration:', error);
                alert('Une erreur est survenue lors de la suppression de l\'amélioration.');
            });
    }
    
    /**
     * Affiche une modale pour ajouter une nouvelle amélioration
     */
    function showUpgradeFormModal() {
        // Créer une modale d'ajout
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        modal.innerHTML = `
            <div class="admin-modal-content">
                <h3>Ajouter une amélioration</h3>
                <form id="add-upgrade-form">
                    <div class="nes-field">
                        <label for="name">Nom</label>
                        <input type="text" id="name" class="nes-input" required>
                    </div>
                    
                    <div class="nes-field">
                        <label for="description">Description</label>
                        <input type="text" id="description" class="nes-input">
                    </div>
                    
                    <div class="nes-field">
                        <label for="base-cost">Coût de base</label>
                        <input type="number" id="base-cost" class="nes-input" value="10" min="1" required>
                    </div>
                    
                    <div class="nes-field">
                        <label for="click-power-bonus">Bonus de puissance de clic</label>
                        <input type="number" id="click-power-bonus" class="nes-input" value="0" min="0" step="0.1">
                    </div>
                    
                    <div class="nes-field">
                        <label for="passive-income-bonus">Bonus de revenu passif</label>
                        <input type="number" id="passive-income-bonus" class="nes-input" value="0" min="0" step="0.1">
                    </div>
                    
                    <div class="nes-field">
                        <label for="unlocked-at-clicks">Débloqué à (clics)</label>
                        <input type="number" id="unlocked-at-clicks" class="nes-input" value="0" min="0">
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="nes-btn is-primary">Ajouter</button>
                        <button type="button" class="nes-btn is-error" id="cancel-add">Annuler</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer l'annulation
        document.getElementById('cancel-add').addEventListener('click', () => {
            modal.remove();
        });
        
        // Gérer la soumission du formulaire
        document.getElementById('add-upgrade-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const newUpgrade = {
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                base_cost: parseInt(document.getElementById('base-cost').value),
                click_power_bonus: parseFloat(document.getElementById('click-power-bonus').value),
                passive_income_bonus: parseFloat(document.getElementById('passive-income-bonus').value),
                unlocked_at_clicks: parseInt(document.getElementById('unlocked-at-clicks').value)
            };
            
            try {
                const response = await fetchAPI('/api/admin/upgrades/add', 'POST', newUpgrade);
                
                if (response.success) {
                    // Ajouter la nouvelle amélioration au tableau
                    upgrades.push(response.upgrade);
                    renderUpgradeTable();
                    
                    // Mettre à jour les statistiques
                    if (totalUpgradesElement) {
                        const currentCount = parseInt(totalUpgradesElement.textContent);
                        totalUpgradesElement.textContent = (currentCount + 1).toString();
                    }
                    
                    modal.remove();
                    alert('Amélioration ajoutée avec succès !');
                } else {
                    alert(`Erreur: ${response.message}`);
                }
            } catch (error) {
                console.error('Erreur lors de l\'ajout de l\'amélioration:', error);
                alert('Une erreur est survenue lors de l\'ajout de l\'amélioration.');
            }
        });
    }
    
    /**
     * Formate un nombre pour l'affichage
     */
    function formatNumber(number) {
        if (typeof formatNumber === 'function' && window.formatNumber) {
            // Utiliser la fonction formatNumber du fichier utils.js si disponible
            return window.formatNumber(number);
        }
        
        // Version simplifiée au cas où
        if (number >= 1000000000) {
            return (number / 1000000000).toFixed(1) + 'B';
        } else if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        } else {
            return number.toString();
        }
    }
});

// Ajouter des styles pour la modale d'administration
document.addEventListener('DOMContentLoaded', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .admin-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .admin-modal-content {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .admin-modal h3 {
            margin-top: 0;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .admin-modal .nes-field {
            margin-bottom: 1.5rem;
        }
        
        .admin-modal .button-group {
            display: flex;
            justify-content: space-between;
            margin-top: 2rem;
        }
        
        .admin-table {
            width: 100%;
            margin-bottom: 2rem;
        }
        
        .admin-stat-card {
            background-color: #f5f5f5;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 1.5rem;
        }
        
        .admin-stat-card h4 {
            margin-top: 0;
            margin-bottom: 1rem;
        }
        
        .admin-stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #209cee;
        }
        
        .admin-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            grid-gap: 1.5rem;
            margin-bottom: 2rem;
        }
    `;
    
    document.head.appendChild(styleElement);
});