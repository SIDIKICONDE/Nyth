#!/bin/bash

echo "=== Adaptation du code C++20 vers C++17 ==="

# 1. Remplacer les en-têtes C++20 par leurs équivalents C++17
echo "Remplacement des en-têtes C++20..."

# std::span -> std::vector ou pointeurs bruts
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/#include <span>/#include <vector>/g'

# std::concepts -> suppression (ou remplacement par SFINAE)
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/#include <concepts>/\/\/ #include <concepts> \/\/ Supprimé pour C++17/g'

# std::ranges -> std::algorithm
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/#include <ranges>/#include <algorithm>/g'

# std::source_location -> __FILE__ et __LINE__
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/#include <source_location>/\/\/ #include <source_location> \/\/ Supprimé pour C++17/g'

# 2. Remplacer les utilisations de std::span
echo "Remplacement des utilisations de std::span..."

# std::span<T> -> std::vector<T>& ou const T*
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/std::span<\([^>]*\)>/std::vector<\1>\&/g'

# 3. Remplacer les concepts par des templates classiques
echo "Suppression des concepts..."

# Supprimer les lignes de concepts
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' '/template.*concept/d'
find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' '/requires.*=/d'

# 4. Remplacer std::ranges par std::algorithm
echo "Remplacement de std::ranges..."

find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/std::ranges::/std::/g'

# 5. Remplacer std::source_location
echo "Remplacement de std::source_location..."

find shared -name "*.hpp" -o -name "*.cpp" | xargs sed -i '' 's/std::source_location::current()/std::string(__FILE__) + ":" + std::to_string(__LINE__)/g'

echo "=== Adaptation terminée ==="
echo "Le code devrait maintenant être compatible C++17"
echo ""
echo "Testons la compilation..."
