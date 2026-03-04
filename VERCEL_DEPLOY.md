# 🚀 Vercel Deployment Guide - Petti Cash Frontend

This guide provides a detailed walkthrough for deploying the `frontend` of the Petti Cash Management System to Vercel.

## 📋 Prerequisites
- A [Vercel](https://vercel.com) account.
- The project hosted on a GitHub repository (e.g., `vj-mazu/petty_cash`).

## 🛠️ Step-by-Step Deployment

### 1. Connect Repository
- log in to [Vercel](https://vercel.com).
- Click **"Add New..."** → **"Project"**.
- Select your repository: `petty_cash`.

### 2. Configure Project Settings
When the "Configure Project" screen appears, ensure these settings are applied:

- **Project Name**: `petti-cash-frontend` (or any name you prefer).
- **Framework Preset**: `Create React App` (Vercel usually auto-detects this).
- **Root Directory**: `frontend` (Click "Edit" and select the `frontend` folder).

### 3. Build & Development Settings
If Vercel detects the `vercel.json` file, it might override some settings. If not, manually ensure:

- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

> [!IMPORTANT]
> Because you have a `vercel.json` file in the `frontend` directory, Vercel will prioritize it for build settings. Ensure it matches your folder structure.

### 4. Environment Variables 🔑
You must add the following environment variable for the frontend to communicate with your backend:

| Variable Name | Value Example |
| :--- | :--- |
| `REACT_APP_API_URL` | `https://your-backend-app.onrender.com/api` |

To add this:
1. Scroll down to the **"Environment Variables"** section.
2. Enter `REACT_APP_API_URL` as the **Key**.
3. Paste your backend API URL (from Render) as the **Value**.
4. Click **"Add"**.

### 5. Deploy 🚀
- Click the **"Deploy"** button.
- Vercel will start cloning your code, installing dependencies, and building the project.

---

## 🔍 Common Issues & Fixes

### ❌ Module not found: 'jspdf-autotable'
We recently fixed this by updating `package-lock.json`. If you see this error again:
1. Ensure `jspdf-autotable` is in your `package.json` dependencies.
2. Run `npm install` locally and **push the updated `package-lock.json`** to GitHub.

### ❌ 404 on Page Refresh
Because this is a Single Page Application (SPA), refreshing a page like `/transactions` might throw a 404. Our `vercel.json` already includes a rewrite rule to fix this:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### ❌ API Connection Failed
- Check that `REACT_APP_API_URL` is correctly set (it should end with `/api`).
- Ensure your backend on Render is awake and healthy.

---

## 🔄 Updating Your Deployment
Whenever you push changes to your `main` branch on GitHub, Vercel will **automatically** trigger a new build and deploy the updates.
