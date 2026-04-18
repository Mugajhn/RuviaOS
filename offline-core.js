// RuviaOS - Offline Core Library
// Provides offline-first functionality

const RuviaOffline = (function() {
    // Storage keys
    const STORAGE_KEYS = {
        PENDING_REQUESTS: 'ruvia_pending_requests',
        CACHED_DATA: 'ruvia_cached_data',
        LAST_SYNC: 'ruvia_last_sync',
        OFFLINE_MODE: 'ruvia_offline_mode'
    };
    
    // Cache expiration (24 hours)
    const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
    
    // Check if online
    function isOnline() {
        return navigator.onLine;
    }
    
    // Update offline status UI
    function updateOfflineStatus() {
        const statusBar = document.getElementById('offlineStatusBar');
        if (statusBar) {
            if (!isOnline()) {
                statusBar.style.display = 'block';
                statusBar.innerHTML = '⚠️ You are offline. Changes will sync when connection returns.';
            } else {
                statusBar.style.display = 'none';
            }
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('onlineStatusChanged', { 
            detail: { online: isOnline() } 
        }));
    }
    
    // Cache API response
    async function cacheData(endpoint, data) {
        const cached = getCachedData();
        cached[endpoint] = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached));
        return data;
    }
    
    // Get cached data
    function getCachedData() {
        const cached = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
        return cached ? JSON.parse(cached) : {};
    }
    
    // Get fresh or cached data
    async function fetchWithCache(endpoint, options = {}) {
        const cacheKey = `${options.method || 'GET'}:${endpoint}`;
        const cached = getCachedData();
        
        if (!isOnline()) {
            // Return cached data if offline
            if (cached[cacheKey]) {
                return cached[cacheKey].data;
            }
            throw new Error('Offline and no cached data available');
        }
        
        try {
            const response = await fetch(endpoint, options);
            if (response.ok) {
                const data = await response.json();
                cacheData(cacheKey, data);
                return data;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (cached[cacheKey]) {
                console.warn('Using cached data for:', endpoint);
                return cached[cacheKey].data;
            }
            throw error;
        }
    }
    
    // Queue request for later sync
    function queueRequest(endpoint, options) {
        const pending = getPendingRequests();
        pending.push({
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            endpoint: endpoint,
            options: options,
            timestamp: Date.now()
        });
        localStorage.setItem(STORAGE_KEYS.PENDING_REQUESTS, JSON.stringify(pending));
    }
    
    // Get pending requests
    function getPendingRequests() {
        const pending = localStorage.getItem(STORAGE_KEYS.PENDING_REQUESTS);
        return pending ? JSON.parse(pending) : [];
    }
    
    // Sync pending requests
    async function syncPendingRequests() {
        if (!isOnline()) return;
        
        const pending = getPendingRequests();
        if (pending.length === 0) return;
        
        console.log(`Syncing ${pending.length} pending requests...`);
        
        for (const req of pending) {
            try {
                const response = await fetch(req.endpoint, req.options);
                if (response.ok) {
                    // Remove from queue
                    const updated = getPendingRequests().filter(r => r.id !== req.id);
                    localStorage.setItem(STORAGE_KEYS.PENDING_REQUESTS, JSON.stringify(updated));
                    console.log('Synced:', req.endpoint);
                }
            } catch (error) {
                console.error('Sync failed for:', req.endpoint, error);
            }
        }
        
        // Update last sync time
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    }
    
    // Initialize offline support
    function init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            updateOfflineStatus();
            syncPendingRequests();
        });
        window.addEventListener('offline', updateOfflineStatus);
        
        // Initial status
        updateOfflineStatus();
        
        // Auto-sync every 30 seconds when online
        setInterval(() => {
            if (isOnline()) {
                syncPendingRequests();
            }
        }, 30000);
    }
    
    // Public API
    return {
        init: init,
        isOnline: isOnline,
        fetchWithCache: fetchWithCache,
        queueRequest: queueRequest,
        syncPendingRequests: syncPendingRequests,
        getPendingCount: () => getPendingRequests().length
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RuviaOffline.init());
} else {
    RuviaOffline.init();
}