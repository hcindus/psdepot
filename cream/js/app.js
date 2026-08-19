// CREAM Web Application
// Comprehensive Real Estate Agent Management - Fully Wired

class CreamApp {
    constructor() {
        this.currentPage = 'home';
        this.darkMode = false;
        this.compactView = true;
        this.data = {
            tasks: [
                { id: 1, text: 'Follow up with 3 leads', completed: false },
                { id: 2, text: 'Send farming letter', completed: false }
            ],
            leads: [
                { id: 45, name: 'John Smith', status: 'Hot', source: 'Website', phone: '555-0101', email: 'john@example.com' },
                { id: 46, name: 'Sarah Johnson', status: 'Warm', source: 'Referral', phone: '555-0102', email: 'sarah@example.com' },
                { id: 47, name: 'Mike Brown', status: 'Cold', source: 'Cold Call', phone: '555-0103', email: 'mike@example.com' }
            ],
            appointments: [
                { id: 1, name: 'Jane Doe', time: '2:00 PM', date: '2026-06-02', status: 'Scheduled', type: 'Property Showing' },
                { id: 2, name: 'Bob Wilson', time: '4:30 PM', date: '2026-06-02', status: 'Confirmed', type: 'Listing Presentation' }
            ],
            transactions: [
                { id: 1, address: '123 Main Street', client: 'Smith Family', price: 850000, status: 'Coach', nextStep: 'Pre-approval' },
                { id: 2, address: '456 Oak Avenue', client: 'Johnson Family', price: 1200000, status: 'Transact', nextStep: 'Inspection' },
                { id: 3, address: '789 Pine Street', client: 'Davis Family', price: 675000, status: 'Close', nextStep: 'Closing: June 5' }
            ],
            campaigns: [
                { id: 1, name: 'Modoc County Campaign', homes: 2847, responseRate: 18, status: 'Active' }
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
            ],
            letterDrafts: [],
            landingPages: [
                { name: 'Home Valuation', url: '/valuation', leads: 45, status: 'Active' },
                { name: 'Featured Listings', url: '/listings', leads: 28, status: 'Active' }
            ]
        };
        
        this.filterStatus = 'All';
        this.sortBy = 'newest';
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
        this.menuToggle?.addEventListener('click', () => this.openMenu());
        this.closeMenu?.addEventListener('click', () => this.closeMenuPanel());
        this.overlay?.addEventListener('click', () => this.closeMenuPanel());

        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
                this.closeMenuPanel();
            });
        });

        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.loadPage(page);
            });
        });
    }

    openMenu() {
        this.sideMenu?.classList.add('open');
        this.overlay?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeMenuPanel() {
        this.sideMenu?.classList.remove('open');
        this.overlay?.classList.remove('show');
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
        this.postRenderSetup();
    }

    updateActiveStates() {
        this.menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === this.currentPage);
        });
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === this.currentPage);
        });
    }

    postRenderSetup() {
        // Re-attach any dynamic event listeners after render
        if (this.currentPage === 'leads') {
            this.setupLeadsPage();
        }
    }

    // ==================== RENDERERS ====================

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
                    <button class="quick-action" onclick="app.addLeadModal()">
                        <i class="fas fa-user-plus"></i>
                        <span>Add Lead</span>
                    </button>
                    <button class="quick-action" onclick="app.loadPage('letters')">
                        <i class="fas fa-envelope"></i>
                        <span>Generate Letter</span>
                    </button>
                    <button class="quick-action" onclick="app.loadPage('revenue')">
                        <i class="fas fa-chart-line"></i>
                        <span>View Revenue</span>
                    </button>
                    <button class="quick-action" onclick="app.scheduleModal()">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Schedule Appt</span>
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Today's Tasks</span>
                        <span class="card-action" onclick="app.loadPage('plan')">View All</span>
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
                        <div class="list-item" onclick="app.viewLeadDetail(${lead.id})">
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
                        <button class="btn btn-primary" onclick="app.addGoalModal()">
                            <i class="fas fa-plus"></i> Add Goal
                        </button>
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
                    <p>You're 67% toward your lead goal! To accelerate, consider hosting an open house this weekend in your target farm area.</p>
                </div>
            </div>
        `;
    }

    renderLeads() {
        const filteredLeads = this.getFilteredLeads();
        const sortedLeads = this.getSortedLeads(filteredLeads);
        
        return `
            <div class="page">
                <div class="section-header">
                    <h1 class="section-title">Lead Management</h1>
                    <p class="section-subtitle">${sortedLeads.length} leads in your database</p>
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" onclick="app.addLeadModal()">
                        <i class="fas fa-plus"></i> Add Lead
                    </button>
                    <button class="btn btn-secondary" onclick="app.toggleFilterModal()">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                    <button class="btn btn-secondary" onclick="app.toggleSortDropdown()">
                        <i class="fas fa-sort"></i> Sort
                    </button>
                </div>

                ${this.filterStatus !== 'All' ? `
                    <div style="margin-bottom: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <span>Filter: ${this.filterStatus}</span>
                        <i class="fas fa-times" style="cursor: pointer;" onclick="app.clearFilter()"></i>
                    </div>
                ` : ''}

                <div class="card">
                    ${sortedLeads.length === 0 ? `
                        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>No leads found matching your criteria</p>
                            <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="app.clearFilter()">Clear Filter</button>
                        </div>
                    ` : sortedLeads.map(lead => `
                        <div class="list-item" onclick="app.viewLeadDetail(${lead.id})">
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
                    <button class="btn btn-primary" onclick="app.showToast('Upgrade to Premium for AI Lead Scoring')">
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
                    <button class="btn btn-primary" onclick="app.scheduleModal()">
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
                                    <p>${appt.time} • ${appt.type}</p>
                                </div>
                            </div>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem"
                                    onclick="app.didLandItModal(${appt.id})">
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
                                <p>Tomorrow, 10:00 AM • Buyer Consultation</p>
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
                        <button class="btn btn-primary" onclick="app.newCampaignModal()">
                            <i class="fas fa-plus"></i> New Campaign
                        </button>
                    </div>
                    ${this.data.campaigns.map(campaign => `
                        <div class="list-item">
                            <div class="list-item-left">
                                <div class="list-item-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
                                    <i class="fas fa-bullseye"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>${campaign.name}</h4>
                                    <p>${campaign.homes.toLocaleString()} homes targeted • ${campaign.responseRate}% response rate</p>
                                </div>
                            </div>
                            <span class="status">
                                <span class="status-dot active"></span> ${campaign.status}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Farm Area Stats</span>
                    </div>
                    <div class="metrics-grid" style="margin: 0">
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--primary)">${this.data.campaigns.length}</div>
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
                        <button class="btn btn-primary" onclick="app.exportPDF()">
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
                    <p>Your profit margin is excellent at 73%. Premium users get automatic IRS-ready Schedule E reports.</p>
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

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Active Transactions</span>
                        <button class="btn btn-primary" onclick="app.addTransactionModal()">
                            <i class="fas fa-plus"></i> Add Transaction
                        </button>
                    </div>
                    ${this.data.transactions.map(txn => `
                        <div class="list-item" onclick="app.viewTransactionDetail(${txn.id})">
                            <div class="list-item-left">
                                <div class="list-item-icon" style="background: ${txn.status === 'Coach' ? 'rgba(245, 158, 11, 0.1)' : txn.status === 'Transact' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${txn.status === 'Coach' ? 'var(--warning)' : txn.status === 'Transact' ? 'var(--secondary)' : 'var(--success)'}">
                                    <i class="fas ${txn.status === 'Coach' ? 'fa-handshake' : txn.status === 'Transact' ? 'fa-file-signature' : 'fa-check-circle'}"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>${txn.address}</h4>
                                    <p>${txn.client} • $${txn.price.toLocaleString()}</p>
                                </div>
                            </div>
                            <div style="text-align: right">
                                <span class="badge badge-${txn.status === 'Coach' ? 'warm' : txn.status === 'Transact' ? 'cold' : 'hot'}">${txn.status}</span>
                                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem">Next: ${txn.nextStep}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Pipeline Summary</span>
                    </div>
                    <div class="metrics-grid" style="margin: 0">
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--warning)">${this.data.transactions.filter(t => t.status === 'Coach').length}</div>
                            <div class="metric-label">In Coach</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--secondary)">${this.data.transactions.filter(t => t.status === 'Transact').length}</div>
                            <div class="metric-label">In Transact</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value" style="color: var(--success)">${this.data.transactions.filter(t => t.status === 'Close').length}</div>
                            <div class="metric-label">Ready to Close</div>
                        </div>
                        <div class="metric-card" style="background: transparent; box-shadow: none">
                            <div class="metric-value">$${(this.data.transactions.reduce((acc, t) => acc + t.price, 0) / 1000000).toFixed(1)}M</div>
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
                        <div class="metric-value">${this.data.leads.length}</div>
                        <div class="metric-label">Total Leads</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.data.metrics.conversion}%</div>
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
                    <div class="list-item" onclick="app.selectTemplate('open-house')">
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
                    <div class="list-item" onclick="app.selectTemplate('farming')">
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
                    <div class="list-item" onclick="app.selectTemplate('anniversary')">
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
                        <input type="text" id="letterRecipient" class="form-input" placeholder="Enter name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea id="letterAddress" class="form-input" rows="3" placeholder="Enter address"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Message</label>
                        <textarea id="letterMessage" class="form-input" rows="6" placeholder="Your message..."></textarea>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" onclick="app.previewLetter()">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-primary" onclick="app.saveLetter()">
                            <i class="fas fa-save"></i> Save Draft
                        </button>
                        <button class="btn btn-success" onclick="app.sendLetter()">
                            <i class="fas fa-paper-plane"></i> Send
                        </button>
                    </div>
                </div>

                ${this.data.letterDrafts.length > 0 ? `
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Saved Drafts</span>
                        </div>
                        ${this.data.letterDrafts.map((draft, idx) => `
                            <div class="list-item" onclick="app.loadDraft(${idx})">
                                <div class="list-item-left">
                                    <div class="list-item-icon">
                                        <i class="fas fa-file-alt"></i>
                                    </div>
                                    <div class="list-item-content">
                                        <h4>${draft.template || 'Custom Letter'}</h4>
                                        <p>${draft.recipient || 'No recipient'} • ${draft.date}</p>
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
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
                        <button class="btn btn-primary" onclick="app.newLandingPageModal()">
                            <i class="fas fa-plus"></i> New Page
                        </button>
                    </div>
                    ${this.data.landingPages.map(page => `
                        <div class="list-item">
                            <div class="list-item-left">
                                <div class="list-item-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <div class="list-item-content">
                                    <h4>${page.name}</h4>
                                    <p>${page.url} • ${page.leads} leads captured</p>
                                </div>
                            </div>
                            <span class="status">
                                <span class="status-dot ${page.status === 'Active' ? 'active' : 'pending'}"></span> ${page.status}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <div class="btn-group" style="margin-top: 1.5rem">
                    <button class="btn btn-secondary" style="flex: 1" onclick="app.showToast('Website editor coming soon')">
                        <i class="fas fa-edit"></i> Edit Site
                    </button>
                    <button class="btn btn-secondary" style="flex: 1" onclick="app.previewWebsite()">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn btn-secondary" style="flex: 1" onclick="app.showToast('Analytics dashboard coming soon')">
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
                        <button class="btn btn-primary" style="margin-top: 1.5rem; width: 100%" onclick="app.upgradeModal()">
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

                    <div class="list-item">
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
                    <div class="list-item" onclick="app.toggleDarkMode()">
                        <div class="list-item-content">
                            <h4>Dark Mode</h4>
                            <p>Switch to dark theme</p>
                        </div>
                        <div class="toggle ${this.darkMode ? 'active' : ''}" style="width: 50px; height: 28px; background: ${this.darkMode ? 'var(--primary)' : 'var(--border)'}; border-radius: 14px; position: relative; cursor: pointer; transition: background 0.3s;">
                            <div style="width: 24px; height: 24px; background: white; border-radius: 50%; position: absolute; top: 2px; ${this.darkMode ? 'right: 2px' : 'left: 2px'}; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: all 0.3s;"></div>
                        </div>
                    </div>
                    <div class="list-item" onclick="app.toggleCompactView()">
                        <div class="list-item-content">
                            <h4>Compact View</h4>
                            <p>Show more items per screen</p>
                        </div>
                        <div class="toggle ${this.compactView ? 'active' : ''}" style="width: 50px; height: 28px; background: ${this.compactView ? 'var(--success)' : 'var(--border)'}; border-radius: 14px; position: relative; cursor: pointer; transition: background 0.3s;">
                            <div style="width: 24px; height: 24px; background: white; border-radius: 50%; position: absolute; top: 2px; ${this.compactView ? 'right: 2px' : 'left: 2px'}; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: all 0.3s;"></div>
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
                        <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.25rem; cursor: pointer;" onclick="app.showToast('Notifications settings coming soon')"></i>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <h4>Daily Summary</h4>
                            <p>Morning briefing email</p>
                        </div>
                        <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.25rem; cursor: pointer;" onclick="app.showToast('Notifications settings coming soon')"></i>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Account</span>
                    </div>
                    <div class="list-item" onclick="app.editProfileModal()">
                        <div class="list-item-content">
                            <h4>Edit Profile</h4>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                    <div class="list-item" onclick="app.changePasswordModal()">
                        <div class="list-item-content">
                            <h4>Change Password</h4>
                        </div>
                        <i class="fas fa-chevron-right" style="color: var(--text-muted)"></i>
                    </div>
                    <div class="list-item" style="color: var(--danger); cursor: pointer;" onclick="app.logout()">
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

    // ==================== ACTIONS & MODALS ====================

    showToast(message) {
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
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
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    addLeadModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'leadModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Lead</h3>
                    <button class="modal-close" onclick="document.getElementById('leadModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" id="leadName" class="form-input" placeholder="John Smith" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone *</label>
                        <input type="tel" id="leadPhone" class="form-input" placeholder="555-0100" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" id="leadEmail" class="form-input" placeholder="john@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Source</label>
                        <select id="leadSource" class="form-input">
                            <option>Website</option>
                            <option>Referral</option>
                            <option>Cold Call</option>
                            <option>Open House</option>
                            <option>Social Media</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="leadStatus" class="form-input">
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('leadModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.saveLead()">Save Lead</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    saveLead() {
        const name = document.getElementById('leadName').value.trim();
        const phone = document.getElementById('leadPhone').value.trim();
        const email = document.getElementById('leadEmail')?.value.trim() || '';
        const source = document.getElementById('leadSource').value;
        const status = document.getElementById('leadStatus').value;
        
        if (!name || !phone) {
            this.showToast('Please fill in name and phone');
            return;
        }
        
        const newLead = {
            id: Date.now(),
            name: name,
            status: status,
            source: source,
            phone: phone,
            email: email
        };
        
        this.data.leads.unshift(newLead);
        this.data.metrics.leads++;
        document.getElementById('leadModal')?.remove();
        this.showToast('Lead added successfully!');
        this.loadPage('leads');
    }

    viewLeadDetail(id) {
        const lead = this.data.leads.find(l => l.id === id);
        if (!lead) return;

        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'leadDetailModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>Lead Details</h3>
                    <button class="modal-close" onclick="document.getElementById('leadDetailModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="width: 80px; height: 80px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                            <i class="fas fa-user" style="font-size: 2rem; color: white;"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem;">${lead.name}</h3>
                        <span class="badge badge-${lead.status.toLowerCase()}">${lead.status}</span>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                            <i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i>
                            <span>${lead.phone}</span>
                        </div>
                        ${lead.email ? `
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                            <i class="fas fa-envelope" style="color: var(--primary); width: 20px;"></i>
                            <span>${lead.email}</span>
                        </div>
                        ` : ''}
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <i class="fas fa-source" style="color: var(--primary); width: 20px;"></i>
                            <span>${lead.source}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('leadDetailModal').remove()">Close</button>
                    <button class="btn btn-primary" onclick="app.scheduleModal(${lead.id}); document.getElementById('leadDetailModal').remove()">
                        <i class="fas fa-calendar-plus"></i> Schedule
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    scheduleModal(leadId = null) {
        this.closeAllModals();
        const lead = leadId ? this.data.leads.find(l => l.id === leadId) : null;
        
        const modal = document.createElement('div');
        modal.id = 'scheduleModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Schedule Appointment</h3>
                    <button class="modal-close" onclick="document.getElementById('scheduleModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Client Name *</label>
                        <input type="text" id="apptName" class="form-input" placeholder="Client name" value="${lead ? lead.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date *</label>
                        <input type="date" id="apptDate" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Time *</label>
                        <input type="time" id="apptTime" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Type</label>
                        <select id="apptType" class="form-input">
                            <option>Property Showing</option>
                            <option>Listing Presentation</option>
                            <option>Buyer Consultation</option>
                            <option>Contract Signing</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('scheduleModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.saveAppointment()">Schedule</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('apptDate').valueAsDate = new Date();
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    saveAppointment() {
        const name = document.getElementById('apptName').value.trim();
        const date = document.getElementById('apptDate').value;
        const time = document.getElementById('apptTime').value;
        const type = document.getElementById('apptType').value;
        
        if (!name || !date || !time) {
            this.showToast('Please fill in all required fields');
            return;
        }
        
        const newAppt = {
            id: Date.now(),
            name: name,
            time: time,
            date: date,
            status: 'Scheduled',
            type: type
        };
        
        this.data.appointments.unshift(newAppt);
        this.data.metrics.appts++;
        document.getElementById('scheduleModal')?.remove();
        this.showToast('Appointment scheduled!');
        this.loadPage('appointments');
    }

    didLandItModal(apptId) {
        const appt = this.data.appointments.find(a => a.id === apptId);
        if (!appt) return;

        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'didLandModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Appointment Result</h3>
                    <button class="modal-close" onclick="document.getElementById('didLandModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1.5rem; color: var(--text-muted);">How did the appointment with <strong>${appt.name}</strong> go?</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <button class="btn btn-success" style="padding: 1rem;" onclick="app.markAppointmentResult(${apptId}, 'landed')">
                            <i class="fas fa-check-circle" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
                            Landed!
                        </button>
                        <button class="btn btn-secondary" style="padding: 1rem;" onclick="app.markAppointmentResult(${apptId}, 'followup')">
                            <i class="fas fa-clock" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
                            Follow Up
                        </button>
                        <button class="btn btn-warning" style="padding: 1rem; grid-column: span 2;" onclick="app.markAppointmentResult(${apptId}, 'nogo')">
                            <i class="fas fa-times-circle" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
                            No Go
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    markAppointmentResult(apptId, result) {
        const appt = this.data.appointments.find(a => a.id === apptId);
        if (!appt) return;

        const messages = {
            landed: '🎉 Congratulations! Deal landed!',
            followup: '⏰ Follow-up scheduled',
            nogo: 'Noted. Moving to nurture sequence.'
        };

        appt.status = result === 'landed' ? 'Converted' : result === 'followup' ? 'Follow-up' : 'No Go';
        document.getElementById('didLandModal')?.remove();
        this.showToast(messages[result]);
        this.loadPage('appointments');
    }

    // ==================== FILTERS & SORT ====================

    getFilteredLeads() {
        if (this.filterStatus === 'All') return this.data.leads;
        return this.data.leads.filter(lead => lead.status === this.filterStatus);
    }

    getSortedLeads(leads) {
        const sorted = [...leads];
        switch (this.sortBy) {
            case 'newest':
                return sorted.sort((a, b) => b.id - a.id);
            case 'oldest':
                return sorted.sort((a, b) => a.id - b.id);
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'status':
                const statusOrder = { 'Hot': 1, 'Warm': 2, 'Cold': 3 };
                return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
            default:
                return sorted;
        }
    }

    toggleFilterModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'filterModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 350px;">
                <div class="modal-header">
                    <h3>Filter Leads</h3>
                    <button class="modal-close" onclick="document.getElementById('filterModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${['All', 'Hot', 'Warm', 'Cold'].map(status => `
                                <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 8px; cursor: pointer; background: ${this.filterStatus === status ? 'var(--primary-light)' : 'transparent'};" onclick="app.setFilter('${status}')">
                                    <input type="radio" name="filterStatus" ${this.filterStatus === status ? 'checked' : ''}>
                                    <span>${status}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="app.clearFilter()">Clear All</button>
                    <button class="btn btn-primary" onclick="document.getElementById('filterModal').remove()">Apply</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    setFilter(status) {
        this.filterStatus = status;
        this.loadPage('leads');
    }

    clearFilter() {
        this.filterStatus = 'All';
        document.getElementById('filterModal')?.remove();
        this.loadPage('leads');
    }

    toggleSortDropdown() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'sortModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 300px;">
                <div class="modal-header">
                    <h3>Sort By</h3>
                    <button class="modal-close" onclick="document.getElementById('sortModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'oldest', label: 'Oldest First' },
                        { value: 'name', label: 'Name (A-Z)' },
                        { value: 'status', label: 'Status (Hot to Cold)' }
                    ].map(option => `
                        <div class="list-item" onclick="app.setSort('${option.value}')" style="cursor: pointer;">
                            <div class="list-item-content">
                                <h4>${option.label}</h4>
                            </div>
                            ${this.sortBy === option.value ? '<i class="fas fa-check" style="color: var(--primary);"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    setSort(sortBy) {
        this.sortBy = sortBy;
        document.getElementById('sortModal')?.remove();
        this.loadPage('leads');
    }

    setupLeadsPage() {
        // Any additional setup for leads page
    }

    // ==================== TRANSACTIONS ====================

    addTransactionModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'transactionModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Transaction</h3>
                    <button class="modal-close" onclick="document.getElementById('transactionModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Property Address *</label>
                        <input type="text" id="txnAddress" class="form-input" placeholder="123 Main Street" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client Name *</label>
                        <input type="text" id="txnClient" class="form-input" placeholder="Client name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Price *</label>
                        <input type="number" id="txnPrice" class="form-input" placeholder="850000" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Stage</label>
                        <select id="txnStatus" class="form-input">
                            <option value="Coach">Coach</option>
                            <option value="Transact">Transact</option>
                            <option value="Close">Close</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('transactionModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.saveTransaction()">Add Transaction</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    saveTransaction() {
        const address = document.getElementById('txnAddress').value.trim();
        const client = document.getElementById('txnClient').value.trim();
        const price = parseInt(document.getElementById('txnPrice').value) || 0;
        const status = document.getElementById('txnStatus').value;
        
        if (!address || !client || !price) {
            this.showToast('Please fill in all required fields');
            return;
        }
        
        const newTxn = {
            id: Date.now(),
            address: address,
            client: client,
            price: price,
            status: status,
            nextStep: status === 'Coach' ? 'Pre-approval' : status === 'Transact' ? 'Inspection' : 'Closing'
        };
        
        this.data.transactions.unshift(newTxn);
        document.getElementById('transactionModal')?.remove();
        this.showToast('Transaction added!');
        this.loadPage('transactions');
    }

    viewTransactionDetail(id) {
        const txn = this.data.transactions.find(t => t.id === id);
        if (!txn) return;
        this.showToast(`${txn.address}: $${txn.price.toLocaleString()} - ${txn.status}`);
    }

    // ==================== FARMING ====================

    newCampaignModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'campaignModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>New Campaign</h3>
                    <button class="modal-close" onclick="document.getElementById('campaignModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Campaign Name *</label>
                        <input type="text" id="campaignName" class="form-input" placeholder="e.g., Spring 2026 Farm" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target Area</label>
                        <input type="text" id="campaignArea" class="form-input" placeholder="ZIP code or neighborhood">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Homes Targeted</label>
                        <input type="number" id="campaignHomes" class="form-input" placeholder="1000">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('campaignModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.saveCampaign()">Create Campaign</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    saveCampaign() {
        const name = document.getElementById('campaignName').value.trim();
        const homes = parseInt(document.getElementById('campaignHomes').value) || 1000;
        
        if (!name) {
            this.showToast('Please enter a campaign name');
            return;
        }
        
        const newCampaign = {
            id: Date.now(),
            name: name,
            homes: homes,
            responseRate: 0,
            status: 'Active'
        };
        
        this.data.campaigns.unshift(newCampaign);
        this.data.goals[2].current++;
        document.getElementById('campaignModal')?.remove();
        this.showToast('Campaign created!');
        this.loadPage('farming');
    }

    addGoalModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'goalModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Add Goal</h3>
                    <button class="modal-close" onclick="document.getElementById('goalModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Goal Name *</label>
                        <input type="text" id="goalName" class="form-input" placeholder="e.g., Add 100 leads" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target *</label>
                        <input type="number" id="goalTarget" class="form-input" placeholder="100" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('goalModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.saveGoal()">Add Goal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    saveGoal() {
        const name = document.getElementById('goalName').value.trim();
        const target = parseInt(document.getElementById('goalTarget').value) || 0;
        
        if (!name || !target) {
            this.showToast('Please fill in all fields');
            return;
        }
        
        this.data.goals.push({
            name: name,
            progress: 0,
            target: target,
            current: 0
        });
        
        document.getElementById('goalModal')?.remove();
        this.showToast('Goal added!');
        this.loadPage('plan');
    }

    // ==================== LETTERS ====================

    selectTemplate(template) {
        const templates = {
            'open-house': `Dear [Name],

I hope this letter finds you well. I'm hosting an open house at [Property Address] this Saturday from 1-4 PM. I'd love to show you this beautiful property and answer any questions you may have about the local market.

Looking forward to seeing you there!

Best regards,
Agent A`,
            'farming': `Dear [Name],

My name is Agent A and I'm a real estate agent specializing in your neighborhood. I've helped many families in [Area] buy and sell homes over the past few years.

If you're ever considering a move or just want to know your home's current value, I'd be happy to provide a complimentary market analysis.

Feel free to reach out anytime.

Best regards,
Agent A`,
            'anniversary': `Dear [Name],

Happy Home Anniversary! It's been [X] years since you purchased your home at [Address]. I hope you've made many wonderful memories there.

As the market continues to evolve, I wanted to check in and see how you're doing. If you have any real estate questions or would like an updated market analysis, I'm here to help.

Congratulations on another year in your home!

Best regards,
Agent A`
        };
        
        const messageEl = document.getElementById('letterMessage');
        if (messageEl) {
            messageEl.value = templates[template] || '';
            messageEl.dataset.template = template;
        }
        this.showToast(`${template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} template loaded`);
    }

    previewLetter() {
        const recipient = document.getElementById('letterRecipient')?.value || '[Recipient]';
        const address = document.getElementById('letterAddress')?.value || '[Address]';
        const message = document.getElementById('letterMessage')?.value || '[Message]';
        
        const previewHTML = `
            <div style="background: white; padding: 2rem; border: 1px solid #ddd; max-width: 600px; margin: 0 auto; font-family: serif;">
                <p style="margin-bottom: 1rem;">${recipient}<br>${address.replace(/\n/g, '<br>')}</p>
                <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
        `;
        
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>Letter Preview</h3>
                    <button class="modal-close" onclick="document.getElementById('previewModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${previewHTML}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('previewModal').remove()">Close</button>
                    <button class="btn btn-success" onclick="document.getElementById('previewModal').remove(); app.sendLetter()">
                        <i class="fas fa-paper-plane"></i> Send Now
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveLetter() {
        const recipient = document.getElementById('letterRecipient')?.value;
        const message = document.getElementById('letterMessage')?.value;
        
        if (!recipient || !message) {
            this.showToast('Please fill in recipient and message');
            return;
        }
        
        this.data.letterDrafts.unshift({
            recipient: recipient,
            message: message,
            template: document.getElementById('letterMessage')?.dataset?.template,
            date: new Date().toLocaleDateString()
        });
        
        this.showToast('Draft saved!');
        this.loadPage('letters');
    }

    sendLetter() {
        const recipient = document.getElementById('letterRecipient')?.value;
        const message = document.getElementById('letterMessage')?.value;
        
        if (!recipient || !message) {
            this.showToast('Please fill in recipient and message');
            return;
        }
        
        this.showToast(`Letter sent to ${recipient}!`);
        document.getElementById('letterRecipient').value = '';
        document.getElementById('letterAddress').value = '';
        document.getElementById('letterMessage').value = '';
    }

    loadDraft(idx) {
        const draft = this.data.letterDrafts[idx];
        if (!draft) return;
        
        document.getElementById('letterRecipient').value = draft.recipient || '';
        document.getElementById('letterMessage').value = draft.message || '';
        this.showToast('Draft loaded');
    }

    // ==================== WEBSITE ====================

    newLandingPageModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'landingModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>New Landing Page</h3>
                    <button class="modal-close" onclick="document.getElementById('landingModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Page Name *</label>
                        <input type="text" id="pageName" class="form-input" placeholder="e.g., Home Valuation" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">URL Path</label>
                        <input type="text" id="pageUrl" class="form-input" placeholder="/valuation">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('landingModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.createLandingPage()">Create Page</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    createLandingPage() {
        const name = document.getElementById('pageName').value.trim();
        const url = document.getElementById('pageUrl').value.trim() || '/' + name.toLowerCase().replace(/\s+/g, '-');
        
        if (!name) {
            this.showToast('Please enter a page name');
            return;
        }
        
        this.data.landingPages.push({
            name: name,
            url: url,
            leads: 0,
            status: 'Active'
        });
        
        document.getElementById('landingModal')?.remove();
        this.showToast('Landing page created!');
        this.loadPage('website');
    }

    previewWebsite() {
        window.open('https://www.agenta-realestate.com', '_blank');
        this.showToast('Opening website preview...');
    }

    // ==================== SETTINGS ====================

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode', this.darkMode);
        this.loadPage('settings');
        this.showToast(this.darkMode ? 'Dark mode enabled' : 'Light mode enabled');
    }

    toggleCompactView() {
        this.compactView = !this.compactView;
        document.body.classList.toggle('compact-view', this.compactView);
        this.loadPage('settings');
        this.showToast(this.compactView ? 'Compact view enabled' : 'Standard view enabled');
    }

    editProfileModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Edit Profile</h3>
                    <button class="modal-close" onclick="document.getElementById('profileModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" value="Agent A">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" value="agent@cream.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-input" value="555-0199">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('profileModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('profileModal').remove(); app.showToast('Profile updated!')">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    changePasswordModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'passwordModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Change Password</h3>
                    <button class="modal-close" onclick="document.getElementById('passwordModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" class="form-input" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-input" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" class="form-input" placeholder="••••••••">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('passwordModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="document.getElementById('passwordModal').remove(); app.showToast('Password changed!')">Update</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showToast('Logged out successfully');
            setTimeout(() => location.reload(), 1000);
        }
    }

    // ==================== PREMIUM ====================

    upgradeModal() {
        this.closeAllModals();
        const modal = document.createElement('div');
        modal.id = 'upgradeModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;">
                    <h3><i class="fas fa-crown"></i> Upgrade to Premium</h3>
                    <button class="modal-close" onclick="document.getElementById('upgradeModal').remove()" style="color: white;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin: 1rem 0;">$99<span style="font-size: 1rem; color: var(--text-muted);">/year</span></div>
                    <ul style="text-align: left; list-style: none; padding: 0; margin: 1.5rem 0;">
                        <li style="padding: 0.5rem 0;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> AI Lead Scoring</li>
                        <li style="padding: 0.5rem 0;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Tax Export (Schedule E)</li>
                        <li style="padding: 0.5rem 0;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Automated Email Campaigns</li>
                        <li style="padding: 0.5rem 0;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Advanced Analytics</li>
                    </ul>
                </div>
                <div class="modal-footer" style="flex-direction: column; gap: 0.5rem;">
                    <button class="btn btn-primary" style="width: 100%;" onclick="document.getElementById('upgradeModal').remove(); app.showToast('Redirecting to payment...')">
                        <i class="fas fa-credit-card"></i> Upgrade Now
                    </button>
                    <button class="btn btn-secondary" style="width: 100%;" onclick="document.getElementById('upgradeModal').remove()">Maybe Later</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ==================== UTILITIES ====================

    exportPDF() {
        this.showToast('Generating PDF...');
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('P&L Statement Q3 2026\n\nGross Revenue: $47,700\nExpenses: ($12,700)\nNet Profit: $35,000');
            link.download = 'PNL_Statement_Q3_2026.txt';
            link.click();
            this.showToast('PDF downloaded!');
        }, 1000);
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    }
}

// Initialize app
const app = new CreamApp();

// Add CSS animations and modal styles
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
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
        animation: modalFadeIn 0.2s ease;
    }
    
    @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: modalSlideIn 0.3s ease;
    }
    
    @keyframes modalSlideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border, #e5e7eb);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: var(--text-muted);
        padding: 0.25rem;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border, #e5e7eb);
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.875rem;
    }
    
    .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border, #e5e7eb);
        border-radius: 8px;
        font-size: 0.9375rem;
        transition: border-color 0.2s;
    }
    
    .form-input:focus {
        outline: none;
        border-color: var(--primary, #1E3A8A);
    }
    
    .toast-message {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary, #1E3A8A);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-size: 0.9375rem;
        z-index: 10001;
        animation: fadeIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .toggle.active {
        background: var(--success) !important;
    }
    
    /* Dark mode support */
    body.dark-mode {
        --bg-primary: #1a1a2e;
        --bg-secondary: #16213e;
        --text-primary: #eee;
        --text-muted: #888;
    }
`;
document.head.appendChild(style);
