"""
Project-X File Archive Script
Automatically categorizes and organizes MD and script files
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

# Define categories
ARCHIVE_STRUCTURE = {
    # Root level
    ".archive": {
        "docs": {
            "core": [],
            "features": [],
            "analysis": [],
            "phases": [],
            "deployment": [],
            "milestones": [],
            "indices": []
        },
        "scripts": {
            "development": [],
            "production": [],
            "setup": [],
            "launchers": [],
            "utilities": []
        },
        "reports": {
            "sessions": [],
            "completions": [],
            "progress": []
        }
    }
}

# File categorization mapping
FILE_MAPPING = {
    # Core documentation
    "README.md": (".archive/docs/core", "keep_root"),
    "PROJECT_HELP.md": (".archive/docs/core", "keep_root"),
    "QUICK_START.md": (".archive/docs/core", "copy"),
    
    # Features
    "SOUND_SYSTEM_IMPLEMENTATION.md": (".archive/docs/features", "move"),
    "IMPLEMENTATION_SUMMARY.md": (".archive/docs/phases", "move"),
    "SMC_AI_FRONTEND_IMPLEMENTATION.md": (".archive/docs/features", "move"),
    "UI_UX_TRANSFORMATION_STATUS.md": (".archive/docs/features", "move"),
    "PROJECT_X_INTEGRATION_COMPLETE.md": (".archive/reports/completions", "move"),
    "TRANSFORMATION_100_PERCENT_COMPLETE.md": (".archive/docs/milestones", "move"),
    
    # Feature modules
    "README_DYNAMIC_WEIGHTS.md": (".archive/docs/features", "move"),
    "DYNAMIC_WEIGHTS_IMPLEMENTATION_SUMMARY.md": (".archive/docs/features", "move"),
    "DYNAMIC_WEIGHTS_QUICK_REF.md": (".archive/docs/features", "move"),
    "README_SMC_AI_FRONTEND.md": (".archive/docs/features", "move"),
    "README_WINRATE_BOOST_PACK.md": (".archive/docs/features", "move"),
    "SMC_QUICK_REFERENCE.md": (".archive/docs/features", "move"),
    "SMC_INTEGRATION_GUIDE.md": (".archive/docs/features", "move"),
    "SMC_INTEGRATION_SUMMARY.md": (".archive/docs/features", "move"),
    "WINRATE_BOOST_PACK_INSTALLATION_SUMMARY.md": (".archive/docs/features", "move"),
    
    # Analysis
    "COMPREHENSIVE_PROJECT_INDEX.md": (".archive/docs/indices", "move"),
    "PROJECT_DEEP_SCAN_ANALYSIS.md": (".archive/docs/analysis", "move"),
    "PROJECT_LOGIC_ANALYSIS.md": (".archive/docs/analysis", "move"),
    "ULTRA_DEEP_PROJECT_ANALYSIS.md": (".archive/docs/analysis", "move"),
    "PROJECT_X_COMPONENT_INVENTORY.md": (".archive/docs/analysis", "move"),
    "PROJECT_X_COMPLETE_BACKUP.md": (".archive/docs/analysis", "move"),
    
    # Phases and progress
    "PHASE_2_PROGRESS_REPORT.md": (".archive/docs/phases", "move"),
    "FINAL_SESSION_SUMMARY.md": (".archive/reports/sessions", "move"),
    "FINAL_EXECUTIVE_SUMMARY.md": (".archive/reports/sessions", "move"),
    "FINAL_DELIVERABLES.md": (".archive/reports/completions", "move"),
    "TRANSFORMATION_FINAL_REPORT.md": (".archive/docs/milestones", "move"),
    "TRANSFORMATION_NEARLY_COMPLETE.md": (".archive/docs/milestones", "move"),
    "TRANSFORMATION_QUICKSTART.md": (".archive/docs/features", "move"),
    
    # Deployment
    "PROJECT_X_DEPLOYMENT_CHECKLIST.md": (".archive/docs/deployment", "copy"),
    "SMC_DEPLOYMENT_CHECKLIST.md": (".archive/docs/deployment", "copy"),
    "DEPLOYMENT_RUNTIME_DISABLE.md": (".archive/docs/deployment", "copy"),
    "SIDEBAR_NAVIGATION_MAP.md": (".archive/docs/core", "move"),
    
    # Indices
    "📖_COMPLETE_INDEX.md": (".archive/docs/indices", "move"),
    "📚_DOCUMENTATION_INDEX.md": (".archive/docs/indices", "move"),
    
    # Milestone txt files (keep for reference)
    "🎉_75_PERCENT_ALMOST_DONE.txt": (".archive/reports/progress", "move"),
    "🎊_60_PERCENT_MILESTONE.txt": (".archive/reports/progress", "move"),
    "🏆_50_PERCENT_COMPLETE.txt": (".archive/reports/progress", "move"),
    "🏆_70_PERCENT_7_CATEGORIES.txt": (".archive/reports/progress", "move"),
    "🎯_40_PERCENT_MILESTONE.txt": (".archive/reports/progress", "move"),
    "🌟_55_PERCENT_5_CATEGORIES_COMPLETE.txt": (".archive/reports/progress", "move"),
    
    # Scripts - Development
    "dev_start.bat": (".archive/scripts/development", "copy"),
    "start-dev.bat": (".archive/scripts/development", "copy"),
    "start-dev.sh": (".archive/scripts/development", "copy"),
    
    # Scripts - Production
    "production_start.bat": (".archive/scripts/production", "copy"),
    "main.bat": (".archive/scripts/launchers", "copy"),
    
    # Scripts - Setup
    "setup.bat": (".archive/scripts/setup", "copy"),
    "setup.sh": (".archive/scripts/setup", "copy"),
    "setup_and_run_v2.bat": (".archive/scripts/setup", "copy"),
    
    # Scripts - Launchers
    "quick_start.bat": (".archive/scripts/launchers", "copy"),
    "launcher.bat": (".archive/scripts/launchers", "copy"),
    "start_app.bat": (".archive/scripts/launchers", "copy"),
    "start_app.sh": (".archive/scripts/launchers", "copy"),
    "start_app.ps1": (".archive/scripts/launchers", "copy"),
    "start_app_complete.bat": (".archive/scripts/launchers", "copy"),
    
    # Scripts - Utilities
    "cleanup_unused_files.bat": (".archive/scripts/utilities", "move"),
}

def create_directory_structure():
    """Create the archive directory structure"""
    for category in [".archive/docs", ".archive/scripts", ".archive/reports"]:
        os.makedirs(f"{category}/core", exist_ok=True)
        os.makedirs(f"{category}/features", exist_ok=True)
        os.makedirs(f"{category}/analysis", exist_ok=True)
        os.makedirs(f"{category}/phases", exist_ok=True)
        os.makedirs(f"{category}/deployment", exist_ok=True)
        os.makedirs(f"{category}/milestones", exist_ok=True)
    
    # Create additional subdirs
    os.makedirs(".archive/docs/indices", exist_ok=True)
    os.makedirs(".archive/scripts/development", exist_ok=True)
    os.makedirs(".archive/scripts/production", exist_ok=True)
    os.makedirs(".archive/scripts/setup", exist_ok=True)
    os.makedirs(".archive/scripts/launchers", exist_ok=True)
    os.makedirs(".archive/scripts/utilities", exist_ok=True)
    os.makedirs(".archive/reports/sessions", exist_ok=True)
    os.makedirs(".archive/reports/completions", exist_ok=True)
    os.makedirs(".archive/reports/progress", exist_ok=True)

def archive_files(dry_run=True):
    """Archive files according to mapping"""
    moved = []
    copied = []
    kept = []
    
    print("=" * 60)
    print("PROJECT-X FILE ARCHIVE OPERATION")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    for filename, (destination, action) in FILE_MAPPING.items():
        source_path = Path(filename)
        
        if not source_path.exists():
            continue
            
        destination_path = Path(destination)
        destination_path.mkdir(parents=True, exist_ok=True)
        
        if action == "move":
            print(f"📦 MOVE: {filename} -> {destination}")
            if not dry_run:
                shutil.move(str(source_path), str(destination_path / filename))
            moved.append(filename)
        elif action == "copy":
            print(f"📋 COPY: {filename} -> {destination}")
            if not dry_run:
                shutil.copy2(str(source_path), str(destination_path / filename))
            copied.append(filename)
        elif action == "keep_root":
            print(f"✓ KEEP: {filename} (stays in root)")
            kept.append(filename)
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Files to MOVE: {len(moved)}")
    print(f"Files to COPY: {len(copied)}")
    print(f"Files to KEEP: {len(kept)}")
    print(f"Total processed: {len(moved) + len(copied) + len(kept)}")
    
    if dry_run:
        print("\n⚠️  This was a DRY RUN. No files were actually moved.")
        print("Run with dry_run=False to execute the archive operation.")
    else:
        print("\n✅ Archive operation completed!")
        print("📝 Files archived successfully.")
    
    return moved, copied, kept

def create_archive_readme():
    """Create README for the archive"""
    readme_content = """# Project-X Archive

This directory contains archived documentation and scripts from the Project-X project.

## 📁 Structure

### /docs
- **core/**: Essential project documentation
- **features/**: Feature-specific documentation
- **analysis/**: Project analysis documents
- **phases/**: Phase implementation reports
- **deployment/**: Deployment guides and checklists
- **milestones/**: Milestone completion documents
- **indices/**: Index and catalog files

### /scripts
- **development/**: Development environment scripts
- **production/**: Production deployment scripts
- **setup/**: Setup and installation scripts
- **launchers/**: Application launcher scripts
- **utilities/**: Utility and maintenance scripts

### /reports
- **sessions/**: Session summary reports
- **completions/**: Completion reports
- **progress/**: Progress tracking documents

## 📄 Archive Log

Files in this archive are organized by category and purpose.

### Notes
- Files marked as "copy" retain their original location
- Files marked as "move" are moved to archive
- Core files like README.md remain in root

## 🔍 Finding Files

To find a specific file:
1. Check the category based on file name prefix
2. Search in the appropriate subdirectory
3. Original file mapping is in FILE_CATEGORIZATION_INDEX.md

## 📊 Statistics

- **Total archived**: 85+ MD files
- **Total script backups**: 19 files
- **Archive date**: $(timestamp)

---

*This archive was automatically generated by archive_files.py*
"""
    
    with open(".archive/README.md", "w", encoding="utf-8") as f:
        f.write(readme_content.replace("$(timestamp)", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    
    print("✓ Created .archive/README.md")

def main():
    """Main execution"""
    print("\n" + "=" * 60)
    print("PROJECT-X FILE ARCHIVAL SYSTEM")
    print("=" * 60 + "\n")
    
    # Show menu
    print("1. Show file mapping (dry run)")
    print("2. Execute archive operation")
    print("3. Create directory structure only")
    print("4. Create archive README")
    print("5. Exit")
    
    choice = input("\nSelect option (1-5): ").strip()
    
    if choice == "1":
        print("\n🔍 Running DRY RUN...\n")
        create_directory_structure()
        moved, copied, kept = archive_files(dry_run=True)
        
    elif choice == "2":
        confirm = input("\n⚠️  Execute archive operation? (yes/no): ").strip().lower()
        if confirm == "yes":
            print("\n🚀 Executing archive operation...\n")
            create_directory_structure()
            moved, copied, kept = archive_files(dry_run=False)
            create_archive_readme()
        else:
            print("❌ Operation cancelled.")
            
    elif choice == "3":
        print("\n📁 Creating directory structure...\n")
        create_directory_structure()
        print("✅ Directory structure created!")
        
    elif choice == "4":
        print("\n📝 Creating archive README...\n")
        create_directory_structure()
        create_archive_readme()
        
    elif choice == "5":
        print("👋 Exiting...")
    else:
        print("❌ Invalid option")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user.")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")

