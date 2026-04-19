// add-dark-mode-to-all.js
// Run this script to add dark mode to all HTML files
// Usage: node add-dark-mode-to-all.js

const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'frontdesk.html',
    'pos.html', 
    'stock.html',
    'housekeeping.html',
    'dashboard.html',
    'reports.html',
    'pms.html',
    'backup-dashboard.html',
    'email-test.html'
];

const darkModeLinks = `
    <!-- Dark Mode Support -->
    <link rel="stylesheet" href="dark-mode.css">
    <script src="dark-mode.js"></script>`;

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if dark mode already added
        if (!content.includes('dark-mode.css')) {
            // Add after </title> or in head section
            if (content.includes('</title>')) {
                content = content.replace('</title>', `</title>${darkModeLinks}`);
            } else if (content.includes('<head>')) {
                content = content.replace('<head>', `<head>${darkModeLinks}`);
            }
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ Dark mode added to: ${file}`);
        } else {
            console.log(`⏩ Dark mode already exists in: ${file}`);
        }
    } else {
        console.log(`❌ File not found: ${file}`);
    }
});

console.log('\n🎉 Done! Dark mode has been added to all HTML files.');
console.log('Restart your server and refresh the pages to see dark mode toggle.');