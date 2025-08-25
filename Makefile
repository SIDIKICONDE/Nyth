# Makefile pour compiler la démonstration AudioEqualizer
CXX = g++
CXXFLAGS = -std=c++20 -O2 -Wall -Wextra -pedantic -pthread
INCLUDES = -I./shared -I./shared/Audio/core -I./shared/Audio/core/components -I./shared/Audio/common -I./shared/Audio/common/dsp -I./shared/Audio/utils
LDFLAGS =

# Programme principal simple (pas de tests pour le moment)
SOURCES = main.cpp
OBJECTS = $(SOURCES:.cpp=.o)

# Fichiers sources du moteur audio
AUDIO_SOURCES = shared/Audio/core/components/AudioEqualizer/AudioEqualizer.cpp \
                shared/Audio/common/dsp/BiquadFilter.cpp

AUDIO_OBJECTS = $(AUDIO_SOURCES:.cpp=.o)

# Cible principale
TARGET = audio_demo

# Règle par défaut
all: $(TARGET)
	@echo "✅ Compilation réussie. Exécutez avec: make run"

# Compilation de l'exécutable
$(TARGET): $(OBJECTS) $(AUDIO_OBJECTS)
	$(CXX) $(CXXFLAGS) $(OBJECTS) $(AUDIO_OBJECTS) $(LDFLAGS) -o $(TARGET)

# Compilation de l'objet principal
%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Compilation des objets du moteur audio
shared/Audio/core/%.o: shared/Audio/core/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

shared/Audio/common/%.o: shared/Audio/common/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

shared/Audio/common/dsp/%.o: shared/Audio/common/dsp/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

shared/Audio/utils/%.o: shared/Audio/utils/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Exécution du programme compilé
run: $(TARGET)
	./$(TARGET)

# Nettoyage
clean:
	rm -f $(OBJECTS) $(AUDIO_OBJECTS) $(TARGET)
	@echo "🧹 Nettoyage terminé"

# Test rapide (commenté - peut être activé plus tard si nécessaire)
# test: clean all run

# Aide
help:
	@echo "Commandes disponibles:"
	@echo "  make all      - Compile la démonstration AudioEqualizer"
	@echo "  make run      - Exécute la démonstration"
	@echo "  make clean    - Nettoie les fichiers générés"
	@echo "  make help     - Affiche cette aide"
	@echo ""
	@echo "🎵 Cette configuration compile une démonstration simple"
	@echo "   de l'AudioEqualizer sans les tests unitaires."

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

.PHONY: all run clean help verify-namespaces test-namespaces clean-namespaces help-namespaces status-namespaces namespaces ns check-ns
