/* ============================================================
   cache.js – Centralized state saving/loading
   ============================================================ */

const Cache = (() => {
    let debounceTimer = null;
    let isRestoring = false;

    // List of standard dom IDs we want to persist directly
    const inputsToCache = [
        'ctrl-bg-color', 'ctrl-grad-left', 'ctrl-grad-right', 'ctrl-dot-opacity',
        'ctrl-wm-opacity', 'ctrl-wm-size', 'ctrl-watermark', 'ctrl-headline1',
        'ctrl-h1-size', 'ctrl-headline-color', 'ctrl-subtitle',
        'ctrl-sub-size', 'ctrl-sub-color', 'ctrl-sub-align', 'ctrl-date', 'ctrl-auto-hide-divider',
        'ctrl-date-size', 'ctrl-date-color', 'ctrl-tv-name', 'ctrl-tv-label',
        'ctrl-website', 'ctrl-facebook', 'ctrl-youtube', 'ctrl-extra-link',
        'ctrl-tv-layout', 'ctrl-show-ad', 'ctrl-ad-text', 'ctrl-ad-pos-y',
        'photo-box-height', 'photo-fit', 'photo-pos-y', 'photo-zoom',
        'vis-divider', 'vis-earth', 'vis-fb', 'vis-yt', 'vis-dotbg', 'vis-wm'
    ];

    async function saveState() {
        if (isRestoring) return; // don't overwrite cache while loading it
        const state = {};
        inputsToCache.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') state[id] = el.checked;
                else state[id] = el.value;
            }
        });
        localStorage.setItem('bdnewscard_state', JSON.stringify(state));

        // Save media to DB securely if they exist
        const mainImg = document.getElementById('main-photo-img')?.src;
        if (mainImg && mainImg.startsWith('data:')) await DB.setItem('main-photo-img', mainImg);
        else await DB.setItem('main-photo-img', null);

        const mainVideo = document.getElementById('main-photo-video')?.src;
        if (mainVideo && mainVideo.startsWith('blob:')) {
            // Blobs cannot be persisted as blob URLs easily,
            // typically video shouldn't persist across reload unless converted to dataURI/arraybuffer
            // For now, video caching might be tricky with massive files. 
            // We will store mainVideoSrc via DB if it's base64, else skip.
        }

        const adImg = document.getElementById('ad-img')?.src;
        if (adImg && adImg.startsWith('data:')) await DB.setItem('ad-img', adImg);
        else await DB.setItem('ad-img', null);
    }

    function triggerSave() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(saveState, 500); // 500ms debounce
    }

    async function loadState() {
        isRestoring = true;
        const saved = localStorage.getItem('bdnewscard_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                inputsToCache.forEach(id => {
                    if (state[id] !== undefined) {
                        const el = document.getElementById(id);
                        if (el) {
                            if (el.type === 'checkbox') el.checked = state[id];
                            else el.value = state[id];
                        }
                    }
                });
            } catch (e) {
                console.error('Failed to parse state', e);
            }
        }

        // Load media
        const mainImg = await DB.getItem('main-photo-img');
        if (mainImg) {
            Upload.setMainPhoto(mainImg); // Upload is globally available
        }
        const adImg = await DB.getItem('ad-img');
        if (adImg) {
            const imgEl = document.getElementById('ad-img');
            const ph = document.getElementById('ad-placeholder');
            if (imgEl && ph) {
                imgEl.src = adImg;
                imgEl.style.display = 'block';
                ph.style.display = 'none';
            }
        }

        isRestoring = false;
    }

    function resetState(e) {
        if (e) e.preventDefault();

        const modal = document.getElementById('reset-modal');
        if (!modal) {
            // Unlikely fallback if modal doesn't exist
            executeReset();
            return;
        }

        // Show the custom modal
        modal.style.display = 'flex';

        // Bind cancel
        document.getElementById('btn-reset-cancel').onclick = () => {
            modal.style.display = 'none';
        };

        // Bind confirm
        document.getElementById('btn-reset-confirm').onclick = () => {
            modal.style.display = 'none';
            executeReset();
        };
    }

    async function executeReset() {
        localStorage.removeItem('bdnewscard_state');
        await DB.clear();
        location.reload();
    }

    function hookInputs() {
        inputsToCache.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', triggerSave);
                el.addEventListener('change', triggerSave);
            }
        });

        // Elements text change:
        const observer = new MutationObserver(triggerSave);
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => observer.observe(el, { characterData: true, subtree: true, childList: true }));
    }

    return { loadState, saveState, triggerSave, resetState, hookInputs };
})();
