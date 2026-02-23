/* ============================================================
   history.js – Simple Undo/Redo
   ============================================================ */

const History = (() => {
  const MAX = 50;
  let stack = [];
  let cursor = -1;

  function val(id) {
    const el = document.getElementById(id);
    if (!el) return undefined;
    return el.type === 'checkbox' ? el.checked : el.value;
  }

  function capture() {
    // serialize all editable state — use ?. so missing elements don't crash
    const state = {
      headline1: document.getElementById('el-headline1')?.innerText,
      subtitle: document.getElementById('el-subtitle')?.innerText,
      date: document.getElementById('el-date')?.innerText,
      tvName: val('ctrl-tv-name'),
      tvLabel: val('ctrl-tv-label'),
      website: val('ctrl-website'),
      facebook: val('ctrl-facebook'),
      youtube: val('ctrl-youtube'),
      watermark: val('ctrl-watermark'),
      bgColor: val('ctrl-bg-color'),
      gradLeft: val('ctrl-grad-left'),
      gradRight: val('ctrl-grad-right'),
      h1Size: val('ctrl-h1-size'),
      subSize: val('ctrl-sub-size'),
      dateSize: val('ctrl-date-size'),
      dotOpacity: val('ctrl-dot-opacity'),
      wmOpacity: val('ctrl-wm-opacity'),
      wmSize: val('ctrl-wm-size'),
      hideAd: val('ctrl-hide-ad'),
      autoHideDivider: val('ctrl-auto-hide-divider'),
      adLayout: val('ctrl-ad-layout'),
      adText: document.getElementById('ad-text-display')?.innerText,
    };
    // Remove future if we branched
    stack = stack.slice(0, cursor + 1);
    stack.push(state);
    if (stack.length > MAX) stack.shift();
    cursor = stack.length - 1;
    updateButtons();
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el || value === undefined) return;
    if (el.type === 'checkbox') el.checked = value;
    else el.value = value;
  }

  function restore(state) {
    if (!state) return;
    setVal('ctrl-tv-name', state.tvName);
    setVal('ctrl-tv-label', state.tvLabel);
    setVal('ctrl-website', state.website);
    setVal('ctrl-facebook', state.facebook);
    setVal('ctrl-youtube', state.youtube);
    setVal('ctrl-watermark', state.watermark);
    setVal('ctrl-bg-color', state.bgColor);
    setVal('ctrl-grad-left', state.gradLeft);
    setVal('ctrl-grad-right', state.gradRight);
    setVal('ctrl-h1-size', state.h1Size);
    setVal('ctrl-sub-size', state.subSize);
    setVal('ctrl-date-size', state.dateSize);
    setVal('ctrl-dot-opacity', state.dotOpacity);
    setVal('ctrl-wm-opacity', state.wmOpacity);
    setVal('ctrl-wm-size', state.wmSize);
    setVal('ctrl-hide-ad', state.hideAd);
    setVal('ctrl-auto-hide-divider', state.autoHideDivider);
    setVal('ctrl-ad-layout', state.adLayout);
    if (state.adText !== undefined) {
      const display = document.getElementById('ad-text-display');
      if (display) display.innerText = state.adText;
    }
    // restore contenteditable
    if (state.headline1 !== undefined) document.getElementById('el-headline1').innerText = state.headline1;
    if (state.subtitle !== undefined) document.getElementById('el-subtitle').innerText = state.subtitle;
    if (state.date !== undefined) document.getElementById('el-date').innerText = state.date;
    Canvas.applyAll();
  }

  function undo() {
    if (cursor <= 0) return;
    cursor--;
    restore(stack[cursor]);
    updateButtons();
  }

  function redo() {
    if (cursor >= stack.length - 1) return;
    cursor++;
    restore(stack[cursor]);
    updateButtons();
  }

  function updateButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.disabled = cursor <= 0;
    if (btnRedo) btnRedo.disabled = cursor >= stack.length - 1;
  }

  return { capture, undo, redo };
})();
