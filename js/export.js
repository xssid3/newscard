/* ============================================================
   export.js – PNG & Video Export
   Clean approach: no DOM hacking for ad zone position. 
   Uses perfectly computed cover canvases to avoid html2canvas stretches.
   ============================================================ */

const Exporter = (() => {

    /**
     * Bakes an img/video into a canvas matching its container's dimensions and CSS object-fit/position.
     * Returns a solid 2D Canvas element.
     */
    function bakeMediaToCanvas(mediaEl, containerW, containerH, isVideo = false) {
        if (!mediaEl || !mediaEl.getAttribute('src') || mediaEl.style.display === 'none') return null;

        const canvas = document.createElement('canvas');
        canvas.width = containerW;
        canvas.height = containerH;
        const ctx = canvas.getContext('2d');

        const vw = isVideo ? (mediaEl.videoWidth || 1066) : (mediaEl.naturalWidth || 1066);
        const vh = isVideo ? (mediaEl.videoHeight || 703) : (mediaEl.naturalHeight || 703);
        if (!vw || !vh) return null;

        let fitMode = 'cover';
        let zoom = 1;
        let posXPct = 50;
        let posYPct = 50;

        const isMain = mediaEl.id && mediaEl.id.includes('main-photo');
        const isAd = mediaEl.id === 'ad-img';

        if (isMain) {
            fitMode = document.getElementById('photo-fit')?.value || 'cover';
            zoom = parseFloat(document.getElementById('photo-zoom')?.value || 1);
            posXPct = parseFloat(document.getElementById('photo-pos-x')?.value || 50);
            posYPct = parseFloat(document.getElementById('photo-pos-y')?.value || 50);
        } else if (isAd) {
            fitMode = 'cover'; // Ad is always cover
            zoom = 1;
            posXPct = parseFloat(document.getElementById('ctrl-ad-pos-x')?.value || 50);
            posYPct = parseFloat(document.getElementById('ctrl-ad-pos-y')?.value || 50);
        }

        const canvasRatio = containerW / containerH;
        const mediaRatio = vw / vh;

        // Background Layer for main photo
        if (isMain) {
            const useBlur = document.getElementById('photo-bg-blur')?.checked ?? true;
            if (useBlur) {
                ctx.save();
                ctx.filter = 'blur(40px)';
                const bgW = containerW * 1.3;
                const bgH = containerH * 1.3;
                const bgRatio = bgW / bgH;
                let bdW = bgW, bdH = bgH;
                if (mediaRatio > bgRatio) { bdH = bgH; bdW = bdH * mediaRatio; }
                else { bdW = bgW; bdH = bdW / mediaRatio; }
                const bX = (containerW - bdW) / 2;
                const bY = (containerH - bdH) / 2;
                ctx.drawImage(mediaEl, 0, 0, vw, vh, bX, bY, bdW, bdH);
                ctx.restore();
            } else {
                const type = document.getElementById('photo-bg-type')?.value ?? 'gradient';
                if (type === 'none') {
                    ctx.fillStyle = '#000000';
                } else if (type === 'color') {
                    ctx.fillStyle = document.getElementById('photo-bg-color')?.value || '#000';
                } else {
                    const c1 = document.getElementById('photo-bg-grad1')?.value || '#222';
                    const c2 = document.getElementById('photo-bg-grad2')?.value || '#0e0e0e';
                    const grad = ctx.createLinearGradient(0, 0, 0, containerH);
                    grad.addColorStop(0, c1); grad.addColorStop(1, c2);
                    ctx.fillStyle = grad;
                }
                ctx.fillRect(0, 0, containerW, containerH);
            }
        }

        let drawW = containerW, drawH = containerH;
        if (fitMode === 'cover') {
            if (mediaRatio > canvasRatio) { drawH = containerH; drawW = drawH * mediaRatio; }
            else { drawW = containerW; drawH = drawW / mediaRatio; }
        } else { // contain
            if (mediaRatio > canvasRatio) { drawW = containerW; drawH = drawW / mediaRatio; }
            else { drawH = containerH; drawW = drawH * mediaRatio; }
        }

        drawW *= zoom;
        drawH *= zoom;

        const drawX = (containerW - drawW) * (posXPct / 100);
        const drawY = (containerH - drawH) * (posYPct / 100);

        ctx.drawImage(mediaEl, 0, 0, vw, vh, drawX, drawY, drawW, drawH);
        return canvas;
    }

    async function exportCard() {
        const btn = document.getElementById('btn-export');
        btn.disabled = true;
        btn.textContent = 'Generating...';
        showToast('Preparing export...');

        try {
            const card = document.getElementById('card-root');
            if (document.activeElement) document.activeElement.blur();

            const photoBoxHeight = parseInt(document.getElementById('card-photo-zone').style.height || 703);

            // Pre-bake canvases
            const videoEl = document.getElementById('main-photo-video');
            const imgEl = document.getElementById('main-photo-img');
            let mainBakedCanvas = null;
            if (videoEl && videoEl.style.display !== 'none' && videoEl.readyState >= 2) {
                mainBakedCanvas = bakeMediaToCanvas(videoEl, 1066, photoBoxHeight, true);
            } else if (imgEl && imgEl.style.display !== 'none') {
                mainBakedCanvas = bakeMediaToCanvas(imgEl, 1066, photoBoxHeight, false);
            }

            const adImgEl = document.getElementById('ad-img');
            let adBakedCanvas = null;
            // Only bake ad image if it's actually visible (its parent ad-view-image is flex, NOT none)
            const adViewImage = document.getElementById('ad-view-image');
            if (adImgEl && adImgEl.src && adImgEl.style.display !== 'none' && adViewImage && adViewImage.style.display !== 'none') {
                adBakedCanvas = bakeMediaToCanvas(adImgEl, 1080, 90, false);
            }

            await new Promise(r => setTimeout(r, 80));

            const finalCanvas = await html2canvas(card, {
                scale: 1,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: 1080,
                height: 1080,
                windowWidth: 1920,
                windowHeight: 1080,
                scrollX: 0,
                scrollY: 0,

                onclone: (cloneDoc, cloneCard) => {
                    const outerClone = cloneDoc.getElementById('canvas-outer');
                    if (outerClone) {
                        outerClone.style.zoom = '1';
                        outerClone.style.transform = 'none';
                        outerClone.style.width = '1080px';
                        outerClone.style.height = '1080px';
                        outerClone.style.overflow = 'visible';
                        outerClone.style.position = 'relative';
                    }
                    cloneCard.style.zoom = '1';
                    cloneCard.style.transform = 'none';
                    cloneCard.style.position = 'relative';
                    cloneCard.style.overflow = 'hidden';

                    // Replace main photo with pixel-perfect canvas
                    if (mainBakedCanvas) {
                        const cloneInner = cloneDoc.getElementById('photo-inner');
                        if (cloneInner) {
                            cloneInner.innerHTML = '';
                            mainBakedCanvas.style.cssText = 'width:100%;height:100%;display:block;';
                            cloneInner.appendChild(mainBakedCanvas);
                        }
                        const bgLayer = cloneDoc.getElementById('photo-bg-layer');
                        if (bgLayer) bgLayer.style.display = 'none';
                    }

                    // Replace ad image with pixel-perfect canvas
                    if (adBakedCanvas) {
                        const cloneAdImg = cloneDoc.getElementById('ad-img');
                        if (cloneAdImg && cloneAdImg.parentNode) {
                            adBakedCanvas.className = cloneAdImg.className;
                            adBakedCanvas.style.cssText = 'width:100%;height:100%;display:block;position:absolute;inset:0;';
                            cloneAdImg.parentNode.replaceChild(adBakedCanvas, cloneAdImg);
                        }
                    }

                    // Clean contenteditable
                    const noOutline = cloneDoc.createElement('style');
                    noOutline.textContent = `
                        [contenteditable] { outline:none !important; caret-color:transparent !important; }
                        .canvas-outer { zoom:1 !important; transform:none !important; }
                    `;
                    cloneDoc.head.appendChild(noOutline);

                    const fonts = cloneDoc.createElement('style');
                    fonts.textContent = `
                        @font-face { font-family:'SiyamRupali'; src:url('assets/fonts/Siyamrupali.ttf') format('truetype'); font-display:block; }
                        @font-face { font-family:'Calibri'; src:url('assets/fonts/calibri.ttf') format('truetype'); font-display:block; }
                        @font-face { font-family:'POEUnicase'; src:url('assets/fonts/POE Unicase To.ttf') format('truetype'); font-display:block; }
                    `;
                    cloneDoc.head.appendChild(fonts);
                }
            });

            const link = document.createElement('a');
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            link.download = `peeai.com____${ts}.png`;
            link.href = finalCanvas.toDataURL('image/png');
            link.click();
            showToast('Exported successfully!');

        } catch (err) {
            console.error('Export error:', err);
            showToast('Export failed - see console.');
        }

        btn.disabled = false;
        btn.innerHTML = '<span>&#8595;</span> Export PNG';
    }

    async function exportVideo() {
        const btn = document.getElementById('btn-export-vid');
        btn.disabled = true;
        btn.textContent = 'Rendering...';
        showToast('Starting video render...');

        let exportVideoEl = null;
        let audioCtx = null;

        try {
            const videoEl = document.getElementById('main-photo-video');
            if (!videoEl || videoEl.style.display === 'none' || !videoEl.src) {
                showToast('No video loaded.');
                btn.disabled = false;
                btn.innerHTML = '<span>&#127909;</span> Export Video';
                return;
            }

            if (document.activeElement) document.activeElement.blur();
            await new Promise(r => setTimeout(r, 80));

            const res = parseInt(document.getElementById('export-res').value);
            const w = res, h = res;
            const scaleFactor = res / 1080;

            // 1. BG
            const bgContainer = document.createElement('div');
            bgContainer.style.cssText = 'width:1080px;height:1080px;position:absolute;top:-9999px;left:-9999px;overflow:hidden;';
            bgContainer.appendChild(document.getElementById('card-bg').cloneNode(true));
            document.body.appendChild(bgContainer);
            const bgCanvas = await html2canvas(bgContainer, { scale: scaleFactor, width: 1080, height: 1080, logging: false });
            document.body.removeChild(bgContainer);

            // 2. FG
            const fgContainer = document.createElement('div');
            fgContainer.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1080px;height:1080px;overflow:hidden;background:transparent;';

            const fgContent = document.getElementById('card-content-area').cloneNode(true);
            const fgWatermark = document.getElementById('card-watermark').cloneNode(true);
            const fgAd = document.getElementById('card-ad-zone').cloneNode(true);

            // Layout is fixed to matching exactly
            fgAd.style.position = 'absolute';
            fgAd.style.bottom = '0'; // use bottom: 0 naturally!
            fgAd.style.left = '0';
            fgAd.style.width = '1080px';
            fgAd.style.height = '90px';
            fgAd.style.overflow = 'hidden';

            const adImgEl = document.getElementById('ad-img');
            const adViewImage = document.getElementById('ad-view-image');
            if (adImgEl && adImgEl.src && adViewImage && adViewImage.style.display !== 'none') {
                const cx = bakeMediaToCanvas(adImgEl, 1080, 90, false);
                const clonedAdImg = fgAd.querySelector('#ad-img');
                if (clonedAdImg && clonedAdImg.parentNode && cx) {
                    cx.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
                    clonedAdImg.parentNode.replaceChild(cx, clonedAdImg);
                }
            }

            const noOutline = document.createElement('style');
            noOutline.textContent = '[contenteditable]{outline:none!important;caret-color:transparent!important;}';
            fgContainer.appendChild(noOutline);
            fgContainer.appendChild(fgWatermark);
            fgContainer.appendChild(fgContent);
            fgContainer.appendChild(fgAd);

            document.body.appendChild(fgContainer);
            const fgCanvas = await html2canvas(fgContainer, { scale: scaleFactor, width: 1080, height: 1080, useCORS: true, logging: false, backgroundColor: null });
            document.body.removeChild(fgContainer);

            // 3. Record
            const masterCanvas = document.createElement('canvas');
            masterCanvas.width = w; masterCanvas.height = h;
            const ctx = masterCanvas.getContext('2d', { alpha: false });
            const stream = masterCanvas.captureStream(30);

            let mime = 'video/webm; codecs=vp9';
            let ext = '.webm';
            if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
                mime = 'video/mp4; codecs="avc1.42E01E"';
                ext = '.mp4';
            } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/mp4')) {
                mime = 'video/mp4';
                ext = '.mp4';
            }

            const recorder = new MediaRecorder(stream, { mimeType: mime });
            const chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

            let rendering = true;
            recorder.onstop = () => {
                rendering = false;
                const blob = new Blob(chunks, { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none'; a.href = url;
                a.download = `peeai.com____video-${Date.now()}${ext}`;
                document.body.appendChild(a); a.click();
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
                showToast(`Exported ${res}p Video!`);
                btn.disabled = false;
                btn.innerHTML = '<span>&#127909;</span> Export Video';
            };

            const startTime = parseFloat(videoEl.dataset.trimStart) || 0;
            const endTime = parseFloat(videoEl.dataset.trimEnd) || videoEl.duration;
            const photoBoxHeight = parseInt(document.getElementById('card-photo-zone').style.height || 703);
            const vStartY = 7 * scaleFactor, vStartX = 7 * scaleFactor;
            const vWidth = 1066 * scaleFactor, vHeight = photoBoxHeight * scaleFactor;

            // Clone video to handle audio routing without affecting UI
            exportVideoEl = document.createElement('video');
            exportVideoEl.src = videoEl.src;
            exportVideoEl.muted = false;
            exportVideoEl.volume = 1;
            exportVideoEl.currentTime = startTime;

            await new Promise((resolve) => {
                exportVideoEl.oncanplay = resolve;
                setTimeout(resolve, 1500); // safety fallback
            });

            const AudioContext = window.AudioContext || window.webkitAudioContext;

            if (AudioContext) {
                audioCtx = new AudioContext();
                const source = audioCtx.createMediaElementSource(exportVideoEl);
                const dest = audioCtx.createMediaStreamDestination();
                source.connect(dest); // Audio stops here, perfect for silent export!
                dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
            } else {
                const actStream = exportVideoEl.captureStream ? exportVideoEl.captureStream() : (exportVideoEl.mozCaptureStream ? exportVideoEl.mozCaptureStream() : null);
                if (actStream) {
                    actStream.getAudioTracks().forEach(t => stream.addTrack(t));
                }
            }

            await exportVideoEl.play();

            let recorderStarted = false;

            function drawFrame() {
                if (!rendering) return;
                try {
                    ctx.clearRect(0, 0, w, h);
                    ctx.drawImage(bgCanvas, 0, 0, w, h);

                    const vw = exportVideoEl.videoWidth, vh = exportVideoEl.videoHeight;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(vStartX, vStartY, vWidth, vHeight);
                    ctx.clip();

                    const fitMode = document.getElementById('photo-fit')?.value || 'cover';
                    const zoom = parseFloat(document.getElementById('photo-zoom')?.value || 1);
                    const posXPct = parseFloat(document.getElementById('photo-pos-x')?.value || 50);
                    const posYPct = parseFloat(document.getElementById('photo-pos-y')?.value || 50);

                    const canvasRatio = vWidth / vHeight;
                    const vidRatio = vw / vh;

                    const useBlur = document.getElementById('photo-bg-blur')?.checked ?? true;
                    if (useBlur) {
                        ctx.save();
                        ctx.filter = `blur(${40 * scaleFactor}px)`;
                        const bgW = vWidth * 1.3, bgH = vHeight * 1.3;
                        const bgRatio = bgW / bgH;
                        let bdW = bgW, bdH = bgH;
                        if (vidRatio > bgRatio) { bdH = bgH; bdW = bdH * vidRatio; }
                        else { bdW = bgW; bdH = bdW / vidRatio; }
                        ctx.drawImage(exportVideoEl, 0, 0, vw, vh,
                            vStartX + (vWidth - bdW) / 2, vStartY + (vHeight - bdH) / 2, bdW, bdH);
                        ctx.restore();
                    } else {
                        const type = document.getElementById('photo-bg-type')?.value ?? 'gradient';
                        if (type === 'color') {
                            ctx.fillStyle = document.getElementById('photo-bg-color')?.value || '#000';
                        } else if (type !== 'none') {
                            const c1 = document.getElementById('photo-bg-grad1')?.value || '#222';
                            const c2 = document.getElementById('photo-bg-grad2')?.value || '#0e0e0e';
                            const grad = ctx.createLinearGradient(0, vStartY, 0, vStartY + vHeight);
                            grad.addColorStop(0, c1); grad.addColorStop(1, c2);
                            ctx.fillStyle = grad;
                        } else { ctx.fillStyle = '#000'; }
                        ctx.fillRect(vStartX, vStartY, vWidth, vHeight);
                    }

                    let drawW = vWidth, drawH = vHeight;
                    if (fitMode === 'cover') {
                        if (vidRatio > canvasRatio) { drawH = vHeight; drawW = drawH * vidRatio; }
                        else { drawW = vWidth; drawH = drawW / vidRatio; }
                    } else { // contain
                        if (vidRatio > canvasRatio) { drawW = vWidth; drawH = drawW / vidRatio; }
                        else { drawH = vHeight; drawW = drawH * vidRatio; }
                    }
                    drawW *= zoom; drawH *= zoom;
                    ctx.drawImage(exportVideoEl, 0, 0, vw, vh,
                        vStartX + (vWidth - drawW) * (posXPct / 100),
                        vStartY + (vHeight - drawH) * (posYPct / 100), drawW, drawH);
                    ctx.restore();

                    ctx.drawImage(fgCanvas, 0, 0, w, h);

                    // Update UI Progress dynamically!
                    if (endTime > startTime) {
                        const pct = Math.min(100, Math.max(0, ((exportVideoEl.currentTime - startTime) / (endTime - startTime)) * 100));
                        btn.innerHTML = `<span style="display:inline-block; font-variant-numeric: tabular-nums;">⏳ Render: ${pct.toFixed(0)}%</span>`;
                    }

                    // Start recording ONLY after the very first frame paints onto the canvas completely. Fixes blank frames.
                    if (!recorderStarted) {
                        recorder.start();
                        recorderStarted = true;
                    }

                    if (exportVideoEl.currentTime >= endTime) {
                        if (recorder.state === 'recording') recorder.stop();
                        exportVideoEl.pause();
                        exportVideoEl.src = '';
                        if (audioCtx) audioCtx.close().catch(() => { });
                    } else {
                        requestAnimationFrame(drawFrame);
                    }
                } catch (e) {
                    console.error('Frame rendering error:', e);
                    showToast('Video Export failed during rendering.');
                    if (recorder.state === 'recording') recorder.stop();
                    exportVideoEl.pause();
                    exportVideoEl.src = '';
                    if (audioCtx) audioCtx.close().catch(() => { });
                    btn.disabled = false;
                    btn.innerHTML = '<span>&#127909;</span> Export Video';
                }
            }
            drawFrame();
        } catch (err) {
            console.error('Video Export Error:', err);
            showToast('Video Export failed - check console.');
            if (exportVideoEl) {
                exportVideoEl.pause();
                exportVideoEl.src = '';
                exportVideoEl.removeAttribute('src');
                exportVideoEl.load();
            }
            if (audioCtx) {
                audioCtx.close().catch(() => { });
            }
            btn.disabled = false;
            btn.innerHTML = '<span>&#127909;</span> Export Video';
        }
    }

    function init() {
        document.getElementById('btn-export')?.addEventListener('click', exportCard);
        document.getElementById('btn-export-vid')?.addEventListener('click', exportVideo);
    }

    return { init };
})();
