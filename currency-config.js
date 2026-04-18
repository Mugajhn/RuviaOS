// RuviaOS - Currency Configuration
// Central file for currency settings

const CURRENCY_CONFIG = {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    exchangeRate: 3800, // 1 USD = 3800 UGX
    decimalPlaces: 0,
    thousandsSeparator: ',',
    format: '{symbol} {amount}'
};

// Format amount to currency string
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'USh 0';
    
    const formattedAmount = Math.round(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return `USh ${formattedAmount}`;
}

// Convert from USD to UGX
function usdToUgx(usdAmount) {
    return usdAmount * CURRENCY_CONFIG.exchangeRate;
}

// Convert from UGX to USD
function ugxToUsd(ugxAmount) {
    return ugxAmount / CURRENCY_CONFIG.exchangeRate;
}

// For use in HTML templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CURRENCY_CONFIG, formatCurrency, usdToUgx, ugxToUsd };
}