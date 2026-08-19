# Sentinel Shield - Agent Implementation Guide

Integrate Sentinel Shield authentication into your applications.

---

## Universal Protection Wrapper

### Nginx Reverse Proxy

```nginx
# /etc/nginx/conf.d/sentinel-shield.conf

upstream sentinel_backend {
    server localhost:3001;
}

# Auth verification endpoint
location = /auth/verify {
    internal;
    proxy_pass http://sentinel_backend/api/auth/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Original-Method $request_method;
    proxy_set_header Authorization $http_authorization;
}

# Protected application
server {
    listen 80;
    server_name app.yourcompany.com;

    location / {
        auth_request /auth/verify;
        auth_request_set $auth_user $upstream_http_x_user_id;
        auth_request_set $auth_email $upstream_http_x_user_email;
        
        proxy_set_header X-User-Id $auth_user;
        proxy_set_header X-User-Email $auth_email;
        proxy_pass http://your_backend;
    }
}
```

### Express.js Middleware

```javascript
// middleware/sentinelAuth.js
const axios = require('axios');

const SENTINEL_API = process.env.SENTINEL_API || 'http://localhost:3001';

async function requireAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Verify token with Sentinel Shield
        const response = await axios.get(`${SENTINEL_API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Attach user to request
        req.user = response.data;
        next();
        
    } catch (err) {
        if (err.response?.status === 401) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
}

module.exports = { requireAuth };
```

### Usage in Routes

```javascript
const express = require('express');
const { requireAuth } = require('./middleware/sentinelAuth');

const router = express.Router();

// Public route
router.get('/public', (req, res) => {
    res.json({ message: 'Hello World' });
});

// Protected route
router.get('/protected', requireAuth, (req, res) => {
    res.json({ 
        message: 'Secret data',
        user: req.user
    });
});

// Admin only
router.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.json({ message: 'Admin only' });
});

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
```

---

## API Integration

### Authentication Flow

```javascript
// client/auth.js

const API_BASE = 'https://auth.yourcompany.com';

class SentinelAuth {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
    }
    
    async login(email, password) {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.accessToken = data.accessToken;
            this.refreshToken = data.refreshToken;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        return data;
    }
    
    async refreshToken() {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                refreshToken: localStorage.getItem('refreshToken') 
            })
        });
        
        const data = await response.json();
        
        if (data.accessToken) {
            this.accessToken = data.accessToken;
            localStorage.setItem('accessToken', data.accessToken);
        }
        
        return data;
    }
    
    async apiRequest(url, options = {}) {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Token expired, try refresh
        if (response.status === 401) {
            await this.refreshToken();
            // Retry request
            return this.apiRequest(url, options);
        }
        
        return response;
    }
    
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.accessToken = null;
        this.refreshToken = null;
    }
}

// Usage
const auth = new SentinelAuth();

// Login
await auth.login('user@example.com', 'password');

// Make authenticated request
const response = await auth.apiRequest('/api/protected/data');
```

---

## Webhook Integration

```javascript
// Configure webhooks
const webhookConfig = {
    url: 'https://your-app.com/webhooks/sentinel',
    events: ['user.login', 'user.logout', 'user.password_change', 'security.alert'],
    secret: 'your-webhook-secret'
};

// Webhook handler
app.post('/webhooks/sentinel', (req, res) => {
    // Verify signature
    const signature = req.headers['x-sentinel-signature'];
    const payload = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', webhookConfig.secret)
        .update(payload)
        .digest('hex');
    
    if (signature !== expected) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Handle event
    const event = req.body;
    
    switch (event.type) {
        case 'user.login':
            console.log(`User ${event.user.email} logged in`);
            break;
        case 'security.alert':
            console.warn(`Security alert: ${event.alert.type}`);
            // Send notification to security team
            break;
    }
    
    res.json({ received: true });
});
```

---

## Session Management

```javascript
// Session store integration
const session = require('express-session');
const SentinelStore = require('sentinel-shield/session-store');

app.use(session({
    store: new SentinelStore({
        sentinelUrl: 'http://localhost:3001',
        apiKey: process.env.SENTINEL_API_KEY
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true }
}));
```

---

## Protected Resources

```javascript
// Resource-level protection
const createProtectedResource = (resourceType) => {
    return async (req, res, next) => {
        const user = req.user;
        const resource = req.params.id;
        
        // Check permissions with Sentinel
        const allowed = await fetch(`${SENTINEL_API}/api/permissions/check`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${req.token}` },
            body: JSON.stringify({ user: user.id, resource, action: req.method })
        });
        
        if (!allowed.ok) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        next();
    };
};

// Use in routes
router.get('/documents/:id', 
    requireAuth, 
    createProtectedResource('document'),
    getDocument
);
```

---

## Best Practices

### 1. Always Use HTTPS
```javascript
// Redirect HTTP to HTTPS
if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
}
```

### 2. Secure Token Storage
```javascript
// Use httpOnly cookies instead of localStorage for better security
res.cookie('accessToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 900000 // 15 minutes
});
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts
});

app.use('/login', authLimiter);
```

### 4. Audit Logging
```javascript
// Log all authentication events
app.use((req, res, next) => {
    if (req.user) {
        console.log(`[${new Date().toISOString()}] ${req.user.email} - ${req.method} ${req.path}`);
    }
    next();
});
```

---

## Testing

```javascript
// Test authentication
const request = require('supertest');

describe('Authentication', () => {
    test('should reject unauthenticated request', async () => {
        const res = await request(app)
            .get('/protected')
            .expect(401);
    });
    
    test('should allow authenticated request', async () => {
        const token = await getTestToken();
        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired or invalid - refresh token |
| 403 Forbidden | User lacks permissions - check role |
| 500 Sentinel Error | Auth service down - implement fallback |
| CORS errors | Configure allowed origins in Sentinel Shield |

---

## Support

- API Docs: https://docs.psdepot.com/api
- Agent SDK: npm install sentinel-shield-agent
- Support: agents@psdepot.com

---

*Protect any app in minutes.*
