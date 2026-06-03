# ⚡ Quick Start Guide - Run in 1 Minute

> **Already set up? Skip straight to running the app!**

## For Windows Users 🪟

### Option 1: Easiest - Double-click the script

1. Open the project folder in File Explorer
2. Double-click **`run-dev.bat`**
3. Two command windows will open automatically
4. Done! Open http://localhost:3000

### Option 2: PowerShell

```powershell
# Right-click the project folder and select "Open PowerShell here", then:
.\run-dev.ps1
```

### Option 3: Manual Setup

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
python run.py

# Terminal 2 - Frontend (in project root)
cd frontend
npm start
```

---

## For macOS/Linux Users 🍎🐧

### Option 1: Easiest - Run the shell script

```bash
chmod +x run-dev.sh
./run-dev.sh
```

### Option 2: Manual Setup

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2 - Frontend (in project root)
cd frontend
npm start
```

---

## After Startup ✅

Once both servers are running:

| Component       | URL                         | Purpose                       |
| --------------- | --------------------------- | ----------------------------- |
| **Frontend**    | http://localhost:3000       | Main application              |
| **Backend API** | http://localhost:8000       | API server                    |
| **API Docs**    | http://localhost:8000/docs  | Interactive API documentation |
| **ReDoc**       | http://localhost:8000/redoc | Alternative API docs          |

### Test Login

- **Email**: `admin@authority.com`
- **Password**: `admin123`
- This is an authority account with dashboard access

### Or Create a New Account

- Click "Create account" on the login page
- Fill in details and pick a security question
- Create your account
- Start reporting issues!

---

## 🛠️ Troubleshooting

### Backend won't start?

```bash
# Make sure virtual environment is activated
cd backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Try running
python run.py
```

If you see `ModuleNotFoundError`, reinstall dependencies:

```bash
pip install -r requirements.txt
```

### Frontend won't start?

```bash
# Make sure you're in the frontend folder
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Then start
npm start
```

### Port already in use?

- **Backend (8000)**: Close other apps using that port
- **Frontend (3000)**: Close other React apps

### CORS errors?

Make sure backend is running first (http://localhost:8000 should be accessible)

---

## 📁 Project Structure

```
project/
├── backend/           # FastAPI server (Port 8000)
│   ├── venv/         # Python virtual environment
│   ├── app/          # Application code
│   ├── run.py        # Start backend
│   └── requirements.txt
│
├── frontend/         # React app (Port 3000)
│   ├── node_modules/
│   ├── src/          # React components
│   ├── package.json
│   └── npm start     # Start frontend
│
├── run-dev.bat       # Windows startup script
├── run-dev.ps1       # PowerShell startup script
└── run-dev.sh        # macOS/Linux startup script
```

---

## 🎯 Common Tasks

### Stop all servers

- Press **Ctrl+C** in both terminal windows

### Clear all data and start fresh

```bash
python clear_data.py
# Then restart backend and frontend
```

### Run tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Build for production

```bash
cd frontend
npm run build
```

---

## 🆘 Need Help?

1. Check [SETUP.md](./SETUP.md) for detailed configuration
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
3. Check [API_EXAMPLES.md](./API_EXAMPLES.md) for API usage
4. Review errors in the terminal window

---

## ✨ You're all set!

The application is now ready to use. Start by:

1. Creating a new user account or login with `admin@authority.com / admin123`
2. Report an issue with a photo
3. View the dashboard to see AI analysis
4. Check duplicates and analytics

Enjoy! 🚀
