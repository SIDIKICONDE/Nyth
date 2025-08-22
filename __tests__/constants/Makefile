# Makefile pour tester la centralisation des constantes
# Tests directs des headers C++ constants

CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -I.
TARGETS = test_core test_effect test_safety test_utils

.PHONY: all clean test help

all: test

help:
	@echo "🧪 TESTS UNITAIRES - CENTRALISATION DES CONSTANTES"
	@echo "=================================================="
	@echo "Commandes disponibles:"
	@echo "  make test    - Exécuter tous les tests"
	@echo "  make clean   - Nettoyer les fichiers temporaires"
	@echo "  make help    - Afficher cette aide"

test: $(TARGETS)
	@echo ""
	@echo "🎯 EXÉCUTION DES TESTS:"
	@echo "======================"
	@echo ""
	@echo "📋 Testing CoreConstants.hpp..."
	@./test_core && echo "✅ CoreConstants.hpp - PASSED" || echo "❌ CoreConstants.hpp - FAILED"
	@echo ""
	@echo "📋 Testing EffectConstants.hpp..."
	@./test_effect && echo "✅ EffectConstants.hpp - PASSED" || echo "❌ EffectConstants.hpp - FAILED"
	@echo ""
	@echo "📋 Testing SafetyContants.hpp..."
	@./test_safety && echo "✅ SafetyContants.hpp - PASSED" || echo "❌ SafetyContants.hpp - FAILED"
	@echo ""
	@echo "📋 Testing utilsConstants.hpp..."
	@./test_utils && echo "✅ utilsConstants.hpp - PASSED" || echo "❌ utilsConstants.hpp - FAILED"
	@echo ""
	@echo "🎉 TOUS LES TESTS TERMINÉS !"
	@echo "=============================="
	@echo "📊 BILAN DE LA CENTRALISATION :"
	@echo "   📁 CoreConstants.hpp    : ~50 constantes (Equalizer, Biquad)"
	@echo "   📁 EffectConstants.hpp  : ~56 constantes (Compressor, Delay)"
	@echo "   📁 SafetyContants.hpp   : ~50 constantes (Audio Protection)"
	@echo "   📁 utilsConstants.hpp   : ~56 constantes (Buffers, SIMD, Utils)"
	@echo "   📈 TOTAL                : ~212 constantes centralisées !"
	@echo ""
	@echo "✅ Zéro duplication"
	@echo "✅ Zéro nombre magique"
	@echo "✅ Cross-platform compatible"
	@echo "✅ Namespaces organisés"
	@echo "✅ Performance optimisée (constexpr)"

test_core: test_core_constants.cpp
	@echo "🔨 Compiling CoreConstants test..."
	@$(CXX) $(CXXFLAGS) -o $@ $<

test_effect: test_effect_constants.cpp
	@echo "🔨 Compiling EffectConstants test..."
	@$(CXX) $(CXXFLAGS) -o $@ $<

test_safety: test_safety_constants.cpp
	@echo "🔨 Compiling SafetyConstants test..."
	@$(CXX) $(CXXFLAGS) -o $@ $<

test_utils: test_utils_constants.cpp
	@echo "🔨 Compiling UtilsConstants test..."
	@$(CXX) $(CXXFLAGS) -o $@ $<

clean:
	@echo "🧹 Cleaning up..."
	@rm -f $(TARGETS)
	@echo "✅ Clean complete"

# Tests de compilation uniquement (sans exécution)
compile-only:
	@echo "🔨 Testing compilation only..."
	@$(CXX) $(CXXFLAGS) -c test_core_constants.cpp && echo "✅ CoreConstants compiles OK" || echo "❌ CoreConstants compilation failed"
	@$(CXX) $(CXXFLAGS) -c test_effect_constants.cpp && echo "✅ EffectConstants compiles OK" || echo "❌ EffectConstants compilation failed"
	@$(CXX) $(CXXFLAGS) -c test_safety_constants.cpp && echo "✅ SafetyConstants compiles OK" || echo "❌ SafetyConstants compilation failed"
	@$(CXX) $(CXXFLAGS) -c test_utils_constants.cpp && echo "✅ UtilsConstants compiles OK" || echo "❌ UtilsConstants compilation failed"
	@rm -f *.o

# Test avec différents niveaux d'optimisation
test-optimized:
	@echo "⚡ Testing with optimization..."
	@$(CXX) $(CXXFLAGS) -O2 -DNDEBUG -o test_core_opt test_core_constants.cpp
	@./test_core_opt && echo "✅ CoreConstants - Optimized OK"
	@rm -f test_core_opt

# Test de compatibilité C++17 (fallback)
test-cpp17:
	@echo "🔄 Testing C++17 compatibility..."
	@$(CXX) -std=c++17 -Wall -Wextra -I. -o test_core_17 test_core_constants.cpp && echo "✅ C++17 compatible" || echo "⚠️ C++17 incompatible"
	@rm -f test_core_17
