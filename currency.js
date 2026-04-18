// RuviaOS - Currency Formatting (Ugandan Shillings)
// Place this file in the root directory

const RuviaCurrency = {
    // Format number as UGX
    format: function(amount) {
        if (amount === undefined || amount === null) return 'USh 0';
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return 'USh 0';
        return 'USh ' + num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    },
    
    // Format with decimals (for precise calculations)
    formatPrecise: function(amount) {
        if (amount === undefined || amount === null) return 'USh 0.00';
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return 'USh 0.00';
        return 'USh ' + num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    // Parse string to number
    parse: function(formattedString) {
        if (!formattedString) return 0;
        const cleaned = formattedString.replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
    },
    
    // Add two amounts
    add: function(a, b) {
        return (this.parse(a) + this.parse(b));
    },
    
    // Subtract two amounts
    subtract: function(a, b) {
        return (this.parse(a) - this.parse(b));
    },
    
    // Get symbol
    getSymbol: function() {
        return 'USh';
    },
    
    // Get code
    getCode: function() {
        return 'UGX';
    }
};

// Make available globally
window.RuviaCurrency = RuviaCurrency;

// Also provide a shorthand
window.formatMoney = RuviaCurrency.format;