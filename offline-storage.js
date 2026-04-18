// offline-storage.js - Offline-First Data Manager for RuviaOS
// This file handles local storage when internet is unavailable

class OfflineStorageManager {
    constructor() {
        this.dbName = 'RuviaOS_OfflineDB';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        this.pendingSync = [];
        this.init();
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Offline storage ready');
                this.startAutoSync();
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores for different data types
                if (!db.objectStoreNames.contains('rooms')) {
                    db.createObjectStore('rooms', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('guests')) {
                    db.createObjectStore('guests', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('reservations')) {
                    db.createObjectStore('reservations', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('transactions')) {
                    db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('pending_sync')) {
                    const pendingStore = db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
                    pendingStore.createIndex('type', 'type', { unique: false });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Save data to local storage
    async save(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => {
                console.log(`✅ Saved to ${storeName}:`, data.id || data);
                resolve(data);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Get all data from local storage
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // Get single item by ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete data from local storage
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Clear all data from a store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Add to pending sync queue
    async addToPendingSync(type, data, endpoint) {
        const pendingItem = {
            type: type,
            data: data,
            endpoint: endpoint,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        return this.save('pending_sync', pendingItem);
    }

    // Get all pending sync items
    async getPendingSync() {
        return this.getAll('pending_sync');
    }

    // Remove from pending sync after successful sync
    async removeFromPendingSync(id) {
        return this.delete('pending_sync', id);
    }

    // Sync pending data to server
    async syncToServer() {
        if (!this.isOnline) {
            console.log('📡 Offline: Cannot sync, waiting for internet');
            return { synced: 0, pending: await this.getPendingSyncCount() };
        }
        
        const pendingItems = await this.getPendingSync();
        let synced = 0;
        
        for (const item of pendingItems) {
            try {
                const response = await fetch(item.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data)
                });
                
                if (response.ok) {
                    await this.removeFromPendingSync(item.id);
                    synced++;
                    console.log(`✅ Synced: ${item.type}`);
                } else if (item.retryCount < 3) {
                    item.retryCount++;
                    await this.save('pending_sync', item);
                }
            } catch (error) {
                console.error(`Failed to sync ${item.type}:`, error);
                if (item.retryCount < 3) {
                    item.retryCount++;
                    await this.save('pending_sync', item);
                }
            }
        }
        
        console.log(`📡 Sync complete: ${synced} items synced, ${pendingItems.length - synced} pending`);
        return { synced, pending: pendingItems.length - synced };
    }

    // Get count of pending sync items
    async getPendingSyncCount() {
        const items = await this.getPendingSync();
        return items.length;
    }

    // Save application settings
    async saveSetting(key, value) {
        return this.save('settings', { key: key, value: value });
    }

    // Get application setting
    async getSetting(key, defaultValue = null) {
        const setting = await this.get('settings', key);
        return setting ? setting.value : defaultValue;
    }

    // Auto-save draft (for forms)
    async saveDraft(formId, data) {
        return this.save('drafts', { id: formId, data: data, timestamp: Date.now() });
    }

    // Load draft
    async loadDraft(formId) {
        return this.get('drafts', formId);
    }

    // Start auto-sync (every 30 seconds when online)
    startAutoSync() {
        setInterval(async () => {
            if (this.isOnline) {
                const pending = await this.getPendingSyncCount();
                if (pending > 0) {
                    console.log(`📡 Auto-sync: ${pending} items pending`);
                    await this.syncToServer();
                }
            }
        }, 30000);
    }

    // Check online status
    updateOnlineStatus() {
        this.isOnline = navigator.onLine;
        if (this.isOnline) {
            console.log('🌐 Internet connected - will sync data');
            this.syncToServer();
        } else {
            console.log('📡 Offline mode - saving locally');
        }
        
        // Dispatch event for UI to react
        window.dispatchEvent(new CustomEvent('online-status-changed', { 
            detail: { isOnline: this.isOnline } 
        }));
    }

    // Get sync status for UI
    async getSyncStatus() {
        const pending = await this.getPendingSyncCount();
        return {
            isOnline: this.isOnline,
            pendingSyncCount: pending,
            lastSync: await this.getSetting('lastSync', null)
        };
    }
}

// Create global instance
const offlineStorage = new OfflineStorageManager();

// Listen for online/offline events
window.addEventListener('online', () => offlineStorage.updateOnlineStatus());
window.addEventListener('offline', () => offlineStorage.updateOnlineStatus());

// Make available globally
window.offlineStorage = offlineStorage;

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = offlineStorage;
}