# Makefile pour l'application Nyth
# Usage: make <commande>

.PHONY: server server-dev server-stop client client-ios client-android install-server install-client help

# Variables
SERVER_DIR = server
CLIENT_DIR = .

# Couleurs pour les messages
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Afficher l'aide
	@echo "$(GREEN)Commandes disponibles pour Nyth:$(NC)"
	@echo ""
	@echo "$(YELLOW)🚀 Développement (Recommandé):$(NC)"
	@echo "  make dev          - Lancer SERVEUR + CLIENT ensemble"
	@echo "  make d            - Raccourci pour 'make dev'"
	@echo "  make dev-bg       - Serveur en arrière-plan + client"
	@echo "  make stop-all     - Arrêter serveur et client"
	@echo ""
	@echo "$(YELLOW)Serveur:$(NC)"
	@echo "  make server       - Démarrer le serveur backend (port 3000)"
	@echo "  make server-dev   - Démarrer le serveur en mode développement (nodemon)"
	@echo "  make server-stop  - Arrêter le serveur backend"
	@echo ""
	@echo "$(YELLOW)Client:$(NC)"
	@echo "  make client       - Démarrer Metro (React Native)"
	@echo "  make client-ios   - Lancer l'app sur iOS"
	@echo "  make client-android - Lancer l'app sur Android"
	@echo ""
	@echo "$(YELLOW)Installation:$(NC)"
	@echo "  make install-server - Installer les dépendances du serveur"
	@echo "  make install-client - Installer les dépendances du client"
	@echo "  make install-all    - Installer toutes les dépendances"
	@echo ""
	@echo "$(YELLOW)Utilitaires:$(NC)"
	@echo "  make check-env    - Vérifier la configuration"
	@echo "  make clean        - Nettoyer les fichiers temporaires"
	@echo "  make help         - Afficher cette aide"

server: ## Démarrer le serveur backend
	@echo "$(GREEN)🚀 Démarrage du serveur backend...$(NC)"
	@cd $(SERVER_DIR) && npm start

server-dev: ## Démarrer le serveur en mode développement
	@echo "$(GREEN)🔧 Démarrage du serveur en mode développement...$(NC)"
	@cd $(SERVER_DIR) && npm run dev

server-stop: ## Arrêter le serveur backend
	@echo "$(RED)🛑 Arrêt du serveur backend...$(NC)"
	@pkill -f "node index.js" || echo "Aucun serveur à arrêter"

client: ## Démarrer Metro (React Native)
	@echo "$(GREEN)📱 Démarrage de Metro...$(NC)"
	@npm start

client-ios: ## Lancer l'app sur iOS
	@echo "$(GREEN)🍎 Lancement sur iOS...$(NC)"
	@npx react-native run-ios

client-android: ## Lancer l'app sur Android
	@echo "$(GREEN)🤖 Lancement sur Android...$(NC)"
	@npx react-native run-android

install-server: ## Installer les dépendances du serveur
	@echo "$(YELLOW)📦 Installation des dépendances du serveur...$(NC)"
	@cd $(SERVER_DIR) && npm install

install-client: ## Installer les dépendances du client
	@echo "$(YELLOW)📦 Installation des dépendances du client...$(NC)"
	@npm install
	@cd ios && pod install --repo-update

install-all: install-client install-server ## Installer toutes les dépendances
	@echo "$(GREEN)✅ Toutes les dépendances installées !$(NC)"

check-env: ## Vérifier la configuration des variables d'environnement
	@echo "$(YELLOW)🔍 Vérification de la configuration...$(NC)"
	@echo "Client (.env):"
	@test -f .env && echo "  ✅ Fichier .env existe" || echo "  ❌ Fichier .env manquant"
	@test -f .env && grep -q "CLIENT_API_KEY" .env && echo "  ✅ CLIENT_API_KEY configurée" || echo "  ❌ CLIENT_API_KEY manquante"
	@test -f .env && grep -q "GOOGLE_WEB_CLIENT_ID" .env && echo "  ✅ GOOGLE_WEB_CLIENT_ID configurée" || echo "  ❌ GOOGLE_WEB_CLIENT_ID manquante"
	@echo ""
	@echo "Serveur (server/.env):"
	@test -f $(SERVER_DIR)/.env && echo "  ✅ Fichier server/.env existe" || echo "  ❌ Fichier server/.env manquant"
	@test -f $(SERVER_DIR)/.env && grep -q "CLIENT_API_KEY" $(SERVER_DIR)/.env && echo "  ✅ CLIENT_API_KEY configurée" || echo "  ❌ CLIENT_API_KEY manquante"
	@test -f $(SERVER_DIR)/.env && grep -q "FIREBASE_PROJECT_ID" $(SERVER_DIR)/.env && echo "  ✅ FIREBASE_PROJECT_ID configurée" || echo "  ❌ FIREBASE_PROJECT_ID manquante"
	@echo ""
	@cd $(SERVER_DIR) && node -e "const { config, assertRequiredEnv } = require('./src/config/env'); try { assertRequiredEnv(); console.log('  ✅ Configuration serveur valide'); } catch(e) { console.log('  ❌ Erreur:', e.message); }"

check-google: ## Vérifier spécifiquement la configuration Google Sign-In
	@echo "$(YELLOW)🔍 Vérification Google Sign-In...$(NC)"
	@node scripts/check-google-config.js

migrate-firebase: ## Migrer vers un nouveau projet Firebase
	@echo "$(YELLOW)🔄 Migration vers un nouveau projet Firebase...$(NC)"
	@echo "$(RED)⚠️  Assurez-vous d'avoir créé le nouveau projet Firebase avant de continuer$(NC)"
	@node scripts/migrate-to-new-firebase.js

clean: ## Nettoyer les fichiers temporaires
	@echo "$(YELLOW)🧹 Nettoyage...$(NC)"
	@rm -rf node_modules/.cache
	@rm -rf metro-cache
	@rm -rf /tmp/react-native-*
	@cd $(SERVER_DIR) && rm -rf node_modules/.cache
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

dev: ## Lancer serveur ET client en même temps
	@echo "$(GREEN)🚀 Démarrage complet : Serveur + Client...$(NC)"
	@echo "$(YELLOW)📍 Serveur: http://localhost:3000$(NC)"
	@echo "$(YELLOW)📍 Metro: http://localhost:8081$(NC)"
	@echo "$(RED)⚠️  Appuyez sur Ctrl+C pour arrêter les deux$(NC)"
	@echo ""
	@(cd $(SERVER_DIR) && npm start) & \
	sleep 3 && \
	npm start

dev-bg: ## Lancer serveur en arrière-plan puis client
	@echo "$(GREEN)🚀 Démarrage serveur en arrière-plan...$(NC)"
	@cd $(SERVER_DIR) && npm start > server.log 2>&1 & echo $$! > server.pid
	@sleep 3
	@echo "$(GREEN)📱 Démarrage du client...$(NC)"
	@npm start

stop-all: ## Arrêter serveur et client
	@echo "$(RED)🛑 Arrêt de tous les services...$(NC)"
	@pkill -f "node index.js" || echo "Serveur déjà arrêté"
	@pkill -f "react-native start" || echo "Metro déjà arrêté"
	@test -f $(SERVER_DIR)/server.pid && kill `cat $(SERVER_DIR)/server.pid` && rm $(SERVER_DIR)/server.pid || echo "Pas de PID serveur"

# Raccourcis pratiques
s: server ## Raccourci pour 'make server'
sd: server-dev ## Raccourci pour 'make server-dev'
c: client ## Raccourci pour 'make client'
d: dev ## Raccourci pour 'make dev'
i: install-all ## Raccourci pour 'make install-all'

# Commande par défaut
.DEFAULT_GOAL := help
