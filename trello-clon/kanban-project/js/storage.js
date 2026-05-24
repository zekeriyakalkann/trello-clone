const STORAGE_KEY = 'kanban_board_data';
const FILTER_KEY = 'kanban_filter_state';
const THEME_KEY = 'kanban_theme_state';
const USERS_KEY = 'kanban_users_data';

// Gelişmiş veri yapısına uygun varsayılan data
const defaultData = [
    { 
        id: 'col-todo', 
        title: 'Yapılacaklar', 
        cards: [
            { 
                id: 'card-1', 
                title: 'Projeyi Planla', 
                description: 'Gereksinimleri belirle ve mimariyi çiz.', 
                label: 'red',
                assignee: 'user-1', // Artık User ID tutuluyor
                dueDate: '2026-05-15',
                checklist: [
                    { id: 'chk-1', text: 'Hedefleri belirle', done: true },
                    { id: 'chk-2', text: 'Tasarımı çiz', done: false }
                ],
                history: [
                    { timestamp: new Date().toISOString(), action: 'Kart oluşturuldu.' }
                ]
            }
        ] 
    },
    { 
        id: 'col-doing', 
        title: 'Devam Edenler', 
        cards: [] 
    },
    { 
        id: 'col-done', 
        title: 'Tamamlananlar', 
        cards: [] 
    }
];

// Varsayılan Kullanıcılar
const defaultUsers = [
    { id: 'user-1', name: 'Zeki K', initials: 'ZK' },
    { id: 'user-2', name: 'Ayşe Yılmaz', initials: 'AY' }
];

let saveTimeout = null;

const Storage = {
    load: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.map(col => {
                col.cards = col.cards.map(card => {
                    return {
                        ...card,
                        checklist: card.checklist || [],
                        assignee: card.assignee || '',
                        dueDate: card.dueDate || '',
                        history: card.history || []
                    };
                });
                return col;
            });
        }
        return defaultData;
    },
    save: (data) => {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }, 300);
    },
    saveFilter: (state) => {
        localStorage.setItem(FILTER_KEY, JSON.stringify(state));
    },
    loadFilter: () => {
        const data = localStorage.getItem(FILTER_KEY);
        return data ? JSON.parse(data) : { query: '', label: 'all' };
    },
    saveTheme: (isDark) => {
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    },
    loadTheme: () => {
        return localStorage.getItem(THEME_KEY) === 'dark';
    },
    
    // --- USER MANAGEMENT ---
    loadUsers: () => {
        const data = localStorage.getItem(USERS_KEY);
        return data ? JSON.parse(data) : defaultUsers;
    },
    saveUsers: (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },
    
    // --- VIEW STATE ---
    saveActiveView: (viewName) => {
        localStorage.setItem('kanban_active_view', viewName);
    },
    loadActiveView: () => {
        return localStorage.getItem('kanban_active_view') || 'board';
    }
};
