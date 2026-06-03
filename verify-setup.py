#!/usr/bin/env python
"""
Verify that the Local Problem Reporter is ready to run
"""
import os
import sys
from pathlib import Path

def check_python():
    """Check Python version"""
    version = sys.version_info
    print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
    return version.major >= 3 and version.minor >= 8

def check_venv():
    """Check if virtual environment is active"""
    venv_active = hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    )
    if venv_active:
        print("✓ Virtual environment is active")
    else:
        print("⚠ Virtual environment is not active (this may be OK)")
    return venv_active

def check_imports():
    """Check if required packages are installed"""
    required = {
        'fastapi': 'FastAPI',
        'uvicorn': 'Uvicorn',
        'sqlalchemy': 'SQLAlchemy',
        'pydantic': 'Pydantic',
        'jwt': 'PyJWT',
    }
    
    missing = []
    for package, name in required.items():
        try:
            __import__(package)
            print(f"✓ {name} installed")
        except ImportError:
            print(f"✗ {name} NOT installed")
            missing.append(package)
    
    return len(missing) == 0

def check_files():
    """Check if required files exist"""
    files = {
        'backend/run.py': 'Backend startup script',
        'backend/app/main.py': 'FastAPI application',
        'backend/requirements.txt': 'Backend dependencies',
        'frontend/package.json': 'Frontend configuration',
        'frontend/public/index.html': 'Frontend HTML',
        '.env.example': 'Environment example',
    }
    
    base = Path(__file__).parent
    all_exist = True
    
    for filepath, description in files.items():
        full_path = base / filepath
        if full_path.exists():
            print(f"✓ {description}")
        else:
            print(f"✗ {description} NOT found: {filepath}")
            all_exist = False
    
    return all_exist

def check_databases():
    """Check if databases exist"""
    db_path = Path(__file__).parent / 'backend/problems.db'
    if db_path.exists():
        size = db_path.stat().st_size
        print(f"✓ Database exists ({size} bytes)")
        return True
    else:
        print("⚠ Database not found (will be created on first run)")
        return True  # Not critical

def main():
    print("\n" + "="*50)
    print("🔍 Local Problem Reporter - System Check")
    print("="*50 + "\n")
    
    checks = [
        ("Python Version", check_python),
        ("Required Packages", check_imports),
        ("Project Files", check_files),
        ("Database", check_databases),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n📋 {name}:")
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"✗ Error checking {name}: {e}")
            results.append((name, False))
    
    # Check venv separately as warning (not critical)
    print(f"\n📋 Virtual Environment (Optional):")
    venv_result = check_venv()
    
    print("\n" + "="*50)
    print("📊 Summary:")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    venv_status = "✓ PASS" if venv_result else "⚠ WARNING"
    print(f"{venv_status}: Virtual Environment (optional)")
    
    print("\n" + "="*50)
    
    if passed == total:
        print("✅ All critical checks passed! Ready to run.\n")
        print("🚀 To start the application:")
        print("  Windows: run-dev.bat")
        print("  macOS/Linux: ./run-dev.sh\n")
        return 0
    else:
        print(f"⚠ {total - passed} check(s) failed.")
        print("Please see SETUP.md for installation instructions.\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
