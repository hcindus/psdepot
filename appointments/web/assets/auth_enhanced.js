/**
 * PSD Appointments AuthAPI - Enterprise Enhanced
 * Secure Authentication with RBAC, MFA, and Audit Logging
 */

// DEMO MODE: Set to false for production
const DEMO_MODE = false;

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

const ADMIN_API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3002'
    : '/api/admin';

// Role hierarchy (higher = more access)
const ROLE_HIERARCHY = {
    'super_admin': 4,
    'admin': 3,
    'manager': 2,
    'user': 1
};

// Permission definitions
const PERMISSIONS = {
    'users:read': ['super_admin', 'admin', 'manager'],
    'users:write': ['super_admin', 'admin'],
    'users:delete': ['super_admin'],
    'audit:read': ['super_admin', 'admin', 'manager'],
    'settings:write': ['super_admin'],
};

let csrfToken = null;
let refreshPromise = null;

/**
 * RBAC Helper Functions
 */
function hasPermission(userRole, permission) {
    if (userRole === 'super_admin') return true;
    const allowed = PERMISSIONS[permission] || [];
    return allowed.includes(userRole);
}

function hasRoleLevel(userRole, minRole) {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}

/**
 * Get CSRF token for request protection
 */
async function getCsrfToken() {
    if (!csrfToken) {
        try {
            const response = await fetch(`${API_BASE}/csrf-token`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to get CSRF token');
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (err) {
            console.error('CSRF token fetch failed:', err);
            csrfToken = 'fallback-csrf';
        }
    }
    return csrfToken;
}

/**
 * Generate device fingerprint for security tracking
 */
function getDeviceFingerprint() {
    const data = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        !!window.localStorage,
        !!window.sessionStorage
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16) + '-' + Date.now().toString(36);
}

/**
 * Get stored tokens from localStorage or sessionStorage
 */
function getStoredTokens() {
    const storage = localStorage.getItem('psd_rememberMe') === 'true' ? localStorage : sessionStorage;
    return {
        accessToken: storage.getItem('psd_accessToken'),
        refreshToken: storage.getItem('psd_refreshToken'),
        tokenExpiry: parseInt(storage.getItem('psd_tokenExpiry') || '0')
    };
}

/**
 * Store tokens securely
 */
function storeTokens(accessToken, refreshToken, expiresIn, rememberMe = false, user = null) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('psd_accessToken', accessToken);
    storage.setItem('psd_refreshToken', refreshToken);
    storage.setItem('psd_tokenExpiry', Date.now() + (expiresIn * 1000));
    if (rememberMe) {
        storage.setItem('psd_rememberMe', 'true');
    }
    if (user) {
        storage.setItem('psd_user', JSON.stringify(user));
    }
}

/**
 * Clear all stored tokens
 */
function clearTokens() {
    ['psd_accessToken', 'psd_refreshToken', 'psd_tokenExpiry', 'psd_user', 'psd_rememberMe'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

/**
 * Check if token is expiring soon
 */
function isTokenExpiringSoon() {
    const { tokenExpiry } = getStoredTokens();
    if (!tokenExpiry) return true;
    return Date.now() > (tokenExpiry - 300000); // 5 minutes buffer
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;
    
    refreshPromise = (async () => {
        try {
            const { refreshToken } = getStoredTokens();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Fingerprint': getDeviceFingerprint()
                },
                credentials: 'include',
                body: JSON.stringify({ refreshToken })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    clearTokens();
                    window.location.href = '/appointments/web/login.html';
                }
                throw new Error('Token refresh failed');
            }
            
            const data = await response.json();
            storeTokens(data.accessToken, data.refreshToken, data.expiresIn, 
                localStorage.getItem('psd_rememberMe') === 'true');
            
            return data.accessToken;
        } finally {
            refreshPromise = null;
        }
    })();
    
    return refreshPromise;
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const csrf = await getCsrfToken();
    const { accessToken } = getStoredTokens();
    
    // Check if token needs refresh
    if (accessToken && isTokenExpiringSoon() && !endpoint.includes('/auth/refresh')) {
        await refreshAccessToken();
    }
    
    const currentToken = getStoredTokens().accessToken || accessToken;
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': csrf,
        'X-Device-Fingerprint': getDeviceFingerprint(),
        ...options.headers
    };
    
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
    });
    
    // Handle 401 - try to refresh token once
    if (response.status === 401 && !endpoint.includes('/auth/')) {
        try {
            await refreshAccessToken();
            const newToken = getStoredTokens().accessToken;
            headers['Authorization'] = `Bearer ${newToken}`;
            
            const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include'
            });
            
            const data = await retryResponse.json();
            return { success: retryResponse.ok, status: retryResponse.status, ...data };
        } catch (refreshErr) {
            clearTokens();
            window.location.href = '/appointments/web/login.html?expired=true';
            throw new Error('Session expired. Please sign in again.');
        }
    }
    
    const data = await response.json().catch(() => ({}));
    return { success: response.ok, status: response.status, ...data };
}

/**
 * Auth API Methods
 */
const AuthAPI = {
    /**
     * Register new user
     */
    async register({ email, password, firstName, lastName, company }) {
        if (DEMO_MODE) {
            const demoUser = {
                id: 'demo-user-' + Date.now(),
                email,
                name: `${firstName} ${lastName}`,
                company,
                role: 'user'
            };
            const demoToken = 'demo-jwt-token-' + Date.now();
            storeTokens(demoToken, demoToken, 3600, false, demoUser);
            return {
                success: true,
                message: 'Account created successfully (Demo Mode)',
                user: demoUser,
                accessToken: demoToken,
                refreshToken: demoToken,
                expiresIn: 3600
            };
        }
        
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, firstName, lastName, company })
        });
    },
    
    /**
     * Login user
     */
    async login({ email, password, rememberMe = false }) {
        if (DEMO_MODE) {
            const demoUser = {
                id: 'demo-user-001',
                email: email || 'demo@psdepot.com',
                name: 'Demo User',
                role: 'super_admin'  // Demo as admin
            };
            const demoToken = 'demo-jwt-token-' + Date.now();
            storeTokens(demoToken, demoToken, 3600, rememberMe, demoUser);
            return {
                success: true,
                user: demoUser,
                accessToken: demoToken,
                refreshToken: demoToken,
                expiresIn: 3600
            };
        }
        
        const result = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        if (result.success && result.accessToken) {
            storeTokens(result.accessToken, result.refreshToken, result.expiresIn, rememberMe, result.user);
        }
        
        return result;
    },
    
    /**
     * Logout user
     */
    async logout() {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            clearTokens();
        }
    },
    
    /**
     * Verify MFA code
     */
    async verifyMFA(code) {
        return apiRequest('/auth/mfa/verify', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    },
    
    /**
     * Setup MFA
     */
    async setupMFA() {
        return apiRequest('/auth/mfa/setup', { method: 'POST' });
    },
    
    /**
     * Get current user
     */
    getCurrentUser() {
        const storage = localStorage.getItem('psd_rememberMe') === 'true' ? localStorage : sessionStorage;
        const user = storage.getItem('psd_user');
        return user ? JSON.parse(user) : null;
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const { accessToken } = getStoredTokens();
        return !!accessToken;
    },
    
    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        const user = this.getCurrentUser();
        return user ? hasPermission(user.role, permission) : false;
    },
    
    /**
     * Check if user has role level
     */
    hasRoleLevel(minRole) {
        const user = this.getCurrentUser();
        return user ? hasRoleLevel(user.role, minRole) : false;
    },
    
    /**
     * Redirect to admin if user has admin access
     */
    redirectToAdminIfAuthorized() {
        if (this.hasRoleLevel('admin')) {
            window.location.href = '/appointments/admin/';
            return true;
        }
        return false;
    },
    
    /**
     * Get stored access token
     */
    getAccessToken() {
        return getStoredTokens().accessToken;
    }
};

/**
 * Admin API Methods
 */
const AdminAPI = {
    /**
     * List users
     */
    async listUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${ADMIN_API_BASE}/users?${queryString}`, {
            headers: { 'Authorization': `Bearer ${AuthAPI.getAccessToken()}` }
        });
        return response.json();
    },
    
    /**
     * Create user
     */
    async createUser(userData) {
        const response = await fetch(`${ADMIN_API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthAPI.getAccessToken()}`
            },
            body: JSON.stringify(userData)
        });
        return response.json();
    },
    
    /**
     * Update user
     */
    async updateUser(userId, updates) {
        const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthAPI.getAccessToken()}`
            },
            body: JSON.stringify(updates)
        });
        return response.json();
    },
    
    /**
     * Delete user
     */
    async deleteUser(userId) {
        const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AuthAPI.getAccessToken()}` }
        });
        return response.json();
    },
    
    /**
     * Get audit logs
     */
    async getAuditLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${ADMIN_API_BASE}/audit-logs?${queryString}`, {
            headers: { 'Authorization': `Bearer ${AuthAPI.getAccessToken()}` }
        });
        return response.json();
    },
    
    /**
     * Get dashboard stats
     */
    async getStats() {
        const response = await fetch(`${ADMIN_API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${AuthAPI.getAccessToken()}` }
        });
        return response.json();
    }
};

/**
 * Session Management
 */
const SessionManager = {
    init() {
        this.checkSession();
        
        // Periodic token refresh check
        setInterval(() => {
            if (AuthAPI.isAuthenticated() && isTokenExpiringSoon()) {
                refreshAccessToken().catch(() => {});
            }
        }, 60000);
        
        // Activity tracking
        this.trackActivity();
    },
    
    checkSession() {
        const { accessToken, tokenExpiry } = getStoredTokens();
        
        if (!accessToken) return false;
        
        if (Date.now() > tokenExpiry) {
            refreshAccessToken().catch(() => {
                clearTokens();
                window.location.href = '/appointments/web/login.html?expired=true';
            });
            return false;
        }
        
        return true;
    },
    
    trackActivity() {
        let activityTimeout;
        const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
        
        const resetTimer = () => {
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(() => {
                AuthAPI.logout().then(() => {
                    window.location.href = '/appointments/web/login.html?timeout=true';
                });
            }, INACTIVITY_LIMIT);
        };
        
        ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer();
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    getCsrfToken().catch(console.error);
    SessionManager.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthAPI, AdminAPI, SessionManager, hasPermission, hasRoleLevel };
}
