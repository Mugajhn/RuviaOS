// add-darkmode-to-all.js
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
    'backup-dashboard.html'
];

const darkModeCode = `
    <!-- Dark Mode Support -->
    <link rel="stylesheet" href="darkmode.css">
    <script src="darkmode.js"></script>`;

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (!content.includes('darkmode.css')) {
            // Add after </title>
            if (content.includes('</title>')) {
                content = content.replace('</title>', `</title>${darkModeCode}`);
            } else if (content.includes('<head>')) {
                content = content.replace('<head>', `<head>${darkModeCode}`);
            }
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ Dark mode added to: ${file}`);
        } else {
            console.log(`⏩ Dark mode already in: ${file}`);
        }
    } else {
        console.log(`❌ File not found: ${file}`);
    }
});

console.log('\n🎉 Dark mode has been added to all pages!');
console.log('Go to http://localhost:3000 to see the new home page');