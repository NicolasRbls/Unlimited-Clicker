/**
 * Script pour la page d'administration d'Unlimited Clicker
 * Avec modal d'édition stylée correctement
 */
document.addEventListener('DOMContentLoaded', () => {
  // Sélecteurs DOM stables
  const userTable = document.getElementById('users-body');
  const upgradesGrid = document.getElementById('upgrades-grid');

  // Stats
  const userCountElement = document.querySelector('.admin-stat-card:nth-of-type(1) .admin-stat-value');
  const totalClicksElement = document.querySelector('.admin-stat-card:nth-of-type(2) .admin-stat-value');
  const totalUpgradesElement = document.querySelector('.admin-stat-card:nth-of-type(3) .admin-stat-value');
  // Bouton "Ajouter une amélioration"
  const addBtn = document.getElementById('add-upgrade');


  // Pour le code existant qui attend addUpgradeButton
  const addUpgradeButton = addBtn;

  addBtn.addEventListener('click', async (e) => {
  });


  // Endpoints dynamiques
  const basePath = (window.CONFIG && window.CONFIG.basePath) || '';
  const ENDPOINTS = (window.ADMIN_ENDPOINTS && {
    users: window.ADMIN_ENDPOINTS.users,
    upgrades: window.ADMIN_ENDPOINTS.upgrades,
    stats: window.ADMIN_ENDPOINTS.stats
  }) || {
    users: `${basePath}/api/admin/users`,
    upgrades: `${basePath}/api/admin/upgrades`,
    stats: `${basePath}/api/admin/stats`
  };

  // Endpoints "mutation"
  const MUTATE = {
    userUpdate: `${basePath}/api/admin/users/update`,
    userDelete: `${basePath}/api/admin/users/delete`,
    upgradeAdd: `${basePath}/api/admin/upgrades/add`,
    upgradeUpdate: `${basePath}/api/admin/upgrades/update`,
    upgradeDelete: `${basePath}/api/admin/upgrades/delete`,
    userEditPage: (id) => `${basePath}/api/admin/user/${id}/edit`,
    userDeletePage: (id) => `${basePath}/api/admin/user/${id}/delete`,
    upgradeEditPage: (id) => `${basePath}/api/admin/upgrade/${id}/edit`,
    upgradeDeletePage: (id) => `${basePath}/api/admin/upgrade/${id}/delete`
  };

  // Données
  let users = [];
  let upgrades = [];

  // Init
  loadAdminData();
  setupEventListeners();
  setupDeleteButtons();
  injectModalStyles();

  /**
   * Charge les données d'admin (users, upgrades, stats)
   */
  async function loadAdminData() {
    try {
      const [usersRes, upgradesRes, statsRes] = await Promise.all([
        fetchAPI(ENDPOINTS.users),
        fetchAPI(ENDPOINTS.upgrades),
        fetchAPI(ENDPOINTS.stats)
      ]);

      if (usersRes && usersRes.success) {
        users = usersRes.users || [];
        renderUserTable();
      }
      if (upgradesRes && upgradesRes.success) {
        upgrades = upgradesRes.upgrades || [];
        renderUpgradesGrid();
      }
      if (statsRes && statsRes.success) {
        updateStatsDisplay(statsRes.stats);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données d'administration:", error);
      showNotification("Une erreur est survenue lors du chargement des données.", 'error');
    }
  }

  /**
   * Écouteurs
   */
  function setupEventListeners() {
    // Ajout d'amélioration
    if (addUpgradeButton) {
      addUpgradeButton.addEventListener('click', showUpgradeFormModal);
    }

    // Délégation sur le tableau users
    if (userTable) {
      userTable.addEventListener('click', (event) => {
        const btn = event.target.closest('a');
        if (!btn) return;

        if (btn.classList.contains('edit-user')) {
          event.preventDefault();
          const userId = btn.getAttribute('data-user-id');
          editUser(userId);
        }
      });
    }

    // Délégation sur la grille d'upgrades
    if (upgradesGrid) {
      upgradesGrid.addEventListener('click', (event) => {
        const btn = event.target.closest('a');
        if (!btn) return;

        if (btn.classList.contains('edit-upgrade')) {
          event.preventDefault();
          const upgradeId = btn.getAttribute('data-upgrade-id');
          editUpgrade(upgradeId);
        }
      });
    }
  }

  /**
   * Branche les boutons de suppression
   */
  function setupDeleteButtons() {
    // Suppression d'utilisateurs
    document.querySelectorAll('.delete-user').forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const userId = this.getAttribute('data-user-id');
        const username = this.getAttribute('data-username') || 'cet utilisateur';

        showConfirmDialog(
          `Supprimer l'agent "${username}" ?`,
          'Cette action est irréversible et supprimera toutes les données de cet agent.',
          () => (window.location.href = this.getAttribute('href') || MUTATE.userDeletePage(userId))
        );
      });
    });

    // Suppression d'upgrades
    document.querySelectorAll('.delete-upgrade').forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const upgradeId = this.getAttribute('data-upgrade-id');
        const upgradeName = this.getAttribute('data-name') || 'cette amélioration';

        showConfirmDialog(
          `Supprimer l'amélioration "${upgradeName}" ?`,
          'Cette action est irréversible.',
          () => (window.location.href = this.getAttribute('href') || MUTATE.upgradeDeletePage(upgradeId))
        );
      });
    });
  }

  /**
   * Rendu tableau des utilisateurs
   */
  function renderUserTable() {
    if (!userTable) return;
    userTable.innerHTML = '';

    users.forEach((user) => {
      const row = document.createElement('tr');

      const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
      const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString() : '—';

      row.innerHTML = `
        <td><span class="id-badge">${user.id}</span></td>
        <td>
          <div class="user-info">
            <span class="username">${escapeHtml(user.username)}</span>
            ${user.is_admin ? '<span class="admin-badge">ADMIN</span>' : ''}
          </div>
        </td>
        <td>${createdDate}</td>
        <td>${lastLoginDate}</td>
        <td><span class="energy-count">${formatNumber(user.total_clicks ?? 0)}</span></td>
        <td>
          <div class="action-buttons">
            <a href="${MUTATE.userEditPage(user.id)}" class="btn btn-sm btn-primary edit-user" data-user-id="${user.id}">✏️ Éditer</a>
            <a href="${MUTATE.userDeletePage(user.id)}" class="btn btn-sm btn-danger delete-user" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}">🗑️ Supprimer</a>
          </div>
        </td>
      `;
      userTable.appendChild(row);
    });

    setupDeleteButtons();
  }

  /**
   * Rendu "cards" des améliorations
   */
  function renderUpgradesGrid() {
    if (!upgradesGrid) return;
    upgradesGrid.innerHTML = '';

    upgrades.forEach((up) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-header">
          <h4>${escapeHtml(up.name)}</h4>
          <span class="upgrade-id">ID: ${up.id}</span>
        </div>
        <p class="upgrade-description">${escapeHtml(up.description || 'Sans description')}</p>
        <div class="upgrade-stats">
          <div class="stat-row"><span class="label">Coût de base:</span><span class="value cost-value">${up.base_cost}</span></div>
          <div class="stat-row"><span class="label">Bonus clic:</span><span class="value power-value">+${up.click_power_bonus}</span></div>
          <div class="stat-row"><span class="label">Bonus passif:</span><span class="value passive-value">+${up.passive_income_bonus}/sec</span></div>
          <div class="stat-row"><span class="label">Débloqué à:</span><span class="value unlock-value">${up.unlocked_at_clicks} clics</span></div>
        </div>
        <div class="upgrade-actions">
          <a href="${MUTATE.upgradeEditPage(up.id)}" class="btn btn-sm btn-primary edit-upgrade" data-upgrade-id="${up.id}">✏️ Modifier</a>
          <a href="${MUTATE.upgradeDeletePage(up.id)}" class="btn btn-sm btn-danger delete-upgrade" data-upgrade-id="${up.id}" data-name="${escapeHtml(up.name)}">🗑️ Supprimer</a>
        </div>
      `;
      upgradesGrid.appendChild(card);
    });

    setupDeleteButtons();
  }

  /**
   * MAJ stats
   */
  function updateStatsDisplay(stats) {
    if (userCountElement && typeof stats.users_count !== 'undefined') {
      userCountElement.textContent = stats.users_count;
    }
    if (totalClicksElement && typeof stats.total_clicks !== 'undefined') {
      totalClicksElement.textContent = formatNumber(stats.total_clicks);
    }
    if (totalUpgradesElement && typeof stats.total_upgrades !== 'undefined') {
      totalUpgradesElement.textContent = stats.total_upgrades;
    }
  }

  /**
   * Modal d'édition d'un utilisateur - CORRIGÉE AVEC STYLES
   */
  function editUser(userId) {
    const user = users.find((u) => String(u.id) === String(userId));
    if (!user) {
      console.error(`Utilisateur ${userId} introuvable`);
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.innerHTML = `
      <div class="custom-modal-content">
        <div class="modal-header">
          <h3>🛸 Modification de l'Agent Cosmique</h3>
          <button class="modal-close" type="button">&times;</button>
        </div>
        
        <form id="edit-user-form" class="modal-form">
          <div class="form-section">
            <h4>Informations de l'Agent</h4>
            
            <div class="modal-form-group">
              <label for="username">Nom d'agent</label>
              <input type="text" id="username" class="modal-input" value="${escapeAttr(user.username)}" required>
              <small>Identifiant unique dans la galaxie</small>
            </div>
            
            <div class="modal-checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" id="is-admin" ${user.is_admin ? 'checked' : ''} ${user.username === 'admin' ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                <span>Statut Administrateur</span>
              </label>
              ${user.username === 'admin' ? '<small class="warning-text">⚠️ L\'admin principal ne peut pas être modifié</small>' : ''}
            </div>
          </div>
          
          <div class="form-section">
            <h4>Statistiques de Jeu</h4>
            
            <div class="stats-grid">
              <div class="modal-form-group">
                <label for="total-clicks">
                  <span class="stat-icon">⚡</span> Énergie totale
                </label>
                <input type="number" id="total-clicks" class="modal-input" value="${user.total_clicks ?? 0}" min="0">
                <small>Clics accumulés</small>
              </div>
              
              <div class="modal-form-group">
                <label for="prestige-level">
                  <span class="stat-icon">🌟</span> Niveau de prestige
                </label>
                <input type="number" id="prestige-level" class="modal-input" value="${user.prestige_level ?? 0}" min="0">
                <small>Réinitialisations effectuées</small>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="submit" class="modal-btn modal-btn-primary">
              <span>💾 Sauvegarder les modifications</span>
            </button>
            <button type="button" class="modal-btn modal-btn-cancel" id="cancel-edit">
              <span>❌ Annuler</span>
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);

    // Événements
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#cancel-edit').addEventListener('click', () => modal.remove());
    
    // Fermeture en cliquant en dehors
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Soumission du formulaire
    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> Sauvegarde en cours...';
      
      const updatedUser = {
        id: userId,
        username: document.getElementById('username').value,
        is_admin: document.getElementById('is-admin').checked,
        total_clicks: parseInt(document.getElementById('total-clicks').value, 10) || 0,
        prestige_level: parseInt(document.getElementById('prestige-level').value, 10) || 0
      };
      
      try {
        const resp = await fetchAPI(MUTATE.userUpdate, 'POST', updatedUser);
        if (resp && resp.success) {
          // MAJ en mémoire
          const idx = users.findIndex((u) => String(u.id) === String(userId));
          if (idx !== -1) users[idx] = { ...users[idx], ...updatedUser };
          renderUserTable();
          modal.remove();
          showNotification('✅ Agent mis à jour avec succès !', 'success');
        } else {
          showNotification(`Erreur: ${(resp && resp.message) || 'mise à jour impossible'}`, 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>💾 Sauvegarder les modifications</span>';
        }
      } catch (err) {
        console.error("Erreur update user:", err);
        showNotification("Une erreur est survenue lors de la mise à jour.", 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>💾 Sauvegarder les modifications</span>';
      }
    });
  }

  /**
   * Modal pour éditer une amélioration
   */
  function editUpgrade(upgradeId) {
    const upgrade = upgrades.find((u) => String(u.id) === String(upgradeId));
    if (!upgrade) {
      console.error(`Amélioration ${upgradeId} introuvable`);
      return;
    }

    // Rediriger vers la page d'édition d'upgrade
    window.location.href = MUTATE.upgradeEditPage(upgradeId);
  }

  /**
   * Modal pour ajouter une amélioration
   */
  async function showUpgradeFormModal(e) {
  if (e) e.preventDefault();
  try {
    // Crée une amélioration vide via l'API existante
    const res = await fetch(MUTATE.upgradeAdd, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // valeurs par défaut gérées côté serveur
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && data.success && data.upgrade && data.upgrade.id) {
      // Redirige vers la page d'édition avec le bon ID
      window.location.href = MUTATE.upgradeEditPage(data.upgrade.id);
    } else {
      console.error('Réponse inattendue:', data);
      showNotification("Impossible de créer l’amélioration (réponse inattendue).", 'error');
    }
  } catch (err) {
    console.error('Erreur ajout amélioration:', err);
    showNotification("Erreur lors de la création de l’amélioration.", 'error');
  }
}


  /**
   * Système de notifications
   */
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Fermeture auto après 5 secondes
    const autoClose = setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(autoClose);
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }

  /**
   * Boîte de dialogue de confirmation
   */
  function showConfirmDialog(title, message, onConfirm) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'custom-modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'confirm-dialog';
    modalContent.innerHTML = `
      <div class="confirm-icon">⚠️</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="confirm-actions">
        <button class="modal-btn modal-btn-danger confirm-button">🗑️ Supprimer</button>
        <button class="modal-btn modal-btn-cancel cancel-button">Annuler</button>
      </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    modalContent.querySelector('.confirm-button').addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      if (typeof onConfirm === 'function') onConfirm();
    });
    
    modalContent.querySelector('.cancel-button').addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
    });
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) document.body.removeChild(modalOverlay);
    });
  }

  /**
   * Helpers
   */
  function formatNumber(n) {
    if (typeof window.formatNumber === 'function') return window.formatNumber(n);
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n ?? 0);
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replaceAll('`', '&#096;');
  }

  /**
   * Injection des styles CSS pour les modales
   */
  function injectModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Modal Overlay */
      .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Modal Content */
      .custom-modal-content {
        background: var(--dark-card);
        border: 1px solid var(--glass-border);
        border-radius: 20px;
        max-width: 700px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Modal Header */
      .modal-header {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(191, 0, 255, 0.1));
        border-bottom: 1px solid var(--glass-border);
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 20px 20px 0 0;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.5rem;
        background: linear-gradient(45deg, var(--neon-blue), var(--neon-purple));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .modal-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--neon-orange);
        transform: rotate(90deg);
      }

      /* Modal Form */
      .modal-form {
        padding: 2rem;
      }

      .form-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 15px;
      }

      .form-section h4 {
        margin: 0 0 1.5rem 0;
        color: var(--neon-green);
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .modal-form-group {
        margin-bottom: 1.5rem;
      }

      .modal-form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.95rem;
      }

      .modal-input {
        width: 100%;
        padding: 0.8rem 1rem;
        background: var(--dark-bg);
        border: 2px solid var(--dark-accent);
        border-radius: 10px;
        color: var(--text-primary);
        font-size: 1rem;
        transition: all 0.3s ease;
        outline: none;
      }

      .modal-input:focus {
        border-color: var(--neon-blue);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
      }

      .modal-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .modal-form-group small {
        display: block;
        margin-top: 0.3rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-style: italic;
      }

      .warning-text {
        color: var(--neon-orange) !important;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .stat-icon {
        font-size: 1.2rem;
        margin-right: 0.3rem;
      }

      /* Checkbox Custom */
      .modal-checkbox-group {
        margin: 1.5rem 0;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        cursor: pointer;
        padding: 0.5rem;
        transition: background 0.3s ease;
        border-radius: 8px;
      }

      .checkbox-label:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .checkbox-label input[type="checkbox"] {
        display: none;
      }

      .checkbox-custom {
        width: 24px;
        height: 24px;
        border: 2px solid var(--dark-accent);
        border-radius: 6px;
        position: relative;
        transition: all 0.3s ease;
        display: inline-block;
      }

      .checkbox-label input:checked + .checkbox-custom {
        background: var(--neon-blue);
        border-color: var(--neon-blue);
      }

      .checkbox-label input:checked + .checkbox-custom::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-weight: bold;
        font-size: 14px;
      }

      .checkbox-label input:disabled + .checkbox-custom {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Modal Actions */
      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
      }

      .modal-btn {
        padding: 1rem 2rem;
        border: none;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .modal-btn-primary {
        background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
        color: white;
      }

      .modal-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 255, 255, 0.3);
      }

      .modal-btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .modal-btn-cancel {
        background: var(--dark-accent);
        color: var(--text-secondary);
      }

      .modal-btn-cancel:hover {
        background: var(--dark-bg);
        color: var(--text-primary);
      }

      .modal-btn-danger {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
      }

      .modal-btn-danger:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(255, 0, 0, 0.3);
      }

      /* Loading Spinner */
      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Confirm Dialog */
      .confirm-dialog {
        background: var(--dark-card);
        border: 1px solid var(--glass-border);
        border-radius: 20px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        animation: slideIn 0.3s ease-out;
      }

      .confirm-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .confirm-dialog h3 {
        margin: 0 0 1rem 0;
        color: var(--neon-orange);
        font-size: 1.3rem;
      }

      .confirm-dialog p {
        color: var(--text-secondary);
        margin-bottom: 2rem;
        line-height: 1.5;
      }

      .confirm-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      /* Notifications */
      .notification {
        position: fixed;
        top: 20px;
        right: -400px;
        max-width: 400px;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        z-index: 3000;
        transition: right 0.3s ease;
      }

      .notification.show {
        right: 20px;
      }

      .notification-success {
        border-color: var(--neon-green);
        background: linear-gradient(135deg, rgba(57, 255, 20, 0.1), rgba(57, 255, 20, 0.05));
      }

      .notification-error {
        border-color: var(--neon-orange);
        background: linear-gradient(135deg, rgba(255, 102, 0, 0.1), rgba(255, 102, 0, 0.05));
      }

      .notification-info {
        border-color: var(--neon-blue);
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 255, 255, 0.05));
      }

      .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(90deg);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .custom-modal-content {
          max-width: 95%;
          margin: 1rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .modal-actions {
          flex-direction: column;
        }

        .modal-btn {
          width: 100%;
        }

        .confirm-actions {
          flex-direction: column;
        }

        .notification {
          left: 10px;
          right: 10px !important;
          max-width: none;
        }
      }
        `;
    document.head.appendChild(style);
  } // <-- fin de injectModalStyles()
}); // <-- fin de document.addEventListener('DOMContentLoaded', ...)