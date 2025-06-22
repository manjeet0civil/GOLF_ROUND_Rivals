# 🚀 Deploy Both Frontend & Backend to Vercel

## 📋 Overview
This guide shows how to deploy your entire golf scorecard app (frontend + backend) to Vercel as a single project.

## 🎯 Step-by-Step Deployment

### **Step 1: Prepare Your Code**

1. **Make sure your code is on GitHub**
2. **All files are committed and pushed**

### **Step 2: Deploy to Vercel**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Sign in with GitHub**
3. **Click "New Project"**
4. **Import your repository:** `manjeet0civil/GOLF_ROUND_Rivals`
5. **Keep default settings:**
   - Framework Preset: `Other`
   - Root Directory: `/` (root)
   - Build Command: `npm run build`
   - Output Directory: `client/dist`

### **Step 3: Configure Environment Variables**

In Vercel project settings, add these environment variables:

```
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **Step 4: Deploy**

1. **Click "Deploy"**
2. **Wait for deployment to complete**
3. **Your app will be live at:** `https://your-app.vercel.app`

## ✅ How It Works

- **Frontend:** Served from `client/dist` (React app)
- **Backend:** Serverless functions from `server/index.ts`
- **API Routes:** All `/api/*` requests go to your backend
- **Static Files:** Everything else serves the React app

## 🔧 Configuration Files

### **vercel.json** (Already configured)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

### **package.json** (Already configured)
- `build`: Builds the React frontend
- `vercel-build`: Vercel uses this for deployment

## 🎉 Benefits

✅ **Single deployment** - Everything in one place
✅ **Automatic HTTPS** - SSL certificate included
✅ **Global CDN** - Fast loading worldwide
✅ **Automatic deployments** - Updates when you push to GitHub
✅ **Free tier** - Generous limits

## 🆘 Troubleshooting

### **Build Errors**
- Check that all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check Vercel build logs

### **API Errors**
- Make sure Supabase credentials are correct
- Check that DATABASE_URL is properly formatted
- Verify Supabase project is active

### **CORS Issues**
- Not needed since frontend and backend are on same domain
- API calls use relative URLs

## 🚀 After Deployment

1. **Test your app** at the Vercel URL
2. **Try signing up/signing in**
3. **Create a game and test multiplayer features**
4. **Share with friends!**

Your golf scorecard app is now live on the internet! 🎯 