/* ============================================================
   upload.js – Image + Video Upload, Drag & Drop, Clipboard Paste
   ============================================================ */

const Upload = (() => {

    // ── helpers ─────────────────────────────────────────────────
    function getOrCreateVideoEl() {
        let v = document.getElementById('main-photo-video');
        if (!v) {
            v = document.createElement('video');
            v.id = 'main-photo-video';
            v.style.cssText = [
                'position:absolute',
                'inset:0',
                'width:100%',
                'height:100%',
                'object-fit:cover',
                'display:none',
            ].join(';');
            v.autoplay = true;
            v.loop = true;
            v.muted = false; // allow preview sound
            v.playsInline = true;
            v.preload = 'auto';
            document.getElementById('photo-inner').appendChild(v);
        }
        return v;
    }

    // ── apply media to the main zone ───────────────────────────
    function applyMediaToMain(file) {
        if (!file) return;
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) return;

        if (isVideo) {
            Trim.openModal(file, (url, start, end) => {
                setMainVideo(url, file.type, start, end);
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            setMainPhoto(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    function setMainPhoto(src) {
        const img = document.getElementById('main-photo-img');
        const ph = document.getElementById('photo-placeholder');
        const video = document.getElementById('main-photo-video');

        // hide video if any
        if (video) {
            video.pause();
            video.src = '';
            video.style.display = 'none';
        }

        const bgImg = document.getElementById('photo-bg-img');
        const bgVideo = document.getElementById('photo-bg-video');
        if (bgVideo) {
            bgVideo.pause();
            bgVideo.src = '';
            bgVideo.style.display = 'none';
        }

        img.src = src;
        img.style.display = 'block';
        if (bgImg) {
            bgImg.src = src;
            bgImg.style.display = 'block';
        }
        ph.style.display = 'none';

        const btnPlay = document.getElementById('btn-toggle-play');
        if (btnPlay) btnPlay.style.display = 'none';

        applyFit();
        showToast('📷 Main photo updated!');
        History.capture();
    }

    let videoTimeUpdateHandler = null;

    function setMainVideo(src, type, start = 0, end = 0) {
        const img = document.getElementById('main-photo-img');
        const ph = document.getElementById('photo-placeholder');
        const video = getOrCreateVideoEl();

        // hide still photo
        img.src = '';
        img.style.display = 'none';

        const bgImg = document.getElementById('photo-bg-img');
        const bgVideo = document.getElementById('photo-bg-video');
        if (bgImg) {
            bgImg.src = '';
            bgImg.style.display = 'none';
        }

        ph.style.display = 'none';

        // apply fit style from photo fit control
        const fit = document.getElementById('photo-fit')?.value || 'cover';
        video.style.objectFit = fit;
        const posY = document.getElementById('photo-pos-y')?.value || 50;
        video.style.objectPosition = `center ${posY}%`;

        // Store trim metadata on the video element for export/playback
        video.dataset.trimStart = start;
        video.dataset.trimEnd = end;

        // load video
        video.src = src;
        video.style.display = 'block';
        video.load();

        if (bgVideo) {
            bgVideo.src = src;
            bgVideo.style.display = 'block';
            bgVideo.load();
        }

        if (videoTimeUpdateHandler) {
            video.removeEventListener('timeupdate', videoTimeUpdateHandler);
        }

        videoTimeUpdateHandler = () => {
            if (end > start && video.currentTime >= end) {
                video.currentTime = start;
            }
        };
        video.addEventListener('timeupdate', videoTimeUpdateHandler);

        video.currentTime = start;
        video.play().catch(() => { }); // autoplay permission may be blocked; that's fine

        if (bgVideo) {
            bgVideo.currentTime = start;
            bgVideo.play().catch(() => { });
        }

        const btnPlay = document.getElementById('btn-toggle-play');
        if (btnPlay) {
            btnPlay.style.display = 'flex';
            btnPlay.innerHTML = '⏸ Pause Video';
        }

        showToast('🎬 Video loaded!');
        History.capture();
    }

    function setAdPhoto(src) {
        const img = document.getElementById('ad-img');
        const ph = document.getElementById('ad-img-placeholder');
        const btnRemove = document.getElementById('btn-remove-ad');
        img.src = src;
        img.style.display = 'block';
        if (ph) ph.style.display = 'none';
        if (btnRemove) btnRemove.style.display = 'block';
        if (window.CanvasApp) window.Canvas.applyAdZone();
        showToast('Ad image updated!');
        History.capture();
    }

    // ─────────────────────────────────────────────────────────────
    function applyFit() {
        const img = document.getElementById('main-photo-img');
        const video = document.getElementById('main-photo-video');
        const fit = document.getElementById('photo-fit')?.value || 'cover';
        img.style.objectFit = fit;
        if (video) video.style.objectFit = fit;
    }

    function applyPhotoPosition() {
        const img = document.getElementById('main-photo-img');
        const video = document.getElementById('main-photo-video');
        const posX = document.getElementById('photo-pos-x')?.value || 50;
        const posY = document.getElementById('photo-pos-y')?.value || 50;
        const posLine = `${posX}% ${posY}%`;
        img.style.objectPosition = posLine;
        if (video) video.style.objectPosition = posLine;

        const bgImg = document.getElementById('photo-bg-img');
        const bgVideo = document.getElementById('photo-bg-video');
        if (bgImg) bgImg.style.objectPosition = posLine;
        if (bgVideo) bgVideo.style.objectPosition = posLine;
    }

    function applyPhotoZoom(val) {
        const img = document.getElementById('main-photo-img');
        const video = document.getElementById('main-photo-video');
        const scale = `scale(${val})`;
        img.style.transform = scale;
        if (video) video.style.transform = scale;
        document.getElementById('photo-zoom-val').textContent = val + 'x';
    }

    function removeMainMedia() {
        const img = document.getElementById('main-photo-img');
        const ph = document.getElementById('photo-placeholder');
        const video = document.getElementById('main-photo-video');

        img.src = '';
        img.style.display = 'none';
        if (video) {
            video.pause();
            video.src = '';
            video.style.display = 'none';
        }

        const bgImg = document.getElementById('photo-bg-img');
        if (bgImg) { bgImg.src = ''; bgImg.style.display = 'none'; }
        const bgVideo = document.getElementById('photo-bg-video');
        if (bgVideo) { bgVideo.pause(); bgVideo.src = ''; bgVideo.style.display = 'none'; }

        const btnPlay = document.getElementById('btn-toggle-play');
        if (btnPlay) btnPlay.style.display = 'none';

        ph.style.display = 'flex';
        showToast('Main media removed.');
        History.capture();
    }

    function toggleVideoPlay() {
        const video = document.getElementById('main-photo-video');
        const bgVideo = document.getElementById('photo-bg-video');
        const btnPlay = document.getElementById('btn-toggle-play');
        if (!video || !btnPlay) return;

        if (video.paused) {
            video.play().catch(() => { });
            if (bgVideo) bgVideo.play().catch(() => { });
            btnPlay.innerHTML = '⏸ Pause Video';
        } else {
            video.pause();
            if (bgVideo) bgVideo.pause();
            btnPlay.innerHTML = '▶️ Play Video';
        }
    }

    function removeAdPhoto() {
        const img = document.getElementById('ad-img');
        const ph = document.getElementById('ad-img-placeholder');
        const btnRemove = document.getElementById('btn-remove-ad');
        img.src = '';
        img.style.display = 'none';
        if (ph) ph.style.display = 'flex';
        if (btnRemove) btnRemove.style.display = 'none';
        if (window.CanvasApp) window.Canvas.applyAdZone();
        History.capture();
    }

    function setAdIcon(src) {
        const img = document.getElementById('ad-custom-icon');
        const iconPh = document.getElementById('ad-icon-text-placeholder');
        const btnRemove = document.getElementById('btn-remove-ad-icon');
        img.src = src;
        img.style.display = 'block';
        if (iconPh) iconPh.style.display = 'none';
        if (btnRemove) btnRemove.style.display = 'block';
        if (window.CanvasApp) window.Canvas.applyAdZone();
        showToast('Icon updated!');
        History.capture();
    }

    function removeAdIcon() {
        const img = document.getElementById('ad-custom-icon');
        const iconPh = document.getElementById('ad-icon-text-placeholder');
        const btnRemove = document.getElementById('btn-remove-ad-icon');
        img.src = '';
        img.style.display = 'none';
        if (iconPh) iconPh.style.display = 'flex';
        if (btnRemove) btnRemove.style.display = 'none';
        if (window.CanvasApp) window.Canvas.applyAdZone();
        History.capture();
    }


    // ─────────────────────────────────────────────────────────────
    function init() {
        // Update the file input to accept video too
        const mainFile = document.getElementById('file-main');
        if (mainFile) mainFile.accept = 'image/*,video/*';

        // Upload zone in left panel
        const mainZone = document.getElementById('upload-main');
        const photoZone = document.getElementById('card-photo-zone');

        mainZone?.addEventListener('click', () => mainFile.click());
        mainFile?.addEventListener('change', e => {
            if (e.target.files[0]) applyMediaToMain(e.target.files[0]);
            e.target.value = ''; // Reset input to allow re-uploading the same file
        });
        setupDragDrop(mainZone, 'main');
        setupDragDrop(photoZone, 'main');

        photoZone?.addEventListener('click', () => {
            if (photoZone._dragDistance > 5) return; // Prevent click if user was dragging
            mainFile.click();
        });

        document.getElementById('btn-remove-main')?.addEventListener('click', removeMainMedia);
        document.getElementById('btn-toggle-play')?.addEventListener('click', toggleVideoPlay);
        document.getElementById('btn-remove-ad')?.addEventListener('click', removeAdPhoto);

        // AD zone - Image upload (sidebar only)
        const adZone = document.getElementById('upload-ad');
        const adFile = document.getElementById('file-ad');
        if (adZone && adFile) {
            adZone.addEventListener('click', () => adFile.click());
            adFile.addEventListener('change', e => {
                if (e.target.files[0]) applyImageToZone(e.target.files[0], 'ad');
                e.target.value = '';
            });
            setupDragDrop(adZone, 'ad'); // sidebar upload zone accepts drops
        }

        // AD zone - Icon upload (sidebar only)
        const iconZone = document.getElementById('upload-ad-icon');
        const iconFile = document.getElementById('file-ad-icon');
        if (iconZone && iconFile) {
            iconZone.addEventListener('click', () => iconFile.click());
            iconFile.addEventListener('change', e => {
                if (e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = ev => setAdIcon(ev.target.result);
                    reader.readAsDataURL(e.target.files[0]);
                }
                e.target.value = '';
            });
        }
        document.getElementById('btn-remove-ad-icon')?.addEventListener('click', removeAdIcon);

        // Fit + position controls
        document.getElementById('photo-fit')?.addEventListener('change', applyFit);
        document.getElementById('photo-pos-x')?.addEventListener('input', applyPhotoPosition);
        document.getElementById('photo-pos-y')?.addEventListener('input', applyPhotoPosition);
        document.getElementById('photo-zoom')?.addEventListener('input', e =>
            applyPhotoZoom(e.target.value)
        );

        // Drag-to-pan on card canvas (NOT file drop for ad zone)
        setupDragAndZoom(document.getElementById('card-photo-zone'), 'main');
        setupDragAndZoom(document.getElementById('card-ad-zone'), 'ad');

        // Global Ctrl+V paste — images only
        document.addEventListener('paste', e => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    applyMediaToMain(item.getAsFile());
                    return;
                }
            }
        });
    }

    // kept for backwards-compat with ad zone calls
    function applyImageToZone(file, zone) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            if (zone === 'ad') setAdPhoto(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    function setupDragDrop(el, zone) {
        if (!el) return;
        el.addEventListener('dragover', e => {
            e.preventDefault();
            el.classList.add('drag-over');
            document.getElementById('card-photo-zone')?.classList.add('drop-target-active');
        });
        el.addEventListener('dragleave', () => {
            el.classList.remove('drag-over');
            document.getElementById('card-photo-zone')?.classList.remove('drop-target-active');
            document.getElementById('card-ad-zone')?.classList.remove('drop-target-active');
        });
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('drag-over');
            document.getElementById('card-photo-zone')?.classList.remove('drop-target-active');
            document.getElementById('card-ad-zone')?.classList.remove('drop-target-active');
            const file = e.dataTransfer.files[0];
            if (!file) return;
            if (zone === 'main') applyMediaToMain(file);
            else applyImageToZone(file, zone);
        });
    }

    function setupDragAndZoom(zoneEl, type) {
        if (!zoneEl) return;

        let isDragging = false;
        let startX = 0, startY = 0;
        let startValX = 50, startValY = 50;

        const posXInput = type === 'main' ? document.getElementById('photo-pos-x') : document.getElementById('ctrl-ad-pos-x');
        const posYInput = type === 'main' ? document.getElementById('photo-pos-y') : document.getElementById('ctrl-ad-pos-y');

        zoneEl.addEventListener('mousedown', e => {
            if (e.button !== 0) return; // Left click only
            // Allow clicks on contenteditable, input, button elements to pass through
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'button') return;
            if (e.target.isContentEditable) return;

            // Only pan if we have position inputs to update (i.e. image mode)
            if (!posXInput || !posYInput) return;

            e.preventDefault();
            isDragging = true;
            zoneEl._dragDistance = 0;
            startX = e.clientX;
            startY = e.clientY;
            startValX = parseFloat(posXInput.value);
            startValY = parseFloat(posYInput.value);
            zoneEl.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            // Prevent default drag behaviors from taking over
            e.preventDefault();
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            zoneEl._dragDistance = Math.abs(deltaX) + Math.abs(deltaY);

            const zoomVal = type === 'main' ? parseFloat(document.getElementById('photo-zoom')?.value || 1) : 1;
            const rect = zoneEl.getBoundingClientRect();

            let newValX = startValX - (deltaX / rect.width) * 100 / zoomVal;
            let newValY = startValY - (deltaY / rect.height) * 100 / zoomVal;

            if (newValX < 0) newValX = 0; if (newValX > 100) newValX = 100;
            if (newValY < 0) newValY = 0; if (newValY > 100) newValY = 100;

            if (posXInput) { posXInput.value = newValX; posXInput.dispatchEvent(new Event('input')); }
            if (posYInput) { posYInput.value = newValY; posYInput.dispatchEvent(new Event('input')); }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                zoneEl.style.cursor = '';
                if (posXInput) posXInput.dispatchEvent(new Event('change'));
                if (posYInput) posYInput.dispatchEvent(new Event('change'));
            }
        });

        zoneEl.addEventListener('wheel', e => {
            if (type !== 'main') return;
            e.preventDefault();
            const zoomInput = document.getElementById('photo-zoom');
            if (!zoomInput) return;

            let currentZoom = parseFloat(zoomInput.value);
            const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
            let newZoom = currentZoom + zoomChange;
            if (newZoom < 1) newZoom = 1;
            if (newZoom > 3) newZoom = 3;
            zoomInput.value = Math.round(newZoom * 100) / 100;
            zoomInput.dispatchEvent(new Event('input'));

            clearTimeout(zoneEl._wheelTimeout);
            zoneEl._wheelTimeout = setTimeout(() => {
                zoomInput.dispatchEvent(new Event('change'));
            }, 300);
        });
    }

    return { init, setMainPhoto, setMainVideo, setAdPhoto, removeMainMedia, removeAdPhoto, applyFit };
})();
