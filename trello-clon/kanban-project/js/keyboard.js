/**
 * keyboard.js — Global Klavye Kısayolları
 *
 * Kısayollar:
 *   N       → İlk kolona yeni kart ekle
 *   K       → Arama inputuna focus
 *   ?       → Kısayollar panelini aç/kapat
 *   ESC     → Açık modalı kapat (card veya shortcuts)
 *   Enter   → Aktif form alanını submit et
 *
 * Kural: input / textarea / select focus'tayken çalışmaz.
 */

const KeyboardShortcuts = (() => {

    // ─── Input focus koruma ───────────────────────────────────────────
    const isTyping = () => {
        const tag = document.activeElement && document.activeElement.tagName;
        const ce  = document.activeElement && document.activeElement.isContentEditable;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ce;
    };

    // ─── Shortcuts panel ──────────────────────────────────────────────
    const PANEL_ID = 'shortcuts-modal';

    const openShortcutsPanel = () => {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        panel.style.display = 'flex';
        // Animasyon yeniden tetikle
        const box = panel.querySelector('.sc-box');
        if (box) {
            box.style.animation = 'none';
            box.offsetHeight;
            box.style.animation = '';
        }
    };

    const closeShortcutsPanel = () => {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        panel.style.display = 'none';
    };

    const isShortcutsPanelOpen = () => {
        const panel = document.getElementById(PANEL_ID);
        return panel && panel.style.display === 'flex';
    };

    // ─── Yeni kart: İlk kolona açar ──────────────────────────────────
    const triggerNewCard = () => {
        // Eğer kart modalı açıksa bir şey yapma
        const cardModal = document.getElementById('card-modal');
        if (cardModal && cardModal.style.display === 'flex') return;

        // İlk kolonun "Kart Ekle" butonunu bul ve tıkla
        const firstAddBtn = document.querySelector('.add-card-btn');
        if (firstAddBtn) {
            firstAddBtn.click();
            if (window.UI && UI.showToast) UI.showToast('Yeni kart ekleme (N)', 'info');
        } else {
            if (window.UI && UI.showToast) UI.showToast('Önce bir kolon ekleyin', 'warning');
        }
    };

    // ─── Arama inputuna focus ─────────────────────────────────────────
    const focusSearch = () => {
        const inp = document.getElementById('search-input');
        if (inp) {
            inp.focus();
            inp.select();
            if (window.UI && UI.showToast) UI.showToast('Arama (K)', 'info');
        }
    };

    // ─── Global keydown handler ───────────────────────────────────────
    const handleKeydown = (e) => {
        const key = e.key;

        // ESC — her zaman çalışır (typing kontrolü yok)
        if (key === 'Escape') {
            if (isShortcutsPanelOpen()) {
                closeShortcutsPanel();
                return;
            }
            // Card modal ESC zaten ui.js'de yönetiliyor → oraya bırak
            return;
        }

        // Typing sırasında diğer kısayollar çalışmasın
        if (isTyping()) return;

        // Modifier tuşlarla kısayol çakışmasını önle
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        switch (key) {
            case 'n':
            case 'N':
                e.preventDefault();
                triggerNewCard();
                break;

            case 'k':
            case 'K':
                e.preventDefault();
                focusSearch();
                break;

            case '?':
                e.preventDefault();
                if (isShortcutsPanelOpen()) {
                    closeShortcutsPanel();
                } else {
                    openShortcutsPanel();
                }
                break;

            default:
                break;
        }
    };

    // ─── Shortcuts panel dışına tıklayınca kapat ─────────────────────
    const handleOverlayClick = (e) => {
        const panel = document.getElementById(PANEL_ID);
        if (panel && e.target === panel) {
            closeShortcutsPanel();
        }
    };

    // ─── "?" buton click ─────────────────────────────────────────────
    const handleHelpBtnClick = () => {
        if (isShortcutsPanelOpen()) {
            closeShortcutsPanel();
        } else {
            openShortcutsPanel();
        }
    };

    // ─── init ─────────────────────────────────────────────────────────
    const init = () => {
        document.addEventListener('keydown', handleKeydown);

        // Overlay tıklama
        const panel = document.getElementById(PANEL_ID);
        if (panel) panel.addEventListener('click', handleOverlayClick);

        // "?" ikonu
        const helpBtn = document.getElementById('shortcuts-help-btn');
        if (helpBtn) helpBtn.addEventListener('click', handleHelpBtnClick);

        // Panel içindeki kapat butonu
        const closeBtn = document.getElementById('shortcuts-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeShortcutsPanel);
    };

    return { init, openShortcutsPanel, closeShortcutsPanel };
})();

window.KeyboardShortcuts = KeyboardShortcuts;
document.addEventListener('DOMContentLoaded', KeyboardShortcuts.init);
