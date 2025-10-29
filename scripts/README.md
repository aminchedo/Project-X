# Scripts Directory

This directory contains all executable scripts organized by purpose and platform.

## 📁 Organization Structure

```
scripts/
├── development/       # Development environment scripts
├── production/        # Production deployment scripts
├── setup/            # Installation and setup scripts
├── launchers/        # Application launcher scripts
└── utilities/        # Utility and maintenance scripts (if any)
```

## 🚀 Script Categories

### Development Scripts
Scripts for local development and testing.

**Location**: `scripts/development/`

**Files**:
- `dev_start.bat` - Start development environment (Windows)
- `start-dev.bat` - Alternative dev start script
- `start-dev.sh` - Start development environment (Unix/Linux)

**Usage**:
```bash
# Windows
.\scripts\development\dev_start.bat

# Unix/Linux
./scripts/development/start-dev.sh
```

---

### Production Scripts
Scripts for production deployment and serving.

**Location**: `scripts/production/`

**Files**:
- `production_start.bat` - Start production server (Windows)

**Usage**:
```bash
.\scripts\production\production_start.bat
```

---

### Setup Scripts
Scripts for project setup and installation.

**Location**: `scripts/setup/`

**Files**:
- `setup.bat` - Setup script for Windows
- `setup.sh` - Setup script for Unix/Linux
- `setup_and_run_v2.bat` - Version 2 setup and run script

**Usage**:
```bash
# Windows
.\scripts\setup\setup.bat

# Unix/Linux
./scripts/setup/setup.sh
```

---

### Launcher Scripts
Application launcher and quick start scripts.

**Location**: `scripts/launchers/`

**Files**:
- `main.bat` - Main application launcher
- `launcher.bat` - Alternative launcher
- `quick_start.bat` - Quick start script
- `start_app.bat` - Start application (Windows)
- `start_app.sh` - Start application (Unix/Linux)
- `start_app_complete.bat` - Complete application startup
- `start_local.bat` - Local start script
- `start_local.sh` - Local start script (Unix/Linux)

**Usage**:
```bash
# Windows - Main launcher
.\scripts\launchers\main.bat

# Windows - Quick start
.\scripts\launchers\quick_start.bat

# Unix/Linux
./scripts/launchers/start_app.sh

# Local development
.\scripts\launchers\start_local.bat
```

---

### Utilities Scripts
Utility and maintenance scripts.

**Location**: `scripts/utilities/`

**Files**:
- `test_ws.py` - WebSocket testing script
- `verify_runtime_disable.sh` - Runtime verification script

**Usage**:
```bash
# Test WebSocket
python scripts/test_ws.py

# Verify runtime
./scripts/verify_runtime_disable.sh
```

## 📋 Quick Reference

### Most Common Usage

**Start Development Environment**:
```bash
# Windows
.\scripts\development\dev_start.bat

# Unix/Linux
./scripts/development/start-dev.sh
```

**Start Production**:
```bash
.\scripts\production\production_start.bat
```

**Quick Start Application**:
```bash
.\scripts\launchers\main.bat
```

## 🎯 Script Organization Benefits

1. **Clear Purpose**: Each script has a designated category
2. **Easy Navigation**: Find scripts by their purpose
3. **Platform Support**: Separate Windows and Unix scripts
4. **Maintainability**: Organized structure for updates
5. **Documentation**: Clear categorization for team members

## 📝 Adding New Scripts

When adding new scripts:

1. **Determine Category**: What is the script's purpose?
   - Development? → `development/`
   - Production? → `production/`
   - Setup? → `setup/`
   - Launcher? → `launchers/`
   - Utility? → `utilities/`

2. **Platform Naming**:
   - Windows: Use `.bat` extension
   - Unix/Linux: Use `.sh` extension
   - Python: Use `.py` extension

3. **Documentation**: Update this README with new script

## 🔍 Finding Scripts

**By Purpose**:
- Need to start development? → `development/`
- Need to deploy? → `production/`
- Need to setup? → `setup/`
- Need to launch app? → `launchers/`
- Need utilities? → `utilities/`

**By Platform**:
- Windows: Look for `.bat` files
- Unix/Linux: Look for `.sh` files
- Python: Look for `.py` files

## 📊 Script Summary

| Category | Count | Files |
|----------|-------|-------|
| Development | 3 | dev_start.bat, start-dev.bat, start-dev.sh |
| Production | 1 | production_start.bat |
| Setup | 3 | setup.bat, setup.sh, setup_and_run_v2.bat |
| Launchers | 7 | main.bat, launcher.bat, quick_start.bat, start_app.bat, start_app.sh, start_app_complete.bat, start_local.bat, start_local.sh |
| Utilities | 2 | test_ws.py, verify_runtime_disable.sh |
| **Total** | **16** | **Scripts organized** |

---

**Last Updated**: October 29, 2025  
**Status**: Fully Organized ✅

