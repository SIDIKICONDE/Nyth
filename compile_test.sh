#!/bin/bash

echo "=== Compilation et Test de MathUtils ==="

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "test_MathUtils.cpp" ]; then
    echo "Erreur: test_MathUtils.cpp non trouvé"
    exit 1
fi

# Compiler avec g++ (version moderne)
echo "Compilation en cours..."
g++ -std=c++17 -O3 -march=native \
    -I. \
    -Wall -Wextra -Wpedantic \
    test_MathUtils.cpp \
    -o test_MathUtils

# Vérifier si la compilation a réussi
if [ $? -eq 0 ]; then
    echo "Compilation réussie!"
    echo "Exécution des tests..."
    echo "======================="
    ./test_MathUtils
else
    echo "Erreur de compilation"
    exit 1
fi

echo "=== Fin du Test ==="
