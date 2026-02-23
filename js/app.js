/* ============================================================
   app.js – Main Application Orchestrator
   ============================================================ */

const AppState = {};

// Toast utility
function showToast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ============================================================
// Context Menu for photo zones
// ============================================================
function initContextMenu() {
    const menu = document.getElementById('context-menu');
    let targetZone = null;

    function showMenu(e, zone) {
        e.preventDefault();
        targetZone = zone;
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.style.display = 'block';
    }

    function hideMenu() { menu.style.display = 'none'; }

    document.getElementById('card-photo-zone').addEventListener('contextmenu', e => showMenu(e, 'main'));
    document.getElementById('card-ad-zone').addEventListener('contextmenu', e => showMenu(e, 'ad'));
    document.addEventListener('click', hideMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideMenu(); });

    document.getElementById('ctx-delete').addEventListener('click', () => {
        if (targetZone === 'main') Upload.removeMainPhoto();
        if (targetZone === 'ad') Upload.removeAdPhoto();
        hideMenu();
    });

    document.getElementById('ctx-fit-cover').addEventListener('click', () => {
        document.getElementById('photo-fit').value = 'cover';
        Upload.applyFit();
        hideMenu();
    });

    document.getElementById('ctx-fit-contain').addEventListener('click', () => {
        document.getElementById('photo-fit').value = 'contain';
        Upload.applyFit();
        hideMenu();
    });
}

// ============================================================
// Keyboard shortcuts
// ============================================================
function initKeyboard() {
    document.addEventListener('keydown', e => {
        const isTyping = ['INPUT', 'TEXTAREA', '[contenteditable]'].some(s =>
            document.activeElement.matches && document.activeElement.matches(s)
        ) || document.activeElement.contentEditable === 'true';

        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            if (!isTyping) { e.preventDefault(); History.undo(); }
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            if (!isTyping) { e.preventDefault(); History.redo(); }
        }
    });

    document.getElementById('btn-undo').addEventListener('click', () => History.undo());
    document.getElementById('btn-redo').addEventListener('click', () => History.redo());
}

// ============================================================
// Mobile panel toggle (slide-in drawer on small screens)
// ============================================================
function initMobilePanel() {
    const panel = document.getElementById('left-panel');
    const backdrop = document.getElementById('panel-backdrop');
    const toggleBtn = document.getElementById('btn-panel-toggle');

    function openPanel() {
        panel.classList.add('panel-open');
        backdrop.classList.add('visible');
        toggleBtn.textContent = '✕';
    }

    function closePanel() {
        panel.classList.remove('panel-open');
        backdrop.classList.remove('visible');
        toggleBtn.textContent = '☰';
    }

    toggleBtn.addEventListener('click', () => {
        panel.classList.contains('panel-open') ? closePanel() : openPanel();
    });

    // Tap backdrop to close panel
    backdrop.addEventListener('click', closePanel);

    // Swipe left to close on mobile (touch gesture)
    let touchStartX = 0;
    panel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    panel.addEventListener('touchend', e => {
        if (touchStartX - e.changedTouches[0].clientX > 60) closePanel();
    });
}

// ============================================================
// Contact Developer Modal
// ============================================================
function initContactModal() {
    const modal = document.getElementById('contact-modal');
    const openBtn = document.getElementById('btn-contact');
    const closeBtn = document.getElementById('btn-contact-close');

    if (!modal || !openBtn || !closeBtn) return;

    function openModal() {
        modal.style.display = 'flex';
    }
    function closeModal() {
        modal.style.display = 'none';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ============================================================
// Responsive canvas sizing
// ============================================================
function initResponsive() {
    Canvas.fitToViewport();
    window.addEventListener('resize', () => Canvas.fitToViewport());
    window.addEventListener('orientationchange', () => {
        setTimeout(() => Canvas.fitToViewport(), 200);
    });
}

// ============================================================
// Fonts preload status
// ============================================================
function checkFontsLoaded() {
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            Canvas.applyAll();
        });
    }
}

// ============================================================
// Automatic Bengali Date
// ============================================================
function initBengaliDate() {
    const bengaliMonths = [
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];

    function toBengaliDigits(numberString) {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return String(numberString).replace(/\d/g, digit => bengaliDigits[digit]);
    }

    const today = new Date();
    const day = toBengaliDigits(today.getDate());
    const month = bengaliMonths[today.getMonth()];
    const year = toBengaliDigits(today.getFullYear());

    const formattedDate = `${day} ${month} ${year}`;

    const ctrlDate = document.getElementById('ctrl-date');
    const elDate = document.getElementById('el-date');

    if (ctrlDate) ctrlDate.value = formattedDate;
    if (elDate) elDate.innerText = formattedDate;
}

// ============================================================
// MAIN INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-reset')?.addEventListener('click', Cache.resetState);

    Elements.init();
    Upload.init();

    // Load state from cache before applying canvas
    Cache.loadState().then(() => {
        initBengaliDate();
        Canvas.wireControls();
        Canvas.applyAll();
        Cache.hookInputs();
        Exporter.init();
        initContextMenu();
        initKeyboard();
        initMobilePanel();
        initResponsive();
        initContactModal();
        checkFontsLoaded();

        // Capture initial state
        setTimeout(() => History.capture(), 300);

        // Show welcome toast
        setTimeout(() => showToast('👋 Click any text on the card to edit it!', 4000), 800);
    });
});
