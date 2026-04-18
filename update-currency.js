// update-currency.js - Run with: node update-currency.js
const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'frontdesk.html', 'pos.html', 'stock.html', 'housekeeping.html',
    'dashboard.html', 'reports.html', 'pms.html', 'backup-dashboard.html',
    'email-test.html'
];

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add currency.js if not present
        if (!content.includes('currency.js')) {
            content = content.replace('</head>', '<script src="currency.js"></script>\n</head>');
        }
        
        // Replace $ symbols with USh formatting
        // This is a basic replacement - you may need to adjust
        content = content.replace(/\$\{([^}]+)\}/g, 'RuviaCurrency.format($1)');
        content = content.replace(/\$(\d+)/g, 'USh $1');
        content = content.replace(/'\$'/g, "'USh'");
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${file}`);
    }
});

console.log('\n🎉 Currency updated to UGX (Ugandan Shillings)!');