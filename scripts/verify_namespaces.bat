@echo off
REM Script Batch pour vérifier les namespaces
REM Utilise PowerShell pour la vérification

echo 🔍 Vérification des namespaces...
echo.

REM Vérifier si PowerShell est disponible
powershell -Command "Write-Host 'PowerShell OK'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERREUR: PowerShell n'est pas disponible
    echo.
    echo Solutions:
    echo 1. Utiliser le script .sh avec WSL/Git Bash
    echo 2. Installer PowerShell 5.1+ depuis Microsoft Store
    echo 3. Utiliser le script .ps1 directement
    goto :error
)

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0verify_namespaces.ps1"

goto :eof

:error
echo.
echo Pour plus d'informations, consultez scripts/README_NAMESPACE_CI.md
exit /b 1
