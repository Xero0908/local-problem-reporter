# Free Deployment Guide - Render.com + Vercel

Deploy your app completely free on Render.com and Vercel!

---

## **BACKEND DEPLOYMENT (Render.com - Free)**

### Step 1: Prepare Your Backend

1. Create `runtime.txt` in backend folder:
```
python-3.11.0
```

2. Create `.gitignore` (if not exists):
```
__pycache__/
*.pyc
.env
.venv/
*.db
uploads/
```

3. Update `requirements.txt` to include:
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
python-multipart==0.0.6
pillow==10.1.0
numpy==1.24.3
requests==2.31.0
```

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/local-problem-reporter.git
git push -u origin main
```

### Step 3: Deploy on Render.com

1. **Sign up** at [render.com](https://render.com) with GitHub
2. **Click "New +"** → Select **"Web Service"**
3. **Connect GitHub** → Select your repo
4. **Fill in details:**
   - Name: `local-problem-reporter-api`
   - Runtime: `Python 3.11`
   - Root Directory: `backend` (or leave blank if backend is in root)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. **Environment Variables** → Add if needed:
   - `DATABASE_URL` (optional, uses SQLite by default)
6. **Click "Create Web Service"**

✅ **Your backend will be live at:** `https://your-app-name.onrender.com`

**Note:** Free tier sleeps after 15 min inactivity. Add a cron job to keep it alive:
- Use [uptimerobot.com](https://uptimerobot.com) (free) to ping your API every 5 minutes

---

## **FRONTEND DEPLOYMENT (Vercel - Free)**

### Step 1: Update Frontend API URLs

Edit `frontend/src/api.js`:

```javascript
// Replace hardcoded localhost with your Render URL
const API_BASE = process.env.REACT_APP_API_URL || 'https://your-app-name.onrender.com/api';

// Or auto-detect:
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api'
  : 'https://your-app-name.onrender.com/api';
```

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-app-name.onrender.com/api
```

### Step 2: Deploy on Vercel

1. **Sign up** at [vercel.com](https://vercel.com) with GitHub
2. **Click "New Project"** → Import your repo
3. **Configure:**
   - Framework: React
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Environment Variables:**
   - Add `REACT_APP_API_URL` = `https://your-app-name.onrender.com/api`
5. **Click "Deploy"**

✅ **Your frontend will be live at:** `https://your-project-name.vercel.app`

---

## **ALTERNATIVE: Keep Backend Online 24/7 (Still Free)**

### Option A: Use Uptime Robot + Render

1. Go to [uptimerobot.com](https://uptimerobot.com) (free account)
2. **Create Monitor:**
   - URL: `https://your-app-name.onrender.com/api/health`
   - Interval: 5 minutes
3. This pings your API every 5 min, keeping it awake

### Option B: Use Railway.app (Better Free Tier)

Railway has a **$5/month free credit** which usually lasts much longer than you'd expect. Better uptime than Render's free tier.

1. Sign up at [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy like Render
4. **Better:** No sleeping, more reliable

### Option C: Raspberry Pi at Home

If you have a spare Raspberry Pi:
- Run backend 24/7 locally
- Use ngrok or Cloudflare Tunnel for free public access
- **Free forever** (just electricity)

```bash
# On Raspberry Pi running Linux:
ngrok http 8000
# Get public URL, use in frontend
```

---

## **COMPLETE FREE STACK**

| Component | Provider | Cost |
|-----------|----------|------|
| **Backend** | Render.com | Free (750 hrs/mo) |
| **Frontend** | Vercel | Free |
| **Database** | SQLite (local) | Free |
| **Keep Alive** | UptimeRobot | Free |
| **Total** | | **$0/month** |

---

## **Quick Checklist**

- [ ] Create GitHub repo with your code
- [ ] Add `runtime.txt` to backend
- [ ] Update `requirements.txt`
- [ ] Create Render.com account
- [ ] Deploy backend
- [ ] Update frontend API URLs
- [ ] Create Vercel account
- [ ] Deploy frontend
- [ ] Set up UptimeRobot (optional, to prevent sleeping)
- [ ] Test from another device using live URLs

---

## **Access App from Any Device**

Once deployed:

1. **Get your live URLs:**
   - Backend: `https://your-app-name.onrender.com`
   - Frontend: `https://your-project-name.vercel.app`

2. **Share with others:**
   - Send them the Vercel URL
   - They can access from any device, anywhere

3. **Mobile access:**
   - Just open the Vercel URL in browser
   - No installation needed

---

## **Troubleshooting**

### Backend shows 503 error
- Free tier is sleeping. Wait 30 seconds for it to wake up
- Or use Uptime Robot to keep it awake

### CORS errors in frontend
- Update backend `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend can't reach backend
- Check that API URL in frontend is correct
- Check Render backend is deployed and running
- Check CORS settings

---

## **Free Alternatives Comparison**

| Provider | Free Tier | Sleep | Setup Time |
|----------|-----------|-------|-----------|
| **Render** | 750 hrs/mo | Yes (15 min) | 5 min |
| **Railway** | $5 credit | No | 5 min |
| **Heroku** | ❌ Removed | - | - |
| **PythonAnywhere** | Limited | No | 10 min |
| **AWS** | 1 yr free tier | No | 30 min |

---

## **Recommended Setup**

**For Complete Beginners:**
- Backend: Render.com
- Frontend: Vercel
- Keep Alive: UptimeRobot
- **Cost: $0, Time: 15 minutes**

**For Better Reliability:**
- Backend: Railway.app
- Frontend: Vercel
- Cost: ~$5/month (usually lasts longer)

---

## **Next Steps**

1. Create GitHub repo → Push code
2. Sign up for Render.com
3. Deploy backend (5 min)
4. Update frontend API URL
5. Deploy frontend on Vercel (5 min)
6. Share your live URL with friends!

**That's it! Your app is now on the internet, completely free!** 🎉

---

## **Commands Quick Reference**

```bash
# Push to GitHub
git add .
git commit -m "Deploy to Render"
git push

# Render will automatically deploy from GitHub

# Test backend is working
curl https://your-app-name.onrender.com/api/issues/all?token=your_token

# Check frontend
# Just open https://your-project-name.vercel.app
```

---

For detailed help, check:
- Render: https://docs.render.com
- Vercel: https://vercel.com/docs
- UptimeRobot: https://uptimerobot.com/help/
