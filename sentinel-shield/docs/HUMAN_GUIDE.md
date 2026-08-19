# Sentinel Shield - Human User Guide

Welcome to Sentinel Shield! This guide will help you use the authentication system.

---

## For End Users

### Creating an Account

1. Go to your organization's login page
2. Click "Create Account" or "Sign Up"
3. Enter your email address
4. Choose a strong password (minimum 8 characters, include uppercase, numbers, symbols)
5. Verify your email address (check your inbox for verification link)

### Logging In

1. Enter your email address
2. Enter your password
3. Click "Sign In"
4. If MFA is enabled, enter the code from your authenticator app

### Forgot Password?

1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check your email for reset instructions
4. Click the link and set a new password

### Setting Up MFA (Two-Factor Authentication)

1. Go to Account Settings
2. Click "Enable MFA"
3. Scan the QR code with Google Authenticator, Authy, or similar app
4. Enter the 6-digit code from your app
5. Save backup codes in a secure location

**Important:** Never share your MFA codes with anyone, including support staff.

---

## For Administrators

### Dashboard Overview

The admin dashboard provides:
- **User Management** - Add, edit, disable users
- **Session Control** - View and revoke active sessions
- **Security Monitoring** - Real-time threat alerts
- **Audit Logs** - Complete activity history
- **System Health** - Service status and metrics

### Adding a New User

1. Login to the admin dashboard
2. Go to "Users" → "Add User"
3. Enter user's email and name
4. Set initial password (user will be prompted to change)
5. Select role (User, Admin, or custom)
6. Click "Create"

### Managing Sessions

1. Go to "Sessions" in the dashboard
2. View all active user sessions
3. To revoke a session:
   - Find the user
   - Click "Revoke"
   - Confirm action
4. To revoke all sessions for a user:
   - Click "Revoke All"
   - User will need to login again

### Viewing Security Alerts

1. Go to "Security" in the dashboard
2. View active threats and alerts
3. Alerts include:
   - Multiple failed login attempts
   - Suspicious IP addresses
   - Unusual login times
   - Password breach notifications

### Reviewing Audit Logs

1. Go to "Audit Logs" in the dashboard
2. Filter by:
   - Date range
   - Event type (Login, Logout, Password Change, etc.)
   - User
3. Export logs for compliance reporting

---

## Common Tasks

### Changing Your Password

1. Login to your account
2. Go to Account Settings
3. Click "Change Password"
4. Enter current password
5. Enter new password (must meet security requirements)
6. Confirm new password
7. Click "Update"

### Updating Your Profile

1. Login to your account
2. Go to Account Settings
3. Update:
   - First name
   - Last name
   - Company
   - Phone number
4. Click "Save Changes"

### Linking Social Accounts

1. Go to Account Settings → Connected Accounts
2. Click "Connect" next to Google, Microsoft, or Apple
3. Follow the OAuth provider's prompts
4. Your accounts are now linked

### Unlinking Social Accounts

1. Go to Account Settings → Connected Accounts
2. Click "Disconnect" next to the provider
3. Confirm action

---

## Troubleshooting

### Can't Login?

**Check these things:**
1. Caps Lock is off
2. Email address is correct (no typos)
3. Password is correct
4. Account hasn't been locked (wait 15 minutes after 5 failed attempts)

**Still can't login?**
- Use "Forgot Password" to reset
- Contact your administrator

### MFA Code Not Working?

1. Check your phone's time is correct (auto-sync)
2. Try the next code in your authenticator app
3. Use a backup code if available
4. Contact administrator to reset MFA

### Account Locked?

After 5 failed login attempts, your account is locked for 15 minutes.
- Wait 15 minutes and try again
- Or contact your administrator to unlock immediately

### Not Receiving Emails?

**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Your email provider isn't blocking messages
4. Corporate firewall isn't blocking the domain

---

## Security Best Practices

### For Users

✅ **DO:**
- Use a unique password (not reused elsewhere)
- Enable MFA on your account
- Log out when finished (especially on shared computers)
- Report suspicious emails or login attempts
- Keep your backup codes safe

❌ **DON'T:**
- Share your password with anyone
- Use "Remember me" on public computers
- Click suspicious links in emails
- Ignore security alerts

### For Administrators

✅ **DO:**
- Regularly review audit logs
- Enable MFA for all admin accounts
- Set strong password policies
- Monitor security alerts daily
- Keep backup of user database
- Test disaster recovery procedures

❌ **DON'T:**
- Give admin access unnecessarily
- Ignore failed login spikes
- Use default passwords
- Share admin credentials
- Disable security features for convenience

---

## Getting Help

### End Users
- Contact your organization's IT department
- Check the help desk portal
- Email: support@yourcompany.com

### Administrators
- Technical Documentation: docs.psdepot.com
- Support Email: support@psdepot.com
- Emergency Support: enterprise customers only

---

## Glossary

- **MFA** - Multi-Factor Authentication (also called 2FA)
- **OAuth** - Standard for secure delegated access
- **JWT** - JSON Web Token (session token)
- **CSRF** - Cross-Site Request Forgery protection
- **Session** - Your active login period
- **Audit Log** - Record of all security events
- **Rate Limiting** - Protection against brute force attacks
- **Breach Detection** - Checking passwords against known compromised databases

---

*Your security is our priority. When in doubt, ask!*
