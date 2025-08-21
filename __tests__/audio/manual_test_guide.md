# 🧪 Guide de Test Manuel - AudioEqualizer

Ce guide vous explique comment tester manuellement les composants audio sans compilation automatique.

## 🎯 Objectif

Valider que les concepts de base de l'audio numérique fonctionnent correctement dans votre projet.

## 📋 Prérequis

### Option 1: Installation de MinGW-w64 (Recommandé)
1. Téléchargez MinGW-w64 depuis https://www.mingw-w64.org/
2. Installez avec l'architecture x86_64 et les threads posix
3. Ajoutez `C:\mingw64\bin` au PATH système
4. Testez avec `g++ --version`

### Option 2: Utilisation de Visual Studio
1. Installez Visual Studio 2022 Community
2. Installez la charge de travail "Développement Desktop en C++"
3. Utilisez le Developer Command Prompt

### Option 3: WSL (Sous-système Windows pour Linux)
1. Activez WSL dans les fonctionnalités Windows
2. Installez Ubuntu depuis le Microsoft Store
3. Installez les outils: `sudo apt install build-essential cmake`

## 🚀 Tests Manuels

### Test 1: Validation des Concepts Mathématiques

Créez un fichier `math_test.cpp` :

```cpp
#include <iostream>
#include <cmath>

int main() {
    // Test conversion dB <-> linéaire
    double db = 6.0;
    double linear = std::pow(10.0, db / 20.0);
    double back_to_db = 20.0 * std::log10(linear);

    std::cout << "dB: " << db << " -> Linear: " << linear << " -> Back to dB: " << back_to_db << std::endl;

    if (std::abs(back_to_db - db) < 0.001) {
        std::cout << "✅ Conversion dB <-> linéaire OK" << std::endl;
        return 0;
    } else {
        std::cout << "❌ Conversion dB <-> linéaire FAILED" << std::endl;
        return 1;
    }
}
```

**Compilation:** `g++ math_test.cpp -o math_test.exe`

**Exécution:** `./math_test.exe`

### Test 2: Génération de Signal

```cpp
#include <iostream>
#include <vector>
#include <cmath>

int main() {
    const int sampleRate = 44100;
    const double frequency = 440.0;
    const int numSamples = 100;

    std::vector<double> sineWave(numSamples);

    for (int i = 0; i < numSamples; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        sineWave[i] = std::sin(2.0 * M_PI * frequency * t);
    }

    // Vérifier les limites
    double maxVal = *std::max_element(sineWave.begin(), sineWave.end());
    double minVal = *std::min_element(sineWave.begin(), sineWave.end());

    std::cout << "Signal range: [" << minVal << ", " << maxVal << "]" << std::endl;

    if (maxVal <= 1.0 && minVal >= -1.0) {
        std::cout << "✅ Signal generation OK" << std::endl;
        return 0;
    } else {
        std::cout << "❌ Signal generation FAILED" << std::endl;
        return 1;
    }
}
```

### Test 3: Calcul RMS

```cpp
#include <iostream>
#include <vector>
#include <cmath>
#include <numeric>

int main() {
    std::vector<double> signal = {0.5, -0.5, 0.5, -0.5};

    double sumSquares = 0.0;
    for (double sample : signal) {
        sumSquares += sample * sample;
    }
    double rms = std::sqrt(sumSquares / signal.size());

    std::cout << "RMS: " << rms << std::endl;

    if (std::abs(rms - 0.5) < 0.001) {
        std::cout << "✅ RMS calculation OK" << std::endl;
        return 0;
    } else {
        std::cout << "❌ RMS calculation FAILED" << std::endl;
        return 1;
    }
}
```

## 🔍 Validation des Composants

### 1. Vérification des Headers

Assurez-vous que ces fichiers existent et sont lisibles :

- ✅ `shared/Audio/core/AudioEqualizer.hpp`
- ✅ `shared/Audio/core/BiquadFilter.hpp`
- ✅ `shared/Audio/utils/AudioBuffer.hpp`
- ✅ `shared/Audio/effects/Compressor.hpp`
- ✅ `shared/Audio/noise/NoiseReducer.hpp`

### 2. Validation des Concepts C++20

Vérifiez que votre compilateur supporte :
- ✅ `std::span`
- ✅ `std::ranges`
- ✅ `std::format`
- ✅ `std::source_location`
- ✅ Concepts (`AudioSampleType`, etc.)

### 3. Test des Constantes

Vérifiez les valeurs dans `shared/Audio/utils/Constants.hpp` :
- ✅ `NUM_BANDS = 10`
- ✅ `DEFAULT_SAMPLE_RATE = 48000`
- ✅ `MAX_GAIN_DB = 24.0`
- ✅ `MIN_GAIN_DB = -24.0`

## 📊 Tests de Validation

### Test des Limites Audio

```cpp
// Test des valeurs limites
double testValues[] = {0.0, 0.5, 1.0, -1.0, 0.999, -0.999};

for (double val : testValues) {
    if (std::abs(val) > 1.0) {
        std::cout << "❌ Valeur hors limites: " << val << std::endl;
    } else {
        std::cout << "✅ Valeur OK: " << val << std::endl;
    }
}
```

### Test de Performance Basique

```cpp
#include <chrono>

int main() {
    const int iterations = 100000;
    auto start = std::chrono::high_resolution_clock::now();

    double result = 0.0;
    for (int i = 0; i < iterations; ++i) {
        result += std::sin(2.0 * M_PI * 440.0 * i / 44100.0);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    double samplesPerMs = static_cast<double>(iterations) / duration.count();
    double realtimeFactor = samplesPerMs / 44.1; // 44.1kHz

    std::cout << "Performance: " << realtimeFactor << "x temps réel" << std::endl;

    return (realtimeFactor > 1.0) ? 0 : 1;
}
```

## 🏗️ Compilation de la Suite de Tests Complète

### Étape 1: Installation des Outils

```bash
# Installation de Chocolatey (gestionnaire de paquets Windows)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Installation de MinGW-w64
choco install mingw

# Installation de CMake
choco install cmake
```

### Étape 2: Compilation

```bash
cd __tests__/audio
mkdir build
cd build

# Configuration
cmake .. -DCMAKE_BUILD_TYPE=Release

# Compilation
cmake --build . --config Release
```

### Étape 3: Exécution

```bash
# Exécuter tous les tests
./audio_tests.exe

# Exécuter des tests spécifiques
./audio_tests.exe --gtest_filter="*Equalizer*"

# Tests de performance
./audio_tests.exe --gtest_filter="*Performance*"
```

## 🎯 Résultats Attendus

### Tests Mathématiques
- ✅ Conversion dB ↔ linéaire précise
- ✅ Calcul RMS correct
- ✅ Génération de signal dans les limites

### Tests de Performance
- ✅ Au moins 1x temps réel (44.1 kHz)
- ✅ Pas de crash avec paramètres extrêmes
- ✅ Utilisation mémoire stable

### Tests de Validation
- ✅ Tous les headers présents
- ✅ Support C++20 complet
- ✅ Valeurs constantes correctes

## 🚨 Dépannage

### Erreur: "g++ not found"
**Solution:** Installez MinGW-w64 et ajoutez au PATH

### Erreur: "CMake generator not found"
**Solution:** Installez Visual Studio avec les outils C++

### Erreur: "Tests failed"
**Solution:** Vérifiez les chemins d'inclusion et les dépendances

### Performance lente
**Solution:** Compilez en mode Release avec optimisations

---

**🎵 Ce guide vous permet de valider manuellement les composants audio avant la compilation complète.**
