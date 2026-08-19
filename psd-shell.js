/**
 * PSD Unified Navigation Shell v1.0
 * Injects shared header, sidebar, and breadcrumbs into each page
 */

(function() {
    'use strict';
    
    // ═══════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    const CONFIG = {
        appName: 'Performance Supply Depot',
        modules: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: '📊',
                href: 'psd_dashboard.html',
                children: [
                    { id: 'overview', label: 'Overview', href: 'psd_dashboard.html' },
                    { id: 'performance', label: 'Performance', href: 'psd_performance.html' },
                    { id: 'customers', label: 'Customers', href: 'psd_dashboard.html#customers' },
                    { id: 'contacts', label: 'Contacts', href: 'psd_dashboard.html#contacts' },
                    { id: 'forecast', label: 'Forecast', href: 'psd_dashboard.html#forecast' }
                ]
            },
            {
                id: 'performance',
                label: 'Performance',
                icon: '📈',
                href: 'psd_performance.html',
                children: []
            },
            {
                id: 'depotchaos',
                label: 'DepotChaos CRM',
                icon: '🏭',
                href: '/depotchaos/',
                external: true,
                children: []
            }
        ]
    };
    
    // ═══════════════════════════════════════════════════════════════════
    // DETECT CURRENT PAGE
    // ═══════════════════════════════════════════════════════════════════
    function getCurrentPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        if (path.includes('psd_dashboard')) {
            const tab = hash.replace('#', '') || 'overview';
            return { module: 'dashboard', page: tab };
        }
        if (path.includes('psd_performance')) {
            return { module: 'performance', page: 'performance' };
        }
        if (path.includes('depotchaos') || path.includes('psd_customer')) {
            return { module: 'depotchaos', page: 'crm' };
        }
        return { module: 'dashboard', page: 'overview' };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // BUILD SHELL HTML
    // ═══════════════════════════════════════════════════════════════════
    function buildShell() {
        const current = getCurrentPage();
        
        return `
            <div id="psd-shell" class="psd-shell">
                <!-- SIDEBAR -->
                <aside class="psd-sidebar" id="psd-sidebar">
                    <div class="psd-sidebar-header">
                        <div class="psd-logo">🏭</div>
                        <div class="psd-brand">
                            <div class="psd-brand-name">${CONFIG.appName}</div>
                            <div class="psd-brand-sub">Sales Intelligence</div>
                        </div>
                    </div>
                    
                    <nav class="psd-nav">
                        ${CONFIG.modules.map(mod => buildNavItem(mod, current)).join('')}
                    </nav>
                    
                    <div class="psd-sidebar-footer">
                        <div class="psd-status">
                            <span class="psd-status-dot online"></span>
                            <span>System Online</span>
                        </div>
                        <div class="psd-version">v2.1.0</div>
                    </div>
                </aside>
                
                <!-- MAIN CONTENT AREA -->
                <div class="psd-main">
                    <!-- TOP HEADER -->
                    <header class="psd-header">
                        <div class="psd-header-left">
                            <button class="psd-menu-toggle" id="psd-menu-toggle" title="Toggle Sidebar">
                                ☰
                            </button>
                            <div class="psd-breadcrumbs" id="psd-breadcrumbs">
                                ${buildBreadcrumbs(current)}
                            </div>
                        </div>
                        <div class="psd-header-right">
                            <div class="psd-quick-actions">
                                <button class="psd-btn-icon" title="Refresh" onclick="window.location.reload()">🔄</button>
                                <button class="psd-btn-icon" title="Help" onclick="alert('Help: Contact miles@myl0nr0s.cloud')">❓</button>
                            </div>
                            <div class="psd-user">
                                <span class="psd-user-name">Captain</span>
                                <span class="psd-user-avatar">👤</span>
                            </div>
                        </div>
                    </header>
                    
                    <!-- PAGE CONTENT SLOT -->
                    <main class="psd-content" id="psd-page-content">
                        <!-- Original page content will be moved here -->
                    </main>
                </div>
            </div>
        `;
    }
    
    function buildNavItem(module, current) {
        const isActive = module.id === current.module;
        const hasChildren = module.children && module.children.length > 0;
        const isExpanded = isActive && hasChildren;
        
        let html = `
            <div class="psd-nav-item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}">
                <a href="${module.href}" class="psd-nav-link" ${module.external ? 'target="_blank"' : ''}>
                    <span class="psd-nav-icon">${module.icon}</span>
                    <span class="psd-nav-label">${module.label}</span>
                    ${module.external ? '<span class="psd-nav-external">↗</span>' : ''}
                    ${hasChildren ? '<span class="psd-nav-chevron">▸</span>' : ''}
                </a>
        `;
        
        if (hasChildren) {
            html += `
                <div class="psd-nav-children" ${isExpanded ? 'style="display: block;"' : ''}>
                    ${module.children.map(child => {
                        const isChildActive = isActive && child.id === current.page;
                        return `
                            <a href="${child.href}" class="psd-nav-child ${isChildActive ? 'active' : ''}">
                                ${child.label}
                            </a>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    function buildBreadcrumbs(current) {
        const crumbs = [];
        const module = CONFIG.modules.find(m => m.id === current.module);
        
        if (module) {
            crumbs.push({ label: module.label, href: module.href });
            
            if (module.children) {
                const child = module.children.find(c => c.id === current.page);
                if (child && child.id !== module.children[0]?.id) {
                    crumbs.push({ label: child.label, href: child.href });
                }
            }
        }
        
        return crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return isLast 
                ? `<span class="psd-crumb-current">${crumb.label}</span>`
                : `<a href="${crumb.href}" class="psd-crumb-link">${crumb.label}</a><span class="psd-crumb-separator">›</span>`;
        }).join('');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INJECT STYLES
    // ═══════════════════════════════════════════════════════════════════
    function injectStyles() {
        if (document.getElementById('psd-shell-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'psd-shell-styles';
        styles.textContent = `
            /* ═══════════════════════════════════════════════════════════
               PSD UNIFIED SHELL STYLES
               ═══════════════════════════════════════════════════════════ */
            
            /* CSS Variables */
            :root {
                --psd-sidebar-width: 260px;
                --psd-sidebar-collapsed: 70px;
                --psd-header-height: 64px;
                --psd-bg-dark: #1a1a2e;
                --psd-bg-card: rgba(255, 255, 255, 0.05);
                --psd-primary: #e94560;
                --psd-primary-dark: #0f3460;
                --psd-text: #e0e0e0;
                --psd-text-muted: #a0a0a0;
                --psd-border: rgba(255, 255, 255, 0.1);
                --psd-transition: all 0.3s ease;
            }
            
            /* Reset body for shell */
            body {
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
            
            /* Shell Container */
            .psd-shell {
                display: flex;
                height: 100vh;
                width: 100vw;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: var(--psd-text);
            }
            
            /* ═══════════════════════════════════════════════════════════
               SIDEBAR
               ═══════════════════════════════════════════════════════════ */
            .psd-sidebar {
                width: var(--psd-sidebar-width);
                background: linear-gradient(180deg, #0f3460 0%, #16213e 100%);
                border-right: 1px solid var(--psd-border);
                display: flex;
                flex-direction: column;
                transition: var(--psd-transition);
                overflow-y: auto;
                overflow-x: hidden;
            }
            
            .psd-sidebar.collapsed {
                width: var(--psd-sidebar-collapsed);
            }
            
            .psd-sidebar-header {
                padding: 24px 20px;
                border-bottom: 1px solid var(--psd-border);
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .psd-logo {
                font-size: 32px;
                line-height: 1;
            }
            
            .psd-brand-name {
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                white-space: nowrap;
            }
            
            .psd-brand-sub {
                font-size: 11px;
                color: var(--psd-text-muted);
                white-space: nowrap;
            }
            
            .psd-sidebar.collapsed .psd-brand {
                display: none;
            }
            
            /* Navigation */
            .psd-nav {
                flex: 1;
                padding: 16px 12px;
            }
            
            .psd-nav-item {
                margin-bottom: 4px;
            }
            
            .psd-nav-link {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: 8px;
                color: var(--psd-text-muted);
                text-decoration: none;
                transition: var(--psd-transition);
                cursor: pointer;
            }
            
            .psd-nav-link:hover {
                background: rgba(233, 69, 96, 0.1);
                color: #fff;
            }
            
            .psd-nav-item.active > .psd-nav-link {
                background: rgba(233, 69, 96, 0.2);
                color: #fff;
                border-left: 3px solid var(--psd-primary);
            }
            
            .psd-nav-icon {
                font-size: 18px;
                width: 24px;
                text-align: center;
            }
            
            .psd-nav-label {
                flex: 1;
                font-size: 14px;
                white-space: nowrap;
            }
            
            .psd-sidebar.collapsed .psd-nav-label,
            .psd-sidebar.collapsed .psd-nav-chevron,
            .psd-sidebar.collapsed .psd-nav-external {
                display: none;
            }
            
            .psd-nav-external {
                font-size: 12px;
                opacity: 0.6;
            }
            
            .psd-nav-chevron {
                font-size: 10px;
                transition: transform 0.2s;
            }
            
            .psd-nav-item.expanded .psd-nav-chevron {
                transform: rotate(90deg);
            }
            
            /* Nav Children */
            .psd-nav-children {
                display: none;
                padding-left: 20px;
                margin-top: 4px;
            }
            
            .psd-nav-child {
                display: block;
                padding: 8px 16px;
                border-radius: 6px;
                color: var(--psd-text-muted);
                text-decoration: none;
                font-size: 13px;
                margin-bottom: 2px;
                transition: var(--psd-transition);
            }
            
            .psd-nav-child:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.05);
            }
            
            .psd-nav-child.active {
                color: var(--psd-primary);
                background: rgba(233, 69, 96, 0.1);
            }
            
            /* Sidebar Footer */
            .psd-sidebar-footer {
                padding: 16px;
                border-top: 1px solid var(--psd-border);
                font-size: 12px;
                color: var(--psd-text-muted);
            }
            
            .psd-status {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .psd-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .psd-status-dot.online {
                background: #4ade80;
                box-shadow: 0 0 8px #4ade80;
            }
            
            .psd-version {
                text-align: center;
                opacity: 0.6;
            }
            
            .psd-sidebar.collapsed .psd-sidebar-footer {
                display: none;
            }
            
            /* ═══════════════════════════════════════════════════════════
               MAIN CONTENT AREA
               ═══════════════════════════════════════════════════════════ */
            .psd-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            /* Header */
            .psd-header {
                height: var(--psd-header-height);
                background: linear-gradient(90deg, #0f3460 0%, #16213e 100%);
                border-bottom: 3px solid var(--psd-primary);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 24px;
            }
            
            .psd-header-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .psd-menu-toggle {
                background: none;
                border: none;
                color: var(--psd-text);
                font-size: 20px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: var(--psd-transition);
            }
            
            .psd-menu-toggle:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .psd-breadcrumbs {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .psd-crumb-link {
                color: var(--psd-text-muted);
                text-decoration: none;
                transition: var(--psd-transition);
            }
            
            .psd-crumb-link:hover {
                color: #fff;
            }
            
            .psd-crumb-separator {
                color: var(--psd-text-muted);
                margin: 0 4px;
            }
            
            .psd-crumb-current {
                color: #fff;
                font-weight: 500;
            }
            
            .psd-header-right {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .psd-quick-actions {
                display: flex;
                gap: 8px;
            }
            
            .psd-btn-icon {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--psd-border);
                border-radius: 6px;
                color: var(--psd-text);
                padding: 8px 12px;
                cursor: pointer;
                font-size: 14px;
                transition: var(--psd-transition);
            }
            
            .psd-btn-icon:hover {
                background: rgba(233, 69, 96, 0.2);
                border-color: var(--psd-primary);
            }
            
            .psd-user {
                display: flex;
                align-items: center;
                gap: 12px;
                padding-left: 16px;
                border-left: 1px solid var(--psd-border);
            }
            
            .psd-user-name {
                font-size: 14px;
                color: var(--psd-text);
            }
            
            .psd-user-avatar {
                font-size: 24px;
            }
            
            /* Content Area */
            .psd-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }
            
            /* Scrollbar Styling */
            .psd-content::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            .psd-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .psd-content::-webkit-scrollbar-thumb {
                background: rgba(233, 69, 96, 0.3);
                border-radius: 4px;
            }
            
            .psd-content::-webkit-scrollbar-thumb:hover {
                background: rgba(233, 69, 96, 0.5);
            }
            
            /* ═══════════════════════════════════════════════════════════
               RESPONSIVE
               ═══════════════════════════════════════════════════════════ */
            @media (max-width: 768px) {
                .psd-sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    height: 100vh;
                    z-index: 1000;
                    transform: translateX(-100%);
                }
                
                .psd-sidebar.open {
                    transform: translateX(0);
                }
                
                .psd-sidebar.collapsed {
                    width: var(--psd-sidebar-width);
                }
                
                .psd-sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                }
                
                .psd-sidebar-overlay.open {
                    display: block;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZE SHELL
    // ═══════════════════════════════════════════════════════════════════
    function init() {
        // Don't initialize if already done
        if (document.getElementById('psd-shell')) return;
        
        // Inject styles
        injectStyles();
        
        // Capture original body content
        const originalBody = document.body;
        const originalScripts = Array.from(originalBody.querySelectorAll('script'));
        const originalContent = originalBody.innerHTML;
        
        // Build and inject shell
        document.body.innerHTML = buildShell();
        
        // Move original content into the content slot
        const contentSlot = document.getElementById('psd-page-content');
        if (contentSlot) {
            contentSlot.innerHTML = originalContent;
            
            // Re-execute inline scripts in content slot
            const scripts = contentSlot.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                // Copy attributes
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            // Dispatch event to notify scripts that shell is ready
            document.dispatchEvent(new Event('psd-shell-ready'));
        }
        
        // Setup interactions
        setupInteractions();
        
        // Mark as initialized
        console.log('🎛️ PSD Shell initialized for:', getCurrentPage());
    }
    
    function setupInteractions() {
        // Menu toggle
        const toggle = document.getElementById('psd-menu-toggle');
        const sidebar = document.getElementById('psd-sidebar');
        
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('psd-sidebar-collapsed', sidebar.classList.contains('collapsed'));
            });
            
            // Restore collapsed state
            if (localStorage.getItem('psd-sidebar-collapsed') === 'true') {
                sidebar.classList.add('collapsed');
            }
        }
        
        // Parent nav items with children
        document.querySelectorAll('.psd-nav-item.has-children').forEach(item => {
            const link = item.querySelector('.psd-nav-link');
            if (link) {
                link.addEventListener('click', (e) => {
                    if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
                        e.preventDefault();
                    }
                    item.classList.toggle('expanded');
                });
            }
        });
        
        // Mobile overlay
        if (window.innerWidth <= 768) {
            const overlay = document.createElement('div');
            overlay.className = 'psd-sidebar-overlay';
            overlay.id = 'psd-sidebar-overlay';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
            });
            
            if (toggle) {
                toggle.addEventListener('click', () => {
                    sidebar.classList.toggle('open');
                    overlay.classList.toggle('open');
                });
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // AUTO-INIT
    // ═══════════════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose to global for manual re-init
    window.PSDShell = { init, getCurrentPage, CONFIG };
    
})();
