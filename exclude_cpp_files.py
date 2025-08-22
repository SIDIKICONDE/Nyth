#!/usr/bin/env python3
import re
import sys

def exclude_cpp_files(filename):
    """Exclure les fichiers C++ problématiques du build Xcode"""
    
    with open(filename, 'r') as f:
        content = f.read()
    
    # Fichiers à exclure temporairement
    files_to_exclude = [
        'OpenGLFilterProcessor.cpp',
        'FilterManager.cpp', 
        'MemoryManager.cpp',
        'FilterFactory.cpp',
        'ProductionConfig.cpp',
        'NativeCameraFiltersModule.cpp'
    ]
    
    # Pour chaque fichier à exclure, commenter sa référence dans le projet
    for file_to_exclude in files_to_exclude:
        # Trouver la ligne qui référence le fichier
        pattern = f'([^/]*{re.escape(file_to_exclude)}[^;]*;)'
        replacement = r'// TEMPORAIREMENT EXCLU: \1'
        content = re.sub(pattern, replacement, content)
        
        print(f"Fichier {file_to_exclude} exclu du build")
    
    with open(filename, 'w') as f:
        f.write(content)
    
    print("Fichiers C++ problématiques exclus du build Xcode")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 exclude_cpp_files.py <project.pbxproj>")
        sys.exit(1)
    
    exclude_cpp_files(sys.argv[1])
