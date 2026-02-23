/* ============================================================
   trim.js – Video Trimming UI and Logic
   ============================================================ */

const Trim = (() => {
    let currentVideoFile = null;
    let videoUrl = null;
    let onApplyCallback = null;

    let startTime = 0;
    let endTime = 100;
    let duration = 0;

    const modal = document.getElementById('trim-modal');
    const videoPreview = document.getElementById('trim-video-preview');
    const sliderStart = document.getElementById('trim-slider-start');
    const sliderEnd = document.getElementById('trim-slider-end');
    const dispStart = document.getElementById('trim-start-display');
    const dispEnd = document.getElementById('trim-end-display');
    const btnClose = document.getElementById('btn-trim-close');
    const btnApply = document.getElementById('btn-trim-apply');

    function openModal(file, callback) {
        currentVideoFile = file;
        videoUrl = URL.createObjectURL(file);
        onApplyCallback = callback;

        videoPreview.src = videoUrl;
        videoPreview.load();

        videoPreview.onloadedmetadata = () => {
            duration = videoPreview.duration;
            sliderStart.setAttribute('max', duration);
            sliderEnd.setAttribute('max', duration);

            // default to full video
            sliderStart.value = 0;
            sliderEnd.value = duration;
            updateDisplay();

            modal.style.display = 'flex';
            videoPreview.play();
        };
    }

    function closeModal() {
        modal.style.display = 'none';
        videoPreview.pause();
        videoPreview.removeAttribute('src');
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        videoUrl = null;
        onApplyCallback = null;
    }

    function updateDisplay() {
        dispStart.textContent = parseFloat(sliderStart.value).toFixed(1);
        dispEnd.textContent = parseFloat(sliderEnd.value).toFixed(1);
    }

    function handleStartInput() {
        let start = parseFloat(sliderStart.value);
        let end = parseFloat(sliderEnd.value);
        if (start >= end) {
            sliderStart.value = end - 0.1;
            start = end - 0.1;
        }
        startTime = start;
        videoPreview.currentTime = startTime;
        updateDisplay();
    }

    function handleEndInput() {
        let start = parseFloat(sliderStart.value);
        let end = parseFloat(sliderEnd.value);
        if (end <= start) {
            sliderEnd.value = start + 0.1;
            end = start + 0.1;
        }
        endTime = end;
        videoPreview.currentTime = endTime - 0.5; // peek before end
        updateDisplay();
    }

    function init() {
        sliderStart.addEventListener('input', handleStartInput);
        sliderEnd.addEventListener('input', handleEndInput);

        btnClose.addEventListener('click', closeModal);
        modal.addEventListener('mousedown', (e) => {
            if (e.target === modal) closeModal();
        });

        btnApply.addEventListener('click', () => {
            if (onApplyCallback) {
                onApplyCallback(videoUrl, parseFloat(sliderStart.value), parseFloat(sliderEnd.value));
            }
            videoPreview.pause();
            modal.style.display = 'none';
            // Do NOT revoke the ObjectURL here, as we pass it to the main video canvas
        });

        // Loop functionality
        videoPreview.addEventListener('timeupdate', () => {
            if (videoPreview.currentTime >= parseFloat(sliderEnd.value)) {
                videoPreview.currentTime = parseFloat(sliderStart.value);
            }
        });
    }

    return { openModal, init };
})();

// Initialize automatically
window.addEventListener('DOMContentLoaded', () => {
    Trim.init();
});
