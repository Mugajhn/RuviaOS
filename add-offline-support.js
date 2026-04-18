// add-offline-support.js - Automatically add offline support to all HTML files
// Run with: node add-offline-support.js

const fs = require('fs');
const path = require('path');

// List of HTML files to update
const htmlFiles = [
    'index.html',
    'frontdesk.html', 
    'pos.html',
    'dashboard.html',
    'stock.html',
    'housekeeping.html',
    'tables.html',
    'reports.html',
    'menu-management.html',
    'backup-dashboard.html',
    'pms.html',
    'staff.html',
    'offline-dashboard.html'
];

// Code to add to <head> section
const offlineHeadCode = `
    <!-- Offline-First Support -->
    <script src="offline-core.js"></script>
    <script src="offline-api.js"></script>`;

// Code to add after <body> (for status bar)
const offlineBodyCode = `
    <!-- Offline Status Bar -->
    <div id="offlineStatusContainer"></div>
    <script>
        fetch('offline-status.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('offlineStatusContainer').innerHTML = data;
            });
    </script>`;

// Code to add AI offline fallback to dashboard
const aiOfflineCode = `
    // AI offline fallback
    if (!navigator.onLine) {
        const aiGrid = document.getElementById('aiGrid');
        if (aiGrid) {
            aiGrid.innerHTML = '<div class="ai-card"><h3>📡 Offline Mode</h3><p>AI predictions require internet connection. Will update automatically when connection is restored.</p></div>';
        }
    }
    
    // Listen for online event to reload AI
    window.addEventListener('online', () => {
        if (typeof loadAIPredictions === 'function') {
            loadAIPredictions();
        }
    });`;

// Function to update a file
function updateFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if offline support already added
    if (content.includes('offline-core.js')) {
        console.log(`⏩ Offline support already in: ${filePath}`);
        return true;
    }
    
    // Add to <head> section
    if (content.includes('</head>')) {
        content = content.replace('</head>', `${offlineHeadCode}\n</head>`);
        modified = true;
        console.log(`✅ Added offline scripts to <head> in: ${filePath}`);
    } else if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>${offlineHeadCode}`);
        modified = true;
        console.log(`✅ Added offline scripts to <head> in: ${filePath}`);
    }
    
    // Add status bar after <body>
    if (content.includes('<body>')) {
        content = content.replace('<body>', `<body>\n${offlineBodyCode}`);
        modified = true;
        console.log(`✅ Added offline status bar to: ${filePath}`);
    }
    
    // Special handling for dashboard.html - add AI offline fallback
    if (filePath.includes('dashboard.html')) {
        // Find the script section
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            const scriptContent = scriptMatch[1];
            if (!scriptContent.includes('AI offline fallback')) {
                // Add before the closing </script>
                content = content.replace('</script>', `${aiOfflineCode}\n</script>`);
                modified = true;
                console.log(`✅ Added AI offline fallback to: ${filePath}`);
            }
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`💾 Saved: ${filePath}`);
        return true;
    }
    
    console.log(`⚠️ No changes made to: ${filePath}`);
    return false;
}

// Create offline core files if they don't exist
function createOfflineFiles() {
    // Check if offline-core.js exists
    if (!fs.existsSync('offline-core.js')) {
        console.log('⚠️ offline-core.js not found. Please create it first.');
        return false;
    }
    
    // Check if offline-api.js exists
    if (!fs.existsSync('offline-api.js')) {
        console.log('⚠️ offline-api.js not found. Please create it first.');
        return false;
    }
    
    // Check if offline-status.html exists
    if (!fs.existsSync('offline-status.html')) {
        console.log('⚠️ offline-status.html not found. Please create it first.');
        return false;
    }
    
    return true;
}

// Main function
async function main() {
    console.log('\n========================================');
    console.log('🔧 RuviaOS - Offline Support Auto-Installer');
    console.log('========================================\n');
    
    // Check for required files
    if (!createOfflineFiles()) {
        console.log('\n❌ Please create offline-core.js, offline-api.js, and offline-status.html first.');
        console.log('   Then run this script again.\n');
        return;
    }
    
    // Update each HTML file
    let successCount = 0;
    for (const file of htmlFiles) {
        const filePath = path.join(__dirname, file);
        if (updateFile(filePath)) {
            successCount++;
        }
    }
    
    console.log('\n========================================');
    console.log(`✅ Complete! ${successCount} files updated.`);
    console.log('========================================');
    console.log('\n📡 Offline support added to all pages!');
    console.log('   - Offline status bar will appear on all pages');
    console.log('   - Data will be cached locally');
    console.log('   - Auto-sync when internet returns');
    console.log('\n💡 Restart your server: node server.js');
    console.log('========================================\n');
}

// Run the script
main().catch(console.error);