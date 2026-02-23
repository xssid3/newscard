/* ============================================================
   canvas.js – Applies all state from controls to the card DOM
   ============================================================ */

const Canvas = (() => {

    let _scale = 1;

    function getScale() { return _scale; }

    // ── Zoom / Scale ─────────────────────────────────────────
    function setScale(s) {
        _scale = s;
        const outer = document.getElementById('canvas-outer');
        const inner = document.getElementById('card-root');
        if (!outer || !inner) return;

        // The card-root is always 1080×1080 (full resolution for export).
        // We shrink/grow it visually using CSS zoom on the outer wrapper.
        // Using `zoom` (not transform) so the wrapper's layout size matches
        // the visual size → flexbox centers it correctly with no scroll bleed.
        outer.style.width = '1080px';
        outer.style.height = '1080px';
        // Use zoom property: supported in all modern browsers; changes layout size
        outer.style.zoom = s;

        const zoomEl = document.getElementById('zoom-pct');
        if (zoomEl) zoomEl.textContent = Math.round(s * 100) + '%';
    }

    // Calculate the correct scale to fit the card in the visible canvas area.
    // Uses window dimensions directly — always reliable regardless of timing.
    function fitToViewport() {
        const isMobile = window.innerWidth <= 680;
        const panel = document.getElementById('left-panel');
        const panelW = (!isMobile && panel) ? panel.offsetWidth || 290 : 0;

        // Fixed chrome heights
        const topbarEl = document.querySelector('.topbar');
        const TOPBAR = topbarEl ? topbarEl.offsetHeight : 56;
        const CONTROLS = 40;   // .canvas-controls height
        const SIDE_PADDING = 30; // Breathing room padding on mobile vs destkop 

        const availW = window.innerWidth - panelW - (isMobile ? 24 : 60);

        // On mobile, the canvas shrinks to strictly fit the screen width, and its height follows implicitly.
        // On desktop, it can fill either width or height limit.
        const availH = isMobile ? availW : (window.innerHeight - TOPBAR - CONTROLS - 60);

        if (availW <= 0 || availH <= 0) return;

        // Floor so we never accidentally overflow by a fraction
        const raw = Math.min(availW / 1080, availH / 1080, 1);
        const s = Math.floor(raw * 100) / 100;
        setScale(Math.max(0.2, s));
    }

    // ── Sync panel → card ────────────────────────────────────

    function applyBackground() {
        const color = document.getElementById('ctrl-bg-color').value;
        document.getElementById('card-bg').style.background = color;
        document.getElementById('card-content-area').style.background = color;
    }

    function applyPhotoBg() {
        const useBlur = document.getElementById('photo-bg-blur')?.checked ?? true;
        const type = document.getElementById('photo-bg-type')?.value ?? 'gradient';

        const layer = document.getElementById('photo-bg-layer');
        if (!layer) return;

        const img = document.getElementById('photo-bg-img');
        const video = document.getElementById('photo-bg-video');
        const fill = document.getElementById('photo-bg-fill');

        const colorSection = document.getElementById('photo-bg-color-section');
        const colorRow = document.getElementById('photo-bg-color-row');
        const gradRow = document.getElementById('photo-bg-grad-row');

        if (colorSection) colorSection.style.display = useBlur ? 'none' : 'block';
        if (!useBlur && colorRow && gradRow) {
            colorRow.style.display = type === 'color' ? 'flex' : 'none';
            gradRow.style.display = type === 'gradient' ? 'flex' : 'none';
        }

        if (useBlur) {
            if (img) img.style.opacity = '1';
            if (video) video.style.opacity = '1';
            if (fill) fill.style.display = 'none';
        } else {
            if (img) img.style.opacity = '0';
            if (video) video.style.opacity = '0';
            if (fill) fill.style.display = 'block';

            if (fill) {
                if (type === 'none') {
                    fill.style.background = '#000000';
                } else if (type === 'color') {
                    fill.style.background = document.getElementById('photo-bg-color')?.value || '#000';
                } else {
                    const c1 = document.getElementById('photo-bg-grad1')?.value || '#222';
                    const c2 = document.getElementById('photo-bg-grad2')?.value || '#0e0e0e';
                    fill.style.background = `linear-gradient(to bottom, ${c1}, ${c2})`;
                }
            }
        }
    }

    function applyGradientBar() {
        const l = document.getElementById('ctrl-grad-left').value;
        const r = document.getElementById('ctrl-grad-right').value;
        document.getElementById('tv-bar').style.background = `linear-gradient(90deg, ${l}, ${r})`;
    }

    function applyDotOverlay() {
        const v = document.getElementById('ctrl-dot-opacity').value;
        const visible = document.getElementById('vis-dotbg').checked;
        const el = document.getElementById('card-dot-overlay');
        el.style.opacity = visible ? v / 100 : 0;
        document.getElementById('ctrl-dot-opacity-val').textContent = v + '%';
    }

    function applyWatermark() {
        const text = document.getElementById('ctrl-watermark').value;
        const opacity = document.getElementById('ctrl-wm-opacity').value;
        const size = document.getElementById('ctrl-wm-size')?.value || 300;
        const visible = document.getElementById('vis-wm').checked;
        const el = document.getElementById('watermark-text');
        el.textContent = text;
        el.style.color = `rgba(255,255,255,${visible ? opacity / 100 : 0})`;
        el.style.fontSize = size + 'px';
        document.getElementById('ctrl-wm-opacity-val').textContent = opacity + '%';
        if (document.getElementById('ctrl-wm-size-val')) {
            document.getElementById('ctrl-wm-size-val').textContent = size + 'px';
        }
    }



    function getContentScale() {
        const boxHeightElement = document.getElementById('photo-box-height');
        const boxHeight = boxHeightElement ? Number(boxHeightElement.value) : 703;
        const hideAd = document.getElementById('ctrl-hide-ad')?.checked ?? false;
        const adH = hideAd ? 0 : 90;
        const contentHeight = 1080 - 7 - adH - boxHeight;
        return contentHeight / 280;
    }

    function applyHeadline(fromCanvas = false) {
        const h1Text = document.getElementById('ctrl-headline1').value;
        const h1Size = document.getElementById('ctrl-h1-size').value;
        const color = document.getElementById('ctrl-headline-color').value;

        const el1 = document.getElementById('el-headline1');

        if (!fromCanvas && el1.innerText !== h1Text) {
            el1.innerText = h1Text;
        }

        const scale = getContentScale();
        el1.style.fontSize = (h1Size * scale) + 'px';
        el1.style.color = color;

        document.getElementById('ctrl-h1-size-val').textContent = h1Size + 'px';

        // Determine layout changes and update divider visibility
        applyVisibility();
    }

    function applySubtitle() {
        const text = document.getElementById('ctrl-subtitle').value;
        const size = document.getElementById('ctrl-sub-size').value;
        const color = document.getElementById('ctrl-sub-color').value;
        const align = !!document.getElementById('ctrl-sub-align') ? document.getElementById('ctrl-sub-align').value : 'center';
        const el = document.getElementById('el-subtitle');
        if (el.innerText !== text) el.innerText = text;
        const scale = getContentScale();
        el.style.fontSize = (size * scale) + 'px';
        el.style.color = color;

        if (align === 'center') {
            el.style.left = '50%';
            el.style.transform = 'translateX(-50%)';
            el.style.textAlign = 'center';
        } else {
            el.style.left = '40px';
            el.style.transform = 'none';
            el.style.textAlign = 'left';
        }

        document.getElementById('ctrl-sub-size-val').textContent = size + 'px';
    }

    function applyDate() {
        const text = document.getElementById('ctrl-date').value;
        const size = document.getElementById('ctrl-date-size').value;
        const color = document.getElementById('ctrl-date-color').value;
        const el = document.getElementById('el-date');
        if (el.innerText !== text) el.innerText = text;
        const scale = getContentScale();
        el.style.fontSize = (size * scale) + 'px';
        el.style.color = color;
        document.getElementById('ctrl-date-size-val').textContent = size + 'px';
    }

    function applyTVBranding() {
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el.innerText !== val) el.innerText = val;
        };
        setEl('el-tv-name', document.getElementById('ctrl-tv-name').value);
        setEl('el-tv-label', document.getElementById('ctrl-tv-label').value);
        setEl('el-website', document.getElementById('ctrl-website').value);
        setEl('el-facebook', document.getElementById('ctrl-facebook').value);
        setEl('el-youtube', document.getElementById('ctrl-youtube').value);

        const extraVal = document.getElementById('ctrl-extra-link').value;
        const extraRow = document.getElementById('el-extra-row');
        if (extraVal.trim() !== '') {
            setEl('el-extra-link', extraVal);
            extraRow.style.display = 'flex';
        } else {
            extraRow.style.display = 'none';
        }

        const layoutVal = document.getElementById('ctrl-tv-layout') ? document.getElementById('ctrl-tv-layout').value : 'distributed';
        const tb = document.getElementById('tv-bar');
        tb.className = 'tv-bar has-layout-' + layoutVal;
    }

    function applyVisibility() {
        const dividerChecked = document.getElementById('vis-divider').checked;
        const autoHide = document.getElementById('ctrl-auto-hide-divider')?.checked ?? true;
        let showDivider = dividerChecked;

        // Auto hide logic: if text spans roughly more than 1.5 lines based on line-height
        if (dividerChecked && autoHide) {
            const el1 = document.getElementById('el-headline1');
            const h1Size = document.getElementById('ctrl-h1-size').value;
            const currentFontSize = (h1Size * getContentScale()) || 54;
            if (el1.offsetHeight > currentFontSize * 1.5 || el1.innerText.includes('\n')) {
                showDivider = false;
            }
        }

        document.getElementById('el-divider').style.display = showDivider ? 'block' : 'none';
        document.getElementById('el-earth-logo').style.display =
            document.getElementById('vis-earth').checked ? 'inline' : 'none';
        document.getElementById('el-fb-row').style.display =
            document.getElementById('vis-fb').checked ? 'flex' : 'none';
        document.getElementById('el-yt-row').style.display =
            document.getElementById('vis-yt').checked ? 'flex' : 'none';
    }

    function applyPhotoBoxSize() {
        const boxHeight = document.getElementById('photo-box-height')?.value || 703;
        document.getElementById('photo-box-height-val').textContent = boxHeight + 'px';

        const photoZone = document.getElementById('card-photo-zone');
        if (photoZone) photoZone.style.height = boxHeight + 'px';

        const hideAd = document.getElementById('ctrl-hide-ad')?.checked ?? false;
        const adH = hideAd ? 0 : 90;
        const contentHeight = 1080 - 7 - adH - boxHeight;
        const contentArea = document.getElementById('card-content-area');
        if (contentArea) {
            contentArea.style.height = contentHeight + 'px';
            contentArea.style.bottom = adH + 'px';
        }

        // Re-apply scaled text when height changes
        applyHeadline();
        applySubtitle();
        applyDate();
    }

    // ── NEW clean applyAdZone ──
    // Flat structure: show exactly ONE child panel. No z-index fights.
    function applyAdZone() {
        const adZone = document.getElementById('card-ad-zone');
        if (!adZone) return;

        // Hide/Show entire ad bar
        const hide = document.getElementById('ctrl-hide-ad')?.checked ?? false;
        adZone.style.display = hide ? 'none' : 'block';
        const settingsBody = document.getElementById('ad-settings-body');
        if (settingsBody) settingsBody.style.opacity = hide ? '0.4' : '1';
        if (settingsBody) settingsBody.style.pointerEvents = hide ? 'none' : '';

        if (hide) { applyPhotoBoxSize(); return; }

        const layout = document.getElementById('ctrl-ad-layout')?.value || 'text';

        // Show correct sidebar controls panel
        ['ad-ctrl-text', 'ad-ctrl-image', 'ad-ctrl-icon-text', 'ad-ctrl-4col'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const ctrlMap = { text: 'ad-ctrl-text', image: 'ad-ctrl-image', 'icon-text': 'ad-ctrl-icon-text', '4-col': 'ad-ctrl-4col' };
        const activeCtrl = document.getElementById(ctrlMap[layout]);
        if (activeCtrl) activeCtrl.style.display = 'block';

        // Show correct card view panel — simple block/flex toggle
        const views = {
            text: document.getElementById('ad-view-text'),
            image: document.getElementById('ad-view-image'),
            'icon-text': document.getElementById('ad-view-icon-text'),
            '4-col': document.getElementById('ad-view-4col'),
        };
        Object.entries(views).forEach(([key, el]) => {
            if (!el) return;
            if (key === layout) {
                el.style.display = (key === 'text' || key === 'image') ? 'flex' : 'flex';
            } else {
                el.style.display = 'none';
            }
        });

        // IMAGE: show/hide the placeholder overlay
        const adImg = document.getElementById('ad-img');
        const adImgPlaceholder = document.getElementById('ad-img-placeholder');
        if (layout === 'image' && adImg && adImgPlaceholder) {
            const hasImage = adImg.src && adImg.src !== window.location.href && adImg.src !== '';
            adImg.style.display = hasImage ? 'block' : 'none';
            adImgPlaceholder.style.display = hasImage ? 'none' : 'flex';
            // Apply pan position
            const posX = document.getElementById('ctrl-ad-pos-x')?.value || 50;
            const posY = document.getElementById('ctrl-ad-pos-y')?.value || 50;
            adImg.style.objectPosition = `${posX}% ${posY}%`;
        }

        // ICON+TEXT: show/hide icon placeholder
        if (layout === 'icon-text') {
            const icon = document.getElementById('ad-custom-icon');
            const iconPh = document.getElementById('ad-icon-text-placeholder');
            if (icon && iconPh) {
                const hasIcon = icon.src && icon.src !== window.location.href && icon.src !== '';
                icon.style.display = hasIcon ? 'block' : 'none';
                iconPh.style.display = hasIcon ? 'none' : 'flex';
            }
        }

        // Modifying ad zone visibility affects available space, so scale the content
        applyPhotoBoxSize();
    }

    function applyAll() {
        applyBackground();
        applyPhotoBg();
        applyGradientBar();
        applyDotOverlay();
        applyWatermark();
        applyHeadline();
        applySubtitle();
        applyDate();
        applyTVBranding();
        applyVisibility();
        applyAdZone();
        applyPhotoBoxSize(); // Call this last to ensure all other elements are in place for calculations
    }

    // ── Wire controls ─────────────────────────────────────────
    function wireControls() {
        const mkInput = (id, fn) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => fn());
            el.addEventListener('change', () => { fn(); History.capture(); });
        };

        mkInput('ctrl-bg-color', applyBackground);
        mkInput('photo-bg-blur', applyPhotoBg);
        mkInput('photo-bg-type', applyPhotoBg);
        mkInput('photo-bg-color', applyPhotoBg);
        mkInput('photo-bg-grad1', applyPhotoBg);
        mkInput('photo-bg-grad2', applyPhotoBg);

        mkInput('ctrl-grad-left', applyGradientBar);
        mkInput('ctrl-grad-right', applyGradientBar);
        mkInput('ctrl-dot-opacity', applyDotOverlay);
        mkInput('ctrl-wm-opacity', applyWatermark);
        mkInput('ctrl-wm-size', applyWatermark);
        mkInput('ctrl-watermark', applyWatermark);
        mkInput('ctrl-headline1', applyHeadline);
        mkInput('ctrl-h1-size', applyHeadline);
        mkInput('ctrl-headline-color', applyHeadline);
        mkInput('ctrl-subtitle', applySubtitle);
        mkInput('ctrl-sub-size', applySubtitle);
        mkInput('ctrl-sub-color', applySubtitle);
        mkInput('ctrl-sub-align', applySubtitle);
        mkInput('ctrl-date', applyDate);
        mkInput('ctrl-date-size', applyDate);
        mkInput('ctrl-date-color', applyDate);
        mkInput('ctrl-tv-name', applyTVBranding);
        mkInput('ctrl-tv-label', applyTVBranding);
        mkInput('ctrl-website', applyTVBranding);
        mkInput('ctrl-facebook', applyTVBranding);
        mkInput('ctrl-youtube', applyTVBranding);
        mkInput('ctrl-extra-link', applyTVBranding);
        mkInput('ctrl-tv-layout', applyTVBranding);
        mkInput('ctrl-hide-ad', applyAdZone);
        mkInput('ctrl-ad-layout', applyAdZone);
        mkInput('ctrl-ad-pos-x', applyAdZone);
        mkInput('ctrl-ad-pos-y', applyAdZone);
        mkInput('photo-box-height', applyPhotoBoxSize);

        ['vis-divider', 'vis-earth', 'vis-fb', 'vis-yt', 'vis-dotbg', 'vis-wm'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                applyVisibility(); applyDotOverlay(); applyWatermark();
                History.capture();
            });
        });

        ['el-headline1', 'el-subtitle', 'el-date',
            'el-tv-name', 'el-tv-label', 'el-website', 'el-facebook', 'el-youtube', 'el-extra-link'].forEach(id => {
                const el = document.getElementById(id);
                el?.addEventListener('input', () => {
                    if (id === 'el-headline1') {
                        document.getElementById('ctrl-headline1').value = el.innerText;
                        applyHeadline(true);
                    }
                    if (id === 'el-subtitle') document.getElementById('ctrl-subtitle').value = el.innerText;
                    if (id === 'el-date') document.getElementById('ctrl-date').value = el.innerText;
                    if (id === 'el-tv-name') document.getElementById('ctrl-tv-name').value = el.innerText;
                    if (id === 'el-tv-label') document.getElementById('ctrl-tv-label').value = el.innerText;
                    if (id === 'el-website') document.getElementById('ctrl-website').value = el.innerText;
                    if (id === 'el-facebook') document.getElementById('ctrl-facebook').value = el.innerText;
                    if (id === 'el-youtube') document.getElementById('ctrl-youtube').value = el.innerText;
                    if (id === 'el-extra-link') document.getElementById('ctrl-extra-link').value = el.innerText;
                });
            });

        document.getElementById('ctrl-auto-hide-divider')?.addEventListener('change', () => {
            applyVisibility();
            History.capture();
        });

        // Click-to-highlight logic for panels
        function highlightSection(sectionId) {
            const section = document.getElementById(sectionId);
            const panel = document.querySelector('.panel-scroll');
            if (!section || !panel) return;

            // Always open left panel on mobile if it's hidden
            const leftPanel = document.getElementById('left-panel');
            const backdrop = document.getElementById('panel-backdrop');
            if (leftPanel && leftPanel.classList.contains('active')) {
                // It's already open, do nothing special
            } else if (window.innerWidth <= 680 && leftPanel && backdrop) {
                leftPanel.classList.add('active');
                backdrop.classList.add('active');
            }

            // Scroll sidebar
            // calculate position relative to the scroll container
            const topPos = section.offsetTop - panel.offsetTop;
            panel.scrollTo({ top: Math.max(0, topPos - 20), behavior: 'smooth' });

            // Highlight animation
            section.style.transition = 'background-color 0.3s, box-shadow 0.3s';
            section.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            section.style.boxShadow = '0 0 15px rgba(255,255,255,0.1)';
            setTimeout(() => {
                section.style.backgroundColor = '';
                section.style.boxShadow = '';
            }, 800);
        }

        const clickMappings = [
            { elId: 'card-photo-zone', sectionId: 'section-photo' },
            { elId: 'content-headline-zone', sectionId: 'section-headline' },
            { elId: 'el-subtitle', sectionId: 'section-subtitle' },
            { elId: 'el-date', sectionId: 'section-date' },
            { elId: 'tv-bar', sectionId: 'section-tv' },
            { elId: 'card-watermark', sectionId: 'section-tv' },
            { elId: 'card-ad-zone', sectionId: 'section-ad' }
        ];

        clickMappings.forEach(mapping => {
            const el = document.getElementById(mapping.elId);
            if (el) {
                // Focus works best for contenteditable, mousedown for divs
                el.addEventListener('mousedown', () => highlightSection(mapping.sectionId));
                el.addEventListener('focus', () => highlightSection(mapping.sectionId));
            }
        });

        document.getElementById('btn-zoom-in').addEventListener('click',
            () => setScale(Math.min(_scale + 0.05, 2)));
        document.getElementById('btn-zoom-out').addEventListener('click',
            () => setScale(Math.max(_scale - 0.05, 0.1)));
        document.getElementById('btn-zoom-fit').addEventListener('click', fitToViewport);
    }

    return { applyAll, applyAdZone, wireControls, fitToViewport, getScale, setScale };
})();
