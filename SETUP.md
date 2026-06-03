# 🚀 Complete Setup Guide - Local Problem Reporter

This guide will get you from zero to running the full application locally.

## Prerequisites Check

Before starting, verify you have these installed:

```bash
# Python 3.8 or higher
python --version

# Node.js 14+ and npm
node --version
npm --version

# Git (optional, but recommended)
git --version
```

If any are missing, download from:
- Python: https://python.org/downloads/
- Node.js: https://nodejs.org/

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal line.

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will take a few minutes as it installs:
- FastAPI (web framework)
- SQLAlchemy (database ORM)
- YOLOv5 (AI model library)
- Pillow & OpenCV (image processing)
- And others...

**Note**: torch (PyTorch) is large (~500MB). The installation will take time.

### Step 4: Verify Installation

Test that everything works:

```bash
python -c "import yolov5; print('✓ YOLOv5 installed')"
python -c "import fastapi; print('✓ FastAPI installed')"
python -c "import sqlalchemy; print('✓ SQLAlchemy installed')"
```

### Step 5: Initialize Database

The database creates automatically when you first run the app, but you can pre-create it:

```bash
python
>>> from app.database import Base, engine
>>> from app.models import *
>>> Base.metadata.create_all(bind=engine)
>>> exit()
```

### Step 7: Configure Email (Required for Password Reset)

**⚠️ IMPORTANT:** Email configuration is required for the password reset feature to work.

Create a `.env` file in the backend directory with your email settings:

```bash
# In backend/.env
EMAIL_SMTP_USERNAME=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password-or-key
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
DEBUG=True
PORT=8000
```

#### For Gmail:
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification" → "App passwords"
   - Select "Mail" and "Other (custom name)"
   - Enter "Local Problem Reporter" as the name
   - Copy the 16-character password
3. Use your Gmail address as `EMAIL_SMTP_USERNAME`
4. Use the App Password as `EMAIL_SMTP_PASSWORD`

#### For Outlook/Hotmail:
```bash
EMAIL_SMTP_USERNAME=your-email@outlook.com
EMAIL_SMTP_PASSWORD=your-password
EMAIL_SMTP_SERVER=smtp-mail.outlook.com
EMAIL_SMTP_PORT=587
```

#### For Yahoo:
```bash
EMAIL_SMTP_USERNAME=your-email@yahoo.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_SMTP_SERVER=smtp.mail.yahoo.com
EMAIL_SMTP_PORT=587
```

#### For Custom SMTP:
Replace the values above with your email provider's SMTP settings.

**Test Email Configuration:**
```bash
# Start the backend
python run.py

# Test password reset in another terminal
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

You should receive a temporary password email if configured correctly.

### Step 8: Configure Frontend API URL

For production builds, create a `.env` file in the frontend directory:

```bash
# In frontend/.env
REACT_APP_API_URL=http://localhost:8000
```

For production deployment, change this to your Railway backend URL:
```bash
REACT_APP_API_URL=https://your-railway-backend.railway.app
```

**Note:** If your frontend runs on a different port (e.g., 3001), update the backend's CORS origins:
```bash
# In backend/.env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Step 9: Start Backend Server

```bash
python run.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

### Step 8: Test Backend API

Visit in your browser:
- **Main**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

You should see responses like `{"message": "Local Problem Reporter API"}`

---

## Frontend Setup

### Step 1: Open New Terminal (Keep Backend Running)

Open another terminal window/tab in the same workspace.

### Step 2: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- React & React DOM
- React Router for navigation
- Axios for API requests
- Chart.js for analytics
- And others...

This may take 2-3 minutes.

### Step 4: Start Development Server

```bash
npm start
```

Expected output:
```
webpack compiled successfully...
You can now view local-problem-reporter-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

The browser may open automatically to http://localhost:3000

---

## ✅ Verify Everything Works

### 1. Backend Running?
- Check terminal with `python run.py` is active
- Visit http://localhost:8000/health
- Should see `{"status": "healthy"}`

### 2. Frontend Running?
- Check terminal with `npm start` is active
- Visit http://localhost:3000
- Should see homepage with "Local Problem Reporter"

### 3. CORS Working?
- Frontend should load without errors
- Check browser console (F12) for errors

If CORS error appears, it means backend isn't running or they can't communicate.

## 🧪 Test the Full Flow

### 1. Report an Issue

- Click "Report Issue"
- Select an image from your computer
- Fill in details
- Click "Get My Location" (requires location permission)
- Submit

Expected result:
- Issue is processed by AI
- Shows detected type and priority
- Redirects to issues list

### 2. View Issues

- Click "View Issues"
- See list of reported issues
- Filter by priority/status/type
- Click on an issue for details

### 3. Try Authority Mode

- Click "Authority Mode" button in nav
- New tabs appear: "Dashboard", "Duplicates", and "Analytics"
- Visit Dashboard to see statistics
- Select an issue and update status

**Authority Account:**
- Email: `admin@authority.com`
- Password: `admin123`
- This account is created automatically on first startup

### 4. Test Duplicate Management

**Delete buttons** only appear for duplicate issues (marked by AI as duplicates).

To test duplicate management:
1. Report several similar issues in the same location
2. AI will automatically detect and mark duplicates
3. Login as authority (`admin@authority.com`)
4. Visit "Duplicates" page to manage duplicate groups
5. Select which duplicates to keep/delete

**Note:** If no duplicates exist, delete buttons won't appear on regular issues.

### 5. Test Password Reset

1. Go to login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for temporary password
5. Use temporary password to login
6. Change password in account settings (if implemented)

---

## 📁 Testing with Sample Images

To test without taking photos:

```bash
# Windows
curl -o test_image.jpg https://via.placeholder.com/500

# Or download from:
# - https://unsplash.com
# - https://picsum.photos
# - Your own photos
```

Then upload to test the system.

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Port 8000 already in use"**
```bash
# Use different port
python -c "uvicorn app.main:app --port 8001"
```

**Error: "Module not found"**
```bash
# Reactivate venv and reinstall
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Error: "YOLOv5 download failed"**
```bash
# Manual download with proxy
pip install --proxy [user:passwd@]proxy.server:port yolov5

# Or update pip
pip install --upgrade pip
```

### Frontend won't start

**Error: "Port 3000 already in use"**
```bash
# Use different port
PORT=3001 npm start
```

**Error: "npm: command not found"**
```bash
# Node.js not installed properly
# Reinstall from nodejs.org
# Restart terminal/IDE after install
```

**CORS Error in browser console**
```
Access to XMLHttpRequest blocked by CORS policy
```
Solution:
- Ensure backend is running on http://localhost:8000
- Check `proxy` in frontend/package.json matches backend

### Database issues

**Error: "database is locked"**
```bash
# Delete and recreate
rm backend/problems.db
# Restart server
python run.py
```

**Error: "table issues already exists"**
```bash
# Delete database file
rm backend/problems.db
# Database auto-creates on startup
```

### Image upload fails

**Error: "File too large"**
- Resize image before upload
- Max default is ~10MB

**Error: "Invalid file format"**
- Upload only .jpg, .jpeg, .png, .gif
- Check file extension

---

## 📊 API Testing with curl

```bash
# Get all issues
curl http://localhost:8000/api/issues/all

# Get system info
curl http://localhost:8000/api/system/info

# Get dashboard analytics
curl http://localhost:8000/api/analytics/dashboard

# Get scoring info
curl http://localhost:8000/api/scoring-info

# Export to CSV
curl -O http://localhost:8000/api/analytics/export/csv
```

---

## 🔧 Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- **Backend**: Changes to Python files auto-reload
- **Frontend**: Changes to React files auto-reload in browser

### Debug Mode
- Backend: Change `DEBUG=False` to `DEBUG=True` in .env
- Frontend: Open DevTools (F12) to see console logs

### Database Inspection
```python
# In Python REPL:
from app.database import SessionLocal
from app.models import Issue

db = SessionLocal()
issues = db.query(Issue).all()
for issue in issues:
    print(f"ID: {issue.id}, Type: {issue.issue_type}, Priority: {issue.priority_level}")
```

### API Documentation
FastAPI auto-generates interactive docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Try API endpoints directly from the docs!

---

## 🚀 Production Deployment

When ready for production:

1. **Use PostgreSQL instead of SQLite**
```python
# In backend/app/database.py
DATABASE_URL = "postgresql://user:password@localhost/dbname"
```

2. **Set DEBUG=False**

3. **Use environment variables** for configuration

4. **Enable HTTPS**

5. **Deploy with Gunicorn + Nginx**
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

6. **Build React for production**
```bash
npm run build
```

7. **Use cloud hosting**: AWS, Heroku, DigitalOcean, etc.

---

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **YOLOv5 Docs**: https://github.com/ultralytics/yolov5
- **SQLAlchemy Docs**: https://sqlalchemy.org/

---

## ✨ You're Ready!

Congratulations! 🎉

Your Local Problem Reporter is now running locally. 

**Next steps:**
1. Try reporting an issue
2. Test authority features
3. Explore the API documentation
4. Customize for your needs
5. Deploy to production

**Questions?** Check the main README.md for more info!

---

Happy coding! 🚀
