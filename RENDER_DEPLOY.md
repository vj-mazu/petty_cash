# 🚀 Render Deployment Guide - Petti Cash Backend

This guide provides a detailed walkthrough for deploying the `backend` of the Petti Cash Management System to Render.

## 📋 Prerequisites
- A [Render](https://render.com) account.
- A PostgreSQL database (can be created on Render or use an external one like Supabase/Neon).
- The project hosted on a GitHub repository (e.g., `vj-mazu/petty_cash`).

## 🛠️ Step-by-Step Deployment

## 🛠️ Step-by-Step Deployment (Blueprint Method)

### 1. Create a New Blueprint Instance
- Log in to [Render](https://render.com).
- Click **"New +"** → **"Blueprint"**.
- Select your repository: `petty_cash`.

### 2. Configure Blueprint
Render will automatically detect the `render.yaml` in your root directory.
- **Service Name**: `petti-cash-backend`
- **Database Name**: `petti-cash-db`
- Click **"Apply"**.

### 3. Environment Variables 🔑
Render will prompt you for any missing variables. Ensure these are set:

| Variable Name | Value Description |
| :--- | :--- |
| `DATABASE_URL` | Your PostgreSQL connection string (`postgres://...`) |
| `JWT_SECRET` | A long, random string for security |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Your Vercel frontend URL (e.g., `https://petti-cash.vercel.app`) |

**To add these:**
1. Go to the **"Environment"** tab in your Render service.
2. Click **"Add Environment Variable"**.
3. Enter the keys and values from the table above.

### 4. Database Setup (Migrations)
The backend uses Sequelize. After the first successful deployment, you might need to run migrations to create the tables:
- You can add `node migrate.js` to your build command: `npm install && node migrate.js`.
- Or run it once from the Render **"Shell"** tab.

---

## 🔍 Common Issues & Fixes

### ❌ Database Connection Error
- Ensure your `DATABASE_URL` is correct.
- If using Render's Internal Database, use the **Internal Connection String**.
- If using an external DB, ensure it allows connections from Render's IP addresses.

### ❌ Port Issues
- Render automatically detects the port, but if it fails, add an environment variable `PORT` = `10000`.

### ❌ CORS Errors on Frontend
- Ensure the `CLIENT_URL` in Render matches your **exact** Vercel URL (including `https://`).

---

## 🔄 Automatic Deploys
Render will automatically redeploy your backend whenever you push new code to the `main` branch.
