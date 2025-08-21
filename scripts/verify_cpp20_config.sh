#!/bin/bash

# =============================================================================
# verify_cpp20_config.sh - Vérification de la configuration C++20
# =============================================================================

echo "🔧 Vérification de la configuration C++20 pour Nyth"
echo "=================================================="

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher le résultat
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "CMakeLists.txt" ]; then
    echo -e "${RED}❌ Erreur: Exécutez ce script depuis la racine du projet${NC}"
    exit 1
fi

echo "📁 Vérification des fichiers de configuration..."

# Vérifier les fichiers CMake
[ -f "CMakeLists.txt" ] && check_result 0 "CMakeLists.txt trouvé" || check_result 1 "CMakeLists.txt manquant"
[ -f "ios/CMakeLists.txt" ] && check_result 0 "ios/CMakeLists.txt trouvé" || check_result 1 "ios/CMakeLists.txt manquant"
[ -f "android/app/src/main/jni/CMakeLists.txt" ] && check_result 0 "Android CMakeLists.txt trouvé" || check_result 1 "Android CMakeLists.txt manquant"
[ -f "cmake/toolchain.cmake" ] && check_result 0 "cmake/toolchain.cmake trouvé" || check_result 1 "cmake/toolchain.cmake manquant"

# Vérifier les fichiers C++20
echo ""
echo "📦 Vérification des fichiers C++20..."

# Vérifier les headers C++20
check_header() {
    if [ -f "$1" ]; then
        if grep -q "C++20\|concepts\|std::span\|std::format\|std::source_location\|consteval" "$1"; then
            check_result 0 "$1 contient des fonctionnalités C++20"
        else
            echo -e "${YELLOW}⚠️  $1 n'utilise pas encore C++20${NC}"
        fi
    else
        echo -e "${RED}❌ $1 manquant${NC}"
    fi
}

check_header "shared/Audio/effects/EffectBase.hpp"
check_header "shared/Audio/effects/Compressor.hpp"
check_header "shared/Audio/effects/Delay.hpp"
check_header "shared/Audio/effects/EffectChain.hpp"
check_header "shared/Audio/utils/AudioBuffer.hpp"
check_header "shared/Audio/utils/Constants.hpp"

echo ""
echo "🛠️  Vérification de l'environnement de build..."

# Vérifier CMake
if command -v cmake &> /dev/null; then
    CMAKE_VERSION=$(cmake --version | head -n1 | cut -d' ' -f3)
    echo -e "${GREEN}✅ CMake $CMAKE_VERSION trouvé${NC}"
else
    echo -e "${RED}❌ CMake non trouvé${NC}"
fi

# Vérifier la version C++ du système
echo ""
echo "🔍 Vérification du support C++20..."

# Créer un fichier de test temporaire
cat > /tmp/test_cpp20.cpp << 'EOF'
#include <iostream>
#include <concepts>
#include <format>
#include <source_location>
#include <span>
#include <vector>

// Test concepts
template<typename T>
concept Integral = std::integral<T>;

template<Integral T>
consteval T square(T x) {
    return x * x;
}

int main() {
    // Test std::span
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::span<int> s(vec);

    // Test std::format
    std::string msg = std::format("Hello C++20! Span size: {}", s.size());

    // Test std::source_location
    auto loc = std::source_location::current();
    std::string location = std::format("File: {}, Line: {}",
                                     loc.file_name(), loc.line());

    std::cout << msg << std::endl;
    std::cout << location << std::endl;
    std::cout << "Square of 5: " << square(5) << std::endl;

    return 0;
}
EOF

# Tenter de compiler avec C++20
if command -v g++ &> /dev/null; then
    if g++ -std=c++20 /tmp/test_cpp20.cpp -o /tmp/test_cpp20 2>/dev/null; then
        echo -e "${GREEN}✅ GCC supporte C++20${NC}"
        /tmp/test_cpp20
    else
        echo -e "${RED}❌ GCC ne supporte pas C++20 ou compilation échouée${NC}"
    fi
elif command -v clang++ &> /dev/null; then
    if clang++ -std=c++20 /tmp/test_cpp20.cpp -o /tmp/test_cpp20 2>/dev/null; then
        echo -e "${GREEN}✅ Clang supporte C++20${NC}"
        /tmp/test_cpp20
    else
        echo -e "${RED}❌ Clang ne supporte pas C++20 ou compilation échouée${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Aucun compilateur C++ trouvé${NC}"
fi

# Nettoyer
rm -f /tmp/test_cpp20.cpp /tmp/test_cpp20

echo ""
echo "📋 Résumé de la configuration C++20:"
echo "===================================="

# Vérifier les définitions CMake
echo "Vérification des flags C++20 dans les CMakeLists.txt..."
if grep -q "CMAKE_CXX_STANDARD 20" CMakeLists.txt; then
    echo -e "${GREEN}✅ C++20 activé dans CMakeLists.txt principal${NC}"
else
    echo -e "${RED}❌ C++20 non activé dans CMakeLists.txt principal${NC}"
fi

if grep -q "CMAKE_CXX_STANDARD 20" ios/CMakeLists.txt; then
    echo -e "${GREEN}✅ C++20 activé dans iOS CMakeLists.txt${NC}"
else
    echo -e "${RED}❌ C++20 non activé dans iOS CMakeLists.txt${NC}"
fi

if grep -q "CMAKE_CXX_STANDARD 20" android/app/src/main/jni/CMakeLists.txt; then
    echo -e "${GREEN}✅ C++20 activé dans Android CMakeLists.txt${NC}"
else
    echo -e "${RED}❌ C++20 non activé dans Android CMakeLists.txt${NC}"
fi

echo ""
echo "🎯 Configuration C++20 vérifiée!"
echo "Pour plus de détails, consultez cmake/README.md"
