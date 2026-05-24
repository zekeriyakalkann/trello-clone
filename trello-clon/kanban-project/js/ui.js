const UI = {
    modal: document.getElementById('card-modal'),
    closeBtn: document.getElementById('modal-close-btn'),
    titleInput: document.getElementById('modal-title'),
    colNameLabel: document.getElementById('modal-col-name'),
    descInput: document.getElementById('modal-desc'),
    labelInput: document.getElementById('modal-label'),
    assigneeInput: document.getElementById('modal-assignee'),
    dateInput: document.getElementById('modal-date'),
    board: document.getElementById('view-board'), // Fix: 'board' yerine 'view-board'
    searchInput: document.getElementById('search-input'),
    filterLabel: document.getElementById('filter-label'),
    themeToggleBtn: document.getElementById('theme-toggle'),

    navBoardBtn: document.getElementById('nav-board'),
    navUsersBtn: document.getElementById('nav-users'),
    viewBoard: document.getElementById('view-board'),
    viewUsers: document.getElementById('view-users'),
    usersGrid: document.getElementById('users-grid'),

    currentCardId: null,
    currentColId: null,

    init: () => {
        const isDark = Storage.loadTheme();
        if (isDark) {
            document.body.classList.add('dark-mode');
            UI.themeToggleBtn.textContent = '☀️';
        }

        const filters = Storage.loadFilter();
        UI.searchInput.value = filters.query || '';
        UI.filterLabel.value = filters.label || 'all';

        // 1. GLOBAL EVENT DELEGATION
        document.addEventListener('click', UI.handleGlobalClick);
        document.addEventListener('keypress', UI.handleGlobalKeypress);
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && UI.modal.style.display === 'flex') {
                UI.closeModal();
            }
        });

        UI.searchInput.addEventListener('input', UI.onFilterChange);
        UI.filterLabel.addEventListener('change', UI.onFilterChange);

        // Auto-resize for modal description
        UI.descInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Avatar preview update
        UI.assigneeInput.addEventListener('change', UI.updateAvatarPreview);

        // Label renk önizleme güncellemesi
        UI.labelInput.addEventListener('change', UI.updateLabelPreview);

        // Varsayılan View Yükle
        const activeView = Storage.loadActiveView();
        if (activeView === 'users') {
            UI.showUsersView();
        } else {
            UI.showBoardView();
        }

        // Durum checkbox'ı değiştiğinde tarih uyarısını güncelle
        document.getElementById('modal-completed').addEventListener('change', (e) => {
            UI.checkOverdueDate(UI.dateInput.value, e.target.checked);
        });
    },

    // --- GLOBAL EVENT HANDLER ---
    handleGlobalClick: (e) => {
        // --- NAVIGATION ---
        if (e.target.closest('#nav-board')) { 
            UI.showBoardView(); 
            return; 
        }
        if (e.target.closest('#nav-users')) { 
            UI.showUsersView(); 
            return; 
        }
        
        // --- HEADER ACTIONS ---
        if (e.target.closest('#theme-toggle')) { 
            UI.toggleTheme(); 
            return; 
        }
        if (e.target.closest('#add-column-btn')) { 
            UI.handleAddColumn(); 
            return; 
        }
        if (e.target.closest('#import-btn')) { 
            UI.handleImport(); 
            return; 
        }
        if (e.target.closest('#export-btn')) { 
            UI.handleExport(); 
            UI.showToast("JSON dışa aktarıldı.", "success");
            return; 
        }
        if (e.target.closest('#export-pdf-btn')) {
            if (window.App && window.App.exportAsPDF) window.App.exportAsPDF();
            return;
        }
        if (e.target.closest('#add-user-btn-header')) { 
            UI.handleAddUser(); 
            return; 
        }
        
        // --- USER ACTIONS ---
        const deleteUserBtn = e.target.closest('.delete-user-btn');
        if (deleteUserBtn) {
            const userId = deleteUserBtn.closest('.user-card').dataset.id;
            window.App.deleteUser(userId);
            return;
        }

        // --- BOARD ACTIONS ---
        const deleteColBtn = e.target.closest('.delete-col-btn');
        if (deleteColBtn) {
            const colId = deleteColBtn.closest('.column').dataset.id;
            window.App.deleteColumn(colId);
            return;
        }

        const deleteCardBtn = e.target.closest('.delete-card-btn');
        if (deleteCardBtn && !e.target.closest('.modal')) {
            const cardId = deleteCardBtn.closest('.card').dataset.id;
            const colId = deleteCardBtn.closest('.column').dataset.id;
            window.App.deleteCard(colId, cardId);
            return;
        }

        const addCardBtn = e.target.closest('.add-card-btn');
        if (addCardBtn) {
            const colId = addCardBtn.closest('.column').dataset.id;
            UI.handleAddCard(colId);
            return;
        }

        const card = e.target.closest('.card');
        if (card && !e.target.closest('.delete-card-btn') && !card.classList.contains('drag-placeholder')) {
            const cardId = card.dataset.id;
            const colId = card.closest('.column').dataset.id;
            const cardData = window.App.findCardInState(cardId);
            const colData = window.App.data.find(c => c.id === colId);
            if (cardData && colData) UI.openModal(cardData, colId, colData.title);
            return;
        }

        // --- MODAL ACTIONS ---
        // Dışarı tıklayınca kapat (hem eski .modal hem yeni .modal-wrapper için)
        if (e.target.closest('#modal-close-btn') || e.target === UI.modal) {
            UI.closeModal();
            return;
        }
        if (e.target.closest('#save-card-btn')) {
            UI.saveCardFromModal();
            return;
        }
        if (e.target.closest('#delete-card-btn') && e.target.closest('.modal')) {
            UI.deleteCardFromModal();
            return;
        }
        if (e.target.closest('#add-checklist-btn')) {
            UI.addChecklistItemFromModal();
            return;
        }

        const deleteCheckBtn = e.target.closest('.delete-check-btn');
        if (deleteCheckBtn) {
            window.App.deleteChecklistItem(UI.currentColId, UI.currentCardId, deleteCheckBtn.dataset.id);
            return;
        }

        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox' && e.target.closest('.checklist-item')) {
            window.App.toggleChecklistItem(UI.currentColId, UI.currentCardId, e.target.dataset.id, e.target.checked);
            return;
        }
    },

    handleGlobalKeypress: (e) => {
        if (e.key === 'Enter') {
            if (e.target.id === 'new-checklist-input') {
                UI.addChecklistItemFromModal();
            } else if (e.target.classList.contains('column-title')) {
                e.preventDefault(); 
                e.target.blur();
            }
        }
    },

    toggleTheme: () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        Storage.saveTheme(isDark);
        UI.themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    },

    // --- YENİ EKLENEN AKSİYON FONKSİYONLARI ---
    showBoardView: () => {
        window.App.currentView = "board";
        
        document.getElementById("view-board").style.display = "flex";
        document.getElementById("view-users").style.display = "none";
        document.querySelector('.header-center').style.display = 'flex';
        
        const addColBtn = document.getElementById('add-column-btn');
        const addUserBtnHeader = document.getElementById('add-user-btn-header');
        if(addColBtn) addColBtn.style.display = 'block';
        if(addUserBtnHeader) addUserBtnHeader.style.display = 'none';

        UI.navBoardBtn.classList.add('active');
        UI.navUsersBtn.classList.remove('active');

        Storage.saveActiveView('board');
        UI.renderBoard(window.App.data, window.App.users);
    },

    showUsersView: () => {
        window.App.currentView = "users";
        
        document.getElementById("view-board").style.display = "none";
        document.getElementById("view-users").style.display = "flex";
        document.querySelector('.header-center').style.display = 'none';

        const addColBtn = document.getElementById('add-column-btn');
        const addUserBtnHeader = document.getElementById('add-user-btn-header');
        if(addColBtn) addColBtn.style.display = 'none';
        if(addUserBtnHeader) addUserBtnHeader.style.display = 'block';

        UI.navUsersBtn.classList.add('active');
        UI.navBoardBtn.classList.remove('active');

        Storage.saveActiveView('users');
        UI.renderUsers(window.App.users);
    },

    handleAddColumn: () => {
        const name = prompt("Kolon adı gir:");
        if (name !== null) {
            if (name.trim() === '') {
                window.UI.showToast("Kolon adı boş bırakılamaz!", "error");
                return;
            }
            window.App.addColumn(name.trim());
            window.UI.showToast("Kolon başarıyla eklendi.", "success");
            
            // Kolon eklendiğinde panoyu en sağa kaydır
            setTimeout(() => {
                if(window.UI.board) window.UI.board.scrollTo({ left: window.UI.board.scrollWidth, behavior: 'smooth' });
            }, 100);
        }
    },

    handleAddCard: (colId) => {
        const title = prompt('Kart başlığı:');
        if (title !== null) {
            if (title.trim() === '') {
                window.UI.showToast("Kart başlığı boş bırakılamaz!", "error");
                return;
            }
            window.App.addCard(colId, title.trim());
        }
    },

    handleImport: () => {
        const importInput = document.getElementById('import-input');
        if (importInput) importInput.click();
    },

    handleExport: () => {
        if (window.App && window.App.exportData) {
            window.App.exportData();
        }
    },

    showToast: (message, type = 'info') => {
        const toastContainer = document.getElementById("toast-container");
        if (!toastContainer) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        
        toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-msg">${message}</span>`;
        toastContainer.appendChild(toast);

        // Zorunlu reflow ile animasyonun tetiklenmesini garanti altına alıyoruz
        void toast.offsetWidth;

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300); // transition süresi
        }, 3000);
    },

    renderUsers: (users) => {
        if (!users || users.length === 0) {
            UI.usersGrid.innerHTML = `
                <div class="empty-state">
                    <h2>Henüz kullanıcı yok</h2>
                    <p>Başlamak için yeni kullanıcı ekle</p>
                </div>
            `;
            UI.updateAssigneeSelect(users);
            return;
        }

        UI.usersGrid.innerHTML = users.map(u => `
            <div class="user-card" data-id="${u.id}">
                <div class="user-card-avatar" style="background-color: ${u.color || '#0079bf'}">${u.initials}</div>
                <div class="user-card-info">
                    <div class="user-card-name">${u.name}</div>
                </div>
                <button class="delete-user-btn" aria-label="Kullanıcıyı Sil" title="Kullanıcıyı Sil">&times;</button>
            </div>
        `).join('');

        UI.updateAssigneeSelect(users);
    },

    updateAssigneeSelect: (users) => {
        let options = `<option value="">Atanmadı</option>`;
        users.forEach(u => {
            options += `<option value="${u.id}">${u.name}</option>`;
        });
        UI.assigneeInput.innerHTML = options;
    },

    handleAddUser: () => {
        const name = prompt('Yeni Kullanıcı Adı Soyadı:');
        if (name !== null) {
            if (name.trim() === '') {
                window.UI.showToast("Kullanıcı adı boş bırakılamaz!", "error");
                return;
            }
            window.App.addUser(name.trim());
        }
    },

    renderBoard: (data, users) => {
        if (!data || data.length === 0) {
            UI.board.innerHTML = `
                <div class="empty-state">
                    <h2>Henüz kolon yok</h2>
                    <p>Başlamak için yeni kolon ekle</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        data.forEach(colData => {
            fragment.appendChild(UI.createColumnElement(colData, users));
        });
        UI.board.innerHTML = '';
        UI.board.appendChild(fragment);

        UI.filterCards();
        if (window.DragManager) window.DragManager.init();
    },

    createColumnElement: (colData, users) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'column';
        colDiv.dataset.id = colData.id;
        colDiv.draggable = true; 

        let cardsHtml = colData.cards.map(card => {
            const labelNames = { 'red': 'Acil', 'orange': 'Öncelikli', 'green': 'Tamamlandı', 'blue': 'Bilgi' };
            const labelHtml = card.label ? `<span class="card-label ${card.label}">${labelNames[card.label] || card.label}</span>` : '';
            
            let avatarHtml = '';
            if (card.assignee) {
                const user = users.find(u => u.id === card.assignee);
                if (user) {
                    avatarHtml = `<div class="assignee-avatar" title="Atanan: ${user.name}" style="background-color: ${user.color || '#0079bf'}">${user.initials}</div>`;
                }
            }
            
            let badgesHtml = '';
            if (card.dueDate) {
                const isOverdue = new Date(card.dueDate) < new Date(new Date().setHours(0,0,0,0));
                const formattedDate = new Date(card.dueDate).toLocaleDateString("tr-TR");
                badgesHtml += `<div class="badge ${isOverdue ? 'overdue' : ''}">🕒 ${formattedDate}</div>`;
            }
            let progressHtml = '';
            if (card.checklist && card.checklist.length > 0) {
                const doneCount = card.checklist.filter(c => c.done).length;
                const totalCount = card.checklist.length;
                const pct = Math.round((doneCount / totalCount) * 100);
                const isComplete = doneCount === totalCount ? 'complete' : '';
                
                progressHtml = `
                    <div class="card-checklist-progress">
                        <span>✔ ${doneCount}/${totalCount}</span>
                        <div class="card-progress-bar">
                            <div class="card-progress-fill ${isComplete}" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `;
            }

            const badgesContainer = badgesHtml ? `<div class="card-badges">${badgesHtml}</div>` : '';

            return `
                <div class="card ${card.completed ? 'card-completed' : ''}" draggable="true" data-id="${card.id}">
                    ${labelHtml}
                    ${avatarHtml}
                    <div class="card-header">
                        <span class="card-title">${card.title}</span>
                        <button class="delete-card-btn" aria-label="Kartı Sil">&times;</button>
                    </div>
                    ${badgesContainer}
                    ${progressHtml}
                </div>
            `;
        }).join('');

        colDiv.innerHTML = `
            <div class="column-header">
                <div style="display:flex; align-items:center; flex-grow:1;">
                    <h2 class="column-title" contenteditable="true" aria-label="Kolon Başlığı">${colData.title}</h2>
                    <span class="card-count">(${colData.cards.length})</span>
                </div>
                <button class="delete-col-btn" title="Kolonu Sil" aria-label="Kolonu Sil">&times;</button>
            </div>
            <div class="card-list">
                ${cardsHtml || '<div class="empty-column-state">Henüz kart yok</div>'}
            </div>
            <button class="add-card-btn" aria-label="Kart Ekle">+ Kart Ekle</button>
        `;

        const titleEl = colDiv.querySelector('.column-title');
        titleEl.addEventListener('blur', (e) => window.App.updateColumnTitle(colData.id, e.target.textContent));

        return colDiv;
    },

    updateCardCounts: () => {
        document.querySelectorAll('.column').forEach(col => {
            const countSpan = col.querySelector('.card-count');
            const cardCount = col.querySelectorAll('.card:not(.drag-placeholder)').length;
            if (countSpan) countSpan.textContent = `(${cardCount})`;
        });
    },

    openModal: (cardData, colId, colTitle) => {
        UI.currentCardId = cardData.id;
        UI.currentColId = colId;
        
        UI.colNameLabel.textContent = colTitle;
        UI.titleInput.textContent = cardData.title;
        UI.descInput.value = cardData.description || '';
        UI.labelInput.value = cardData.label || '';
        UI.assigneeInput.value = cardData.assignee || '';
        UI.dateInput.value = cardData.dueDate || '';
        document.getElementById('modal-completed').checked = cardData.completed || false;
        
        // Auto resize tetikle
        UI.descInput.style.height = 'auto';
        UI.descInput.style.height = (UI.descInput.scrollHeight) + 'px';
        
        UI.updateAvatarPreview();
        UI.updateLabelPreview();
        UI.checkOverdueDate(cardData.dueDate, cardData.completed);

        UI.renderChecklist(cardData.checklist || []);
        UI.renderHistory(cardData.history || []);

        // Modal animasyonunu her açılışta yeniden tetikle
        const content = UI.modal.querySelector('.modal-wrapper') || UI.modal.querySelector('.modal-content');
        if (content) {
            content.style.animation = 'none';
            content.offsetHeight; // reflow
            content.style.animation = '';
        }

        UI.modal.style.display = 'flex';
        document.getElementById('new-checklist-input').value = '';
    },

    closeModal: () => {
        UI.modal.style.display = 'none';
        UI.currentCardId = null;
        UI.currentColId = null;
    },

    updateAvatarPreview: () => {
        const avatarEl = document.getElementById('modal-assignee-avatar');
        const userId = UI.assigneeInput.value;
        if (userId) {
            const user = window.App.users.find(u => u.id === userId);
            if (user) {
                avatarEl.style.display = 'flex';
                avatarEl.textContent = user.initials;
                avatarEl.style.backgroundColor = user.color || '#0079bf';
                return;
            }
        }
        avatarEl.style.display = 'none';
    },

    updateLabelPreview: () => {
        const colorBar = document.getElementById('modal-label-color');
        const labelVal = UI.labelInput.value;
        const colors = { red: '#e74c3c', orange: '#e67e22', green: '#2ecc71', blue: '#3498db' };
        if (labelVal && colors[labelVal]) {
            colorBar.style.display = 'block';
            colorBar.className = 'label-color-bar ' + labelVal;
        } else {
            colorBar.style.display = 'none';
        }
    },

    checkOverdueDate: (dueDate, isCompleted) => {
        if (!dueDate) {
            UI.dateInput.classList.remove('overdue');
            return;
        }
        const today = new Date();
        today.setHours(0,0,0,0);
        const dateObj = new Date(dueDate);
        if (dateObj < today && !isCompleted) {
            UI.dateInput.classList.add('overdue');
        } else {
            UI.dateInput.classList.remove('overdue');
        }
    },

    renderChecklist: (checklist) => {
        const container = document.getElementById('checklist-items');
        container.innerHTML = '';
        
        let doneCount = 0;
        checklist.forEach(item => {
            if (item.done) doneCount++;
            const div = document.createElement('div');
            div.className = `checklist-item ${item.done ? 'done' : ''}`;
            
            div.innerHTML = `
                <input type="checkbox" ${item.done ? 'checked' : ''} data-id="${item.id}">
                <span>${item.text}</span>
                <button class="delete-check-btn" data-id="${item.id}">&times;</button>
            `;
            container.appendChild(div);
        });

        const total = checklist.length;
        const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
        document.getElementById('checklist-progress-text').textContent = `${pct}%`;
        document.getElementById('checklist-progress-fill').style.width = `${pct}%`;
    },

    addChecklistItemFromModal: () => {
        const input = document.getElementById('new-checklist-input');
        const text = input.value.trim();
        if (text && UI.currentCardId) {
            window.App.addChecklistItem(UI.currentColId, UI.currentCardId, text);
            input.value = '';
        }
    },

    renderHistory: (history) => {
        const container = document.getElementById('activity-log');
        const reversed = [...history].reverse();
        container.innerHTML = reversed.map(log => {
            const d = new Date(log.timestamp);
            const formattedDate = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            return `<li class="activity-item"><span class="activity-time">${formattedDate}</span> ${log.action}</li>`;
        }).join('');
    },

    saveCardFromModal: () => {
        if (UI.currentCardId) {
            const isCompleted = document.getElementById('modal-completed').checked;
            window.App.updateCardDetails(
                UI.currentColId,
                UI.currentCardId,
                UI.titleInput.textContent,
                UI.descInput.value,
                UI.labelInput.value,
                UI.assigneeInput.value,
                UI.dateInput.value,
                isCompleted
            );
            UI.closeModal();
        }
    },

    deleteCardFromModal: () => {
        if (UI.currentCardId) {
            window.App.deleteCard(UI.currentColId, UI.currentCardId);
            UI.closeModal();
        }
    },

    onFilterChange: () => {
        const query = UI.searchInput.value;
        const label = UI.filterLabel.value;
        Storage.saveFilter({ query, label });
        UI.filterCards();
    },

    filterCards: () => {
        const query = UI.searchInput.value.toLowerCase().trim();
        const selectedLabel = UI.filterLabel.value;
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const cardLabelSpan = card.querySelector('.card-label');
            
            let matchesLabel = (selectedLabel === 'all');
            if (selectedLabel === 'none') matchesLabel = !cardLabelSpan;
            else if (selectedLabel !== 'all') matchesLabel = cardLabelSpan && cardLabelSpan.classList.contains(selectedLabel);

            const matchesSearch = title.includes(query);

            if (matchesSearch && matchesLabel) card.classList.remove('hidden-by-search');
            else card.classList.add('hidden-by-search');
        });
    }
};

window.UI = UI;
