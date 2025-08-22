# Makefile pour les tests du module Noise
CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -O2 -I../../shared -I../../shared/Audio -I../../shared/compat -pthread
TARGET = test_noise_complete
SOURCES = test_noise_complete.cpp ../../shared/Audio/noise/NoiseReducer.cpp ../../shared/Audio/noise/RNNoiseSuppressor.cpp ../../shared/Audio/noise/SpectralNR.cpp ../../shared/Audio/core/BiquadFilter.cpp

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
