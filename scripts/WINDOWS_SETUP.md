# 🔍 Vérifications de Namespaces - Guide Windows

Ce guide explique comment utiliser les vérifications de namespaces sur Windows.

## 🚀 Démarrage Rapide

### Option 1: PowerShell (Recommandé)

```powershell
# Depuis le répertoire racine du projet
.\scripts\verify_namespaces.ps1

# Avec options
.\scripts\verify_namespaces.ps1 -Test    # Tester le script
.\scripts\verify_namespaces.ps1 -Clean   # Nettoyer les tests
.\scripts\verify_namespaces.ps1 -Help    # Aide
```

### Option 2: Script Batch

```cmd
# Double-cliquer ou exécuter dans CMD
scripts\verify_namespaces.bat
```

### Option 3: WSL/Git Bash (si installé)

```bash
# Utiliser le script Bash original
./scripts/verify_namespaces.sh
```

## 🛠️ Installation des Prérequis

### PowerShell (Méthode Recommandée)

1. **Vérifier PowerShell** :

   ```powershell
   $PSVersionTable.PSVersion
   # Doit être 5.1 ou supérieur
   ```

2. **Si PowerShell n'est pas installé** :

   - Windows 10+ : Déjà installé
   - Windows 7/8.1 : Installer [PowerShell 5.1](https://www.microsoft.com/en-us/download/details.aspx?id=54616)
   - Ou utiliser PowerShell Core depuis [Microsoft Store](https://www.microsoft.com/store/productId/9MZ1SNWT0N5D)

3. **Exécuter le script** :
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\scripts\verify_namespaces.ps1
   ```

### Git Bash / WSL

1. **Installer Git Bash** :

   - Télécharger depuis [git-scm.com](https://git-scm.com/download/win)
   - Ou utiliser WSL si Windows 10+

2. **Exécuter avec Git Bash** :
   ```bash
   cd /path/to/project
   chmod +x scripts/verify_namespaces.sh
   ./scripts/verify_namespaces.sh
   ```

## 📊 Exemples d'Utilisation

### Vérification Complète

```powershell
PS C:\Users\Conde\Desktop\nyth> .\scripts\verify_namespaces.ps1
🔍 Vérification des namespaces...
📁 Vérification de shared/Audio/safety/NativeAudioSafetyModule.h...
✅ shared/Audio/safety/NativeAudioSafetyModule.h - OK
📁 Vérification de shared/Audio/safety/NativeAudioSafetyModule.cpp...
✅ shared/Audio/safety/NativeAudioSafetyModule.cpp - OK
...
🎉 Toutes les vérifications de namespaces sont passées avec succès !
```

### Test du Script

```powershell
PS C:\Users\Conde\Desktop\nyth> .\scripts\verify_namespaces.ps1 -Test
🧪 Test des vérifications de namespaces...
📁 Fichiers de test créés
🧪 Test du script de vérification...
📁 Vérification de C:\Users\Conde\Desktop\nyth\test_namespace_verification\ValidModule.h...
✅ C:\Users\Conde\Desktop\nyth\test_namespace_verification\ValidModule.h - OK
📁 Vérification de C:\Users\Conde\Desktop\nyth\test_namespace_verification\InvalidModule.h...
❌ ERREUR: C:\Users\Conde\Desktop\nyth\test_namespace_verification\InvalidModule.h - Using declarations Nyth::Audio manquantes
❌ ERREUR: C:\Users\Conde\Desktop\nyth\test_namespace_verification\InvalidModule.h - Références longues Nyth::Audio::* non autorisées:
   Ligne 13: Nyth::Audio::SafetyConfig
   Ligne 14: Nyth::Audio::SafetyState
🎉 Test réussi ! Le script détecte correctement les erreurs de namespaces.
```

## 🔧 Dépannage

### Erreur: "Execution Policy"

```powershell
# Solution:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreur: "Fichier non trouvé"

- Vérifier le chemin d'exécution
- S'assurer d'être dans le répertoire racine du projet
- Utiliser le chemin absolu si nécessaire

### Erreur: "PowerShell non disponible"

```cmd
# Solutions:
# 1. Utiliser Git Bash
"C:\Program Files\Git\bin\bash.exe" -c "./scripts/verify_namespaces.sh"

# 2. Utiliser WSL
wsl bash -c "./scripts/verify_namespaces.sh"
```

## 📋 Scripts Disponibles

| Script                  | Usage      | Description                              |
| ----------------------- | ---------- | ---------------------------------------- |
| `verify_namespaces.ps1` | PowerShell | Script principal PowerShell              |
| `verify_namespaces.bat` | CMD/Batch  | Lance le script PowerShell               |
| `verify_namespaces.sh`  | Bash       | Script original (nécessite WSL/Git Bash) |

## 🎯 Intégration CI/CD Windows

### Azure DevOps

```yaml
# Dans azure-pipelines.yml
- task: PowerShell@2
  displayName: '🔍 Vérifier les Namespaces'
  inputs:
    targetType: 'inline'
    script: '.\scripts\verify_namespaces.ps1'
```

### GitHub Actions (Windows Runner)

```yaml
# Dans .github/workflows/verify-namespaces.yml
- name: 🔍 Vérifier les namespaces
  shell: powershell
  run: .\scripts\verify_namespaces.ps1
```

## 💡 Conseils pour Windows

1. **Utilisez PowerShell** : Plus moderne et puissant que CMD
2. **Chemin d'exécution** : Lancez depuis le répertoire racine du projet
3. **Execution Policy** : Configurez une fois pour éviter les erreurs
4. **IDE Integration** : VSCode peut exécuter les scripts PowerShell directement

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que PowerShell 5.1+ est installé
2. Exécutez `.\scripts\verify_namespaces.ps1 -Help` pour l'aide
3. Consultez les logs détaillés en cas d'erreur
4. Utilisez Git Bash comme fallback

**🎉 Vos vérifications de namespaces fonctionnent maintenant sur Windows !** 🚀
