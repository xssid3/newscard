/* ============================================================
   db.js – IndexedDB wrapper for large strings (images/videos)
   ============================================================ */

const DB = (() => {
    const DB_NAME = 'BDNewsCardDB';
    const STORE_NAME = 'media_store';
    const DB_VERSION = 1;
    let dbInstance = null;

    function init() {
        return new Promise((resolve, reject) => {
            if (dbInstance) {
                resolve(dbInstance);
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = e => reject('IndexedDB error: ' + e.target.errorCode);
            request.onsuccess = e => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };
            request.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async function setItem(id, value) {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put({ id, value });
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e);
        });
    }

    async function getItem(id) {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = e => resolve(e.target.result ? e.target.result.value : null);
            req.onerror = e => reject(e);
        });
    }

    async function clear() {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e);
        });
    }

    return { setItem, getItem, clear };
})();
