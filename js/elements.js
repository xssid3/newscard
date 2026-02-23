/* ============================================================
   elements.js – Drag, Resize, Select for card elements
   ============================================================ */

const Elements = (() => {

    let activeEl = null;
    let dragState = null;

    // Make an element draggable within the card bounds
    function makeDraggable(el) {
        el.style.position = 'absolute';
        el.style.cursor = 'grab';

        el.addEventListener('mousedown', startDrag);
        el.addEventListener('touchstart', e => startDrag(e.touches[0]), { passive: true });
    }

    function startDrag(e) {
        if (e.button === 2) return; // right click
        const el = e.currentTarget || e.target.closest('[data-draggable]');
        if (!el) return;

        const card = document.getElementById('card-root');
        const cardRect = card.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        dragState = {
            el,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: elRect.left - cardRect.left,
            startTop: elRect.top - cardRect.top,
        };

        el.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', e => onDrag(e.touches[0]));
        document.addEventListener('touchend', endDrag);
    }

    function onDrag(e) {
        if (!dragState) return;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        const scale = Canvas.getScale();
        const newLeft = dragState.startLeft + dx / scale;
        const newTop = dragState.startTop + dy / scale;

        dragState.el.style.left = newLeft + 'px';
        dragState.el.style.top = newTop + 'px';
    }

    function endDrag() {
        if (!dragState) return;
        dragState.el.style.cursor = 'grab';
        dragState = null;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        History.capture();
    }

    // Keyboard shortcut: Delete key on selected element
    document.addEventListener('keydown', e => {
        if (e.key === 'Delete' && activeEl) {
            activeEl.style.display = 'none';
            activeEl = null;
            History.capture();
        }
    });

    function init() {
        // Make contenteditable elements show focus ring
        const editables = document.querySelectorAll('[contenteditable]');
        editables.forEach(el => {
            el.addEventListener('input', () => {
                // debounce capture
                clearTimeout(el._captureTimer);
                el._captureTimer = setTimeout(() => History.capture(), 800);
            });
        });
    }

    return { init };
})();
