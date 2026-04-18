// offline-backup.js - Offline Backup System for RuviaOS
// Run: node offline-backup.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');
const readline = require('readline');

// Configuration
const config = {
    // Source: Your PostgreSQL database
    database: {
        host: 'localhost',
        port: 5432,
        database: 'ruvia_hotel_db',
        user: 'postgres',
        password: ''  // Will be prompted or set in .env
    },
    
    // Backup locations (choose one or more)
    backupPaths: [
        // External USB drive (Windows example)
        'D:\\RuviaOS_Backups',
        'E:\\RuviaOS_Backups',
        // External USB drive (Mac example)
        '/Volumes/USB_DRIVE/RuviaOS_Backups',
        // Network drive (Windows)
        '\\\\192.168.1.100\\Shared\\RuviaOS_Backups',
        // Local secondary folder
        'C:\\Users\\Public\\RuviaOS_Backups'
    ],
    
    // Keep how many backups?
    keepBackups: 30,  // Keep last 30 backups
    
    // Backup schedule (in hours)
    scheduleHours: 24  // Daily backup
};

// Create backup directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
    }
}

// Get all available drives (Windows)
function getAvailableDrives() {
    if (process.platform === 'win32') {
        const drives = [];
        for (let i = 65; i <= 90; i++) {
            const drive = String.fromCharCode(i) + ':\\';
            if (fs.existsSync(drive)) {
                drives.push(drive);
            }
        }
        return drives;
    }
    return [];
}

// Detect external drives
function detectExternalDrives() {
    console.log('\n🔍 Detecting available drives...');
    
    if (process.platform === 'win32') {
        const drives = getAvailableDrives();
        const externalDrives = [];
        
        for (const drive of drives) {
            try {
                const stats = fs.statfsSync(drive);
                // Check if it's removable drive (D:, E:, etc. usually external)
                if (drive !== 'C:\\') {
                    externalDrives.push(drive);
                }
            } catch (e) {
                // Drive might be empty or not ready
            }
        }
        
        return externalDrives;
    } else {
        // Mac/Linux - check mounted volumes
        const volumes = [];
        try {
            const volumesDir = '/Volumes';
            if (fs.existsSync(volumesDir)) {
                const items = fs.readdirSync(volumesDir);
                for (const item of items) {
                    const volPath = path.join(volumesDir, item);
                    if (fs.statSync(volPath).isDirectory()) {
                        volumes.push(volPath);
                    }
                }
            }
        } catch (e) {}
        return volumes;
    }
}

// Create database backup
async function createDatabaseBackup(backupPath, backupName) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = backupName || `ruviaos_backup_${timestamp}`;
        const sqlFilePath = path.join(backupPath, `${fileName}.sql`);
        const zipFilePath = path.join(backupPath, `${fileName}.zip`);
        
        // Get password from environment or prompt
        const dbPassword = process.env.DB_PASSWORD || config.database.password;
        
        // Build pg_dump command
        const dumpCommand = `pg_dump --host=${config.database.host} --port=${config.database.port} --username=${config.database.user} --dbname=${config.database.database} --format=plain --file="${sqlFilePath}"`;
        
        const env = { ...process.env, PGPASSWORD: dbPassword };
        
        console.log(`📦 Creating backup: ${fileName}`);
        
        exec(dumpCommand, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Backup failed:', error);
                reject(error);
                return;
            }
            
            // Create zip file
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                // Clean up SQL file
                fs.unlinkSync(sqlFilePath);
                
                const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`✅ Backup created: ${fileName}.zip (${sizeMB} MB)`);
                
                resolve({
                    success: true,
                    filename: `${fileName}.zip`,
                    path: zipFilePath,
                    size: archive.pointer(),
                    size_mb: sizeMB,
                    timestamp: new Date().toISOString()
                });
            });
            
            output.on('error', (err) => reject(err));
            
            archive.pipe(output);
            archive.file(sqlFilePath, { name: `${fileName}.sql` });
            archive.finalize();
        });
    });
}

// Copy backup to multiple locations
async function copyBackupToLocations(backupFile, backupName) {
    const results = [];
    
    for (const location of config.backupPaths) {
        if (fs.existsSync(location)) {
            const destPath = path.join(location, backupName);
            try {
                fs.copyFileSync(backupFile, destPath);
                console.log(`📋 Copied to: ${destPath}`);
                results.push({ location, success: true });
            } catch (error) {
                console.log(`❌ Failed to copy to ${location}: ${error.message}`);
                results.push({ location, success: false, error: error.message });
            }
        } else {
            console.log(`⚠️ Location not available: ${location}`);
            results.push({ location, success: false, error: 'Location not found' });
        }
    }
    
    return results;
}

// Clean old backups (keep only recent ones)
function cleanOldBackups(backupPath, keepCount) {
    if (!fs.existsSync(backupPath)) return;
    
    const files = fs.readdirSync(backupPath)
        .filter(file => file.endsWith('.zip'))
        .map(file => ({
            name: file,
            path: path.join(backupPath, file),
            time: fs.statSync(path.join(backupPath, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);
    
    const toDelete = files.slice(keepCount);
    
    for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Deleted old backup: ${file.name}`);
    }
    
    console.log(`📊 ${files.length - toDelete.length} backups kept, ${toDelete.length} deleted`);
}

// Verify backup integrity
function verifyBackup(backupPath) {
    return new Promise((resolve) => {
        const AdmZip = require('adm-zip');
        
        try {
            const zip = new AdmZip(backupPath);
            const entries = zip.getEntries();
            
            // Check if it contains SQL file
            const hasSqlFile = entries.some(entry => entry.entryName.endsWith('.sql'));
            
            if (hasSqlFile) {
                console.log(`✅ Backup verified: ${path.basename(backupPath)}`);
                resolve({ valid: true });
            } else {
                console.log(`❌ Backup invalid: ${path.basename(backupPath)} (no SQL file)`);
                resolve({ valid: false });
            }
        } catch (error) {
            console.log(`❌ Backup verification failed: ${error.message}`);
            resolve({ valid: false });
        }
    });
}

// Restore from backup
async function restoreFromBackup(backupPath) {
    return new Promise((resolve, reject) => {
        const AdmZip = require('adm-zip');
        const tempDir = path.join(__dirname, 'temp_restore');
        
        // Create temp directory
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        try {
            // Extract zip
            const zip = new AdmZip(backupPath);
            zip.extractAllTo(tempDir, true);
            
            // Find SQL file
            const files = fs.readdirSync(tempDir);
            const sqlFile = files.find(f => f.endsWith('.sql'));
            
            if (!sqlFile) {
                throw new Error('No SQL file found in backup');
            }
            
            const sqlFilePath = path.join(tempDir, sqlFile);
            const dbPassword = process.env.DB_PASSWORD || config.database.password;
            
            // Restore using psql
            const restoreCommand = `psql --host=${config.database.host} --port=${config.database.port} --username=${config.database.user} --dbname=${config.database.database} --file="${sqlFilePath}"`;
            const env = { ...process.env, PGPASSWORD: dbPassword };
            
            console.log('🔄 Restoring database from backup...');
            
            exec(restoreCommand, { env }, (error, stdout, stderr) => {
                // Clean up temp directory
                fs.rmSync(tempDir, { recursive: true });
                
                if (error) {
                    console.error('❌ Restore failed:', error);
                    reject(error);
                } else {
                    console.log('✅ Database restored successfully!');
                    resolve({ success: true });
                }
            });
            
        } catch (error) {
            fs.rmSync(tempDir, { recursive: true });
            reject(error);
        }
    });
}

// Interactive menu
function showMenu() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           💾 RuviaOS Offline Backup Manager               ║
╠═══════════════════════════════════════════════════════════╣
║  1. Create backup to all locations                        ║
║  2. Create backup to specific drive                       ║
║  3. Restore from backup                                   ║
║  4. Verify backup integrity                               ║
║  5. List all backups                                      ║
║  6. Clean old backups                                     ║
║  7. Detect external drives                                ║
║  8. Setup automatic scheduled backups                     ║
║  9. Exit                                                  ║
╚═══════════════════════════════════════════════════════════╝
    `);
}

// List all backups
function listAllBackups() {
    console.log('\n📋 Available Backups:\n');
    
    for (const location of config.backupPaths) {
        if (fs.existsSync(location)) {
            console.log(`📍 ${location}:`);
            const files = fs.readdirSync(location)
                .filter(file => file.endsWith('.zip'))
                .map(file => {
                    const stats = fs.statSync(path.join(location, file));
                    return `   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${stats.mtime.toLocaleString()})`;
                });
            
            if (files.length === 0) {
                console.log('   (No backups found)');
            } else {
                files.forEach(f => console.log(f));
            }
            console.log('');
        }
    }
}

// Setup automatic scheduled backups
function setupScheduledBackups() {
    console.log(`
⏰ Setting up automatic scheduled backups...
   
This will add a scheduled task to run backups automatically.

For Windows: Creates a Task Scheduler task
For Mac/Linux: Creates a cron job

Press Ctrl+C to cancel, or wait 5 seconds to continue...
    `);
    
    setTimeout(() => {
        const scriptPath = path.join(__dirname, 'offline-backup.js');
        
        if (process.platform === 'win32') {
            // Windows Task Scheduler
            const taskName = 'RuviaOS_Backup';
            const cmd = `schtasks /create /tn "${taskName}" /tr "node ${scriptPath} --auto" /sc daily /st 02:00 /f`;
            
            console.log(`📅 Creating scheduled task: ${taskName}`);
            exec(cmd, (error) => {
                if (error) {
                    console.log('❌ Failed to create scheduled task. Run as Administrator?');
                } else {
                    console.log('✅ Scheduled backup created! Runs daily at 2:00 AM');
                }
            });
        } else {
            // Mac/Linux Cron
            const cronJob = `0 2 * * * cd ${__dirname} && node ${scriptPath} --auto >> ${__dirname}/backup.log 2>&1`;
            const cmd = `(crontab -l 2>/dev/null; echo "${cronJob}") | crontab -`;
            
            exec(cmd, (error) => {
                if (error) {
                    console.log('❌ Failed to create cron job');
                } else {
                    console.log('✅ Scheduled backup created! Runs daily at 2:00 AM');
                }
            });
        }
    }, 5000);
}

// Main function
async function main() {
    // Load environment variables
    require('dotenv').config();
    config.database.password = process.env.DB_PASSWORD || '';
    
    // Check for auto mode
    if (process.argv.includes('--auto')) {
        console.log('🤖 Running automatic backup...');
        const backupDir = config.backupPaths.find(p => fs.existsSync(p)) || __dirname;
        ensureDirectoryExists(backupDir);
        
        try {
            const backup = await createDatabaseBackup(backupDir);
            await copyBackupToLocations(backup.path, backup.filename);
            cleanOldBackups(backupDir, config.keepBackups);
            console.log('✅ Automatic backup completed');
        } catch (error) {
            console.error('❌ Automatic backup failed:', error);
        }
        return;
    }
    
    // Interactive mode
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, resolve);
        });
    }
    
    while (true) {
        showMenu();
        const choice = await askQuestion('\nSelect option (1-9): ');
        
        switch (choice) {
            case '1':
                // Create backup to all locations
                console.log('\n📦 Creating backup to all configured locations...\n');
                
                const availableLocation = config.backupPaths.find(p => fs.existsSync(p));
                if (!availableLocation) {
                    console.log('❌ No backup locations available. Please insert USB drive or configure network drive.');
                    break;
                }
                
                ensureDirectoryExists(availableLocation);
                const backup = await createDatabaseBackup(availableLocation);
                await copyBackupToLocations(backup.path, backup.filename);
                console.log('\n✅ Backup completed and copied to all available locations!');
                break;
                
            case '2':
                // Create backup to specific drive
                const drives = detectExternalDrives();
                console.log('\n💾 Available drives:');
                drives.forEach((drive, i) => console.log(`   ${i + 1}. ${drive}`));
                
                const driveChoice = await askQuestion('\nSelect drive number: ');
                const selectedDrive = drives[parseInt(driveChoice) - 1];
                
                if (selectedDrive) {
                    const backupPath = path.join(selectedDrive, 'RuviaOS_Backups');
                    ensureDirectoryExists(backupPath);
                    await createDatabaseBackup(backupPath);
                    console.log(`✅ Backup saved to ${backupPath}`);
                } else {
                    console.log('❌ Invalid selection');
                }
                break;
                
            case '3':
                // Restore from backup
                listAllBackups();
                const filename = await askQuestion('\nEnter backup filename to restore: ');
                
                // Find the file
                let backupPath = null;
                for (const location of config.backupPaths) {
                    const testPath = path.join(location, filename);
                    if (fs.existsSync(testPath)) {
                        backupPath = testPath;
                        break;
                    }
                }
                
                if (backupPath) {
                    const confirm = await askQuestion('⚠️ WARNING: This will replace ALL current data. Continue? (yes/no): ');
                    if (confirm.toLowerCase() === 'yes') {
                        await restoreFromBackup(backupPath);
                    }
                } else {
                    console.log('❌ Backup file not found');
                }
                break;
                
            case '4':
                // Verify backup
                listAllBackups();
                const verifyFile = await askQuestion('\nEnter backup filename to verify: ');
                
                let verifyPath = null;
                for (const location of config.backupPaths) {
                    const testPath = path.join(location, verifyFile);
                    if (fs.existsSync(testPath)) {
                        verifyPath = testPath;
                        break;
                    }
                }
                
                if (verifyPath) {
                    await verifyBackup(verifyPath);
                } else {
                    console.log('❌ Backup file not found');
                }
                break;
                
            case '5':
                listAllBackups();
                break;
                
            case '6':
                // Clean old backups
                for (const location of config.backupPaths) {
                    if (fs.existsSync(location)) {
                        console.log(`\n🧹 Cleaning ${location}...`);
                        cleanOldBackups(location, config.keepBackups);
                    }
                }
                break;
                
            case '7':
                // Detect external drives
                const externalDrives = detectExternalDrives();
                console.log('\n💾 Detected external drives:');
                if (externalDrives.length === 0) {
                    console.log('   No external drives detected');
                } else {
                    externalDrives.forEach(drive => console.log(`   📀 ${drive}`));
                }
                break;
                
            case '8':
                await setupScheduledBackups();
                break;
                
            case '9':
                console.log('\n👋 Goodbye!');
                rl.close();
                return;
                
            default:
                console.log('❌ Invalid option');
        }
        
        await askQuestion('\nPress Enter to continue...');
    }
}

// Run the program
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    createDatabaseBackup,
    restoreFromBackup,
    verifyBackup,
    listAllBackups,
    detectExternalDrives
};