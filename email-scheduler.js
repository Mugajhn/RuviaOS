// email-scheduler.js - Automated email scheduler for RuviaOS
// Run this as a separate process: node email-scheduler.js

const { Pool } = require('pg');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ruvia_hotel_db',
    password: 'your_password_here', // Change this
    port: 5432,
});

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function sendEmail(to, subject, htmlContent) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"RuviaOS Hotel" <noreply@ruviaos.com>',
            to: to,
            subject: subject,
            html: htmlContent
        });
        console.log(`✅ Email sent to ${to}`);
        return true;
    } catch (error) {
        console.log(`❌ Failed to send email to ${to}:`, error.message);
        return false;
    }
}

// Send check-in reminders for tomorrow's arrivals
async function sendCheckinReminders() {
    const result = await pool.query(`
        SELECT 
            r.reservation_number,
            g.email,
            g.full_name,
            rm.room_number,
            r.check_in
        FROM reservations r
        JOIN guests g ON r.guest_id = g.id
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.check_in = CURRENT_DATE + INTERVAL '1 day'
        AND r.status = 'confirmed'
        AND g.email IS NOT NULL
    `);
    
    for (const guest of result.rows) {
        const html = `
            <h2>See You Tomorrow at RuviaOS Hotel!</h2>
            <p>Dear ${guest.full_name},</p>
            <p>We're excited to welcome you tomorrow. Your room ${guest.room_number} will be ready at 2:00 PM.</p>
            <p>Please bring your ID and confirmation number: ${guest.reservation_number}</p>
            <p>Safe travels!</p>
        `;
        await sendEmail(guest.email, `Check-in Reminder - Tomorrow`, html);
    }
    console.log(`📧 Sent ${result.rows.length} check-in reminders`);
}

// Send thank you emails to today's checkouts
async function sendThankYouEmails() {
    const result = await pool.query(`
        SELECT 
            g.email,
            g.full_name,
            rm.room_number,
            r.check_out
        FROM reservations r
        JOIN guests g ON r.guest_id = g.id
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.check_out = CURRENT_DATE
        AND r.status = 'checked-out'
        AND g.email IS NOT NULL
    `);
    
    for (const guest of result.rows) {
        const html = `
            <h2>Thank You for Staying at RuviaOS Hotel!</h2>
            <p>Dear ${guest.full_name},</p>
            <p>Thank you for choosing us. We hope you enjoyed your stay in Room ${guest.room_number}.</p>
            <p>We look forward to welcoming you again soon!</p>
            <p>Use code <strong>WELCOMEBACK10</strong> for 10% off your next stay.</p>
        `;
        await sendEmail(guest.email, `Thank You for Staying with Us`, html);
    }
    console.log(`📧 Sent ${result.rows.length} thank you emails`);
}

// Send low stock alerts to manager
async function sendLowStockAlerts() {
    const lowStock = await pool.query(`
        SELECT name, current_stock, reorder_level, location
        FROM products
        WHERE current_stock <= reorder_level AND is_active = true
    `);
    
    if (lowStock.rows.length > 0 && process.env.MANAGER_EMAIL) {
        const itemsHtml = lowStock.rows.map(item => `
            <tr><td>${item.name}</td><td>${item.current_stock}</td><td>${item.reorder_level}</td></tr>
        `).join('');
        
        const html = `
            <h2>⚠️ Low Stock Alert</h2>
            <p>The following items need reordering:</p>
            <table border="1"><tr><th>Product</th><th>Stock</th><th>Reorder Level</th></tr>${itemsHtml}</table>
        `;
        await sendEmail(process.env.MANAGER_EMAIL, `Low Stock Alert - ${lowStock.rows.length} Items`, html);
    }
    console.log(`📧 Low stock alert: ${lowStock.rows.length} items`);
}

// Run all automated tasks
async function runDailyTasks() {
    console.log('🚀 Running daily email tasks...', new Date().toLocaleString());
    await sendCheckinReminders();
    await sendThankYouEmails();
    await sendLowStockAlerts();
    console.log('✅ Daily email tasks completed');
}

// Run once on startup, then daily at 9:00 AM
runDailyTasks();
setInterval(runDailyTasks, 24 * 60 * 60 * 1000);

console.log('📧 Email scheduler running. Will send daily notifications at 9:00 AM');