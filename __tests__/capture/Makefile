# Makefile pour tester le module de capture audio
# Tests unitaires complets pour les classes Audio Capture

CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -I.
TARGET = test_capture_audio
SOURCE = test_capture_audio.cpp

.PHONY: all clean test help

all: test

help:
	@echo "🎵 TESTS UNITAIRES - MODULE CAPTURE AUDIO"
	@echo "========================================"
	@echo "Commandes disponibles:"
	@echo "  make test    - Exécuter tous les tests"
	@echo "  make clean   - Nettoyer les fichiers temporaires"
	@echo "  make help    - Afficher cette aide"

test: $(TARGET)
	@echo ""
	@echo "🚀 EXÉCUTION DES TESTS:"
	@echo "======================"
	@echo ""
	@echo "🎵 Testing Audio Capture Module..."
	@./$(TARGET) && echo "" && echo "🎉 ALL TESTS PASSED!" || echo "" && echo "💥 SOME TESTS FAILED!"
	@echo ""
	@echo "📊 VALIDATION RÉSUMÉ:"
	@echo "   🔄 AudioFormatConverter : 5 tests"
	@echo "   📊 CircularBuffer       : 6 tests"
	@echo "   📈 AudioAnalyzer        : 8 tests"
	@echo "   📁 AudioFileWriter       : 3 tests"
	@echo "   ⏱️  AudioTimer           : 3 tests"
	@echo "   🏊 AudioBufferPool       : 3 tests"
	@echo "   📈 TOTAL                : 28 tests !"
	@echo ""

$(TARGET): $(SOURCE)
	@echo "🔨 Compiling Audio Capture Test..."
	@$(CXX) $(CXXFLAGS) -o $@ $<

clean:
	@echo "🧹 Cleaning up..."
	@rm -f $(TARGET)
	@rm -f test_output.wav
	@echo "✅ Clean complete"

# Tests de compilation uniquement (sans exécution)
compile-only:
	@echo "🔨 Testing compilation only..."
	@$(CXX) $(CXXFLAGS) -c $(SOURCE) && echo "✅ Compilation OK" || echo "❌ Compilation failed"
	@rm -f *.o

# Test avec différents niveaux d'optimisation
test-optimized:
	@echo "⚡ Testing with optimization..."
	@$(CXX) $(CXXFLAGS) -O2 -DNDEBUG -o $(TARGET)_opt $(SOURCE)
	@./$(TARGET)_opt && echo "✅ Optimized version OK"
	@rm -f $(TARGET)_opt

# Test de compatibilité C++17 (fallback)
test-cpp17:
	@echo "🔄 Testing C++17 compatibility..."
	@$(CXX) -std=c++17 $(CXXFLAGS) -o $(TARGET)_17 $(SOURCE) && echo "✅ C++17 compatible" || echo "⚠️ C++17 incompatible"
	@rm -f $(TARGET)_17

# Test avec instrumentation pour valgrind
test-valgrind:
	@echo "🔍 Testing with valgrind (memory check)..."
	@if command -v valgrind >/dev/null 2>&1; then \
		$(CXX) $(CXXFLAGS) -g -o $(TARGET)_debug $(SOURCE) && \
		valgrind --leak-check=full --error-exitcode=1 ./$(TARGET)_debug && echo "✅ No memory leaks detected" || echo "❌ Memory issues found"; \
		rm -f $(TARGET)_debug; \
	else \
		echo "⚠️ Valgrind not installed, skipping memory test"; \
	fi

# Benchmark des performances
benchmark:
	@echo "📊 Running performance benchmark..."
	@time ./$(TARGET) >/dev/null 2>&1 && echo "✅ Performance test completed" || echo "❌ Performance test failed"
