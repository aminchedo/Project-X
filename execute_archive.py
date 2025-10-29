"""
Non-interactive archive execution script
Moves files according to the categorization plan
"""

import os
import shutil
from datetime import datetime

# File mapping with (destination, action) tuples
# action: 'move', 'copy', 'keep_root'
MAPPING = {
    # Features
    'SOUND_SYSTEM_IMPLEMENTATION.md': ('.archive/docs/features', 'move'),
    'SMC_AI_FRONTEND_IMPLEMENTATION.md': ('.archive/docs/features', 'move'),
    'UI_UX_TRANSFORMATION_STATUS.md': ('.archive/docs/features', 'move'),
    'README_DYNAMIC_WEIGHTS.md': ('.archive/docs/features', 'move'),
    'DYNAMIC_WEIGHTS_IMPLEMENTATION_SUMMARY.md': ('.archive/docs/features', 'move'),
    'DYNAMIC_WEIGHTS_QUICK_REF.md': ('.archive/docs/features', 'move'),
    'README_SMC_AI_FRONTEND.md': ('.archive/docs/features', 'move'),
    'README_WINRATE_BOOST_PACK.md': ('.archive/docs/features', 'move'),
    'SMC_QUICK_REFERENCE.md': ('.archive/docs/features', 'move'),
    'SMC_INTEGRATION_GUIDE.md': ('.archive/docs/features', 'move'),
    'SMC_INTEGRATION_SUMMARY.md': ('.archive/docs/features', 'move'),
    'WINRATE_BOOST_PACK_INSTALLATION_SUMMARY.md': ('.archive/docs/features', 'move'),
    
    # Analysis
    'COMPREHENSIVE_PROJECT_INDEX.md': ('.archive/docs/indices', 'move'),
    'PROJECT_DEEP_SCAN_ANALYSIS.md': ('.archive/docs/analysis', 'move'),
    'PROJECT_LOGIC_ANALYSIS.md': ('.archive/docs/analysis', 'move'),
    'ULTRA_DEEP_PROJECT_ANALYSIS.md': ('.archive/docs/analysis', 'move'),
    'PROJECT_X_COMPONENT_INVENTORY.md': ('.archive/docs/analysis', 'move'),
    'PROJECT_X_COMPLETE_BACKUP.md': ('.archive/docs/analysis', 'move'),
    
    # Phases
    'PHASE_2_PROGRESS_REPORT.md': ('.archive/docs/phases', 'move'),
    'IMPLEMENTATION_SUMMARY.md': ('.archive/docs/phases', 'move'),
    
    # Milestones
    'TRANSFORMATION_100_PERCENT_COMPLETE.md': ('.archive/docs/milestones', 'move'),
    'TRANSFORMATION_FINAL_REPORT.md': ('.archive/docs/milestones', 'move'),
    'TRANSFORMATION_NEARLY_COMPLETE.md': ('.archive/docs/milestones', 'move'),
    'TRANSFORMATION_QUICKSTART.md': ('.archive/docs/features', 'move'),
    
    # Reports
    'FINAL_SESSION_SUMMARY.md': ('.archive/reports/sessions', 'move'),
    'FINAL_EXECUTIVE_SUMMARY.md': ('.archive/reports/sessions', 'move'),
    'FINAL_DELIVERABLES.md': ('.archive/reports/completions', 'move'),
    'PROJECT_X_INTEGRATION_COMPLETE.md': ('.archive/reports/completions', 'move'),
    
    # Core (copy)
    'QUICK_START.md': ('.archive/docs/core', 'copy'),
    
    # Deployment (copy)
    'PROJECT_X_DEPLOYMENT_CHECKLIST.md': ('.archive/docs/deployment', 'copy'),
    'SMC_DEPLOYMENT_CHECKLIST.md': ('.archive/docs/deployment', 'copy'),
    'DEPLOYMENT_RUNTIME_DISABLE.md': ('.archive/docs/deployment', 'copy'),
    'SIDEBAR_NAVIGATION_MAP.md': ('.archive/docs/core', 'copy'),
    
    # Indices
    '📖_COMPLETE_INDEX.md': ('.archive/docs/indices', 'move'),
    '📚_DOCUMENTATION_INDEX.md': ('.archive/docs/indices', 'move'),
    
    # Milestone TXT files
    '🏆_100_PERCENT_COMPLETE.txt': ('.archive/reports/progress', 'move'),
    '🎉_75_PERCENT_ALMOST_DONE.txt': ('.archive/reports/progress', 'move'),
    '🎊_60_PERCENT_MILESTONE.txt': ('.archive/reports/progress', 'move'),
    '🏆_50_PERCENT_COMPLETE.txt': ('.archive/reports/progress', 'move'),
    '🏆_70_PERCENT_7_CATEGORIES.txt': ('.archive/reports/progress', 'move'),
    '🎯_40_PERCENT_MILESTONE.txt': ('.archive/reports/progress', 'move'),
    '🌟_55_PERCENT_5_CATEGORIES_COMPLETE.txt': ('.archive/reports/progress', 'move'),
    
    # Scripts - Development
    'dev_start.bat': ('.archive/scripts/development', 'copy'),
    'start-dev.bat': ('.archive/scripts/development', 'copy'),
    'start-dev.sh': ('.archive/scripts/development', 'copy'),
    
    # Scripts - Production
    'production_start.bat': ('.archive/scripts/production', 'copy'),
    
    # Scripts - Setup
    'setup.bat': ('.archive/scripts/setup', 'copy'),
    'setup.sh': ('.archive/scripts/setup', 'copy'),
    'setup_and_run_v2.bat': ('.archive/scripts/setup', 'copy'),
    
    # Scripts - Launchers
    'main.bat': ('.archive/scripts/launchers', 'copy'),
    'quick_start.bat': ('.archive/scripts/launchers', 'copy'),
    'launcher.bat': ('.archive/scripts/launchers', 'copy'),
    'start_app.bat': ('.archive/scripts/launchers', 'copy'),
    'start_app.sh': ('.archive/scripts/launchers', 'copy'),
    'start_app.ps1': ('.archive/scripts/launchers', 'copy'),
    'start_app_complete.bat': ('.archive/scripts/launchers', 'copy'),
    
    # Scripts - Utilities
    'cleanup_unused_files.bat': ('.archive/scripts/utilities', 'move'),
}

def execute_archive():
    """Execute the archive operation"""
    moved_count = 0
    copied_count = 0
    not_found = []
    
    print("=" * 60)
    print("PROJECT-X ARCHIVE OPERATION")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    for filename, (destination, action) in MAPPING.items():
        if not os.path.exists(filename):
            not_found.append(filename)
            continue
            
        os.makedirs(destination, exist_ok=True)
        dest_path = os.path.join(destination, filename)
        
        try:
            if action == 'move':
                shutil.move(filename, dest_path)
                try:
                    print(f"[MOVED] {filename:45} -> {destination}")
                except UnicodeEncodeError:
                    print(f"[MOVED] {filename.encode('ascii', 'ignore').decode()} -> {destination}")
                moved_count += 1
            elif action == 'copy':
                shutil.copy2(filename, dest_path)
                try:
                    print(f"[COPIED] {filename:45} -> {destination}")
                except UnicodeEncodeError:
                    print(f"[COPIED] {filename.encode('ascii', 'ignore').decode()} -> {destination}")
                copied_count += 1
        except Exception as e:
            try:
                print(f"[ERROR] {filename}: {e}")
            except UnicodeEncodeError:
                print(f"[ERROR] {filename.encode('ascii', 'ignore').decode()}: {e}")
    
    print()
    print("=" * 60)
    print("ARCHIVE COMPLETE")
    print("=" * 60)
    print(f"Files MOVED: {moved_count}")
    print(f"Files COPIED: {copied_count}")
    print(f"Files NOT FOUND: {len(not_found)}")
    if not_found:
        print("\nFiles not found:")
        for f in not_found[:5]:
            print(f"  - {f}")
        if len(not_found) > 5:
            print(f"  ... and {len(not_found) - 5} more")
    print("=" * 60)
    
    # Create archive README
    create_archive_readme()
    
def create_archive_readme():
    """Create README for the archive"""
    readme_content = f"""# Project-X Archive

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

## 📊 Statistics

- **Archive created**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Total categories**: 10
- **Organization**: By type and purpose

## 🔍 Finding Files

Files are organized by category in the appropriate subdirectory.

For a complete file map, see:
- `FILE_CATEGORIZATION_INDEX.md` in root
- `ARCHIVE_OPERATION_SUMMARY.md` in root

---

*This archive was automatically generated*
"""
    
    readme_path = ".archive/README.md"
    os.makedirs(".archive", exist_ok=True)
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    print(f"\n[OK] Created {readme_path}")

if __name__ == "__main__":
    try:
        execute_archive()
    except KeyboardInterrupt:
        print("\n\n[WARN] Operation cancelled by user.")
    except Exception as e:
        print(f"\n\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

