# Makefile pour la gestion des modules Shared
# Utilise les scripts Ruby pour ajouter/supprimer automatiquement tous les fichiers shared/

.PHONY: help add-shared remove-shared demo backup restore clean list-backups maintenance clean-cache check-project backup-project update-deps monitor maintenance-all maintenance-install install-deps clean-deps link-deps install-node-modules clean-node-modules setup-react-native stop-ports kill-processes clean-simulator reset-simulator start-simulator troubleshoot fresh-install test test-watch test-coverage archive export-dev export-prod devices logs clear-logs version bump-version assets-clean code-sign-check provisioning

# Couleurs pour les messages
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
PURPLE=\033[0;35m
CYAN=\033[0;36m
NC=\033[0m # No Color

# Configuration
PROJECT_NAME=Nyth
SHARED_PATH=../shared
PROJECT_PATH=$(PROJECT_NAME).xcodeproj
BACKUP_PREFIX=$(PROJECT_PATH)/project.pbxproj.backup_

# Vérification des prérequis
check-prerequisites:
	@echo "$(CYAN)🔍 Vérification des prérequis...$(NC)"
	@command -v ruby >/dev/null 2>&1 || { echo "$(RED)❌ Ruby n'est pas installé$(NC)"; exit 1; }
	@gem list xcodeproj -i >/dev/null 2>&1 || { echo "$(RED)❌ Gem xcodeproj manquante. Installez avec: gem install xcodeproj$(NC)"; exit 1; }
	@test -d "$(SHARED_PATH)" || { echo "$(RED)❌ Dossier shared/ non trouvé: $(SHARED_PATH)$(NC)"; exit 1; }
	@test -f "$(PROJECT_PATH)/project.pbxproj" || { echo "$(RED)❌ Fichier project.pbxproj non trouvé$(NC)"; exit 1; }
	@echo "$(GREEN)✅ Tous les prérequis sont satisfaits$(NC)"

# Aide
help:
	@echo "$(PURPLE)🎯 Makefile - Gestion des modules Shared$(NC)"
	@echo ""
	@echo "$(CYAN)Commandes disponibles:$(NC)"
	@echo ""
	@echo "  $(GREEN)make help$(NC)              - Afficher cette aide"
	@echo "  $(GREEN)make demo$(NC)              - Voir la démonstration des scripts"
	@echo ""
	@echo "$(PURPLE)📂 GESTION DES MODULES SHARED:$(NC)"
	@echo "  $(GREEN)make add-shared$(NC)        - Ajouter tous les modules shared/"
	@echo "  $(GREEN)make remove-shared$(NC)     - Supprimer tous les modules shared/"
	@echo ""
	@echo "$(PURPLE)🛠️  MAINTENANCE COMPLÈTE:$(NC)"
	@echo "  $(GREEN)make maintenance$(NC)       - Menu de maintenance interactif"
	@echo "  $(GREEN)make clean-cache$(NC)       - Nettoyer tous les caches"
	@echo "  $(GREEN)make check-project$(NC)     - Diagnostiquer l'état du projet"
	@echo "  $(GREEN)make backup-project$(NC)    - Sauvegarde complète du projet"
	@echo "  $(GREEN)make update-deps$(NC)       - Mettre à jour les dépendances"
	@echo "  $(GREEN)make monitor$(NC)           - Monitorer les performances"
	@echo "  $(GREEN)make maintenance-all$(NC)   - Exécuter toutes les vérifications"
	@echo ""
	@echo "$(PURPLE)⚛️  DÉPENDANCES REACT NATIVE:$(NC)"
	@echo "  $(GREEN)make install-deps$(NC)      - Installer toutes les dépendances"
	@echo "  $(GREEN)make clean-deps$(NC)        - Nettoyer les dépendances"
	@echo "  $(GREEN)make link-deps$(NC)         - Lier les dépendances natives"
	@echo "  $(GREEN)make install-node-modules$(NC) - Installer node_modules"
	@echo "  $(GREEN)make clean-node-modules$(NC) - Nettoyer node_modules"
	@echo "  $(GREEN)make setup-react-native$(NC) - Configuration complète React Native"
	@echo ""
	@echo "$(PURPLE)🚀 SIMULATEUR & PROCESSUS:$(NC)"
	@echo "  $(GREEN)make stop-ports$(NC)         - Arrêter les processus sur les ports"
	@echo "  $(GREEN)make kill-processes$(NC)     - Tuer les processus React Native"
	@echo "  $(GREEN)make clean-simulator$(NC)    - Nettoyer le simulateur iOS"
	@echo "  $(GREEN)make reset-simulator$(NC)    - Reset des données (sims préservés)"
	@echo "  $(GREEN)make start-simulator$(NC)    - Démarrer le simulateur iOS"
	@echo ""
	@echo "$(PURPLE)📋 SAUVEGARDES & ÉTAT:$(NC)"
	@echo "  $(GREEN)make backup$(NC)            - Créer une sauvegarde manuelle"
	@echo "  $(GREEN)make list-backups$(NC)      - Lister toutes les sauvegardes"
	@echo "  $(GREEN)make status$(NC)            - Voir l'état actuel du projet"
	@echo ""
	@echo "$(PURPLE)🧹 NETTOYAGE:$(NC)"
	@echo "  $(GREEN)make clean$(NC)             - Nettoyer les fichiers temporaires"
	@echo "  $(GREEN)make assets-clean$(NC)      - Nettoyer le cache des assets"
	@echo "  $(GREEN)make clear-logs$(NC)        - Effacer tous les logs"
	@echo ""
	@echo "$(PURPLE)🧪 TESTS & QUALITÉ:$(NC)"
	@echo "  $(GREEN)make test$(NC)              - Exécuter tous les tests"
	@echo "  $(GREEN)make test-watch$(NC)        - Tests en mode watch"
	@echo "  $(GREEN)make test-coverage$(NC)     - Tests avec coverage"
	@echo ""
	@echo "$(PURPLE)📦 DÉPLOIEMENT & DISTRIBUTION:$(NC)"
	@echo "  $(GREEN)make archive$(NC)           - Créer une archive iOS"
	@echo "  $(GREEN)make export-dev$(NC)        - Export pour développement"
	@echo "  $(GREEN)make export-prod$(NC)       - Export pour production"
	@echo "  $(GREEN)make code-sign-check$(NC)   - Vérifier le code signing"
	@echo "  $(GREEN)make provisioning$(NC)      - Gérer les provisioning profiles"
	@echo ""
	@echo "$(PURPLE)📱 DEVICES & DEBUGGING:$(NC)"
	@echo "  $(GREEN)make devices$(NC)           - Lister les devices connectés"
	@echo "  $(GREEN)make logs$(NC)              - Afficher les logs en temps réel"
	@echo "  $(GREEN)make version$(NC)           - Afficher la version actuelle"
	@echo "  $(GREEN)make bump-version$(NC)      - Incrémenter la version"
	@echo ""
	@echo "$(CYAN)Prérequis:$(NC)"
	@echo "  - Ruby >= 2.0"
	@echo "  - Gem xcodeproj"
	@echo "  - Dossier ../shared/"
	@echo ""
	@echo "$(YELLOW)⚠️  Important:$(NC)"
	@echo "  - Les scripts créent des sauvegardes automatiques"
	@echo "  - Fermez Xcode avant d'exécuter les scripts"
	@echo "  - Utilisez 'make list-backups' pour voir les sauvegardes"
	@echo "  - 📱 Les simulateurs iOS sont TOUJOURS préservés"

# Démonstration
demo: check-prerequisites
	@echo "$(CYAN)🎬 DÉMONSTRATION - Scripts de gestion shared/$(NC)"
	@echo "$(PURPLE)" && ruby demo_shared_modules.rb

# Ajouter les modules shared/
add-shared: check-prerequisites
	@echo "$(CYAN)🚀 AJOUT DES MODULES SHARED/$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Une sauvegarde automatique sera créée"
	@echo "   - Assurez-vous que Xcode est fermé"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Opération annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Exécution du script...$(NC)"
	ruby add_shared_modules.rb
	@echo ""
	@echo "$(GREEN)✅ Modules shared/ ajoutés avec succès !$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Prochaines étapes:$(NC)"
	@echo "  1. Ouvrez le workspace: $(GREEN)open $(PROJECT_NAME).xcworkspace$(NC)"
	@echo "  2. Vérifiez les groupes dans le navigateur"
	@echo "  3. Configurez les chemins d'inclusion si nécessaire"
	@echo "  4. Testez la compilation: Cmd+B"

# Supprimer les modules shared/
remove-shared: check-prerequisites
	@echo "$(CYAN)🗑️ SUPPRESSION DES MODULES SHARED/$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Une sauvegarde automatique sera créée"
	@echo "   - Le dossier physique ../shared/ ne sera pas supprimé"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Opération annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Exécution du script...$(NC)"
	ruby remove_shared_modules.rb
	@echo ""
	@echo "$(GREEN)✅ Modules shared/ supprimés avec succès !$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Note:$(NC)"
	@echo "  Le dossier physique $(SHARED_PATH) reste intact"

# Créer une sauvegarde manuelle
backup:
	@echo "$(CYAN)📋 CRÉATION D'UNE SAUVEGARDE MANUELLE$(NC)"
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	backup_file="$(BACKUP_PREFIX)$${timestamp}"; \
	cp "$(PROJECT_PATH)/project.pbxproj" "$$backup_file"; \
	echo "$(GREEN)✅ Sauvegarde créée:$(NC) $$backup_file"

# Lister les sauvegardes
list-backups:
	@echo "$(CYAN)📋 SAUVEGARDES DISPONIBLES$(NC)"
	@echo ""
	@ls -la $(PROJECT_PATH)/project.pbxproj.backup_* 2>/dev/null || echo "$(YELLOW)ℹ️  Aucune sauvegarde trouvée$(NC)"
	@echo ""
	@echo "$(CYAN)📖 Pour restaurer une sauvegarde:$(NC)"
	@echo "   $(GREEN)cp <sauvegarde> $(PROJECT_PATH)/project.pbxproj$(NC)"

# État du projet
status: check-prerequisites
	@echo "$(CYAN)📊 ÉTAT DU PROJET$(NC)"
	@echo ""
	@echo "$(BLUE)📁 Projet:$(NC) $(PROJECT_PATH)"
	@echo "$(BLUE)📂 Shared:$(NC) $(SHARED_PATH)"
	@if [ -d "$(SHARED_PATH)" ]; then \
		echo "$(BLUE)📊 Fichiers dans shared/:$(NC)"; \
		find "$(SHARED_PATH)" -type f \( -name "*.cpp" -o -name "*.hpp" -o -name "*.h" -o -name "*.mm" \) | wc -l | tr -d ' ' | xargs echo "   Sources: "; \
	fi
	@echo ""
	@echo "$(BLUE)🔍 Modules présents dans le projet:$(NC)"
	@grep -c "shared" $(PROJECT_PATH)/project.pbxproj 2>/dev/null || echo "   Aucun module shared détecté"
	@echo ""
	@echo "$(BLUE)📋 Sauvegardes disponibles:$(NC)"
	@ls $(PROJECT_PATH)/project.pbxproj.backup_* 2>/dev/null | wc -l | tr -d ' ' | xargs echo "   Nombre: "

# Nettoyer les fichiers temporaires
clean:
	@echo "$(CYAN)🧹 NETTOYAGE DES FICHIERS TEMPORAIRES$(NC)"
	@rm -f demo_shared_modules.rb
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

# === SCRIPTS DE MAINTENANCE ===

# Menu de maintenance interactif
maintenance:
	@echo "$(PURPLE)🛠️  MENU DE MAINTENANCE iOS$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Accès au menu complet de maintenance...$(NC)"
	@echo ""
	@./maintenance.sh

# Nettoyage des caches
clean-cache:
	@echo "$(CYAN)🧹 NETTOYAGE COMPLET DES CACHES$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  Cette action va supprimer:$(NC)"
	@echo "   - Données dérivées Xcode"
	@echo "   - Caches de compilation"
	@echo "   - Caches CocoaPods"
	@echo "   - Anciennes sauvegardes (garde les 3 plus récentes)"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Opération annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Exécution du nettoyage...$(NC)"
	@./maintenance/clean_cache.sh
	@echo ""
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

# Diagnostic du projet
check-project:
	@echo "$(CYAN)🔍 DIAGNOSTIC COMPLET DU PROJET$(NC)"
	@echo ""
	@echo "$(BLUE)📊 Cette vérification inclut:$(NC)"
	@echo "   - Structure du projet"
	@echo "   - Configuration des fichiers"
	@echo "   - État des dépendances"
	@echo "   - Sauvegardes disponibles"
	@echo "   - Modules shared/"
	@echo ""
	@echo "$(GREEN)▶️  Analyse en cours...$(NC)"
	@./maintenance/check_project.sh
	@echo ""
	@echo "$(GREEN)✅ Diagnostic terminé$(NC)"

# Sauvegarde complète du projet
backup-project:
	@echo "$(CYAN)💾 SAUVEGARDE COMPLÈTE DU PROJET$(NC)"
	@echo ""
	@echo "$(BLUE)📁 Cette sauvegarde inclut:$(NC)"
	@echo "   - Configuration Xcode complète"
	@echo "   - Workspace et settings"
	@echo "   - Scripts de gestion"
	@echo "   - Documentation automatique"
	@echo ""
	@echo "$(GREEN)▶️  Création de la sauvegarde...$(NC)"
	@./maintenance/backup_project.sh
	@echo ""
	@echo "$(GREEN)✅ Sauvegarde terminée$(NC)"

# Mise à jour des dépendances
update-deps:
	@echo "$(CYAN)🔄 MISE À JOUR DES DÉPENDANCES$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Une sauvegarde sera créée automatiquement"
	@echo "   - Les pods seront reinstallés"
	@echo "   - Fermez Xcode avant de continuer"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Opération annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Mise à jour en cours...$(NC)"
	@./maintenance/update_dependencies.sh
	@echo ""
	@echo "$(GREEN)✅ Mise à jour terminée$(NC)"

# Monitoring des performances
monitor:
	@echo "$(CYAN)📊 MONITORING DES PERFORMANCES$(NC)"
	@echo ""
	@echo "$(BLUE)📈 Cette analyse inclut:$(NC)"
	@echo "   - Ressources système (CPU, RAM, Disque)"
	@echo "   - État des caches et builds"
	@echo "   - Analyse des dépendances"
	@echo "   - Recommandations d'optimisation"
	@echo ""
	@echo "$(GREEN)▶️  Analyse en cours...$(NC)"
	@./maintenance/monitor_performance.sh
	@echo ""
	@echo "$(GREEN)✅ Monitoring terminé$(NC)"

# Maintenance complète (toutes les vérifications)
maintenance-all: check-project monitor
	@echo ""
	@echo "$(PURPLE)🎉 MAINTENANCE COMPLÈTE TERMINÉE$(NC)"
	@echo ""
	@echo "$(CYAN)📋 RÉSUMÉ:$(NC)"
	@echo "   ✅ Diagnostic du projet"
	@echo "   ✅ Monitoring des performances"
	@echo ""
	@echo "$(YELLOW)💡 PROCHAINES ÉTAPES RECOMMANDÉES:$(NC)"
	@echo "   - $(GREEN)make clean-cache$(NC)    si des problèmes de cache"
	@echo "   - $(GREEN)make backup-project$(NC) pour sauvegarder l'état actuel"
	@echo "   - $(GREEN)make update-deps$(NC)    si des dépendances obsolètes"

# Installation des scripts de maintenance
maintenance-install:
	@echo "$(CYAN)📦 INSTALLATION DES SCRIPTS DE MAINTENANCE$(NC)"
	@echo ""
	@echo "$(BLUE)🔧 Cette commande va:$(NC)"
	@echo "   - Vérifier que tous les scripts existent"
	@echo "   - Les rendre exécutables"
	@echo "   - Tester leur fonctionnement de base"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Installation annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Installation en cours...$(NC)"
	@chmod +x maintenance.sh maintenance/*.sh 2>/dev/null || true
	@if [ -d "maintenance" ] && [ -f "maintenance.sh" ]; then \
		echo "$(GREEN)✅ Scripts installés avec succès$(NC)"; \
		echo ""; \
		echo "$(CYAN)📋 Test rapide:$(NC)"; \
		./maintenance.sh --help 2>/dev/null || echo "$(YELLOW)ℹ️  Menu principal disponible via:$(NC) make maintenance"; \
	else \
		echo "$(RED)❌ Erreur lors de l'installation$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)✅ Installation terminée$(NC)"

# === DÉPENDANCES REACT NATIVE ===

# Installation des node_modules
install-node-modules:
	@echo "$(CYAN)📦 INSTALLATION DES NODE_MODULES$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Installation depuis package.json"
	@echo "   - Peut prendre du temps"
	@echo "   - Nécessite une connexion internet"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Installation annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Installation des node_modules...$(NC)"
	@if command -v yarn >/dev/null 2>&1; then \
		echo "$(BLUE)ℹ️  Utilisation de Yarn$(NC)"; \
		cd .. && yarn install; \
	elif command -v npm >/dev/null 2>&1; then \
		echo "$(BLUE)ℹ️  Utilisation de NPM$(NC)"; \
		cd .. && npm install; \
	else \
		echo "$(RED)❌ Ni Yarn ni NPM trouvé$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)✅ node_modules installés$(NC)"

# Nettoyage des node_modules
clean-node-modules:
	@echo "$(CYAN)🧹 NETTOYAGE DES NODE_MODULES$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  ATTENTION:$(NC)"
	@echo "   - Supprimera node_modules/"
	@echo "   - Supprimera package-lock.json et yarn.lock"
	@echo "   - Nécessitera une réinstallation"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Nettoyage annulé$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Suppression des node_modules...$(NC)"
	@cd .. && rm -rf node_modules package-lock.json yarn.lock
	@echo ""
	@echo "$(GREEN)✅ node_modules nettoyés$(NC)"
	@echo ""
	@echo "$(CYAN)💡 Pour réinstaller:$(NC)"
	@echo "   $(GREEN)make install-node-modules$(NC)"

# Lier les dépendances natives
link-deps:
	@echo "$(CYAN)🔗 LIEN DES DÉPENDANCES NATIVES$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Lie les bibliothèques React Native"
	@echo "   - Modifie les configurations natives"
	@echo "   - Crée une sauvegarde automatique"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Laison annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Création d'une sauvegarde...$(NC)"
	@make backup >/dev/null 2>&1
	@echo "$(GREEN)▶️  Laison des dépendances...$(NC)"
	@cd .. && if command -v npx >/dev/null 2>&1; then \
		npx react-native link; \
	elif command -v react-native >/dev/null 2>&1; then \
		react-native link; \
	else \
		echo "$(RED)❌ React Native CLI non trouvé$(NC)"; \
		echo "   Installez avec: $(GREEN)npm install -g react-native-cli$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)✅ Dépendances liées$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Prochaines étapes:$(NC)"
	@echo "   1. Vérifier: $(GREEN)make check-project$(NC)"
	@echo "   2. Recompiler: $(GREEN)make clean-cache && open Nyth.xcworkspace$(NC)"

# Installation complète des dépendances
install-deps: install-node-modules update-deps
	@echo ""
	@echo "$(PURPLE)🎉 INSTALLATION COMPLÈTE TERMINÉE$(NC)"
	@echo ""
	@echo "$(CYAN)📋 RÉSUMÉ:$(NC)"
	@echo "   ✅ node_modules installés"
	@echo "   ✅ Pods mis à jour"
	@echo ""
	@echo "$(YELLOW)💡 PROCHAINES ÉTAPES:$(NC)"
	@echo "   - $(GREEN)make link-deps$(NC)      pour lier les dépendances natives"
	@echo "   - $(GREEN)make check-project$(NC)  pour vérifier l'installation"
	@echo "   - $(GREEN)open Nyth.xcworkspace$(NC) pour ouvrir le projet"

# Nettoyage complet des dépendances
clean-deps: clean-node-modules
	@echo ""
	@echo "$(PURPLE)🧹 NETTOYAGE COMPLET TERMINÉ$(NC)"
	@echo ""
	@echo "$(CYAN)📋 RÉSUMÉ:$(NC)"
	@echo "   ✅ node_modules supprimés"
	@echo "   ✅ Locks supprimés"
	@echo ""
	@echo "$(YELLOW)💡 POUR RÉINSTALLER:$(NC)"
	@echo "   - $(GREEN)make install-deps$(NC)    installation complète"
	@echo "   - $(GREEN)make install-node-modules$(NC) node_modules seulement"

# Configuration complète React Native
setup-react-native: backup-project clean-deps install-deps link-deps
	@echo ""
	@echo "$(PURPLE)🚀 CONFIGURATION REACT NATIVE COMPLÈTE$(NC)"
	@echo ""
	@echo "$(CYAN)📋 RÉSUMÉ DE L'INSTALLATION:$(NC)"
	@echo "   ✅ Sauvegarde créée"
	@echo "   ✅ node_modules nettoyés et réinstallés"
	@echo "   ✅ Pods mis à jour"
	@echo "   ✅ Dépendances natives liées"
	@echo ""
	@echo "$(GREEN)🎉 Configuration terminée !$(NC)"
	@echo ""
	@echo "$(CYAN)📋 PROCHAINES ÉTAPES:$(NC)"
	@echo "   1. Ouvrir le workspace: $(GREEN)open Nyth.xcworkspace$(NC)"
	@echo "   2. Nettoyer et compiler: $(GREEN)Cmd+Shift+K$(NC) puis $(GREEN)Cmd+B$(NC)"
	@echo "   3. Tester: $(GREEN)react-native run-ios$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  SI PROBLÈMES:$(NC)"
	@echo "   - Utilisez: $(GREEN)make clean-cache$(NC)"
	@echo "   - Vérifiez: $(GREEN)make check-project$(NC)"

# === SIMULATEUR & PROCESSUS ===

# Arrêter les processus sur les ports
stop-ports:
	@echo "$(CYAN)🛑 ARRÊT DES PROCESSUS SUR LES PORTS$(NC)"
	@echo ""
	@echo "$(BLUE)🔍 Ports surveillés:$(NC)"
	@echo "   - 8081 (Metro bundler)"
	@echo "   - 3000 (Services)"
	@echo "   - 4000-4999 (Autres services)"
	@echo ""
	@echo "$(GREEN)▶️  Recherche et arrêt des processus...$(NC)"
	@for port in 8081 3000 4000 4001 5000; do \
		pid=$$(lsof -ti :$${port} 2>/dev/null || echo ""); \
		if [ -n "$${pid}" ]; then \
			echo "$(YELLOW)⚠️  Port $${port} utilisé par PID: $${pid}$$(NC)"; \
			kill -9 $${pid} 2>/dev/null && echo "$(GREEN)✅ Port $${port} libéré$(NC)" || echo "$(RED)❌ Impossible de tuer PID $${pid}$$(NC)"; \
		else \
			echo "$(BLUE)ℹ️  Port $${port} libre$(NC)"; \
		fi; \
	done
	@echo ""
	@echo "$(GREEN)✅ Vérification des ports terminée$(NC)"

# Tuer les processus React Native
kill-processes:
	@echo "$(CYAN)💀 ÉLIMINATION DES PROCESSUS REACT NATIVE$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  ATTENTION:$(NC)"
	@echo "   - Tuer Metro bundler"
	@echo "   - Tuer React Native packager"
	@echo "   - Tuer simulateur iOS"
	@echo "   - Tuer Xcode"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Opération annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Suppression des processus...$(NC)"
	@pkill -f "metro" 2>/dev/null && echo "$(GREEN)✅ Metro bundler arrêté$(NC)" || echo "$(BLUE)ℹ️  Aucun Metro bundler trouvé$(NC)"
	@pkill -f "react-native" 2>/dev/null && echo "$(GREEN)✅ React Native arrêté$(NC)" || echo "$(BLUE)ℹ️  Aucun React Native trouvé$(NC)"
	@pkill -f "Simulator" 2>/dev/null && echo "$(GREEN)✅ Simulateur arrêté$(NC)" || echo "$(BLUE)ℹ️  Aucun simulateur trouvé$(NC)"
	@pkill -f "Xcode" 2>/dev/null && echo "$(GREEN)✅ Xcode arrêté$(NC)" || echo "$(BLUE)ℹ️  Aucun Xcode trouvé$(NC)"
	@echo ""
	@echo "$(GREEN)✅ Nettoyage des processus terminé$(NC)"
	@echo ""
	@echo "$(CYAN)💡 Vérification:$(NC)"
	@echo "   $(GREEN)make stop-ports$(NC) pour vérifier les ports"

# Nettoyer le simulateur iOS
clean-simulator:
	@echo "$(CYAN)🧹 NETTOYAGE DU SIMULATEUR iOS$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Supprimera les données des apps"
	@echo "   - Gardera les simulateurs installés"
	@echo "   - Nécessitera un redémarrage"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Nettoyage annulé$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Arrêt du simulateur...$(NC)"
	@pkill -f "Simulator" 2>/dev/null && echo "$(GREEN)✅ Simulateur arrêté$(NC)" || echo "$(BLUE)ℹ️  Simulateur déjà arrêté$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Nettoyage des données...$(NC)"
	@if command -v xcrun >/dev/null 2>&1; then \
		xcrun simctl erase all 2>/dev/null && echo "$(GREEN)✅ Données des simulateurs effacées$(NC)" || echo "$(RED)❌ Erreur lors du nettoyage$(NC)"; \
	else \
		echo "$(RED)❌ xcrun non trouvé$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)✅ Nettoyage du simulateur terminé$(NC)"

# Reset des données du simulateur (sans supprimer les simulateurs)
reset-simulator:
	@echo "$(CYAN)🔄 RESET DES DONNÉES SIMULATEUR iOS$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  ATTENTION:$(NC)"
	@echo "   - Supprimera les données des APPS seulement"
	@echo "   - Gardera TOUS les simulateurs intacts"
	@echo "   - Équivalent à 'clean-simulator'"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Reset annulé$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Arrêt du simulateur...$(NC)"
	@pkill -f "Simulator" 2>/dev/null && echo "$(GREEN)✅ Simulateur arrêté$(NC)" || echo "$(BLUE)ℹ️  Simulateur déjà arrêté$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Nettoyage des données des simulateurs...$(NC)"
	@if command -v xcrun >/dev/null 2>&1; then \
		xcrun simctl shutdown all 2>/dev/null; \
		xcrun simctl erase all 2>/dev/null && echo "$(GREEN)✅ Données des simulateurs effacées$(NC)" || echo "$(RED)❌ Erreur lors du nettoyage$(NC)"; \
	else \
		echo "$(RED)❌ xcrun non trouvé$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)✅ Reset des données terminé$(NC)"
	@echo ""
	@echo "$(CYAN)💡 Note:$(NC)"
	@echo "   - Les simulateurs sont conservés"
	@echo "   - Pour redémarrer: $(GREEN)make start-simulator$(NC)"

# Démarrer le simulateur iOS
start-simulator:
	@echo "$(CYAN)🚀 DÉMARRAGE DU SIMULATEUR iOS$(NC)"
	@echo ""
	@echo "$(BLUE)📱 Options:$(NC)"
	@echo "   - Démarre le dernier simulateur iPhone"
	@echo "   - Utilise iOS Simulator"
	@echo "   - Ouvre automatiquement"
	@echo ""
	@echo "$(GREEN)▶️  Vérification des prérequis...$(NC)"
	@if ! command -v xcrun >/dev/null 2>&1; then \
		echo "$(RED)❌ xcrun non trouvé$(NC)"; \
		exit 1; \
	fi
	@if ! command -v open >/dev/null 2>&1; then \
		echo "$(RED)❌ Commande open non trouvée$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)▶️  Démarrage du simulateur...$(NC)"
	@open -a Simulator 2>/dev/null && echo "$(GREEN)✅ Simulateur démarré$(NC)" || echo "$(RED)❌ Erreur lors du démarrage$(NC)"
	@echo ""
	@echo "$(GREEN)✅ Simulateur iOS opérationnel$(NC)"
	@echo ""
	@echo "$(CYAN)💡 Pour tester:$(NC)"
	@echo "   $(GREEN)react-native run-ios --simulator='iPhone 15'$(NC)"

# Workflow complet pour problèmes de développement
troubleshoot: stop-ports kill-processes clean-cache
	@echo ""
	@echo "$(PURPLE)🔧 DÉPANNAGE COMPLET TERMINÉ$(NC)"
	@echo ""
	@echo "$(CYAN)📋 RÉSUMÉ:$(NC)"
	@echo "   ✅ Ports libérés"
	@echo "   ✅ Processus tués"
	@echo "   ✅ Caches nettoyés"
	@echo ""
	@echo "$(YELLOW)💡 PROCHAINES ÉTAPES:$(NC)"
	@echo "   1. $(GREEN)make start-sim$(NC) pour démarrer le simulateur"
	@echo "   2. $(GREEN)make check-project$(NC) pour vérifier l'état"
	@echo "   3. $(GREEN)react-native run-ios$(NC) pour tester"

# Installation fraîche (sans toucher aux simulateurs)
fresh-install: kill-processes clean-deps install-deps link-deps
	@echo ""
	@echo "$(PURPLE)🔄 INSTALLATION FRAÎCHE TERMINÉE$(NC)"
	@echo ""
	@echo "$(CYAN)📋 RÉSUMÉ:$(NC)"
	@echo "   ✅ Processus tués"
	@echo "   ✅ Simulateurs PRESERVÉS"
	@echo "   ✅ Dépendances nettoyées et réinstallées"
	@echo "   ✅ Liens natifs refaits"
	@echo ""
	@echo "$(GREEN)🎉 Prêt pour un nouveau départ !$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Options simulateur:$(NC)"
	@echo "   $(GREEN)make clean-sim$(NC) pour nettoyer les données"
	@echo "   $(GREEN)make start-sim$(NC) pour démarrer"
	@echo "   $(GREEN)react-native run-ios$(NC) pour tester"

# === RACCOURCIS ===

# Raccourci pour les commandes fréquentes
install: add-shared
uninstall: remove-shared

# Raccourcis de maintenance
clean-all: clean-cache clean
setup: maintenance-install
doctor: check-project
perf: monitor
full-backup: backup-project

# Raccourcis de dépendances React Native
install-all: install-deps
clean-all-deps: clean-deps
link: link-deps
setup-rn: setup-react-native

# Raccourcis de simulateur et processus
stop-all: stop-ports
kill-all:
	@echo "$(YELLOW)⚠️  Pour tuer les processus:$(NC)"
	@echo "   $(GREEN)make kill-processes$(NC)"
clean-sim: clean-simulator
reset-sim: reset-simulator
start-sim: start-simulator
fresh-start:
	@echo "$(CYAN)🔄 FRESH START - Démarrage propre$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  Cette commande va:$(NC)"
	@echo "   1. Tuer tous les processus React Native"
	@echo "   2. Nettoyer les données du simulateur (SANS supprimer)"
	@echo "   3. Démarrer le simulateur"
	@echo ""
	@echo "$(BLUE)ℹ️  Note: Les simulateurs sont TOUJOURS préservés$(NC)"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Opération annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Exécution de fresh-start...$(NC)"
	@make kill-processes
	@make clean-simulator
	@make start-simulator
	@echo ""
	@echo "$(PURPLE)🎉 FRESH START TERMINÉ$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Simulateurs:$(NC)"
	@echo "   ✅ Préservés et nettoyés"
	@echo "   🚀 Prêt à être utilisé"

# === TESTS & QUALITÉ ===

# Exécuter tous les tests
test:
	@echo "$(CYAN)🧪 EXÉCUTION DES TESTS$(NC)"
	@echo ""
	@echo "$(BLUE)🔍 Recherche des frameworks de test:$(NC)"
	@if [ -f "../package.json" ]; then \
		if grep -q "jest\|mocha\|jasmine" ../package.json; then \
			echo "$(GREEN)✅ Framework de test détecté$(NC)"; \
			echo ""; \
			echo "$(GREEN)▶️  Lancement des tests...$(NC)"; \
			cd .. && npm test; \
		else \
			echo "$(YELLOW)⚠️  Aucun framework de test détecté$(NC)"; \
			echo "   Installez Jest: $(GREEN)npm install --save-dev jest$(NC)"; \
		fi \
	else \
		echo "$(RED)❌ package.json non trouvé$(NC)"; \
		exit 1; \
	fi

# Tests en mode watch
test-watch:
	@echo "$(CYAN)👀 TESTS EN MODE WATCH$(NC)"
	@echo ""
	@if [ -f "../package.json" ]; then \
		cd .. && npm run test:watch 2>/dev/null || npm test -- --watch; \
	else \
		echo "$(RED)❌ package.json non trouvé$(NC)"; \
		exit 1; \
	fi

# Tests avec coverage
test-coverage:
	@echo "$(CYAN)📊 TESTS AVEC COVERAGE$(NC)"
	@echo ""
	@if [ -f "../package.json" ]; then \
		cd .. && npm run test:coverage 2>/dev/null || npm test -- --coverage; \
	else \
		echo "$(RED)❌ package.json non trouvé$(NC)"; \
		exit 1; \
	fi

# === DÉPLOIEMENT & DISTRIBUTION ===

# Créer une archive iOS
archive:
	@echo "$(CYAN)📦 CRÉATION D'ARCHIVE iOS$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  IMPORTANT:$(NC)"
	@echo "   - Archive pour distribution"
	@echo "   - Nécessite un compte développeur"
	@echo "   - Vérifiez le code signing"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Archive annulée$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Création de l'archive...$(NC)"
	@if command -v xcodebuild >/dev/null 2>&1; then \
		xcodebuild -workspace Nyth.xcworkspace -scheme Nyth -configuration Release -archivePath build/Nyth.xcarchive archive; \
		echo "$(GREEN)✅ Archive créée:$(NC) build/Nyth.xcarchive"; \
	else \
		echo "$(RED)❌ xcodebuild non trouvé$(NC)"; \
		exit 1; \
	fi

# Export pour développement
export-dev:
	@echo "$(CYAN)📤 EXPORT DÉVELOPPEMENT$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  Export pour développement/test$(NC)"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Export annulé$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Export en cours...$(NC)"
	@if [ -d "build/Nyth.xcarchive" ]; then \
		xcodebuild -exportArchive -archivePath build/Nyth.xcarchive -exportPath build/Development -exportOptionsPlist exportOptions-dev.plist; \
		echo "$(GREEN)✅ Export réussi:$(NC) build/Development"; \
	else \
		echo "$(RED)❌ Archive non trouvée. Créez d'abord:$(NC) make archive"; \
		exit 1; \
	fi

# Export pour production
export-prod:
	@echo "$(CYAN)📤 EXPORT PRODUCTION$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  Export pour App Store$(NC)"
	@echo "   - Nécessite certificats de distribution"
	@echo "   - Vérifiez les provisioning profiles"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Export annulé$(NC)"; exit 1; }
	@echo ""
	@echo "$(GREEN)▶️  Export en cours...$(NC)"
	@if [ -d "build/Nyth.xcarchive" ]; then \
		xcodebuild -exportArchive -archivePath build/Nyth.xcarchive -exportPath build/Production -exportOptionsPlist exportOptions-prod.plist; \
		echo "$(GREEN)✅ Export réussi:$(NC) build/Production"; \
	else \
		echo "$(RED)❌ Archive non trouvée. Créez d'abord:$(NC) make archive"; \
		exit 1; \
	fi

# Vérifier le code signing
code-sign-check:
	@echo "$(CYAN)🔐 VÉRIFICATION CODE SIGNING$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Vérification des certificats...$(NC)"
	@security find-identity -v -p codesigning | grep -E "(iPhone|iOS)" || echo "$(YELLOW)⚠️  Aucun certificat iOS trouvé$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Vérification des provisioning profiles...$(NC)"
	@ls -la ~/Library/MobileDevice/Provisioning\ Profiles/ 2>/dev/null || echo "$(YELLOW)⚠️  Aucun provisioning profile trouvé$(NC)"
	@echo ""
	@echo "$(CYAN)💡 Pour ajouter un certificat:$(NC)"
	@echo "   - Xcode > Preferences > Accounts"
	@echo "   - Double-clic sur .mobileprovision"

# Gérer les provisioning profiles
provisioning:
	@echo "$(CYAN)📄 GESTION PROVISIONING PROFILES$(NC)"
	@echo ""
	@echo "$(BLUE)📋 Provisioning profiles installés:$(NC)"
	@ls -la ~/Library/MobileDevice/Provisioning\ Profiles/ 2>/dev/null || echo "$(YELLOW)⚠️  Aucun profile trouvé$(NC)"
	@echo ""
	@echo "$(CYAN)💡 Actions disponibles:$(NC)"
	@echo "   1. Télécharger depuis Apple Developer"
	@echo "   2. Double-clic pour installer"
	@echo "   3. Xcode > Preferences > Accounts > Download"

# === DEVICES & DEBUGGING ===

# Lister les devices connectés
devices:
	@echo "$(CYAN)📱 DEVICES CONNECTÉS$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Recherche des devices...$(NC)"
	@if command -v xcrun >/dev/null 2>&1; then \
		echo "$(BLUE)📱 Devices physiques:$(NC)"; \
		xcrun xctrace list devices 2>/dev/null | grep -E "(iPhone|iPad)" || echo "$(YELLOW)   Aucun device physique$(NC)"; \
		echo ""; \
		echo "$(BLUE)📱 Simulateurs:$(NC)"; \
		xcrun simctl list devices | grep -E "(Booted|Shutdown)" | head -10; \
	else \
		echo "$(RED)❌ xcrun non trouvé$(NC)"; \
		exit 1; \
	fi

# Afficher les logs en temps réel
logs:
	@echo "$(CYAN)📋 LOGS EN TEMPS RÉEL$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  Ctrl+C pour arrêter$(NC)"
	@echo ""
	@if command -v xcrun >/dev/null 2>&1; then \
		echo "$(GREEN)▶️  Affichage des logs...$(NC)"; \
		xcrun simctl spawn booted log stream --level=debug --predicate 'processImagePath contains "Nyth"'; \
	else \
		echo "$(RED)❌ xcrun non trouvé$(NC)"; \
		echo "   Alternative: $(GREEN)xcodebuild -workspace Nyth.xcworkspace -scheme Nyth -configuration Debug build$(NC)"; \
		exit 1; \
	fi

# Nettoyer le cache des assets
assets-clean:
	@echo "$(CYAN)🖼️  NETTOYAGE CACHE ASSETS$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Suppression du cache Metro...$(NC)"
	@cd .. && rm -rf node_modules/.cache 2>/dev/null && echo "$(GREEN)✅ Cache Metro supprimé$(NC)" || echo "$(BLUE)ℹ️  Aucun cache Metro$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Suppression du cache iOS...$(NC)"
	@rm -rf ~/Library/Developer/CoreSimulator/Caches/* 2>/dev/null && echo "$(GREEN)✅ Cache simulateur supprimé$(NC)" || echo "$(BLUE)ℹ️  Aucun cache simulateur$(NC)"
	@echo ""
	@echo "$(GREEN)✅ Cache assets nettoyé$(NC)"

# Effacer tous les logs
clear-logs:
	@echo "$(CYAN)🗑️  EFFACEMENT DES LOGS$(NC)"
	@echo ""
	@echo "$(GREEN)▶️  Suppression des logs iOS...$(NC)"
	@rm -rf ~/Library/Logs/CoreSimulator/* 2>/dev/null && echo "$(GREEN)✅ Logs simulateur supprimés$(NC)" || echo "$(BLUE)ℹ️  Aucun log simulateur$(NC)"
	@rm -rf ~/Library/Developer/Xcode/DerivedData/*/Logs/* 2>/dev/null && echo "$(GREEN)✅ Logs Xcode supprimés$(NC)" || echo "$(BLUE)ℹ️  Aucun log Xcode$(NC)"
	@echo ""
	@echo "$(GREEN)✅ Tous les logs effacés$(NC)"

# Afficher la version actuelle
version:
	@echo "$(CYAN)📋 VERSION DE L'APPLICATION$(NC)"
	@echo ""
	@if [ -f "Nyth.xcodeproj/project.pbxproj" ]; then \
		echo "$(BLUE)🔍 Version dans Xcode:$(NC)"; \
		grep -A1 'MARKETING_VERSION' Nyth.xcodeproj/project.pbxproj | grep -o '[0-9]\+\.[0-9]\+\.[0-9]*' | head -1 || echo "   N/A"; \
		echo ""; \
		echo "$(BLUE)🔍 Build version:$(NC)"; \
		grep -A1 'CURRENT_PROJECT_VERSION' Nyth.xcodeproj/project.pbxproj | grep -o '[0-9]\+' | head -1 || echo "   N/A"; \
	else \
		echo "$(RED)❌ Fichier projet non trouvé$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@if [ -f "../package.json" ]; then \
		echo "$(BLUE)🔍 Version dans package.json:$(NC)"; \
		grep '"version"' ../package.json | cut -d'"' -f4 || echo "   N/A"; \
	fi

# Incrémenter la version
bump-version:
	@echo "$(CYAN)⬆️  INCRÉMENTATION DE VERSION$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠️  ATTENTION:$(NC)"
	@echo "   - Incrémente le build number"
	@echo "   - Modifie project.pbxproj"
	@echo "   - Crée une sauvegarde automatique"
	@echo ""
	@read -p "Voulez-vous continuer ? [y/N] " confirm && [ "$$confirm" = "y" ] || { echo "$(RED)❌ Incrémentation annulée$(NC)"; exit 1; }
	@echo ""
	@make backup >/dev/null 2>&1
	@if [ -f "Nyth.xcodeproj/project.pbxproj" ]; then \
		current_version=$$(grep -A1 'CURRENT_PROJECT_VERSION' Nyth.xcodeproj/project.pbxproj | grep -o '[0-9]\+' | head -1); \
		new_version=$$((current_version + 1)); \
		sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]\+/CURRENT_PROJECT_VERSION = $${new_version}/g" Nyth.xcodeproj/project.pbxproj; \
		echo "$(GREEN)✅ Version incrémentée:$(NC) $${current_version} → $${new_version}"; \
	else \
		echo "$(RED)❌ Fichier projet non trouvé$(NC)"; \
		exit 1; \
	fi

# Raccourcis de dépannage
fix-issues: troubleshoot
reset-all:
	@echo "$(YELLOW)⚠️  Pour reset complet:$(NC)"
	@echo "   $(GREEN)make fresh-install$(NC)"

# Raccourcis de tests
test-all: test test-coverage
test-dev: test-watch

# Raccourcis de déploiement
build-archive: archive
build-dev: archive export-dev
build-prod: archive export-prod

# Raccourcis de développement
dev-setup: clean-cache install-deps link-deps start-simulator
dev-logs: logs
dev-clean: assets-clean clear-logs clean-cache

# Raccourcis de version
show-version: version
inc-version: bump-version

# Cible par défaut
.DEFAULT_GOAL := help
