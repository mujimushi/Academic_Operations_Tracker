# NUST Academic Operations Tracker — Deployment Guide

**For:** System Administrator
**System:** On-premises Windows Server deployment
**Repository:** https://github.com/mujimushi/Academic_Operations_Tracker

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Setup](#2-server-setup)
3. [Clone & Install](#3-clone--install)
4. [Database Setup (MySQL)](#4-database-setup-mysql)
5. [Environment Configuration](#5-environment-configuration)
6. [Microsoft 365 SSO Setup (Azure AD)](#6-microsoft-365-sso-setup-azure-ad)
7. [Run Database Migration & Seed](#7-run-database-migration--seed)
8. [Build & Start the Application](#8-build--start-the-application)
9. [SMTP Email Configuration](#9-smtp-email-configuration)
10. [Firebase Push Notifications (Optional)](#10-firebase-push-notifications-optional)
11. [Cron Jobs Setup (Windows Task Scheduler)](#11-cron-jobs-setup-windows-task-scheduler)
12. [Reverse Proxy (IIS / Nginx)](#12-reverse-proxy-iis--nginx)
13. [SSL/HTTPS Certificate](#13-sslhttps-certificate)
14. [File Upload Storage](#14-file-upload-storage)
15. [Backup Strategy](#15-backup-strategy)
16. [First Login & Admin Setup](#16-first-login--admin-setup)
17. [User Registration Guide](#17-user-registration-guide)
18. [Troubleshooting](#18-troubleshooting)
19. [Maintenance & Updates](#19-maintenance--updates)

---

## 1. Prerequisites

Install these on the Windows Server before proceeding:

| Software | Minimum Version | Download |
|----------|----------------|----------|
| **Node.js** | 18.18+ (LTS recommended) | https://nodejs.org/ |
| **MySQL** | 8.0+ | https://dev.mysql.com/downloads/installer/ |
| **Git** | 2.40+ | https://git-scm.com/download/win |

Verify installations:
```powershell
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
mysql --version   # Should show 8.x
git --version     # Should show 2.x
```

---

## 2. Server Setup

### Required ports:
- **3000** — Application (internal, behind reverse proxy)
- **80/443** — Reverse proxy (external-facing)
- **3306** — MySQL (internal only, not exposed)

### Create application directory:
```powershell
mkdir C:\apps\academic-tracker
```

### Create a dedicated Windows service account (recommended):
Create a local user `svc-tracker` that will run the application process. This account needs:
- Read/write access to the application directory
- Read/write access to the upload storage directory
- Network access to MySQL on localhost

---

## 3. Clone & Install

```powershell
cd C:\apps\academic-tracker
git clone https://github.com/mujimushi/Academic_Operations_Tracker.git .
cd academic-operations-tracker
npm install
```

This installs all dependencies (~200MB). Wait for it to complete without errors.

---

## 4. Database Setup (MySQL)

### 4.1 Create the database and user

Open MySQL as root:
```powershell
mysql -u root -p
```

Run these SQL commands:
```sql
-- Create the database
CREATE DATABASE academic_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create a dedicated application user (change the password!)
CREATE USER 'aot_app'@'localhost' IDENTIFIED BY 'CHANGE_THIS_TO_A_STRONG_PASSWORD';

-- Grant permissions
GRANT ALL PRIVILEGES ON academic_tracker.* TO 'aot_app'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 4.2 Verify the connection

```powershell
mysql -u aot_app -p -D academic_tracker -e "SELECT 1;"
```

Should return `1` without errors.

---

## 5. Environment Configuration

Copy the example environment file:
```powershell
cd C:\apps\academic-tracker\academic-operations-tracker
copy .env.example .env.local
```

Edit `.env.local` with Notepad or your preferred editor:

```env
# ─── DATABASE ───────────────────────────────────────────
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://aot_app:YOUR_DB_PASSWORD@localhost:3306/academic_tracker"

# ─── NEXTAUTH ──────────────────────────────────────────
# The public URL where users will access the app
NEXTAUTH_URL="https://tracker.your-domain.edu.pk"

# Generate a random secret (run this in PowerShell):
#   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
NEXTAUTH_SECRET="PASTE_YOUR_GENERATED_SECRET_HERE"

# ─── MICROSOFT 365 SSO ─────────────────────────────────
# See Section 6 for how to get these values
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# ─── CRON JOBS ─────────────────────────────────────────
# Generate another random secret for cron authentication
CRON_SECRET="PASTE_ANOTHER_GENERATED_SECRET_HERE"

# ─── FIREBASE (Optional) ──────────────────────────────
# Leave empty if not using push notifications yet
# Can be configured later via Admin Panel instead
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
```

### Generate secrets in PowerShell:
```powershell
# Run this twice — once for NEXTAUTH_SECRET, once for CRON_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## 6. Microsoft 365 SSO Setup (Azure AD)

This application uses Microsoft 365 for single sign-on. You need to register an application in Azure Active Directory.

### 6.1 Register the application

1. Go to **https://portal.azure.com**
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Click **App registrations** in the left menu
4. Click **+ New registration**
5. Fill in:
   - **Name:** `NUST Academic Operations Tracker`
   - **Supported account types:** `Accounts in this organizational directory only` (single tenant)
   - **Redirect URI:** Select `Web` and enter:
     ```
     https://tracker.your-domain.edu.pk/api/auth/callback/azure-ad
     ```
     (Replace with your actual domain. For local testing, use `http://localhost:3000/api/auth/callback/azure-ad`)
6. Click **Register**

### 6.2 Note the application IDs

After registration, you'll see:
- **Application (client) ID** — copy this to `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** — copy this to `AZURE_AD_TENANT_ID`

### 6.3 Create a client secret

1. In your app registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Description: `AOT Production`
4. Expiry: Choose `24 months` (set a calendar reminder to rotate before expiry)
5. Click **Add**
6. Copy the **Value** immediately (it will be hidden later) — paste into `AZURE_AD_CLIENT_SECRET`

### 6.4 Configure API permissions

1. Go to **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph** → **Delegated permissions**
4. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
5. Click **Grant admin consent for [your organization]**

### 6.5 Update .env.local

```env
AZURE_AD_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_AD_CLIENT_SECRET="your_client_secret_value"
AZURE_AD_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## 7. Run Database Migration & Seed

### 7.1 Generate Prisma client

```powershell
cd C:\apps\academic-tracker\academic-operations-tracker
npx prisma generate
```

### 7.2 Run the database migration

This creates all tables in the MySQL database:
```powershell
npx prisma migrate dev --name init
```

Expected output: `Your database is now in sync with your Prisma schema.`

### 7.3 Seed the database with initial data

This creates a default admin user, sample teams, and system configuration:
```powershell
npx prisma db seed
```

Expected output: `Seed complete.`

### 7.4 Verify the tables

```powershell
npx prisma studio
```

This opens a web UI at http://localhost:5555. Verify you can see the User, Team, Task, and SystemConfig tables with data.

---

## 8. Build & Start the Application

### 8.1 Build for production

```powershell
cd C:\apps\academic-tracker\academic-operations-tracker
npm run build
```

This compiles the application. Wait for it to complete (~2-5 minutes).

### 8.2 Start the application

```powershell
npm start
```

The application starts on **http://localhost:3000**.

### 8.3 Set up as a Windows Service (recommended for production)

Install `pm2` globally to manage the Node.js process:
```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Start the app with pm2
cd C:\apps\academic-tracker\academic-operations-tracker
pm2 start npm --name "academic-tracker" -- start

# Save the process list
pm2 save

# Set up auto-start on Windows boot
pm2-startup install
```

Verify it's running:
```powershell
pm2 status
```

### 8.4 Useful pm2 commands

```powershell
pm2 logs academic-tracker    # View application logs
pm2 restart academic-tracker  # Restart the app
pm2 stop academic-tracker     # Stop the app
pm2 monit                     # Real-time monitoring dashboard
```

---

## 9. SMTP Email Configuration

The application sends email notifications for high-severity alerts. SMTP is configured through the Admin Panel (no server restart needed).

1. Log in as the Admin user
2. Navigate to **Settings**
3. Fill in the **SMTP Configuration** section:

| Field | Example Value | Description |
|-------|-------------|-------------|
| SMTP Host | `mail.nust.edu.pk` or `smtp.office365.com` | Your mail server |
| SMTP Port | `587` | 587 for STARTTLS, 465 for SSL |
| SMTP User | `noreply@nust.edu.pk` | Sending account |
| SMTP Password | (your password) | Account password or app password |
| SMTP From | `noreply@nust.edu.pk` | The "From" address on emails |

4. Click **Save** on the SMTP section

### For Microsoft 365 SMTP:
```
Host: smtp.office365.com
Port: 587
User: your-service-account@nust.edu.pk
Password: (account password or app password)
From: noreply@nust.edu.pk
```

### Test email delivery:
After configuring, trigger a test by creating a task and moving it through approval. The team resource person should receive an email with a deep link.

---

## 10. Firebase Push Notifications (Optional)

Push notifications alert the Pro Rector and Director on their phones even when the browser is closed.

### 10.1 Set up Firebase project

1. Go to **https://console.firebase.google.com** (login: seecslms@gmail.com)
2. Create a new project or use an existing one
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 10.2 Configure in Admin Panel

1. Log in as Admin → **Settings** → **Firebase (FCM)** section
2. Open the downloaded JSON file and copy these values:

| Admin Panel Field | JSON Key |
|-------------------|----------|
| FCM Project ID | `project_id` |
| FCM Client Email | `client_email` |
| FCM Private Key | `private_key` (the entire string including `-----BEGIN PRIVATE KEY-----`) |

3. Click **Save**

### 10.3 Enable Cloud Messaging

1. In Firebase Console, go to **Cloud Messaging**
2. If prompted, enable the Firebase Cloud Messaging API

Push notifications will now fire for CRITICAL severity alerts (escalations, overdue tasks).

---

## 11. Cron Jobs Setup (Windows Task Scheduler)

The application has 4 scheduled jobs that run via HTTP calls. Set these up in Windows Task Scheduler.

### 11.1 Create cron scripts

Create `C:\apps\academic-tracker\cron\` directory and add these batch files:

**`check-inactivity.bat`** (runs at 1:00 PM and 5:00 PM, Mon-Sat):
```batch
@echo off
curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-inactivity >> C:\apps\academic-tracker\cron\logs\inactivity.log 2>&1
```

**`check-overdue.bat`** (runs at 8:00 AM, Mon-Sat):
```batch
@echo off
curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-overdue >> C:\apps\academic-tracker\cron\logs\overdue.log 2>&1
```

**`check-stale-paused.bat`** (runs at 8:00 AM, Mon-Sat):
```batch
@echo off
curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-stale-paused >> C:\apps\academic-tracker\cron\logs\stale-paused.log 2>&1
```

**`check-stale-drafts.bat`** (runs at 8:00 AM, Monday only):
```batch
@echo off
curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-stale-drafts >> C:\apps\academic-tracker\cron\logs\stale-drafts.log 2>&1
```

Replace `YOUR_CRON_SECRET` with the value from `.env.local`.

Create the logs directory:
```powershell
mkdir C:\apps\academic-tracker\cron\logs
```

### 11.2 Create scheduled tasks

Open **Task Scheduler** (`taskschd.msc`) and create these tasks:

| Task Name | Script | Trigger | Days |
|-----------|--------|---------|------|
| AOT-Inactivity-1PM | check-inactivity.bat | Daily at 1:00 PM | Mon-Sat |
| AOT-Inactivity-5PM | check-inactivity.bat | Daily at 5:00 PM | Mon-Sat |
| AOT-Overdue | check-overdue.bat | Daily at 8:00 AM | Mon-Sat |
| AOT-StalePaused | check-stale-paused.bat | Daily at 8:00 AM | Mon-Sat |
| AOT-StaleDrafts | check-stale-drafts.bat | Weekly at 8:00 AM | Monday |

For each task:
1. **General tab:** Run whether user is logged on or not. Use the service account.
2. **Trigger tab:** Set the schedule as above. Uncheck Sunday.
3. **Action tab:** Start a program → browse to the `.bat` file.
4. **Conditions tab:** Uncheck "Start only if on AC power".

### 11.3 Test the cron jobs

Run manually to verify:
```powershell
C:\apps\academic-tracker\cron\check-overdue.bat
```

Expected output: `{"checked":N,"notified":N}` (some JSON response).

---

## 12. Reverse Proxy (IIS / Nginx)

The application runs on port 3000 internally. A reverse proxy serves it on port 80/443 externally.

### Option A: IIS with URL Rewrite

1. Install **IIS** and the **URL Rewrite** module and **Application Request Routing (ARR)**
2. Enable ARR proxy: IIS Manager → Server → Application Request Routing → Server Proxy Settings → Enable proxy
3. Create a new website:
   - Site name: `AcademicTracker`
   - Physical path: `C:\apps\academic-tracker\academic-operations-tracker\public`
   - Binding: HTTPS, port 443, hostname: `tracker.your-domain.edu.pk`
4. Add a `web.config` to the physical path:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### Option B: Nginx (if installed)

```nginx
server {
    listen 443 ssl;
    server_name tracker.your-domain.edu.pk;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support — disable buffering
        proxy_buffering off;
        proxy_cache off;
    }

    # Increase upload limit for document attachments (25MB)
    client_max_body_size 30m;
}
```

**Important for SSE:** Ensure `proxy_buffering off` is set — otherwise real-time notifications will be delayed.

---

## 13. SSL/HTTPS Certificate

HTTPS is required for:
- Microsoft 365 SSO (Azure AD requires HTTPS redirect URIs in production)
- PWA installation (service workers require HTTPS)
- Security (authentication cookies are HTTP-only secure)

Options:
1. **Institutional certificate** from your IT PKI
2. **Let's Encrypt** (if the server is internet-facing): use `win-acme` for automatic renewal
3. **Self-signed** (for internal testing only — not recommended for production)

After installing the certificate, update `NEXTAUTH_URL` in `.env.local`:
```env
NEXTAUTH_URL="https://tracker.your-domain.edu.pk"
```

And update the Azure AD redirect URI to match (Section 6.1).

---

## 14. File Upload Storage

Task documents and chat attachments are stored on the local filesystem.

### 14.1 Create the upload directory

```powershell
mkdir C:\data\academic-tracker-uploads
```

### 14.2 Configure the path in Admin Panel

1. Log in as Admin → **Settings** → **File Storage** section
2. Set **Upload Path** to: `C:\data\academic-tracker-uploads`
3. Click **Save**

### 14.3 Set permissions

The application service account needs read/write access:
```powershell
icacls "C:\data\academic-tracker-uploads" /grant "svc-tracker:(OI)(CI)F"
```

### 14.4 Storage limits (enforced by the application)

- Maximum file size: **25 MB** per file
- Maximum storage per task: **200 MB** (all documents + chat attachments)

### 14.5 Include in backups

Add `C:\data\academic-tracker-uploads` to your backup schedule (see Section 15).

---

## 15. Backup Strategy

### 15.1 Database backup

Create `C:\apps\academic-tracker\cron\backup-db.bat`:
```batch
@echo off
set BACKUP_DIR=C:\backups\academic-tracker\db
set DATE=%date:~10,4%-%date:~4,2%-%date:~7,2%
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
mysqldump -u aot_app -pYOUR_DB_PASSWORD academic_tracker > "%BACKUP_DIR%\academic_tracker_%DATE%.sql"

:: Delete backups older than 30 days
forfiles /P "%BACKUP_DIR%" /S /M *.sql /D -30 /C "cmd /c del @path" 2>nul
```

Schedule in Task Scheduler: Daily at 2:00 AM.

### 15.2 File upload backup

Include `C:\data\academic-tracker-uploads` in your existing Windows Server Backup or file-level backup solution. Daily, 30-day retention.

### 15.3 Application backup

The application code is in Git. No separate backup needed — it can be re-cloned and rebuilt from the repository at any time.

---

## 16. First Login & Admin Setup

### 16.1 Update the seed admin email

The database seed creates a default admin user with email `admin@nust.edu.pk`. If your admin's Microsoft 365 email is different, update it:

```powershell
cd C:\apps\academic-tracker\academic-operations-tracker
npx prisma studio
```

In Prisma Studio, go to the **User** table, find the Admin user, and change the `email` to the actual Microsoft 365 email of your system administrator.

### 16.2 First login

1. Open `https://tracker.your-domain.edu.pk` in a browser
2. You will be redirected to Microsoft 365 login
3. Sign in with the admin's Microsoft 365 account
4. On first login, the system captures the Microsoft object ID (msId) automatically
5. You are redirected to the Admin Panel

### 16.3 Admin checklist after first login

- [ ] Configure SMTP settings (Section 9)
- [ ] Configure Firebase settings if using push notifications (Section 10)
- [ ] Set the correct upload path (Section 14)
- [ ] Register all users (Section 17)
- [ ] Create dev teams and assign resource persons
- [ ] Verify cron jobs are running (check Cron Status in Settings)

---

## 17. User Registration Guide

The system does NOT support self-registration. The Admin must pre-register every user.

### 17.1 Register a user

1. Go to **Admin Panel** → **Users**
2. Click **Add User**
3. Fill in:
   - **Email**: The user's Microsoft 365 email (must match exactly)
   - **Name**: Display name
   - **Role**: Select one of:
     - `PRO_RECTOR` — Pro Rector (executive dashboard, override actions)
     - `DIRECTOR` — Director ACAD (approval queue, final sign-off)
     - `COORDINATOR` — Academic Coordinator (creates and manages tasks)
     - `TEAM_RESOURCE` — Dev team resource person (receives and delivers tasks)
     - `ADMIN` — System administrator
4. Click **Save**

The user can now log in with their Microsoft 365 account. Their role determines what they see.

### 17.2 Register a dev team

1. Go to **Admin Panel** → **Teams**
2. Click **Add Team**
3. Fill in:
   - **Team Name**: e.g., "ICT Web Team", "ERP Team"
   - **Resource Person**: Select from the dropdown (shows users with TEAM_RESOURCE role only)
4. Click **Save**

### 17.3 Typical user setup

| Role | Count | Example |
|------|-------|---------|
| Admin | 1 | IT administrator |
| Pro Rector | 1 | Pro Rector Academics |
| Director | 1 | Director ACAD |
| Coordinator | 2-5 | Academic staff per directorate |
| Team Resource | 3-10 | One per dev team |

---

## 18. Troubleshooting

### Application won't start

```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Check pm2 logs
pm2 logs academic-tracker --lines 50
```

### Database connection fails

```powershell
# Test connection
mysql -u aot_app -p -D academic_tracker -e "SELECT 1;"

# Check DATABASE_URL format in .env.local
# Must be: mysql://user:password@host:port/database
```

### Microsoft SSO login fails

Common causes:
- Redirect URI mismatch: The URI in Azure AD must exactly match `{NEXTAUTH_URL}/api/auth/callback/azure-ad`
- Client secret expired: Rotate in Azure Portal → Certificates & secrets
- User email doesn't match: The Microsoft 365 email must match exactly what's registered in the Admin Panel
- User not registered: Admin must pre-register the user before they can log in

### Emails not sending

1. Check SMTP configuration in Admin → Settings
2. Test SMTP connectivity from the server:
   ```powershell
   Test-NetConnection -ComputerName smtp.office365.com -Port 587
   ```
3. Check application logs: `pm2 logs academic-tracker`

### Push notifications not working

1. Verify Firebase configuration in Admin → Settings
2. User must have granted notification permission in their browser
3. On iOS: PWA must be installed to home screen (Apple requirement)
4. Check browser console for Firebase errors

### Cron jobs not firing

1. Check Task Scheduler history for errors
2. Verify CRON_SECRET matches between `.env.local` and the `.bat` files
3. Test manually:
   ```powershell
   curl -X POST -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/check-overdue
   ```
4. Check cron logs in `C:\apps\academic-tracker\cron\logs\`

### File uploads failing

1. Verify the upload path exists and has write permissions
2. Check the path configured in Admin → Settings → File Storage
3. Verify disk space is available

---

## 19. Maintenance & Updates

### Applying updates

When new code is pushed to the repository:
```powershell
cd C:\apps\academic-tracker\academic-operations-tracker
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart academic-tracker
```

### Rotating Azure AD client secret

1. Go to Azure Portal → App registrations → AOT → Certificates & secrets
2. Create a new secret
3. Update `AZURE_AD_CLIENT_SECRET` in `.env.local`
4. Restart: `pm2 restart academic-tracker`
5. Delete the old secret in Azure Portal

### Monitoring

- **Application logs:** `pm2 logs academic-tracker`
- **Process health:** `pm2 monit`
- **Database size:** `mysql -u aot_app -p -e "SELECT table_name, ROUND(data_length/1024/1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'academic_tracker';"`
- **Upload storage:** `dir /s C:\data\academic-tracker-uploads`

### Maintenance window

Scheduled maintenance: **Sundays** (as per SRS requirement). The application can be stopped with:
```powershell
pm2 stop academic-tracker
# ... perform maintenance ...
pm2 start academic-tracker
```

---

## Quick Reference Card

| Item | Value |
|------|-------|
| Application URL | `https://tracker.your-domain.edu.pk` |
| Internal port | 3000 |
| Database | MySQL `academic_tracker` on localhost:3306 |
| Config file | `C:\apps\academic-tracker\academic-operations-tracker\.env.local` |
| Upload storage | `C:\data\academic-tracker-uploads` (configurable in Admin) |
| Cron scripts | `C:\apps\academic-tracker\cron\` |
| Cron logs | `C:\apps\academic-tracker\cron\logs\` |
| App logs | `pm2 logs academic-tracker` |
| Process manager | pm2 |
| SSO provider | Azure AD (Microsoft 365) |
| Repository | https://github.com/mujimushi/Academic_Operations_Tracker |
