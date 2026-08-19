// CREAM Web Application
// Comprehensive Real Estate Agent Management

class CreamApp {
    constructor() {
        this.currentPage = 'home';
        this.data = {
            tasks: [
                { id: 1, text: 'Follow up with 3 leads', completed: false },
                { id: 2, text: 'Send farming letter', completed: false }
            ],
            leads: [
                { id: 45, name: 'John Smith', status: 'Hot', source: 'Website', phone: '555-0101' },
                { id: 46, name: 'Sarah Johnson', status: 'Warm', source: 'Referral', phone: '555-0102' },
                { id: 47, name: 'Mike Brown', status: 'Cold', source: 'Cold Call', phone: '555-0103' }
            ],
            appointments: [
                { id: 1, name: 'Jane Doe', time: '2:00 PM', date: '2026-06-02', status: 'Scheduled' },
                { id: 2, name: 'Bob Wilson', time: '4:30 PM', date: '2026-06-02', status: 'Confirmed' }
            ],
            metrics: {
                leads: 50,
                appts: 5,
                conversion: 18,
                revenue: 42500
            },
            goals: [
                { name: 'Add 50 leads', progress: 67, target: 50, current: 33 },
                { name: 'Close 10 deals', progress: 75, target: 10, current: 7 },
                { name: 'Launch 3 campaigns', progress: 33, target: 3, current: 1 }
            ]
        };
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadPage('home');
    }

    cacheElements() {
        this.menuToggle = document.getElementById('menuToggle');
        this.closeMenu = document.getElementById('closeMenu');
        this.sideMenu = document.getElementById('sideMenu');
        this.overlay = document.getElementById('overlay');
        this.content = document.getElementById('content');
        this.menuItems = document.querySelectorAll('.menu-list li');
        this.navItems = document.querySelectorAll('.nav-item');
    }

    bindEvents() {
        // Menu toggle
        this.menuToggle.addEventListener('click', () => this.openMenu());
        this.closeMenu.addEventListener('click', () => this.closeMenuPanel());
        this.overlay.addEventListener('click', () => this.closeMenuPanel());

        // Menu items
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
                this.closeMenuPanel();
            });
        });

        // Bottom nav
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
            });
        });
    }

    openMenu() {
        this.sideMenu.classList.add('open');
        this.overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeMenuPanel() {
        this.sideMenu.classList.remove('open');
        this.overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    loadPage(page) {
        this.currentPage = page;
        this.updateActiveStates();
        
        const pageRenderers = {
            home: () => this.renderHome(),
            plan: () => this.renderPlanBusiness(),
            leads: () => this.renderLeads(),
            appointments: () => this.renderAppointments(),
            farming: () => this.renderFarming(),
            revenue: () => this.renderRevenue(),
            transactions: () => this.renderTransactions(),
            analyze: () => this.renderAnalyzeDB(),
            letters: () => this.renderLetters(),
            website: () => this.renderWebsite(),
            premium: () => this.renderPremium(),
            settings: () => this.renderSettings()
        };

        const renderer = pageRenderers[page] || pageRenderers.home;
        this.content.innerHTML = renderer();
    }

    updateActiveStates() {
        // Update menu items
        this.menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === this.currentPage);
        });

        // Update bottom nav
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === this.currentPage);
        });
    }

    renderHome() {
        return `
            <div class="page home-page">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${this.data.metrics.leads}</div>
                        <div class="metric-label">Leads Added</div>
                        <div class="metric-change positive">+12 this week</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.data.metrics.appts}</div>
                        <div class="metric-label">Appointments</div>
                        <div class="metric-change positive">+2 today</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.data.metrics.conversion}%</div>
                        <div class="metric-label">Conversion Rate</div>
                        <div class="metric-change positive">+3% vs last month</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${this.data.metrics.revenue.toLocaleString()}</div>
                        <div class="metric-label">Q3 Revenue</div>
                        <div class="metric-change positive">+18% YoY</div>
                    </div>
                </div>

                <div class="quick-actions">
                    <button class="quick-action" onclick="app.showToast('Add Lead modal would open')">
                        <i class="fas fa-user-plus"></i>
                        <span>Add Lead</span>
                    </button>
                    <button class="quick-action" onclick="app.showToast('Letter generator would open')">
                        <i class="fas fa-envelope"></i>
                        <span>Generate Letter</span>
                    </button>
                    <button class="quick-action" onclick="app.loadPage('revenue')">
                        <i class="fas fa-chart-line"></i>
                        <span>View Revenue</span>
                    </button>
                    <button class="quick-action" onclick="app.showToast('Schedule modal would open')">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Schedule Appt</span>
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Today's Tasks</span>
                        <span class="card-action">View All</span>
                    </div>
                    ${this.data.tasks.map(task => `
                        <div class="list-item">
                            <div class="list-item-left">
                                <div class="list-item-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>${task.text}</h4>
                                    <p>Due today</p>
                                </div>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                        </div>
                    `).join('')}
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Recent Leads</span>
                        <span class="card-action" onclick="app.loadPage('leads')">View All</span>
                    </div>
                    ${this.data.leads.slice(0, 3).map(lead => `
                        <div class="list-item">
                            <div class="list-item-left">
                                <div class="list-item-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>${lead.name}</h4>
                                    <p>${lead.source} • ${lead.phone}</p>
                                </div>
                            </div>
                            <span class="badge badge-${lead.status.toLowerCase()}">${lead.status}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="coach-tip">
                    <div class="coach-tip-header">
                        <i class="fas fa-lightbulb"></i>
                        <span>Coach's Corner</span>
                    </div>
                    <p>Focus on 94117 geo-farming this week. Your conversion rate in this area is 25% higher than your average. Consider sending a targeted letter campaign.</p>
                </div>
            </div>
        `;
    }

    renderPlanBusiness() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Plan Your Business</h1>
                    <p class="section-subtitle">Track goals, milestones, and coaching progress</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Active Goals</span>
                        <button class="btn btn-primary"><i class="fas fa-plus"></i> Add Goal</button>
                    </div>
                    ${this.data.goals.map(goal => `
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>${goal.name}</span>
                                <span>${goal.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${goal.progress}%"></div>
                            </div>
                            <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem">
                                ${goal.current} of ${goal.target} completed
                            </p>
                        </div>
                    `).join('')}
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Milestones</span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Complete CRM setup</h4>
                                <p>Completed on May 15</p>
                            </div>
                        </div>
                        <span class="status">
                            <span class="status-dot active"></span> Done
                        </span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
                                <i class="fas fa-spinner"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Launch first farming campaign</h4>
                                <p>Target: June 15</p>
                            </div>
                        </div>
                        <span class="status">
                            <span class="status-dot pending"></span> In Progress
                        </span>
                    </div>
                </div>

                <div class="coach-tip">
                    <div class="coach-tip-header">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>Weekly Coaching Tip</span>
                    </div>
                    <p>You're 67% toward your lead goal! To accelerate, consider hosting an open house this weekend in your target farm area. Your conversion rate from open houses is 40% higher than cold leads.</p>
                </div>
            </div>
        `;
    }

    renderLeads() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Lead Management</h1>
                    <p class="section-subtitle">${this.data.leads.length} leads in your database</p>
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" onclick="app.showToast('Add Lead modal would open')">
                        <i class="fas fa-plus"></i> Add Lead
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-sort"></i> Sort
                    </button>
                </div>

                <div class="card">
                    ${this.data.leads.map(lead => `
                        <div class="list-item" onclick="app.viewLead(${lead.id})">
                            <div class="list-item-left">
                                <div class="list-item-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>Lead #${lead.id}: ${lead.name}</h4>
                                    <p>${lead.source} • ${lead.phone}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem">
                                <span class="badge badge-${lead.status.toLowerCase()}">${lead.status}</span>
                                <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card" style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.05), rgba(59, 130, 246, 0.05))">
                    <div class="card-header">
                        <span class="card-title"><i class="fas fa-robot"></i> AI Lead Scoring</span>
                    </div>
                    <p style="color: var(--text-muted); margin-bottom: 1rem">Get AI-powered insights on which leads are most likely to convert.</p>
                    <button class="btn btn-primary" onclick="app.showToast('Premium feature - upgrade required')">
                        <i class="fas fa-star"></i> Unlock Lead Scoring
                    </button>
                </div>
            </div>
        `;
    }

    renderAppointments() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Appointments</h1>
                    <p class="section-subtitle">Manage your schedule and track outcomes</p>
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary">
                        <i class="fas fa-plus"></i> Schedule New
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Today's Appointments</span>
                    </div>
                    ${this.data.appointments.map(appt => `
                        <div class="list-item">
                            <div class="list-item-left">
                                <div class="list-item-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary)">
                                    <i class="fas fa-calendar"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>${appt.name}</h4>
                                    <p>${appt.time} • ${appt.status}</p>
                                </div>
                            </div>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem"
                                    onclick="app.showToast('Did you land it? dialog would open')">
                                Did you land it?
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Upcoming</span>
                    </div>
                    <div class="list-item" style="opacity: 0.6">
                        <div class="list-item-left">
                            <div class="list-item-icon">
                                <i class="fas fa-calendar"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Tom Wilson</h4>
                                <p>Tomorrow, 10:00 AM</p>
                            </div>
                        </div>
                        <span class="badge badge-cold">Scheduled</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderFarming() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Community Farming</h1>
                    <p class="section-subtitle">Geo-targeted marketing campaigns</p>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #1E3A8A, #3B82F6); color: white">
                    <div style="display: flex; align-items: center; gap: 1rem">
                        <i class="fas fa-map-marked-alt" style="font-size: 2.5rem; opacity: 0.9"></i>
                        <div>
                            <h3 style="margin-bottom: 0.25rem">Map View</h3>
                            <p style="opacity: 0.8">Visualize your farm areas and track coverage</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Active Campaigns</span>
                        <button class="btn btn-primary"><i class="fas fa-plus"></i> New Campaign</button>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Modoc County Campaign</h4>
                                <p>2,847 homes targeted • 18% response rate</p>
                            </div>
                        </div>
                        <span class="status">
                            <span class="status-dot active"></span> Active
                        </span>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Farm Area Stats</span>
                    </div>
                    <div class="metrics-grid" style="margin: 0">
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--primary)">3</div>
                            <div class="metric-label">Active Areas</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--primary)">12,450</div>
                            <div class="metric-label">Homes Reached</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--primary)">18%</div>
                            <div class="metric-label">Response Rate</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--primary)">24</div>
                            <div class="metric-label">Leads Generated</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRevenue() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Revenue & Profit</h1>
                    <p class="section-subtitle">Track commissions, referrals, and P&L</p>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">$42.5K</div>
                        <div class="metric-label">Commissions</div>
                        <div class="metric-change positive">+15%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$5.2K</div>
                        <div class="metric-label">Referrals</div>
                        <div class="metric-change positive">+8%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$35K</div>
                        <div class="metric-label">Net Profit</div>
                        <div class="metric-change positive">+12%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">82%</div>
                        <div class="metric-label">Profit Margin</div>
                        <div class="metric-change positive">+2%</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">P&L Statement (Q3 2026)</span>
                        <button class="btn btn-primary">
                            <i class="fas fa-download"></i> Export PDF
                        </button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>% of Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Gross Revenue</strong></td>
                                <td><strong>$47,700</strong></td>
                                <td>100%</td>
                            </tr>
                            <tr>
                                <td>Commissions</td>
                                <td>$42,500</td>
                                <td>89%</td>
                            </tr>
                            <tr>
                                <td>Referral Fees</td>
                                <td>$5,200</td>
                                <td>11%</td>
                            </tr>
                            <tr>
                                <td><strong>Expenses</strong></td>
                                <td><strong>($12,700)</strong></td>
                                <td>27%</td>
                            </tr>
                            <tr>
                                <td>Marketing</td>
                                <td>($3,500)</td>
                                <td>7%</td>
                            </tr>
                            <tr>
                                <td>Office/MLS</td>
                                <td>($2,400)</td>
                                <td>5%</td>
                            </tr>
                            <tr>
                                <td>Transportation</td>
                                <td>($1,800)</td>
                                <td>4%</td>
                            </tr>
                            <tr style="border-top: 2px solid var(--border)">
                                <td><strong>Net Profit</strong></td>
                                <td><strong style="color: var(--success)">$35,000</strong></td>
                                <td><strong>73%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="coach-tip">
                    <div class="coach-tip-header">
                        <i class="fas fa-calculator"></i>
                        <span>Tax Time Tip</span>
                    </div>
                    <p>Your profit margin is excellent at 73%. Consider exporting your Schedule E report for tax filing. Premium users get automatic IRS-ready reports.</p>
                </div>
            </div>
        `;
    }

    renderTransactions() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Transaction Pipeline</h1>
                    <p class="section-subtitle">Track deals from coach to close</p>
                </div>

                <div class="card"
>
                    <div class="card-header">
                        <span class="card-title">Active Transactions</span>
                        <button class="btn btn-primary"><i class="fas fa-plus"></i> Add Transaction</button>
                    </div>
                    
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
                                <i class="fas fa-handshake"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>123 Main Street</h4>
                                <p>Smith Family • $850,000</p>
                            </div>
                        </div>
                        <div style="text-align: right">
                            <span class="badge badge-warm">Coach</span>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem">Next: Pre-approval</p>
                        </div>
                    </div>

                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary)">
                                <i class="fas fa-file-signature"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>456 Oak Avenue</h4>
                                <p>Johnson Family • $1,200,000</p>
                            </div>
                        </div>
                        <div style="text-align: right">
                            <span class="badge badge-cold">Transact</span>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem">Next: Inspection</p>
                        </div>
                    </div>

                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>789 Pine Street</h4>
                                <p>Davis Family • $675,000</p>
                            </div>
                        </div>
                        <div style="text-align: right">
                            <span class="badge badge-cold">Close</span>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem">Closing: June 5</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Pipeline Summary</span>
                    </div>
                    <div class="metrics-grid" style="margin: 0">
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--warning)">2</div>
                            <div class="metric-label">In Coach</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--secondary)">3</div>
                            <div class="metric-label">In Transact</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--success)">1</div>
                            <div class="metric-label">Ready to Close</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value">$2.7M</div>
                            <div class="metric-label">Pipeline Value</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyzeDB() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Database Analysis</h1>
                    <p class="section-subtitle">AI-powered insights on your data</p>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">50</div>
                        <div class="metric-label">Total Leads</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">18%</div>
                        <div class="metric-label">Conversion Rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$425</div>
                        <div class="metric-label">Cost per Lead</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">14 days</div>
                        <div class="metric-label">Avg Time to Close</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Lead Timeline</span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Email Campaign Sent</h4>
                                <p>May 28, 2026 • 45% open rate</p>
                            </div>
                        </div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary)">
                                <i class="fas fa-hand-pointer"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>12 Clicks Recorded</h4>
                                <p>May 29, 2026 • Landing page</p>
                            </div>
                        </div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
                                <i class="fas fa-file-contract"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>3 Offers Made</h4>
                                <p>June 1, 2026 • 1 accepted</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="coach-tip">
                    <div class="coach-tip-header">
                        <i class="fas fa-brain"></i>
                        <span>AI Insight</span>
                    </div>
                    <p><strong>Focus on 90210:</strong> Your conversion rate in this zip code is 25% higher than average. Consider increasing your farming budget here by 20% for maximum ROI.</p>
                </div>
            </div>
        `;
    }

    renderLetters() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Letter Generator</h1>
                    <p class="section-subtitle">Create professional letters and marketing materials</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Choose Template</span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(30, 58, 138, 0.1); color: var(--primary)">
                                <i class="fas fa-door-open"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Open House Invitation</h4>
                                <p>Invite neighbors to your open house</p>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                <i class="fas fa-seedling"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Farming Letter</h4>
                                <p>Introduce yourself to a farm area</p>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
                                <i class="fas fa-birthday-cake"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Anniversary Card</h4>
                                <p>Celebrate client's purchase anniversary</p>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Letter Editor</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Recipient Name</label>
                        <input type="text" class="form-input" placeholder="Enter name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea class="form-input" rows="3" placeholder="Enter address"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Message</label>
                        <textarea class="form-input" rows="6" placeholder="Dear [Name],...">Dear [Name],

I hope this letter finds you well. I'm writing to...

Best regards,
Agent A</textarea>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-primary" onclick="app.showToast('Letter saved!')">
                            <i class="fas fa-save"></i> Save Draft
                        </button>
                        <button class="btn btn-success">
                            <i class="fas fa-paper-plane"></i> Send
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWebsite() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Website Portal</h1>
                    <p class="section-subtitle">Manage your landing pages and lead capture</p>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #1E3A8A, #3B82F6); color: white">
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div>
                            <h3 style="margin-bottom: 0.5rem">Your Website</h3>
                            <p style="opacity: 0.9">www.agenta-realestate.com</p>
                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem">
                                <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem"><i class="fas fa-check"></i> Live</span>
                                <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem">124 visitors today</span>
                            </div>
                        </div>
                        <i class="fas fa-globe" style="font-size: 3rem; opacity: 0.3"></i>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Landing Pages</span>
                        <button class="btn btn-primary"><i class="fas fa-plus"></i> New Page</button>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon">
                                <i class="fas fa-home"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Home Valuation</h4>
                                <p>/valuation • 45 leads captured</p>
                            </div>
                        </div>
                        <span class="status">
                            <span class="status-dot active"></span> Active
                        </span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon">
                                <i class="fas fa-list"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Featured Listings</h4>
                                <p>/listings • 28 leads captured</p>
                            </div>
                        </div>
                        <span class="status">
                            <span class="status-dot active"></span> Active
                        </span>
                    </div>
                </div>

                <div class="btn-group" style="margin-top: 1.5rem">
                    <button class="btn btn-secondary" style="flex: 1">
                        <i class="fas fa-edit"></i> Edit Site
                    </button>
                    <button class="btn btn-secondary" style="flex: 1">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn btn-secondary" style="flex: 1">
                        <i class="fas fa-chart-bar"></i> Analytics
                    </button>
                </div>
            </div>
        `;
    }

    renderPremium() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Premium Tools</h1>
                    <p class="section-subtitle">Unlock advanced features for your business</p>
                </div>

                <div class="card" style="border: 2px solid var(--primary)">
                    <div style="text-align: center; padding: 1.5rem">
                        <i class="fas fa-crown" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem"></i>
                        <h2>CREAM Premium</h2>
                        <p style="color: var(--text-muted); margin: 1rem 0">Get the full power of AI-driven real estate management</p>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary)">$99<span style="font-size: 1rem; font-weight: 400; color: var(--text-muted)">/year</span></div>
                        <button class="btn btn-primary" style="margin-top: 1.5rem; width: 100%">
                            <i class="fas fa-star"></i> Upgrade Now
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Available Tools</span>
                    </div>
                    
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>AI Lead Scoring</h4>
                                <p>Predict which leads will convert</p>
                            </div>
                        </div>
                        <span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6">Premium</span>
                    </div>

                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                <i class="fas fa-file-invoice-dollar"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Tax Export (Schedule E)</h4>
                                <p>IRS-ready rental income reports</p>
                            </div>
                        </div>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">Premium</span>
                    </div>

                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary)">
                                <i class="fas fa-envelope-open-text"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Automated Email Campaigns</h4>
                                <p>Drip campaigns to nurture leads</p>
                            </div>
                        </div>
                        <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary)">Premium</span>
                    </div>

                    <div class="list-item"
>
                        <div class="list-item-left">
                            <div class="list-item-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
                                <i class="fas fa-chart-pie"></i>
                            </div>
                            <div class="list-item-content">
                                <h4>Advanced Analytics</h4>
                                <p>Deep insights and forecasting</p>
                            </div>
                        </div>
                        <span class="badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">Premium</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Settings</h1>
                    <p class="section-subtitle">Customize your CREAM experience</p>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Appearance</span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Dark Mode</h4>
                            <p>Switch to dark theme</p>
                        </div>
                        <div class="toggle" style="width: 50px; height: 28px; background: var(--border); border-radius: 14px; position: relative; cursor: pointer">
                            <div style="width: 24px; height: 24px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2)"></div>
                        </div>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Compact View</h4>
                            <p>Show more items per screen</p>
                        </div>
                        <div class="toggle" style="width: 50px; height: 28px; background: var(--success); border-radius: 14px; position: relative; cursor: pointer">
                            <div style="width: 24px; height: 24px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2)"></div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Notifications</span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Appointment Reminders</h4>
                            <p>Get notified before meetings</p>
                        </div>
                        <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.25rem"></i>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Daily Summary</h4>
                            <p>Morning briefing email</p>
                        </div>
                        <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.25rem"></i>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Account</span>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Edit Profile</h4>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Change Password</h4>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                    <div class="list-item" style="color: var(--danger)">
                        <div class="list-item-content">
                            <h4><i class="fas fa-sign-out-alt"></i> Logout</h4>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; padding: 2rem; color: var(--text-muted)">
                    <p>CREAM v1.0</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem">© 2026 CREAM Real Estate</p>
                </div>
            </div>
        `;
    }

    // Utility methods
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9375rem;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    viewLead(id) {
        const lead = this.data.leads.find(l => l.id === id);
        if (lead) {
            this.showToast(`Viewing ${lead.name}'s details`);
        }
    }
}

// Initialize app
const app = new CreamApp();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(10px); }
    }
`;
document.head.appendChild(style);
