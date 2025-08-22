# Makefile pour les tests du module Safety
CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -O2 -I../../shared -I../../shared/Audio -I../../shared/compat -pthread
TARGET = test_safety_complete
SOURCES = test_safety_complete.cpp ../../shared/Audio/safety/AudioSafety.cpp

# Compilation
$(TARGET): $(SOURCES)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCES)

# Test
test: $(TARGET)
	./$(TARGET)

# Nettoyage
clean:
	rm -f $(TARGET)

# Installation des dépendances (si nécessaire)
deps:
	@echo "Vérification des dépendances..."

.PHONY: test clean deps
