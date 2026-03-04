# Petti Cash Management System - Deployment Guide

This guide will help you deploy the Petti Cash Management System to **Vercel** (Frontend) and **Render** (Backend).

## 🚀 Backend Deployment (Render)

1.  **Create a Account**: Sign up at [Render.com](https://render.com).
2.  **Connect GitHub**: Connect your GitHub account and select the `petty_cash` repository.
3.  **Create a New Web Service**:
    *   **Repository**: `vj-mazu/petty_cash`
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node start.js`
4.  **Add Database (PostgreSQL)**:
    *   Go to "New" -> "PostgreSQL".
    *   Name it `petti-cash-db`.
    *   Once created, copy the **External Connection String**.
5.  **Set Environment Variables**:
    *   `DATABASE_URL`: (Paste the connection string from above)
    *   `JWT_SECRET`: (Any long random string)
    *   `NODE_ENV`: `production`
    *   `CLIENT_URL`: `https://your-vercel-app-url.vercel.app` (Add this AFTER deploying the frontend)

---

## 🎨 Frontend Deployment (Vercel)

1.  **Create a Account**: Sign up at [Vercel.com](https://vercel.com).
2.  **Connect GitHub**: Connect your GitHub account and select the `petty_cash` repository.
3.  **New Project**:
    *   **Repository**: `vj-mazu/petty_cash`
    *   **Framework Preset**: `Create React App`
    *   **Root Directory**: `frontend`
    *   **Install Command**: `npm install`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `build`
4.  **Set Environment Variables**:
    *   `REACT_APP_API_URL`: `https://your-render-app-url.onrender.com/api` (Replace with your Render sub-domain)
5.  **Deploy**: Click "Deploy".

---

## 🔗 Connecting Both

1.  After the frontend is deployed, copy its URL and update the `CLIENT_URL` variable in your Render dashboard.
2.  Redeploy the backend if necessary.
