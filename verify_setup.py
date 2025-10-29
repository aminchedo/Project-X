#!/usr/bin/env python3
"""
Project-X Setup Verification Script
Checks if all required components are properly configured
"""

import os
import sys
from pathlib import Path

def check_file(path, description):
    """Check if a file exists"""
    if os.path.exists(path):
        print(f"[OK] {description}: Found")
        return True
    else:
        print(f"[FAIL] {description}: Missing")
        return False

def check_directory(path, description):
    """Check if a directory exists"""
    if os.path.isdir(path):
        print(f"[OK] {description}: Found")
        return True
    else:
        print(f"[FAIL] {description}: Missing")
        return False

def check_env_file(path):
    """Check .env.local file and its contents"""
    if not os.path.exists(path):
        print("[FAIL] .env.local: Missing")
        return False
    
    with open(path, 'r') as f:
        content = f.read()
        
    required_vars = ['VITE_API_BASE', 'VITE_WS_URL']
    missing = [var for var in required_vars if var not in content]
    
    if missing:
        print(f"[FAIL] .env.local: Missing variables: {', '.join(missing)}")
        return False
    
    print("[OK] .env.local: Properly configured")
    return True

def main():
    print("=" * 60)
    print("PROJECT-X SETUP VERIFICATION")
    print("=" * 60)
    print()
    
    project_root = Path(__file__).parent
    all_good = True
    
    print("DIRECTORY STRUCTURE")
    print("-" * 60)
    all_good &= check_directory(project_root / "src", "Frontend source (src/)")
    all_good &= check_directory(project_root / "backend", "Backend directory")
    all_good &= check_directory(project_root / "src" / "stores", "Zustand stores")
    all_good &= check_directory(project_root / "src" / "hooks", "React hooks")
    all_good &= check_directory(project_root / "backend" / "api", "Backend API routes")
    print()
    
    print("CRITICAL FILES")
    print("-" * 60)
    all_good &= check_file(project_root / "package.json", "package.json")
    all_good &= check_file(project_root / "backend" / "main.py", "Backend main.py")
    all_good &= check_file(project_root / "backend" / "requirements.txt", "Backend requirements.txt")
    all_good &= check_file(project_root / "src" / "stores" / "useAppStore.ts", "Global Zustand store")
    all_good &= check_file(project_root / "backend" / "api" / "portfolio_routes.py", "Portfolio routes")
    all_good &= check_file(project_root / "LOCAL_SETUP.md", "Setup guide")
    print()
    
    print("CONFIGURATION")
    print("-" * 60)
    all_good &= check_env_file(project_root / ".env.local")
    print()
    
    print("BACKEND VERIFICATION")
    print("-" * 60)
    
    # Check if portfolio router is included in main.py
    main_py_path = project_root / "backend" / "main.py"
    if main_py_path.exists():
        with open(main_py_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'from api.portfolio_routes import router as portfolio_router' in content:
            print("[OK] Portfolio router: Imported in main.py")
        else:
            print("[FAIL] Portfolio router: Not imported in main.py")
            all_good = False
            
        if 'app.include_router(portfolio_router)' in content:
            print("[OK] Portfolio router: Included in app")
        else:
            print("[FAIL] Portfolio router: Not included in app")
            all_good = False
            
        if '@app.websocket("/ws/market")' in content:
            print("[OK] WebSocket endpoint: /ws/market found")
        else:
            print("[FAIL] WebSocket endpoint: /ws/market not found")
            all_good = False
    print()
    
    print("=" * 60)
    if all_good:
        print("SUCCESS! ALL CHECKS PASSED! You're ready to start!")
        print()
        print("Quick Start:")
        print("  1. Terminal 1: cd backend && python main.py")
        print("  2. Terminal 2: npm run dev")
        print("  3. Browser: http://localhost:5173")
    else:
        print("WARNING! SOME CHECKS FAILED. Please review the errors above.")
        sys.exit(1)
    print("=" * 60)

if __name__ == "__main__":
    main()
