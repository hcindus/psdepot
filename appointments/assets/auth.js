/**
 * PSD Appointments AuthAPI
 * Secure Authentication Client Library
 * Connects to Sentinel-Dusty Auth Service (port 3000)
 */

// DEMO MODE: Set to false for production
const DEMO_MODE = false;

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : '/auth-api';

let csrfToken = null;
let refreshPromise = null;

/**
 * Get CSRF token for request protection
 */
async function getCsrfToken() {
    if (!csrfToken) {
        try {
            const response = await fetch(`${API_BASE}/csrf-token`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to get CSRF token');
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (err) {
            console.error('CSRF token fetch failed:', err);
            // Continue without CSRF protection if endpoint unavailable
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
    
    // Simple hash for fingerprinting
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
function storeTokens(accessToken, refreshToken, expiresIn, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('psd_accessToken', accessToken);
    storage.setItem('psd_refreshToken', refreshToken);
    storage.setItem('psd_tokenExpiry', Date.now() + (expiresIn * 1000));
    if (rememberMe) {
        localStorage.setItem('psd_rememberMe', 'true');
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
 * Check if token is expired or about to expire (within 5 minutes)
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
            
            const csrf = await getCsrfToken();
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrf,
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
            // Retry request with new token
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
     * Register new user with company details
     */
    async register({ email, password, firstName, lastName, company, newsletter = false }) {
        // DEMO MODE: Auto-create demo user
        if (DEMO_MODE) {
            console.log('DEMO MODE: Registering demo user');
            const demoUser = {
                id: 'demo-user-' + Date.now(),
                email: email,
                name: `${firstName} ${lastName}`,
                company: company,
                role: 'user'
            };
            const demoToken = 'demo-jwt-token-' + Date.now();
            storeTokens(demoToken, demoToken, 3600, false);
            sessionStorage.setItem('psd_user', JSON.stringify(demoUser));
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
            body: JSON.stringify({
                email,
                password,
                firstName,
                lastName,
                company,
                newsletter
            })
        });
    },
    
    /**
     * Login user
     */
    async login({ email, password, rememberMe = false }) {
        // DEMO MODE: Allow any email/password
        if (DEMO_MODE) {
            console.log('DEMO MODE: Logging in as demo user');
            const demoUser = {
                id: 'demo-user-001',
                email: email || 'demo@psdepot.com',
                name: 'Demo User',
                company: 'Performance Supply Depot',
                role: 'admin'
            };
            const demoToken = 'demo-jwt-token-' + Date.now();
            storeTokens(demoToken, demoToken, 3600, rememberMe);
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('psd_user', JSON.stringify(demoUser));
            storage.setItem('psd_rememberMe', rememberMe ? 'true' : 'false');
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
            storeTokens(result.accessToken, result.refreshToken, result.expiresIn, rememberMe);
            
            // Store user info
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('psd_user', JSON.stringify(result.user));
            storage.setItem('psd_rememberMe', rememberMe ? 'true' : 'false');
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
     * Request password reset
     */
    async requestPasswordReset(email, securityAnswer) {
        return apiRequest('/auth/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email, securityAnswer })
        });
    },
    
    /**
     * Verify password reset token
     */
    async verifyResetToken(token) {
        return apiRequest('/auth/password-reset/verify', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    },
    
    /**
     * Confirm password reset
     */
    async confirmPasswordReset(token, newPassword) {
        return apiRequest('/auth/password-reset/confirm', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword })
        });
    },
    
    /**
     * Check password against breach database
     */
    async checkPasswordBreach(password) {
        // Hash first 5 chars of SHA-1 for k-anonymity
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);
        
        try {
            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            const text = await response.text();
            const breached = text.split('\n').some(line => {
                const [hashSuffix] = line.split(':');
                return hashSuffix === suffix;
            });
            return { breached };
        } catch (err) {
            // Fail open - don't block if breach service unavailable
            return { breached: false, error: true };
        }
    },
    
    /**
     * Resend verification email
     */
    async resendVerification(email) {
        return apiRequest('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
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
        return apiRequest('/auth/mfa/setup', {
            method: 'POST'
        });
    },
    
    /**
     * Get current user from storage
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
     * Verify token validity
     */
    async verifyToken(token) {
        try {
            const result = await apiRequest('/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return result.valid;
        } catch {
            return false;
        }
    },
    
    /**
     * Get stored access token
     */
    getAccessToken() {
        return getStoredTokens().accessToken;
    }
};

// Session management utilities
const SessionManager = {
    /**
     * Initialize session checks
     */
    init() {
        // Check for expired session on page load
        this.checkSession();
        
        // Periodic token refresh check
        setInterval(() => {
            if (AuthAPI.isAuthenticated() && isTokenExpiringSoon()) {
                refreshAccessToken().catch(() => {
                    // Silent fail - will catch on next request
                });
            }
        }, 60000); // Check every minute
        
        // Activity tracking for session timeout
        this.trackActivity();
    },
    
    /**
     * Check current session validity
     */
    checkSession() {
        const { accessToken, tokenExpiry } = getStoredTokens();
        
        if (!accessToken) return false;
        
        if (Date.now() > tokenExpiry) {
            // Token expired, try to refresh
            refreshAccessToken().catch(() => {
                clearTokens();
                window.location.href = '/appointments/web/login.html?expired=true';
            });
            return false;
        }
        
        return true;
    },
    
    /**
     * Track user activity for session management
     */
    trackActivity() {
        let activityTimeout;
        const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
        
        const resetTimer = () => {
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(() => {
                // Logout after inactivity
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
    // Pre-fetch CSRF token
    getCsrfToken().catch(console.error);
    
    // Initialize session management
    SessionManager.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthAPI, SessionManager, getDeviceFingerprint };
}