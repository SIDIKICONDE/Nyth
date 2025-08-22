#!/usr/bin/env python3
import re
import sys

def fix_project_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Ajouter les flags POSIX aux configurations Debug et Release
    posix_flags = [
        '"-D_POSIX_C_SOURCE=200809L"',
        '"-D_DARWIN_C_SOURCE=1"',
        '"-DHAVE_STRUCT_TIMESPEC=1"'
    ]
    
    # Pattern pour trouver OTHER_CFLAGS
    pattern = r'(OTHER_CFLAGS = \()([^)]*)(\);)'
    
    def replace_flags(match):
        existing = match.group(2).strip()
        if existing:
            # Ajouter les nouveaux flags
            new_flags = existing + ',\n\t\t\t\t' + ',\n\t\t\t\t'.join(posix_flags)
        else:
            new_flags = '\n\t\t\t\t' + ',\n\t\t\t\t'.join(posix_flags)
        return match.group(1) + new_flags + match.group(3)
    
    # Appliquer les modifications
    new_content = re.sub(pattern, replace_flags, content)
    
    # Ajouter GCC_PREPROCESSOR_DEFINITIONS si pas présent
    if 'GCC_PREPROCESSOR_DEFINITIONS' not in new_content:
        # Trouver une section de buildSettings pour ajouter les définitions
        pattern = r'(buildSettings = \{[^}]*CLANG_CXX_LANGUAGE_STANDARD[^}]*\};)'
        def add_definitions(match):
            settings = match.group(1)
            # Ajouter avant la fermeture }
            posix_defs = '\n\t\t\t\tGCC_PREPROCESSOR_DEFINITIONS = "$(inherited) _POSIX_C_SOURCE=200809L _DARWIN_C_SOURCE=1 HAVE_STRUCT_TIMESPEC=1";'
            return settings.replace('};', posix_defs + '\n\t\t\t};')
        
        new_content = re.sub(pattern, add_definitions, new_content)
    
    # Sauvegarder les modifications
    with open(filename, 'w') as f:
        f.write(new_content)
    
    print(f"Projet {filename} modifié avec succès")

if __name__ == "__main__":
    fix_project_file("Nyth.xcodeproj/project.pbxproj")
