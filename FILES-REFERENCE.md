# 📂 Project Files Reference

## Quick Start Files (New - Use These!)

### Startup Scripts

- **`run-dev.bat`** - Windows: Double-click to start backend + frontend
- **`run-dev.ps1`** - Windows PowerShell version
- **`run-dev.sh`** - macOS/Linux version

### Documentation

- **`QUICK-START.md`** ⭐ READ THIS FIRST - 1-minute quick start guide
- **`READY-TO-RUN.md`** - System status and what's configured
- **`SETUP.md`** - Detailed setup instructions (reference)

### Verification

- **`verify-setup.py`** - Run `python verify-setup.py` to check if everything is ready

---

## Backend Files

### Application Structure

```
backend/
├── run.py                      # Start backend: python run.py
├── requirements.txt            # Python dependencies (pip install -r requirements.txt)
├── .env                        # Environment configuration (email settings)
├── problems.db                 # SQLite database (auto-created)
├── venv/                       # Python virtual environment
│   └── Scripts/Activate.ps1   # Activation script for Windows
│
└── app/
    ├── __init__.py
    ├── main.py                # FastAPI app initialization
    ├── models.py              # SQLAlchemy database models
    ├── schemas.py             # Pydantic request/response schemas
    ├── database.py            # Database configuration
    │
    ├── routes/
    │   ├── __init__.py
    │   ├── auth.py            # Authentication endpoints
    │   ├── issues.py          # Issue management endpoints
    │   └── analytics.py       # Analytics endpoints
    │
    └── services/
        ├── __init__.py
        ├── ai_detector.py     # YOLO image detection
        ├── auth.py            # Authentication utilities
        └── priority_scorer.py # Priority calculation
```

### Backend URLs (After Startup)

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Frontend Files

### Application Structure

```
frontend/
├── package.json               # npm configuration, dependencies
├── .env                       # Environment variables (REACT_APP_API_URL)
├── .env.example              # Example environment file
│
├── public/
│   └── index.html            # HTML entry point
│
└── src/
    ├── index.js              # React entry point
    ├── App.jsx               # Main component with routing
    ├── index.css             # Global styles
    │
    ├── pages/
    │   ├── LoginPage.jsx     # Login and registration
    │   ├── ForgotPasswordPage.jsx  # Password reset
    │   ├── ReportPage.jsx    # Report new issue
    │   ├── IssuesListPage.jsx     # Browse issues
    │   ├── IssueDetailPage.jsx    # Issue details
    │   ├── DashboardPage.jsx      # Authority dashboard
    │   ├── AnalyticsPage.jsx      # Analytics/reports
    │   ├── DuplicatesPage.jsx     # Duplicate management
    │   ├── ResolvedPage.jsx       # Resolved issues
    │   └── CivicImpactPage.jsx    # User contribution stats
    │
    └── components/           # Reusable React components
```

### Frontend URL (After Startup)

- **App**: http://localhost:3000

---

## Configuration Files

### Backend Configuration

- **`backend/.env`** - Email settings, port, debug mode
- **`.env.example`** - Example configuration

### Frontend Configuration

- **`frontend/.env`** - API URL configuration
- **`frontend/.env.example`** - Example configuration

---

## Database

- **Location**: `backend/problems.db`
- **Type**: SQLite3
- **Auto-created**: Yes (on first startup)
- **Sample Data**: Authority account (`admin@authority.com / admin123`)

---

## Documentation

### For Getting Started (Read These First)

1. **QUICK-START.md** - 1-minute startup guide
2. **READY-TO-RUN.md** - What's configured and ready

### For Reference/Setup

3. **SETUP.md** - Detailed setup instructions
4. **README.md** - Project overview and features
5. **ARCHITECTURE.md** - System design and components
6. **API_EXAMPLES.md** - Example API calls
7. **PROJECT_SUMMARY.md** - Project statistics

---

## Test Reports

- **`TEST_REPORT.md`** - Complete test results from functionality testing
- **`test_*.py`** - Various test scripts for development

---

## Development Files

- **`requirements.txt`** - Root level Python dependencies
- **`Dockerfile`** - Docker configuration
- **`docker-compose.yml`** - Docker compose setup
- **`.gitignore`** - Git ignore rules
- **`vercel.json`** - Vercel deployment config

---

## Upload Directory

- **`uploads/`** - Stores uploaded issue images
- **`public/`** - Static files for frontend

---

## How to Use This Reference

1. **Want to start the app?** → Use `QUICK-START.md` + `run-dev.bat`
2. **Want to verify setup?** → Run `python verify-setup.py`
3. **Want detailed setup?** → Read `SETUP.md`
4. **Want to understand architecture?** → Read `ARCHITECTURE.md`
5. **Want API examples?** → Read `API_EXAMPLES.md`

---

## File Checklist

### ✅ Backend Ready

- ✓ `backend/run.py` exists
- ✓ `backend/requirements.txt` installed
- ✓ `backend/venv/` virtual environment created
- ✓ `backend/.env` configured
- ✓ `backend/app/main.py` configured

### ✅ Frontend Ready

- ✓ `frontend/package.json` configured
- ✓ `frontend/.env` configured
- ✓ `frontend/node_modules/` installed
- ✓ `frontend/src/App.jsx` routing setup

### ✅ Database Ready

- ✓ SQLite configuration in `backend/app/database.py`
- ✓ Models defined in `backend/app/models.py`
- ✓ Database auto-creates on startup

### ✅ Startup Scripts Ready

- ✓ `run-dev.bat` created for Windows
- ✓ `run-dev.ps1` created for PowerShell
- ✓ `run-dev.sh` created for macOS/Linux

### ✅ Documentation Ready

- ✓ `QUICK-START.md` created
- ✓ `READY-TO-RUN.md` created
- ✓ `verify-setup.py` created
- ✓ `README.md` updated

---

## Summary

Everything is configured and ready to run. Choose your startup method and you're good to go! 🚀
