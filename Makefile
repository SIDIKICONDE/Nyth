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

.PHONY: all run clean test help