// RuviaOS - Offline API Handler
// Wraps fetch calls with offline support

const API_BASE = 'http://localhost:3000';

const OfflineAPI = {
    // GET request with cache
    async get(endpoint) {
        const url = endpoint.startsWith('http') ? endpoint : API_BASE + endpoint;
        try {
            return await RuviaOffline.fetchWithCache(url);
        } catch (error) {
            console.error('GET failed:', endpoint, error);
            throw error;
        }
    },
    
    // POST request (queues if offline)
    async post(endpoint, data) {
        const url = endpoint.startsWith('http') ? endpoint : API_BASE + endpoint;
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
        
        if (!RuviaOffline.isOnline()) {
            // Queue for later
            RuviaOffline.queueRequest(url, options);
            return { success: true, queued: true, message: 'Saved offline, will sync when online' };
        }
        
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            // Queue if failed
            RuviaOffline.queueRequest(url, options);
            return { success: true, queued: true, message: 'Request queued for later sync' };
        }
    },
    
    // PUT request
    async put(endpoint, data) {
        const url = endpoint.startsWith('http') ? endpoint : API_BASE + endpoint;
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
        
        if (!RuviaOffline.isOnline()) {
            RuviaOffline.queueRequest(url, options);
            return { success: true, queued: true };
        }
        
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            RuviaOffline.queueRequest(url, options);
            return { success: true, queued: true };
        }
    },
    
    // DELETE request
    async delete(endpoint) {
        const url = endpoint.startsWith('http') ? endpoint : API_BASE + endpoint;
        const options = { method: 'DELETE' };
        
        if (!RuviaOffline.isOnline()) {
            RuviaOffline.queueRequest(url, options);
            return { success: true, queued: true };
        }
        
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            RuviaOffline.queueRequest(url, options);
            return { success: true, queued: true };
        }
    }
};

// Make available globally
window.OfflineAPI = OfflineAPI;