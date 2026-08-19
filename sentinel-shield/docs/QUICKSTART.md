# Sentinel Shield - Quick Start Guide

Get enterprise authentication running in 5 minutes.

---

## Option 1: Docker Compose (Recommended)

### Prerequisites
- Docker & Docker Compose installed
- 512MB RAM available
- Port 3001 available

### Deploy

```bash
# Clone repository
git clone https://github.com/psdepot/sentinel-shield.git
cd sentinel-shield

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required environment variables:**
```env
JWT_ACCESS_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-refresh-here
BCRYPT_PEPPER=your-pepper-secret-here
FRONTEND_URL=https://your-domain.com
```

**Optional OAuth providers:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
MICROSOFT_CLIENT_ID=your-ms-client-id
MICROSOFT_CLIENT_SECRET=your-ms-secret
```

```bash
# Start services
docker-compose up -d

# Verify running
curl http://localhost:3001/api/health
```

**Access:**
- Auth API: http://localhost:3001
- Admin Dashboard: http://localhost:3001/admin

---

## Option 2: Traditional Node.js

### Prerequisites
- Node.js 18+ installed
- SQLite3
- 256MB RAM

### Install

```bash
# Clone repository
git clone https://github.com/psdepot/sentinel-shield.git
cd sentinel-shield

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env

# Start server
npm start
```

Server runs on port 3001.

---

## Option 3: Kubernetes

### Prerequisites
- Kubernetes cluster
- kubectl configured

### Deploy

```bash
# Create namespace
kubectl create namespace sentinel-shield

# Apply manifests
kubectl apply -f deployment/k8s/namespace.yaml
kubectl apply -f deployment/k8s/configmap.yaml
kubectl apply -f deployment/k8s/secret.yaml
kubectl apply -f deployment/k8s/deployment.yaml
kubectl apply -f deployment/k8s/service.yaml
kubectl apply -f deployment/k8s/ingress.yaml

# Verify
kubectl get pods -n sentinel-shield
```

---

## Initial Setup

### 1. Create Admin User

```bash
# Using the CLI
node scripts/create-admin.js admin@yourcompany.com "Your Name" "SecurePassword123!"
```

### 2. Access Admin Dashboard

1. Navigate to `https://your-domain.com/admin`
2. Login with admin credentials
3. Configure settings:
   - Email SMTP settings
   - OAuth providers
   - Rate limiting
   - Session policies

### 3. Protect Your Application

**Nginx Configuration:**
```nginx
location /api/ {
    auth_request /auth/verify;
    auth_request_set $auth_user $upstream_http_x_user_id;
    proxy_set_header X-User-Id $auth_user;
    proxy_pass http://your-backend;
}

location /auth/verify {
    internal;
    proxy_pass http://localhost:3001/api/auth/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
}
```

**Express.js Middleware:**
```javascript
const { requireAuth } = require('sentinel-shield');

// Protect all routes
app.use(requireAuth);

// Or specific routes
app.use('/api/protected', requireAuth);
```

---

## Configuration

### Database

Default: SQLite (./data/auth.db)

For production, use PostgreSQL:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sentinel_shield
```

### Security Settings

```env
# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true

# Session Settings
SESSION_TIMEOUT=900000  # 15 minutes
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000  # 15 minutes

# Token Settings
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Email Configuration

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

---

## Verification

Test your deployment:

```bash
# Health check
curl http://localhost:3001/api/health

# Register test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123!"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123!"}'
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
docker logs sentinel-shield-auth

# Verify port not in use
lsof -i :3001

# Check environment variables
node scripts/verify-config.js
```

### Database errors

```bash
# Reset database (WARNING: Deletes all data!)
rm data/auth.db
npm run migrate
```

### Port conflicts

Change port in .env:
```env
PORT=3002
```

---

## Next Steps

- [Configure OAuth Providers](docs/oauth-setup.md)
- [Setup MFA](docs/mfa-setup.md)
- [Integrate with Your App](docs/integration.md)
- [Admin Dashboard Guide](docs/admin-guide.md)
- [Security Best Practices](docs/security.md)

---

## Support

- 📧 support@psdepot.com
- 💬 Discord: discord.gg/sentinel-shield
- 📖 Docs: docs.psdepot.com

---

*Deploy in 5 minutes. Secure for a lifetime.*
