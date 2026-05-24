const DragManager = {
    draggedElement: null,
    placeholder: null,
    dragType: null,

    init: () => {
        const board = document.getElementById('view-board');
        
        // HTML5 drag event delegation zorluk çıkarabiliyor, bu yüzden
        // elementlere direkt bağlamak en sağlıklısı
        const cards = document.querySelectorAll('.card');
        const columns = document.querySelectorAll('.column');
        const lists = document.querySelectorAll('.card-list');

        cards.forEach(card => {
            card.addEventListener('dragstart', DragManager.handleDragStart);
            card.addEventListener('dragend', DragManager.handleDragEnd);
        });

        columns.forEach(col => {
            col.addEventListener('dragstart', DragManager.handleDragStart);
            col.addEventListener('dragend', DragManager.handleDragEnd);
        });

        board.addEventListener('dragover', DragManager.handleBoardDragOver);
        board.addEventListener('drop', DragManager.handleDrop);

        lists.forEach(list => {
            list.addEventListener('dragover', DragManager.handleListDragOver);
            list.addEventListener('dragleave', DragManager.handleListDragLeave);
            list.addEventListener('drop', DragManager.handleDrop);
        });
    },

    createPlaceholder: (rect, type) => {
        const p = document.createElement('div');
        if (type === 'card') {
            p.className = 'drag-placeholder card-placeholder';
            p.style.height = `${rect.height}px`;
        } else {
            p.className = 'column-placeholder';
            p.style.height = `${rect.height}px`;
            p.style.width = `${rect.width}px`;
        }
        return p;
    },

    handleDragStart: (e) => {
        // Prevent inner card drags from moving column
        if (e.target.classList.contains('card')) {
            e.stopPropagation();
            DragManager.dragType = 'card';
        } else if (e.target.classList.contains('column')) {
            DragManager.dragType = 'column';
        } else {
            return;
        }

        DragManager.draggedElement = e.target;
        e.dataTransfer.effectAllowed = 'move';
        
        const rect = DragManager.draggedElement.getBoundingClientRect();
        DragManager.placeholder = DragManager.createPlaceholder(rect, DragManager.dragType);

        setTimeout(() => {
            DragManager.draggedElement.classList.add('is-dragging'); // Original elemanı gizle
            // Orijinal yerine placeholder'ı koy
            if (DragManager.draggedElement.parentNode) {
                DragManager.draggedElement.parentNode.insertBefore(DragManager.placeholder, DragManager.draggedElement.nextSibling);
            }
        }, 0);
    },

    handleDragEnd: (e) => {
        if (!DragManager.draggedElement) return;
        
        DragManager.draggedElement.classList.remove('is-dragging');
        
        if (DragManager.placeholder && DragManager.placeholder.parentNode) {
            // Placeholder'ın olduğu yere asıl elemanı koy
            DragManager.placeholder.parentNode.insertBefore(DragManager.draggedElement, DragManager.placeholder);
            DragManager.placeholder.parentNode.removeChild(DragManager.placeholder);
        }
        
        DragManager.draggedElement = null;
        DragManager.placeholder = null;
        DragManager.dragType = null;
        
        document.querySelectorAll('.column.drag-over').forEach(col => col.classList.remove('drag-over'));
    },

    handleListDragOver: (e) => {
        if (DragManager.dragType !== 'card') return;
        e.preventDefault();
        e.stopPropagation();

        const list = e.currentTarget;
        const column = list.closest('.column');
        
        if (column && !column.classList.contains('drag-over')) {
            document.querySelectorAll('.column.drag-over').forEach(col => col.classList.remove('drag-over'));
            column.classList.add('drag-over');
        }

        const afterElement = DragManager.getDragAfterElement(list, e.clientY);
        
        if (afterElement == null) {
            list.appendChild(DragManager.placeholder);
        } else {
            list.insertBefore(DragManager.placeholder, afterElement);
        }
    },

    handleListDragLeave: (e) => {
        const list = e.currentTarget;
        const column = list.closest('.column');
        if (column && !list.contains(e.relatedTarget)) {
            column.classList.remove('drag-over');
        }
    },

    handleBoardDragOver: (e) => {
        if (DragManager.dragType !== 'column') return;
        e.preventDefault();

        const board = document.getElementById('view-board');
        if (!board) return;
        const afterElement = DragManager.getDragAfterColumn(board, e.clientX);
        
        if (afterElement == null) {
            board.appendChild(DragManager.placeholder);
        } else {
            board.insertBefore(DragManager.placeholder, afterElement);
        }
    },

    handleDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (DragManager.placeholder && DragManager.draggedElement) {
            DragManager.placeholder.parentNode.insertBefore(DragManager.draggedElement, DragManager.placeholder);
        }
        
        const column = e.target.closest('.column');
        if (column) column.classList.remove('drag-over');

        if (window.App && window.App.updateStateFromDOM) {
            window.App.updateStateFromDOM();
        }
    },

    getDragAfterElement: (container, y) => {
        const draggableElements = [...container.querySelectorAll('.card:not(.is-dragging):not(.drag-placeholder):not(.hidden-by-search)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    getDragAfterColumn: (container, x) => {
        const draggableColumns = [...container.querySelectorAll('.column:not(.is-dragging):not(.column-placeholder)')];
        return draggableColumns.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
};

window.DragManager = DragManager;
