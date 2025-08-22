# Makefile pour les tests du module Effects
CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -O2 -I../../shared -I../../shared/Audio -I../../shared/compat -pthread
TARGET_BASIC = test_effects_complete
TARGET_ADVANCED = test_effects_advanced
SOURCES_BASIC = test_effects_complete.cpp
SOURCES_ADVANCED = test_effects_advanced.cpp

# Compilation des tests de base
$(TARGET_BASIC): $(SOURCES_BASIC)
	$(CXX) $(CXXFLAGS) -o $(TARGET_BASIC) $(SOURCES_BASIC)

# Compilation des tests avancés
$(TARGET_ADVANCED): $(SOURCES_ADVANCED)
	$(CXX) $(CXXFLAGS) -o $(TARGET_ADVANCED) $(SOURCES_ADVANCED)

# Test de base
test-basic: $(TARGET_BASIC)
	./$(TARGET_BASIC)

# Test avancé
test-advanced: $(TARGET_ADVANCED)
	./$(TARGET_ADVANCED)

# Test complet (base + avancé)
test-all: test-basic test-advanced

# Nettoyage
clean:
	rm -f $(TARGET_BASIC) $(TARGET_ADVANCED)

# Installation des dépendances (si nécessaire)
deps:
	@echo "Vérification des dépendances..."

.PHONY: test-basic test-advanced test-all clean deps
