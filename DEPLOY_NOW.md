# Quick Render Deployment Setup

Everything is now ready to deploy! Follow these steps:

## Step 1: Create GitHub Account (if you don't have one)
- Go to https://github.com/signup
- Create account and verify email

## Step 2: Create GitHub Repository
- Go to https://github.com/new
- Repository name: `local-problem-reporter`
- Select "Public" (Render needs to access it)
- Click "Create repository"

## Step 3: Push Code to GitHub
Open your terminal in the project folder and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/local-problem-reporter.git
git branch -M main
git add .
git commit -m "Initial commit - ready for deployment"
git push -u origin main
```

(Replace YOUR_USERNAME with your GitHub username)

## Step 4: Deploy Backend on Render.com

1. Go to https://render.com
2. Click "Sign up" → Connect with GitHub
3. Authorize Render to access your repositories
4. Click "New +" → Select "Web Service"
5. Connect your GitHub repo
6. Fill in these settings:
   - **Name:** `local-problem-reporter-api`
   - **Runtime:** Python 3.11
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
7. Click "Create Web Service"
8. Wait ~2 minutes for deployment
9. **Copy your URL** - it looks like: `https://local-problem-reporter-api.onrender.com`

## Step 5: Update Frontend with Backend URL

1. Go to your GitHub repo
2. Click "Add file" → "Create new file"
3. Name: `.env.production`
4. Paste this:
```
REACT_APP_API_URL=https://local-problem-reporter-api.onrender.com/api
```
(Replace with your actual Render URL)

5. Commit the file

## Step 6: Deploy Frontend on Vercel

1. Go to https://vercel.com
2. Click "Sign up" → Connect with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repo
5. Select "Framework Preset" → React
6. Set "Root Directory" → `frontend`
7. Add Environment Variable:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-render-url.onrender.com/api`
8. Click "Deploy"
9. Wait ~1 minute
10. **Your app is live!** You'll get a URL like `https://myapp.vercel.app`

## Step 7: Keep Backend Alive (Optional)

To prevent backend from sleeping on free tier:

1. Go to https://uptimerobot.com
2. Click "Sign up"
3. Click "Add Monitor"
4. URL: `https://your-render-url.onrender.com/api/issues/all?token=test`
5. Interval: 5 minutes
6. Save

This pings your backend every 5 minutes, keeping it awake!

## Done! 🎉

Your app is now live and accessible from anywhere:
- **Frontend:** Your Vercel URL
- **Backend:** Your Render URL
- **Share with friends:** Just send them the Vercel URL!

---

### Troubleshooting

**Backend shows 503 error?**
- It's sleeping (free tier). Wait 30 seconds for it to wake up.
- Or set up UptimeRobot to keep it alive.

**Frontend can't reach backend?**
- Check that `.env.production` has the correct Render URL
- Make sure `REACT_APP_API_URL` ends with `/api`

**Need to update code?**
- Just push to GitHub (`git push`)
- Render and Vercel will automatically redeploy!

---

Happy deploying! 🚀
