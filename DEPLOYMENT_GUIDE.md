# 🚀 Golf Round Rivals - Deployment Guide

## 📋 Overview
This project has a **frontend (client)** and **backend (server)** that need to be deployed separately for optimal performance.

## 🎯 Recommended Deployment Strategy

### **Frontend → Vercel** 
### **Backend → Railway**

---

## 🔧 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### 1.2 Deploy Backend
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `manjeet0civil/GOLF_ROUND_Rivals`
4. Set **Root Directory** to: `server`
5. Click **"Deploy"**

### 1.3 Configure Environment Variables
In Railway project settings, add:
```
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 1.4 Get Backend URL
- Railway will give you a URL like: `https://your-app-name.railway.app`
- **Save this URL** - you'll need it for the frontend

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub

### 2.2 Deploy Frontend
1. Click **"New Project"**
2. Import your repository: `manjeet0civil/GOLF_ROUND_Rivals`
3. Set **Root Directory** to: `client`
4. Set **Framework Preset** to: `Vite`

### 2.3 Configure Environment Variables
Add this environment variable:
```
VITE_API_URL=https://your-railway-backend-url.railway.app
```
Replace `your-railway-backend-url` with your actual Railway URL.

### 2.4 Deploy
- Click **"Deploy"**
- Wait for deployment to complete

---

## ✅ Step 3: Test Your Deployment

### 3.1 Test Frontend
- Visit your Vercel URL
- Try signing up/signing in
- Test creating a game

### 3.2 Test Backend
- Your frontend should automatically connect to Railway backend
- Check browser console for any API errors

---

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Backend needs to allow requests from Vercel domain
   - Check Railway logs for CORS configuration

2. **Environment Variables**
   - Make sure all Supabase credentials are correct
   - Check Railway and Vercel environment variables

3. **Database Connection**
   - Verify Supabase project is active
   - Check DATABASE_URL format

### Get Help:
- Check Railway logs for backend errors
- Check Vercel logs for frontend errors
- Check browser console for API errors

---

## 🎉 Success!
Your golf scorecard app should now be live with:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://your-app.railway.app`

Both will automatically redeploy when you push changes to GitHub! 