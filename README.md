# Notification System (Payments + Email Reminders)

## What this does
- Accounting admins can log in
- Create payment records with a due date
- The system emails reminders based on `REMINDER_DAYS_BEFORE`

## Requirements
- Node.js 18+

## Setup
1. Install dependencies
   - `npm install`

2. Create your env file
   - Copy `.env.example` to `.env` and fill in values

3. Initialize the database
   - `npm run init-db`

4. Create the first admin
   - `npm run create-admin`

5. Start the app
   - `npm run dev`

Open `http://localhost:3000`.

## Notes
- Reminders are emailed to the admin who created the payment.
- The reminder job runs daily at 08:00 server time and once shortly after boot.

## Email configuration
This project sends email via SMTP using `nodemailer`.

- For Gmail, you typically need an **App Password** (not your normal password).
- For Microsoft 365/Outlook, use your tenant SMTP settings.

Fill these in your `.env`:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
- `SMTP_USER`, `SMTP_PASS`
- `MAIL_FROM`

## Push to GitHub
1. Create a new empty repository on GitHub (no README needed).

2. In this project folder, run:
   - `git init`
   - `git add .`
   - `git commit -m "Initial commit"`

3. Add the GitHub remote (replace with your repo URL):
   - `git remote add origin https://github.com/<your-username>/<your-repo>.git`

4. Push:
   - `git branch -M main`
   - `git push -u origin main`

## Hosting
GitHub Pages is for static sites only, so it can’t run this Node/SQLite server.

Typical options:
- Render / Railway / Fly.io for the Node server
- A small VPS

If you tell me which host you prefer, I can add the exact deploy config for it.

## Deploy on Render
This repo includes a `render.yaml` that provisions:
- a **Web service** (the UI + API)
- a **Worker service** (runs the email reminder scheduler)
- a **Persistent Disk** for SQLite

### Steps
1. Push this repo to GitHub.
2. In Render:
   - New -> **Blueprint**
   - Connect your GitHub repo
   - Apply the blueprint

### Required env vars (set in Render for BOTH services)
- `SESSION_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

Optional:
- `REMINDER_DAYS_BEFORE` (default is `7,3,1,0`)

### Database
The blueprint mounts a disk at `/var/data` and sets:
- `DB_PATH=/var/data/app.db`

### Creating the first admin on Render
Render doesn’t run interactive commands by default.

Use the built-in bootstrap admin feature. Set these env vars (in both Web + Worker):
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`

On startup, the app will create that admin **only if it doesn’t already exist**.
