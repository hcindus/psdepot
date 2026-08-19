/**
 * PSD Appointments Web Application
 * Performance Supply Depot - SPA with Calendar, Booking, and Auth
 */

// Configuration
const CONFIG = {
    API_BASE: window.location.hostname === 'localhost' 
        ? 'http://localhost:8083/appointments/api/v1'
        : '/appointments/api/v1',
    AUTH_SERVICE: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '',
    TOKEN_KEY: 'psd_auth_token',
    USER_KEY: 'psd_user'
};

// State Management
const state = {
    currentUser: null,
    authToken: null,
    currentView: 'calendar',
    calendarView: 'month',
    currentDate: new Date(),
    selectedDate: null,
    selectedTimeSlot: null,
    availability: [],
    bookings: [],
    leads: []
};

// DOM Elements Cache
const elements = {};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    initializeApp();
});

// Cache DOM elements for performance
function cacheElements() {
    // Screens
    elements.authScreen = document.getElementById('auth-screen');
    elements.appScreen = document.getElementById('app-screen');
    
    // Auth
    elements.authEmail = document.getElementById('auth-email');
    elements.authPassword = document.getElementById('auth-password');
    elements.loginBtn = document.getElementById('login-btn');
    elements.authError = document.getElementById('auth-error');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.userEmail = document.getElementById('user-email');
    
    // Navigation
    elements.navItems = document.querySelectorAll('.nav-item');
    
    // Views
    elements.views = document.querySelectorAll('.view');
    elements.calendarView = document.getElementById('calendar-view');
    elements.bookingsView = document.getElementById('bookings-view');
    elements.leadsView = document.getElementById('leads-view');
    
    // Calendar
    elements.calendarGrid = document.getElementById('calendar-grid');
    elements.currentMonthYear = document.getElementById('current-month-year');
    elements.prevMonth = document.getElementById('prev-month');
    elements.nextMonth = document.getElementById('next-month');
    elements.viewBtns = document.querySelectorAll('.view-btn');
    elements.availableSlots = document.getElementById('available-slots');
    
    // Booking Modal
    elements.bookingModal = document.getElementById('booking-modal');
    elements.modalClose = document.querySelector('.modal-close');
    elements.modalCancel = document.querySelector('.modal-cancel');
    elements.bookingForm = document.getElementById('booking-form');
    elements.selectedDateDisplay = document.getElementById('selected-date-display');
    elements.selectedTimeDisplay = document.getElementById('selected-time-display');
    elements.slotsContainer = document.getElementById('slots-container');
    
    // Form inputs
    elements.bookingName = document.getElementById('booking-name');
    elements.bookingEmail = document.getElementById('booking-email');
    elements.bookingPhone = document.getElementById('booking-phone');
    elements.bookingNotes = document.getElementById('booking-notes');
    
    // Lists
    elements.bookingsList = document.getElementById('bookings-list');
    elements.leadsSearchInput = document.getElementById('leads-search-input');
    elements.leadsSearchBtn = document.getElementById('leads-search-btn');
    elements.leadsResults = document.getElementById('leads-results');
    
    // Toast
    elements.toastContainer = document.getElementById('toast-container');
}

// Initialize Application
async function initializeApp() {
    // Check for existing session
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const user = localStorage.getItem(CONFIG.USER_KEY);
    
    if (token && user) {
        try {
            state.authToken = token;
            state.currentUser = JSON.parse(user);
            showApp();
            await loadInitialData();
        } catch (error) {
            console.error('Session restore failed:', error);
            showAuth();
        }
    } else {
        showAuth();
    }
    
    bindEvents();
}

// Event Binding
function bindEvents() {
    // Auth
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.authEmail.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());
    elements.authPassword.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
    
    // Calendar Controls
    elements.prevMonth.addEventListener('click', () => navigateMonth(-1));
    elements.nextMonth.addEventListener('click', () => navigateMonth(1));
    elements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => switchCalendarView(btn.dataset.calendarView));
    });
    
    // Modal
    elements.modalClose.addEventListener('click', closeBookingModal);
    elements.modalCancel.addEventListener('click', closeBookingModal);
    elements.bookingModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeBookingModal();
    });
    
    // Booking Form
    elements.bookingForm.addEventListener('submit', handleBookingSubmit);
    
    // Leads Search
    elements.leadsSearchBtn.addEventListener('click', searchLeads);
    elements.leadsSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLeads();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeBookingModal();
    });
}

// Auth Functions
async function handleLogin() {
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    setButtonLoading(elements.loginBtn, true);
    
    try {
        // Try Sentinel-Dusty auth service first
        let response = await fetch(`${CONFIG.AUTH_SERVICE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        // Fallback to appointments API auth if auth service fails
        if (!response.ok) {
            response = await fetch(`${CONFIG.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
        }
        
        if (response.ok) {
            const data = await response.json();
            state.authToken = data.access_token || data.token;
            state.currentUser = data.user || { email };
            
            localStorage.setItem(CONFIG.TOKEN_KEY, state.authToken);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.currentUser));
            
            showApp();
            await loadInitialData();
            showToast('Welcome back!', 'success');
        } else {
            const error = await response.json().catch(() => ({}));
            showAuthError(error.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Demo mode for development
        if (window.location.hostname === 'localhost') {
            state.authToken = 'demo-token';
            state.currentUser = { email, name: 'Demo User' };
            localStorage.setItem(CONFIG.TOKEN_KEY, state.authToken);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.currentUser));
            showApp();
            await loadInitialData();
            showToast('Demo mode activated', 'info');
        } else {
            showAuthError('Connection error. Please try again.');
        }
    } finally {
        setButtonLoading(elements.loginBtn, false);
    }
}

function handleLogout() {
    state.authToken = null;
    state.currentUser = null;
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    showAuth();
    showToast('Logged out successfully', 'info');
}

function showAuth() {
    elements.authScreen.classList.remove('hidden');
    elements.appScreen.classList.add('hidden');
    elements.authEmail.value = '';
    elements.authPassword.value = '';
    elements.authError.classList.remove('visible');
}

function showApp() {
    elements.authScreen.classList.add('hidden');
    elements.appScreen.classList.remove('hidden');
    elements.userEmail.textContent = state.currentUser?.email || '';
    renderCalendar();
}

function showAuthError(message) {
    elements.authError.textContent = message;
    elements.authError.classList.add('visible');
}

// View Management
function switchView(viewName) {
    state.currentView = viewName;
    
    // Update nav
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
    
    // Update views
    elements.views.forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}-view`);
    });
    
    // Load data if needed
    if (viewName === 'bookings') loadBookings();
    if (viewName === 'leads') elements.leadsSearchInput.focus();
}

function switchCalendarView(view) {
    state.calendarView = view;
    elements.viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.calendarView === view);
    });
    renderCalendar();
}

// Data Loading
async function loadInitialData() {
    await Promise.all([
        loadAvailability(),
        loadBookings()
    ]);
}

async function loadAvailability() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE}/availability`);
        if (response.ok) {
            state.availability = await response.json();
            updateAvailableSlotsCount();
            renderCalendar();
        }
    } catch (error) {
        console.error('Failed to load availability:', error);
        // Demo data
        generateDemoAvailability();
        updateAvailableSlotsCount();
        renderCalendar();
    }
}

async function loadBookings() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE}/bookings`);
        if (response.ok) {
            state.bookings = await response.json();
            renderBookings();
        }
    } catch (error) {
        console.error('Failed to load bookings:', error);
        // Demo data
        state.bookings = [];
        renderBookings();
    }
}

// Calendar Functions
function navigateMonth(direction) {
    state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const { calendarView, currentDate } = state;
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    elements.currentMonthYear.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear grid
    elements.calendarGrid.innerHTML = '';
    elements.calendarGrid.className = 'calendar-grid';
    
    if (calendarView === 'month') {
        renderMonthView();
    } else if (calendarView === 'week') {
        renderWeekView();
    } else if (calendarView === 'day') {
        renderDayView();
    }
}

function renderMonthView() {
    const { currentDate } = state;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        elements.calendarGrid.appendChild(header);
    });
    
    // Calendar days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, true);
        elements.calendarGrid.appendChild(dayEl);
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDateKey(new Date(year, month, day));
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const hasSlots = hasAvailableSlots(dateStr);
        
        const dayEl = createDayElement(day, false, isToday, hasSlots, dateStr);
        elements.calendarGrid.appendChild(dayEl);
    }
    
    // Next month days
    const totalCells = elements.calendarGrid.children.length - 7; // Exclude headers
    const remainingCells = 35 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, true);
        elements.calendarGrid.appendChild(dayEl);
    }
}

function renderWeekView() {
    elements.calendarGrid.classList.add('week-view');
    
    const { currentDate } = state;
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Empty corner
    elements.calendarGrid.appendChild(document.createElement('div'));
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        const isToday = dayDate.toDateString() === today.toDateString();
        
        const header = document.createElement('div');
        header.className = `week-day-header ${isToday ? 'today' : ''}`;
        header.innerHTML = `
            <div class="day-name">${dayNames[i]}</div>
            <div class="day-number">${dayDate.getDate()}</div>
        `;
        elements.calendarGrid.appendChild(header);
    }
    
    // Time slots
    for (let hour = 8; hour < 18; hour++) {
        // Time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-slot-label';
        timeLabel.textContent = `${hour}:00`;
        elements.calendarGrid.appendChild(timeLabel);
        
        // Day slots
        for (let i = 0; i < 7; i++) {
            const slot = document.createElement('div');
            slot.className = 'week-time-slot';
            
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dateStr = formatDateKey(dayDate);
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (isSlotAvailable(dateStr, timeStr)) {
                slot.classList.add('available');
                slot.addEventListener('click', () => openBookingModal(dayDate, timeStr));
            }
            
            elements.calendarGrid.appendChild(slot);
        }
    }
}

function renderDayView() {
    elements.calendarGrid.classList.add('day-view');
    
    const { currentDate } = state;
    const dateStr = formatDateKey(currentDate);
    
    // Day header
    const header = document.createElement('div');
    header.className = 'day-header';
    header.innerHTML = `<h3>${currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>`;
    elements.calendarGrid.appendChild(header);
    
    // Slots container
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'day-slots';
    
    const dayAvailability = getAvailabilityForDate(dateStr);
    
    if (dayAvailability.length === 0) {
        slotsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No available slots for this day</p>
            </div>
        `;
    } else {
        dayAvailability.forEach(slot => {
            const slotCard = document.createElement('div');
            slotCard.className = 'day-slot-card';
            slotCard.innerHTML = `
                <div class="time">${slot.time}</div>
                <div class="availability">${slot.available} slots available</div>
            `;
            slotCard.addEventListener('click', () => openBookingModal(currentDate, slot.time));
            slotsContainer.appendChild(slotCard);
        });
    }
    
    elements.calendarGrid.appendChild(slotsContainer);
}

function createDayElement(day, isOtherMonth, isToday = false, hasSlots = false, dateStr = null) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (hasSlots) dayEl.classList.add('has-slots');
    if (dateStr === state.selectedDate) dayEl.classList.add('selected');
    
    dayEl.innerHTML = `<div class="day-number">${day}</div>`;
    
    if (hasSlots && !isOtherMonth) {
        const count = getAvailabilityForDate(dateStr).length;
        dayEl.innerHTML += `<div class="slots-indicator">${count} slots</div>`;
    }
    
    if (!isOtherMonth && dateStr) {
        dayEl.addEventListener('click', () => {
            state.selectedDate = dateStr;
            const date = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), day);
            openBookingModal(date);
        });
    }
    
    return dayEl;
}

function hasAvailableSlots(dateStr) {
    return getAvailabilityForDate(dateStr).length > 0;
}

function getAvailabilityForDate(dateStr) {
    return state.availability.filter(a => a.date === dateStr && a.available > 0);
}

function isSlotAvailable(dateStr, timeStr) {
    return state.availability.some(a => a.date === dateStr && a.time === timeStr && a.available > 0);
}

function updateAvailableSlotsCount() {
    const today = formatDateKey(new Date());
    const count = getAvailabilityForDate(today).length;
    elements.availableSlots.textContent = count;
}

// Booking Modal
function openBookingModal(date, preselectedTime = null) {
    state.selectedTimeSlot = preselectedTime;
    
    elements.selectedDateDisplay.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    elements.selectedTimeDisplay.textContent = preselectedTime ? `at ${preselectedTime}` : 'Select a time slot';
    
    // Pre-fill user info
    if (state.currentUser) {
        elements.bookingEmail.value = state.currentUser.email || '';
        elements.bookingName.value = state.currentUser.name || '';
    }
    
    // Load time slots
    renderTimeSlots(date);
    
    elements.bookingModal.classList.remove('hidden');
    
    // Store selected date
    state.selectedDate = formatDateKey(date);
}

function closeBookingModal() {
    elements.bookingModal.classList.add('hidden');
    elements.bookingForm.reset();
    state.selectedTimeSlot = null;
    state.selectedDate = null;
}

function renderTimeSlots(date) {
    const dateStr = formatDateKey(date);
    const slots = getAvailabilityForDate(dateStr);
    
    elements.slotsContainer.innerHTML = '';
    
    if (slots.length === 0) {
        elements.slotsContainer.innerHTML = '<p class="no-slots">No available slots</p>';
        return;
    }
    
    slots.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.textContent = slot.time;
        
        if (state.selectedTimeSlot === slot.time) {
            btn.classList.add('selected');
        }
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedTimeSlot = slot.time;
            elements.selectedTimeDisplay.textContent = `at ${slot.time}`;
        });
        
        elements.slotsContainer.appendChild(btn);
    });
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (!state.selectedTimeSlot) {
        showToast('Please select a time slot', 'error');
        return;
    }
    
    const bookingData = {
        date: state.selectedDate,
        time: state.selectedTimeSlot,
        name: elements.bookingName.value.trim(),
        email: elements.bookingEmail.value.trim(),
        phone: elements.bookingPhone.value.trim(),
        notes: elements.bookingNotes.value.trim()
    };
    
    const submitBtn = elements.bookingForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast('Booking confirmed successfully!', 'success');
            closeBookingModal();
            await loadBookings();
            await loadAvailability();
        } else {
            const error = await response.json().catch(() => ({}));
            showToast(error.message || 'Failed to create booking', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        // Demo success
        showToast('Booking confirmed! (Demo mode)', 'success');
        closeBookingModal();
        
        // Add to local bookings for demo
        state.bookings.unshift({
            id: Date.now(),
            ...bookingData,
            status: 'confirmed',
            created_at: new Date().toISOString()
        });
        renderBookings();
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Bookings List
function renderBookings() {
    if (state.bookings.length === 0) {
        elements.bookingsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No bookings yet</p>
                <p>Schedule your first appointment from the Calendar</p>
            </div>
        `;
        return;
    }
    
    elements.bookingsList.innerHTML = state.bookings.map(booking => {
        const date = new Date(booking.date);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return `
            <div class="booking-card">
                <div class="booking-date">
                    <div class="day">${date.getDate()}</div>
                    <div class="month">${monthNames[date.getMonth()]}</div>
                </div>
                <div class="booking-info">
                    <h4>${booking.name}</h4>
                    <p>📧 ${booking.email} | 🕐 ${booking.time} | 📱 ${booking.phone || 'N/A'}</p>
                    ${booking.notes ? `<p>📝 ${booking.notes}</p>` : ''}
                </div>
                <div class="booking-status ${booking.status || 'confirmed'}">
                    ${booking.status || 'confirmed'}
                </div>
            </div>
        `;
    }).join('');
}

// Leads Search
async function searchLeads() {
    const query = elements.leadsSearchInput.value.trim();
    
    if (!query) {
        showToast('Please enter a search term', 'error');
        return;
    }
    
    setButtonLoading(elements.leadsSearchBtn, true);
    
    try {
        const response = await fetchWithAuth(
            `${CONFIG.API_BASE}/leads/search?q=${encodeURIComponent(query)}`
        );
        
        if (response.ok) {
            state.leads = await response.json();
            renderLeads();
        } else {
            showToast('Failed to search leads', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        // Demo data
        state.leads = [
            { id: 1, name: 'John Doe', email: 'john@example.com', company: 'Acme Corp', phone: '+1234567890' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', company: 'Tech Inc', phone: '+0987654321' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', company: 'Sales Co', phone: '+1122334455' }
        ].filter(l => 
            l.name.toLowerCase().includes(query.toLowerCase()) ||
            l.email.toLowerCase().includes(query.toLowerCase()) ||
            l.company.toLowerCase().includes(query.toLowerCase())
        );
        renderLeads();
    } finally {
        setButtonLoading(elements.leadsSearchBtn, false);
    }
}

function renderLeads() {
    if (state.leads.length === 0) {
        elements.leadsResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No leads found</p>
            </div>
        `;
        return;
    }
    
    elements.leadsResults.innerHTML = state.leads.map(lead => `
        <div class="lead-card">
            <div class="lead-info">
                <h4>${lead.name}</h4>
                <p>📧 ${lead.email} | 🏢 ${lead.company || 'N/A'} | 📱 ${lead.phone || 'N/A'}</p>
            </div>
            <div class="lead-actions">
                <button class="btn btn-outline" onclick="bookForLead(${lead.id})">Book</button>
            </div>
        </div>
    `).join('');
}

function bookForLead(leadId) {
    const lead = state.leads.find(l => l.id === leadId);
    if (lead) {
        switchView('calendar');
        setTimeout(() => {
            elements.bookingName.value = lead.name;
            elements.bookingEmail.value = lead.email;
            elements.bookingPhone.value = lead.phone || '';
        }, 100);
    }
}

// Utility Functions
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${state.authToken}`,
        ...options.headers
    };
    
    return fetch(url, { ...options, headers });
}

function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

function setButtonLoading(btn, loading) {
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Demo Data Generation
function generateDemoAvailability() {
    const today = new Date();
    state.availability = [];
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = formatDateKey(date);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Generate slots for each day
        for (let hour = 9; hour <= 17; hour++) {
            if (Math.random() > 0.3) { // 70% chance of availability
                state.availability.push({
                    date: dateStr,
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    available: Math.floor(Math.random() * 3) + 1
                });
            }
        }
    }
}

// Expose functions for inline handlers
window.bookForLead = bookForLead;
