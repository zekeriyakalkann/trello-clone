/**
 * touch.js — Mobil Touch Drag & Drop
 *
 * Sadece dokunmatik (coarse pointer) cihazlarda aktif.
 * Desktop HTML5 drag-drop'u kesinlikle bozmaz.
 *
 * Yöntem:
 *   touchstart  → sürüklenen kartı işaretle, klon oluştur
 *   touchmove   → klonu parmak pozisyonuyla takip ettir
 *   touchend    → hangi .card-list üstündeyse oraya bırak
 */

const TouchDrag = (() => {

    // ─── Yalnızca coarse pointer (dokunmatik) cihazlar ───────────────
    const isTouchDevice = () =>
        window.matchMedia('(pointer: coarse)').matches;

    // ─── State ───────────────────────────────────────────────────────
    let dragCard   = null;   // orijinal kart DOM elementi
    let dragClone  = null;   // parmakla sürüklenen klon
    let startX     = 0;
    let startY     = 0;
    let offsetX    = 0;
    let offsetY    = 0;
    let longPressTimer = null;
    const LONG_PRESS_MS = 300; // kısa basış = tap, uzun = drag başlar

    // ─── Klon oluştur ─────────────────────────────────────────────────
    const createClone = (card) => {
        const rect  = card.getBoundingClientRect();
        const clone = card.cloneNode(true);
        clone.id    = 'touch-drag-clone';
        clone.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            opacity: 0.85;
            pointer-events: none;
            z-index: 9999;
            transform: scale(1.04) rotate(1.5deg);
            transition: transform 0.15s;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.25);
        `;
        document.body.appendChild(clone);
        return clone;
    };

    // ─── Parmak altındaki .card-list bul ─────────────────────────────
    const getListUnder = (x, y) => {
        // Klonu geçici gizle → altını okuyabilmek için
        if (dragClone) dragClone.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        if (dragClone) dragClone.style.display = '';
        if (!el) return null;
        return el.closest('.card-list');
    };

    // ─── Highlight yönetimi ───────────────────────────────────────────
    const clearHighlights = () => {
        document.querySelectorAll('.column.drag-over').forEach(c =>
            c.classList.remove('drag-over')
        );
    };

    // ─── touchstart ───────────────────────────────────────────────────
    const onTouchStart = (e) => {
        const card = e.target.closest('.card');
        if (!card) return;
        // Sil butonu tıklandıysa iptal
        if (e.target.closest('.delete-card-btn')) return;

        const touch = e.touches[0];
        const rect  = card.getBoundingClientRect();
        startX  = touch.clientX;
        startY  = touch.clientY;
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;

        // Uzun basış → drag başlat
        longPressTimer = setTimeout(() => {
            dragCard = card;
            dragCard.style.opacity = '0.3';
            dragClone = createClone(card);
        }, LONG_PRESS_MS);
    };

    // ─── touchmove ───────────────────────────────────────────────────
    const onTouchMove = (e) => {
        if (!dragCard) {
            // Hareket olduysa long press iptal
            clearTimeout(longPressTimer);
            return;
        }
        e.preventDefault(); // sayfanın kaymasını önle

        const touch = e.touches[0];
        const x = touch.clientX - offsetX;
        const y = touch.clientY - offsetY;

        // Klonu taşı
        dragClone.style.left = x + 'px';
        dragClone.style.top  = y + 'px';

        // Hedef kolonu vurgula
        clearHighlights();
        const list = getListUnder(touch.clientX, touch.clientY);
        if (list) {
            const col = list.closest('.column');
            if (col) col.classList.add('drag-over');
        }
    };

    // ─── touchend ─────────────────────────────────────────────────────
    const onTouchEnd = (e) => {
        clearTimeout(longPressTimer);
        clearHighlights();

        if (!dragCard || !dragClone) {
            dragCard  = null;
            dragClone = null;
            return;
        }

        const touch = e.changedTouches[0];
        const list  = getListUnder(touch.clientX, touch.clientY);

        // Orijinal kartı geri görünür yap
        dragCard.style.opacity = '';

        if (list) {
            // Hedef listeye taşı
            list.appendChild(dragCard);
            // State güncelle
            if (window.App && window.App.updateStateFromDOM) {
                window.App.updateStateFromDOM();
            }
        }

        // Klonu temizle
        dragClone.remove();
        dragCard  = null;
        dragClone = null;
    };

    // ─── init ─────────────────────────────────────────────────────────
    const init = () => {
        if (!isTouchDevice()) return; // masaüstünde hiç bağlanma

        // Delegation: board üzerindeki tüm kartlar için
        const board = document.getElementById('view-board');
        if (!board) return;

        board.addEventListener('touchstart', onTouchStart, { passive: true });
        board.addEventListener('touchmove',  onTouchMove,  { passive: false });
        board.addEventListener('touchend',   onTouchEnd,   { passive: true });
    };

    return { init };
})();

window.TouchDrag = TouchDrag;
document.addEventListener('DOMContentLoaded', TouchDrag.init);
