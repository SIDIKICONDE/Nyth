# Makefile pour compiler et exécuter les tests AudioEqualizer
CXX = g++
CXXFLAGS = -std=c++20 -O2 -Wall -Wextra -pedantic
INCLUDES = -I./shared -I./shared/Audio/core -I./shared/compat
LDFLAGS =

# Fichiers sources
SOURCES = test_AudioEqualizer.cpp
OBJECTS = $(SOURCES:.cpp=.o)

# Fichiers de l'AudioEqualizer à compiler avec
EQ_SOURCES = shared/Audio/core/AudioEqualizer.cpp shared/Audio/core/BiquadFilter.cpp
EQ_OBJECTS = $(EQ_SOURCES:.cpp=.o)

# Cible principale
TARGET = test_audio_equalizer

# Règle par défaut
all: $(TARGET)
	@echo "✅ Compilation réussie. Exécutez avec: make run"

# Compilation de l'exécutable
$(TARGET): $(OBJECTS) $(EQ_OBJECTS)
	$(CXX) $(CXXFLAGS) $(OBJECTS) $(EQ_OBJECTS) $(LDFLAGS) -o $(TARGET)

# Compilation des objets de test
%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Compilation des objets AudioEqualizer
shared/Audio/core/%.o: shared/Audio/core/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Exécution des tests
run: $(TARGET)
	./$(TARGET)

# Nettoyage
clean:
	rm -f $(OBJECTS) $(EQ_OBJECTS) $(TARGET)
	@echo "🧹 Nettoyage terminé"

# Test rapide
test: clean all run

# Aide
help:
	@echo "Commandes disponibles:"
	@echo "  make all      - Compile le projet"
	@echo "  make run      - Exécute les tests"
	@echo "  make clean    - Nettoie les fichiers générés"
	@echo "  make test     - Nettoie, compile et exécute"
	@echo "  make help     - Affiche cette aide"

# ============================================
# 🔍 VÉRIFICATIONS DE NAMESPACES (CI/CD)
# ============================================

.PHONY: verify-namespaces test-namespaces clean-namespaces help-namespaces status-namespaces

# 🔍 Vérifier les namespaces dans tous les modules audio
verify-namespaces:
	@echo "🔍 Vérification des namespaces..."
	@chmod +x scripts/verify_namespaces.sh
	@./scripts/verify_namespaces.sh

# 🧪 Tester le script de vérification des namespaces
test-namespaces:
	@echo "🧪 Test du script de vérification des namespaces..."
	@chmod +x scripts/test_namespace_verification.sh
	@./scripts/test_namespace_verification.sh

# 🧹 Nettoyer les artefacts de test des namespaces
clean-namespaces:
	@echo "🧹 Nettoyage des artefacts de test..."
	@rm -rf test_namespace_verification
	@echo "✅ Nettoyage terminé"

# 📊 Statut des namespaces
status-namespaces:
	@echo "📊 Statut des namespaces:"
	@echo ""
	@echo "🔍 Modules vérifiés:"
	@./scripts/verify_namespaces.sh 2>/dev/null || echo "❌ Erreurs détectées"
	@echo ""
	@echo "📁 Structure des namespaces:"
	@echo "  ✅ facebook::react     → Interfaces TurboModule"
	@echo "  ✅ Nyth::Audio        → Logique métier audio"
	@echo ""
	@echo "📋 Résumé des modifications:"
	@echo "  • 6 modules refactorisés"
	@echo "  • 135+ références simplifiées"
	@echo "  • CI/CD intégré"

# 📚 Afficher l'aide pour les namespaces
help-namespaces:
	@echo "🔍 Commandes pour les vérifications de namespaces:"
	@echo ""
	@echo "  verify-namespaces    🔍 Vérifier tous les namespaces"
	@echo "  test-namespaces      🧪 Tester le script de vérification"
	@echo "  clean-namespaces     🧹 Nettoyer les artefacts de test"
	@echo "  status-namespaces    📊 Afficher le statut"
	@echo "  help-namespaces      📚 Afficher cette aide"
	@echo ""
	@echo "📋 Exemples:"
	@echo "  make verify-namespaces    # Vérifier tous les modules"
	@echo "  make test-namespaces      # Tester la validation"
	@echo "  make clean-namespaces     # Nettoyer après les tests"

# 🎯 Raccourcis pratiques
namespaces: verify-namespaces
ns: verify-namespaces
check-ns: verify-namespaces

.PHONY: all run clean test help verify-namespaces test-namespaces clean-namespaces help-namespaces status-namespaces namespaces ns check-ns
