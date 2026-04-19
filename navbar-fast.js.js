// navbar-fast.js - Universal Fast Navbar Loader with Preload
(function() {
    'use strict';
    
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;
    
    // Check cache first (fastest)
    const cachedNavbar = sessionStorage.getItem('ruviaos-navbar');
    if (cachedNavbar) {
        navbarContainer.innerHTML = cachedNavbar;
        console.log('✅ Navbar loaded from cache');
        initNavbarButtons();
        return;
    }
    
    // Show skeleton instantly (no white flash)
    navbarContainer.innerHTML = `
        <div class="navbar-skeleton" style="background: linear-gradient(135deg, #1a3c34, #2c5f4a); height: 60px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🏨</span>
                <div><h3 style="margin:0; color:white;">RuviaOS Hotel</h3></div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 60px; height: 35px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
                <div style="width: 60px; height: 35px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
                <div style="width: 80px; height: 35px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
            </div>
        </div>
    `;
    
    // Fetch navbar (only happens once)
    fetch('navbar.html')
        .then(response => response.text())
        .then(html => {
            navbarContainer.innerHTML = html;
            sessionStorage.setItem('ruviaos-navbar', html);
            console.log('✅ Navbar fetched and cached');
            initNavbarButtons();
        })
        .catch(error => {
            console.error('Navbar error:', error);
        });
    
    function initNavbarButtons() {
        // Initialize dark mode button
        const darkBtn = document.getElementById('darkModeToggleBtn');
        if (darkBtn) {
            const isDark = localStorage.getItem('ruviaos-dark-mode') === 'enabled';
            darkBtn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
            darkBtn.onclick = function(e) {
                e.preventDefault();
                toggleDarkModeGlobal();
            };
        }
        
        // Initialize logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                localStorage.removeItem('ruviaos_logged_in');
                localStorage.removeItem('ruviaos_user');
                window.location.href = '/index.html';
            };
        }
    }
    
    function toggleDarkModeGlobal() {
        const isDark = !document.body.classList.contains('dark-mode');
        if (isDark) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('ruviaos-dark-mode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('ruviaos-dark-mode', 'disabled');
        }
        
        const darkBtn = document.getElementById('darkModeToggleBtn');
        if (darkBtn) {
            darkBtn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
        }
        
        window.dispatchEvent(new CustomEvent('darkmode-changed', { detail: { enabled: isDark } }));
    }
    
    // Apply saved dark mode
    if (localStorage.getItem('ruviaos-dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    
    window.toggleDarkMode = toggleDarkModeGlobal;
})();