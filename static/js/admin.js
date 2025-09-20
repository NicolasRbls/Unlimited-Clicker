/**
 * Script pour la page d'administration d'Unlimited Clicker
 * - Sélecteurs stables (IDs)
 * - Endpoints dynamiques compatibles BASE_PATH
 * - Plus aucune référence à upgradeTable
 */
document.addEventListener('DOMContentLoaded', () => {
  // Sélecteurs DOM stables
  const userTable = document.getElementById('users-body');
  const upgradesGrid = document.getElementById('upgrades-grid'); // si présent dans admin.html
  const addUpgradeButton = document.getElementById('add-upgrade');

  // Stats (mets-leur des IDs côté HTML si tu veux être 100% stable)
  const userCountElement = document.querySelector('.admin-stat-card:nth-of-type(1) .admin-stat-value');
  const totalClicksElement = document.querySelector('.admin-stat-card:nth-of-type(2) .admin-stat-value');
  const totalUpgradesElement = document.querySelector('.admin-stat-card:nth-of-type(3) .admin-stat-value');

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

  // Endpoints "mutation" (update/add/delete)
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
        renderUpgradesGrid(); // remplace l'ancien renderUpgradeTable()
      }
      if (statsRes && statsRes.success) {
        updateStatsDisplay(statsRes.stats);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données d'administration:", error);
      alert("Une erreur est survenue lors du chargement des données. Veuillez réessayer.");
    }
  }

  /**
   * Écouteurs
   */
  function setupEventListeners() {
    // Ajout d'amélioration (ouvre une modale)
    if (addUpgradeButton) {
      addUpgradeButton.addEventListener('click', showUpgradeFormModal);
    }

    // Délégation sur le tableau users (boutons "Éditer")
    if (userTable) {
      userTable.addEventListener('click', (event) => {
        const btn = event.target.closest('a');
        if (!btn) return;

        // Bouton "Éditer" depuis le tableau (class utilitaire)
        if (btn.classList.contains('edit-user')) {
          event.preventDefault();
          const userId = btn.getAttribute('data-user-id');
          editUser(userId);
        }
        // Les suppressions sont gérées par setupDeleteButtons() pour confirmation custom
      });
    }

    // Délégation sur la grille d'upgrades (si utilisée)
    if (upgradesGrid) {
      upgradesGrid.addEventListener('click', (event) => {
        const btn = event.target.closest('a');
        if (!btn) return;

        if (btn.classList.contains('edit-upgrade')) {
          event.preventDefault();
          const upgradeId = btn.getAttribute('data-upgrade-id');
          editUpgrade(upgradeId);
        }
        // Les suppressions sont gérées par setupDeleteButtons()
      });
    }
  }

  /**
   * Branche les boutons de suppression (utilise une modale de confirmation)
   */
  function setupDeleteButtons() {
    // Suppression d'utilisateurs
    document.querySelectorAll('.delete-user').forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const userId = this.getAttribute('data-user-id');
        const username = this.getAttribute('data-username') || 'cet utilisateur';

        showConfirmDialog(
          `Supprimer "${username}" ?`,
          'Cette action est irréversible.',
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
          `Supprimer "${upgradeName}" ?`,
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

      const createdDate = user.created_at ? new Date(user.created_at).toLocaleString() : '—';
      const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleString() : '—';

      row.innerHTML = `
        <td>${user.id}</td>
        <td>${escapeHtml(user.username)}${user.is_admin ? ' <span class="admin-badge">ADMIN</span>' : ''}</td>
        <td>${createdDate}</td>
        <td>${lastLoginDate}</td>
        <td>${formatNumber(user.total_clicks ?? 0)}</td>
        <td>
          <a href="${MUTATE.userEditPage(user.id)}" class="nes-btn is-primary edit-user" data-user-id="${user.id}">Éditer</a>
          <a href="${MUTATE.userDeletePage(user.id)}" class="nes-btn is-error delete-user" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}">Supprimer</a>
        </td>
      `;
      userTable.appendChild(row);
    });

    // Rebrancher les boutons de suppression ajoutés dynamiquement
    setupDeleteButtons();
  }

  /**
   * Rendu "cards" des améliorations
   * (si upgradesGrid est présent ; sinon laisse le rendu serveur)
   */
  function renderUpgradesGrid() {
    if (!upgradesGrid) return;
    upgradesGrid.innerHTML = '';

    upgrades.forEach((up) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-header">
          <h4>${escapeHtml(up.name)}</h4><span class="upgrade-id">ID: ${up.id}</span>
        </div>
        <p class="upgrade-description">${escapeHtml(up.description || '')}</p>
        <div class="upgrade-stats">
          <div class="stat-row"><span class="label">Coût de base:</span><span class="value">${up.base_cost}</span></div>
          <div class="stat-row"><span class="label">Bonus clic:</span><span class="value">${up.click_power_bonus}</span></div>
          <div class="stat-row"><span class="label">Bonus passif:</span><span class="value">${up.passive_income_bonus}/sec</span></div>
          <div class="stat-row"><span class="label">Débloqué à:</span><span class="value">${up.unlocked_at_clicks} clics</span></div>
        </div>
        <div class="upgrade-actions">
          <a href="${MUTATE.upgradeEditPage(up.id)}" class="nes-btn is-primary edit-upgrade" data-upgrade-id="${up.id}">✏️ Modifier</a>
          <a href="${MUTATE.upgradeDeletePage(up.id)}" class="nes-btn is-error delete-upgrade" data-upgrade-id="${up.id}" data-name="${escapeHtml(up.name)}">🗑️ Supprimer</a>
        </div>
      `;
      upgradesGrid.appendChild(card);
    });

    // Rebrancher les boutons de suppression ajoutés dynamiquement
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
   * Modale d'édition d'un utilisateur
   */
  function editUser(userId) {
    const user = users.find((u) => String(u.id) === String(userId));
    if (!user) {
      console.error(`Utilisateur ${userId} introuvable`);
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <h3>Modifier l'utilisateur</h3>
        <form id="edit-user-form">
          <div class="nes-field">
            <label for="username">Nom d'utilisateur</label>
            <input type="text" id="username" class="nes-input" value="${escapeAttr(user.username)}" required>
          </div>
          <div class="nes-field">
            <label for="total-clicks">Clics totaux</label>
            <input type="number" id="total-clicks" class="nes-input" value="${user.total_clicks ?? 0}" min="0">
          </div>
          <div class="nes-field">
            <label for="prestige-level">Niveau de prestige</label>
            <input type="number" id="prestige-level" class="nes-input" value="${user.prestige_level ?? 0}" min="0">
          </div>
          <div class="button-group">
            <button type="submit" class="nes-btn is-primary">Enregistrer</button>
            <button type="button" class="nes-btn is-error" id="cancel-edit">Annuler</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancel-edit').addEventListener('click', () => modal.remove());

    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedUser = {
        id: userId,
        username: document.getElementById('username').value,
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
          alert('Utilisateur mis à jour avec succès !');
        } else {
          alert(`Erreur: ${(resp && resp.message) || 'mise à jour impossible'}`);
        }
      } catch (err) {
        console.error("Erreur update user:", err);
        alert("Une erreur est survenue lors de la mise à jour de l'utilisateur.");
      }
    });
  }

  /**
   * Modale pour ajouter une amélioration
   */
  function showUpgradeFormModal() {
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

    document.getElementById('cancel-add').addEventListener('click', () => modal.remove());

    document.getElementById('add-upgrade-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newUpgrade = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        base_cost: parseInt(document.getElementById('base-cost').value, 10) || 0,
        click_power_bonus: parseFloat(document.getElementById('click-power-bonus').value) || 0,
        passive_income_bonus: parseFloat(document.getElementById('passive-income-bonus').value) || 0,
        unlocked_at_clicks: parseInt(document.getElementById('unlocked-at-clicks').value, 10) || 0
      };
      try {
        const resp = await fetchAPI(MUTATE.upgradeAdd, 'POST', newUpgrade);
        if (resp && resp.success) {
          upgrades.push(resp.upgrade);
          renderUpgradesGrid();
          if (totalUpgradesElement) {
            const n = parseInt(totalUpgradesElement.textContent, 10) || 0;
            totalUpgradesElement.textContent = String(n + 1);
          }
          modal.remove();
          alert("Amélioration ajoutée avec succès !");
        } else {
          alert(`Erreur: ${(resp && resp.message) || "ajout impossible"}`);
        }
      } catch (err) {
        console.error("Erreur ajout amélioration:", err);
        alert("Une erreur est survenue lors de l'ajout de l'amélioration.");
      }
    });
  }

  /**
   * Helpers UI
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
   * Boîte de dialogue de confirmation custom
   */
  function showConfirmDialog(title, message, onConfirm) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="modal-buttons">
        <button class="nes-btn is-primary confirm-button">Confirmer</button>
        <button class="nes-btn is-error cancel-button">Annuler</button>
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
});

/**
 * Styles inline pour la modale d'admin (si pas déjà dans ton CSS)
 */
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .admin-modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
    .admin-modal-content{background:#fff;padding:2rem;border-radius:8px;max-width:600px;width:100%;max-height:90vh;overflow:auto}
    .admin-modal h3{margin:0 0 1.5rem;text-align:center}
    .admin-modal .nes-field{margin-bottom:1rem}
    .admin-modal .button-group{display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.25rem}
    .admin-table{width:100%;margin-bottom:2rem}
    .admin-stat-card{background:#f5f5f5;padding:1.25rem;border-radius:8px;text-align:center;margin-bottom:1rem}
    .admin-stat-value{font-size:2rem;font-weight:700;color:#209cee}
    .admin-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000}
    .modal-content{background:#fff;padding:2rem;border-radius:8px;max-width:500px;width:100%;box-shadow:0 4px 16px rgba(0,0,0,.2)}
    .modal-buttons{display:flex;justify-content:space-between;margin-top:1.25rem}
    .upgrade-card{border:1px solid #e0e0e0;border-radius:8px;padding:1rem}
    .upgrade-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem}
    .upgrade-description{margin:.5rem 0 1rem;color:#555}
    .upgrade-stats .stat-row{display:flex;justify-content:space-between}
    .upgrade-actions{display:flex;gap:.5rem;margin-top:1rem}
    .admin-badge{background:#ffd166;color:#333;border-radius:4px;padding:.1rem .4rem;margin-left:.25rem;font-size:.75rem}
  `;
  document.head.appendChild(style);
});
