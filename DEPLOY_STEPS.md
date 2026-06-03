# 🚀 DEPLOYMENT QUICK START - Do These 3 Things!

Your code is now on GitHub. Time to deploy!

---

## ✅ DEPLOY BACKEND (5 minutes)

1. **Go to:** https://render.com
2. **Sign up** with GitHub (click "GitHub" button)
3. **Authorize** Render to access your repo
4. **Click:** "New +" → "Web Service"
5. **Select:** `local-problem-reporter` repo
6. **Fill in settings:**
   ```
   Name: local-problem-reporter-api
   Runtime: Python 3.11
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
7. **Click:** "Create Web Service"
8. **Wait 2-3 minutes** for deployment
9. **Copy your backend URL** (look like: `https://local-problem-reporter-api-xxxxx.onrender.com`)

---

## ✅ DEPLOY FRONTEND (5 minutes)

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub
3. **Authorize** Vercel
4. **Click:** "Add New" → "Project"
5. **Select:** `local-problem-reporter` repo
6. **Settings:**
   - Framework: React (should auto-detect)
   - Root Directory: `frontend`
7. **Add Environment Variable:**
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-render-url.onrender.com/api`
   (Paste the URL from Step 1 Step 9, then add `/api`)
8. **Click:** "Deploy"
9. **Wait 1-2 minutes**
10. **Your app is LIVE!** 🎉

---

## 📋 What You Get

```
✅ Frontend (React): https://your-app.vercel.app
✅ Backend (API): https://your-app-api.onrender.com
✅ Database: Included with backend (SQLite)
✅ Cost: $0/month (completely FREE)
✅ Updates: Auto-deploy when you push to GitHub
```

---

## 💡 Next Steps

**Want to keep backend awake 24/7?**
1. Go to https://uptimerobot.com
2. Sign up (free)
3. Create monitor for: `https://your-render-url.onrender.com/api/health`
4. Set interval to 5 minutes

This prevents Render from sleeping!

---

## 🎯 Share Your App

Your **Vercel URL** is what you share:
- Send to friends/family
- Works on any device
- No installation needed
- Mobile-friendly

---

## ❓ Common Issues

**Backend shows 503?**
→ It's sleeping. Wait 30s, try again.

**Frontend can't reach backend?**
→ Check `.env.production` has correct URL with `/api` at end.

**Need to update code?**
→ Just `git push` to GitHub, auto-redeploys in 1-2 minutes!

---

**Questions?** Check `DEPLOYMENT_CHECKLIST.md` or `DEPLOY_NOW.md` 

**Ready?** Start with Backend → Frontend → Done! 🚀
