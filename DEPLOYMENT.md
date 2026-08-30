# StructurAI Deployment Guide: Vercel & Cloud Backend

This guide walks you through deploying **StructurAI** with the frontend hosted on **Vercel** and the FastAPI / PyTorch ML backend hosted on a free cloud service like **Render** or **Railway**.

---

## 🚀 Part 1: Deploy Frontend to Vercel

### Option A: Import via GitHub (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." $\rightarrow$ "Project"**.
2. Select your GitHub repository: `mallugze/Depth-Estimation-`.
3. Vercel will automatically detect the settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `cd frontend && npm install && npm run build` (or automatic from root `package.json`)
   - **Output Directory**: `frontend/dist`
4. *(Optional)* In **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com` (Leave blank initially if testing in Demo mode).
5. Click **"Deploy"**.

> **Note**: Even if your backend is not yet deployed, the Vercel frontend includes an interactive **Demo Scan & 3D Topography Explorer** with live WebGL rendering out of the box!

---

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

---

## ⚙️ Part 2: Deploy Backend (FastAPI + PyTorch)

Because PyTorch + YOLOv8 + MiDaS models require dedicated Python runtimes, you can deploy the backend for free using **Render**, **Railway**, or **Fly.io**.

### Deploying to Render (Free)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **"New +" $\rightarrow$ "Web Service"**.
2. Connect your GitHub repository (`mallugze/Depth-Estimation-`).
3. Configure the service:
   - **Name**: `structurai-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **"Create Web Service"**.
5. Once deployed, copy your Render service URL (e.g. `https://structurai-backend.onrender.com`).

---

## 🔗 Part 3: Connect Vercel Frontend to Render Backend

1. In your **Vercel Project Settings** $\rightarrow$ **Environment Variables**.
2. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-structurai-backend.onrender.com`
3. Click **"Save"**, then trigger a **Redeploy** on Vercel.

---

## 🧪 Local Testing

To test the production build locally before deploying:

```bash
# Test frontend production build
cd frontend
npm run build
npm run preview
```
