// shared-data.js - Central data service for all pages
// This ensures all pages get the latest data

const RuviaData = {
    // Global event listeners
    listeners: [],
    
    // Notify all pages when data changes
    notifyChange: function(type, data) {
        this.listeners.forEach(listener => {
            if (listener.type === type) {
                listener.callback(data);
            }
        });
    },
    
    // Register a page to listen for changes
    addListener: function(type, callback) {
        this.listeners.push({ type, type, callback });
    },
    
    // Update stock and notify all pages
    updateStock: async function(productId, newStock) {
        try {
            const response = await fetch(`/api/products/${productId}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_stock: newStock })
            });
            const result = await response.json();
            if (result.success) {
                this.notifyChange('stock', { productId, newStock });
            }
            return result;
        } catch(e) {
            console.error('Stock update error:', e);
        }
    },
    
    // Update product and notify all pages
    updateProduct: async function(productId, data) {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.id) {
                this.notifyChange('product', result);
            }
            return result;
        } catch(e) {
            console.error('Product update error:', e);
        }
    }
};