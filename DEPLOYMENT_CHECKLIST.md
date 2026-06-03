# DEPLOYMENT CHECKLIST - Follow These Steps in Order

## ✅ STEP 1: Prepare for GitHub (5 minutes)

- [ ] I have downloaded Git from https://git-scm.com/ (Windows users)
- [ ] I can open terminal and type `git --version` (check it works)
- [ ] I have a GitHub account (create at https://github.com/signup if not)

## ✅ STEP 2: Push Code to GitHub (10 minutes)

Run these commands in your project folder:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"

git remote add origin https://github.com/YOUR_USERNAME/local-problem-reporter.git
git branch -M main
git add .
git commit -m "Ready for deployment to Render and Vercel"
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username

After running these commands:
- [ ] Go to https://github.com and see your code uploaded ✓

## ✅ STEP 3: Deploy Backend on Render (5 minutes)

1. [ ] Go to https://render.com
2. [ ] Click "Sign up with GitHub"
3. [ ] Authorize Render to access GitHub
4. [ ] Click "New +" → "Web Service"
5. [ ] Select your GitHub repo
6. [ ] Fill in:
   - Name: `local-problem-reporter-api`
   - Runtime: `Python 3.11`
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
7. [ ] Click "Create Web Service"
8. [ ] Wait 2-3 minutes for deployment
9. [ ] **SAVE THIS URL** → Your backend URL will be shown

**Your Backend URL will look like:**
```
https://local-problem-reporter-api.onrender.com
```

## ✅ STEP 4: Deploy Frontend on Vercel (5 minutes)

1. [ ] Go to https://vercel.com
2. [ ] Click "Sign up with GitHub"
3. [ ] Authorize Vercel
4. [ ] Click "Add New" → "Project"
5. [ ] Import your GitHub repo
6. [ ] Settings:
   - Framework: React
   - Root Directory: `frontend`
7. [ ] Add Environment Variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-render-url.onrender.com/api` (from Step 3)
8. [ ] Click "Deploy"
9. [ ] Wait 1-2 minutes
10. [ ] **SAVE THIS URL** → Your frontend is live!

**Your Frontend URL will look like:**
```
https://local-problem-reporter.vercel.app
```

## ✅ STEP 5 (Optional): Keep Backend Alive 24/7

To prevent free Render from sleeping:

1. [ ] Go to https://uptimerobot.com
2. [ ] Sign up with email
3. [ ] Click "Create Monitor"
4. [ ] URL: Paste your Render backend URL + `/api/health`
   - Example: `https://local-problem-reporter-api.onrender.com/api/health`
5. [ ] Monitoring Interval: 5 minutes
6. [ ] Click "Create Monitor"

This keeps your backend awake by pinging it every 5 minutes!

---

## 🎉 YOU'RE DONE!

Your app is now **LIVE** and accessible from anywhere!

### Share with Others:
- Send them your **Vercel URL** (frontend)
- They can open it in any browser, any device
- Works on mobile too!

### Your Live URLs:
```
Frontend (Share this): https://your-vercel-url.vercel.app
Backend: https://your-render-url.onrender.com
```

---

## ❓ Troubleshooting

### Backend shows "503 Service Unavailable"
- It's asleep. Wait 30 seconds, try again.
- Or set up UptimeRobot (Step 5) to keep it awake.

### Frontend can't reach backend
- Check `.env.production` has correct Render URL
- Should end with `/api` 
- Redeploy Vercel if you changed it

### How to update code after deployment?
- Just `git push` to GitHub
- Render and Vercel automatically redeploy!
- Takes ~2 minutes to go live

### Want to stop the app?
- You can delete the apps from Render/Vercel anytime
- They stay FREE until you delete them

---

## ⚠️ Important Notes

1. **Your app stays FREE** - You pay $0 per month
2. **Backend sleeps** on free Render (use UptimeRobot to prevent)
3. **Data is safe** - SQLite database stays on Render
4. **Updates are easy** - Just push to GitHub, auto-redeploys
5. **No credit card needed** (unless you upgrade later)

---

**Questions?** Check DEPLOY_NOW.md or DEPLOYMENT_GUIDE_FREE.md for detailed info!

Good luck! 🚀
