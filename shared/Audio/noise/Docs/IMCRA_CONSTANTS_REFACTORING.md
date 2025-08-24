# Refactoring des Constantes IMCRA

## Objectif

Remplacer tous les nombres magiques dans les composants IMCRA par des constantes nommées et bien documentées, améliorant ainsi la lisibilité, la maintenabilité et la cohérence du code.

## Constantes Ajoutées

### Namespace `IMCRAConstants`

#### Constantes Mathématiques et Utilitaires
```cpp
constexpr double EULER_MASCHERONI = 0.57721566;      // Constante d'Euler-Mascheroni
constexpr double EXPONENTIAL_APPROX_THRESHOLD = 1e-10; // Seuil pour l'approximation exponentielle
constexpr double MAX_LIKELIHOOD_RATIO = 50.0;        // Limite maximale du ratio de vraisemblance
constexpr double BIAS_CORRECTION_FACTOR = 2.12;      // Facteur de correction de biais
constexpr double BIAS_CORRECTION_STEP = 0.025;       // Pas de correction de biais
constexpr double DB_TO_LINEAR_FACTOR = 10.0;         // Facteur de conversion dB vers linéaire
constexpr double DB_TO_LINEAR_DIVISOR = 10.0;        // Diviseur pour conversion dB vers linéaire
```

#### Valeurs d'Initialisation
```cpp
constexpr double INITIAL_MINIMUM_VALUE = 1e10;       // Valeur initiale très élevée pour les minima
constexpr double INITIAL_SNR_VALUE = 1.0;            // Valeur initiale du SNR
constexpr double INITIAL_PROBABILITY = 0.5;          // Probabilité initiale (50%)
constexpr double INITIAL_BIAS_FACTOR = 1.0;          // Facteur de biais initial
constexpr double INITIAL_GAIN = 1.0;                 // Gain initial
```

#### Constantes de Calcul
```cpp
constexpr double MIN_SNR_PROTECTION = 1e-10;         // Protection contre division par zéro
constexpr double UNITY_VALUE = 1.0;                  // Valeur unitaire
constexpr double ZERO_VALUE = 0.0;                   // Valeur zéro
constexpr double HALF_VALUE = 0.5;                   // Valeur 0.5
```

#### Constantes pour les Calculs Mathématiques
```cpp
constexpr int MAX_ITERATIONS_EXPINT = 20;            // Nombre maximum d'itérations pour expint
constexpr double EXPONENTIAL_SERIES_THRESHOLD = 1e-10; // Seuil pour la série exponentielle
```

## Nombres Magiques Remplacés

### Dans `Imcra.hpp`

#### Fonction `expint()`
```cpp
// Avant
if (x < 1.0f) {
    return -std::log(x) - 0.57721566f + x - x * x / 4.0f + x * x * x / 18.0f;
} else {
    for (int n = 1; n <= 20; ++n) {
        if (std::abs(term) < 1e-10f) break;
    }
    return std::exp(-x) / x * (1.0f + sum);
}

// Après
if (x < IMCRAConstants::UNITY_VALUE) {
    return -std::log(x) - IMCRAConstants::EULER_MASCHERONI + x - x * x / 4.0f + x * x * x / 18.0f;
} else {
    for (int n = 1; n <= IMCRAConstants::MAX_ITERATIONS_EXPINT; ++n) {
        if (std::abs(term) < IMCRAConstants::EXPONENTIAL_SERIES_THRESHOLD) break;
    }
    return std::exp(-x) / x * (IMCRAConstants::UNITY_VALUE + sum);
}
```

### Dans `Imcra.cpp`

#### Constructeur et Initialisation
```cpp
// Avant
S_.resize(numBins_, 0.0f);
Smin_.resize(numBins_, 1e10f);
xi_.resize(numBins_, 1.0f);
q_.resize(numBins_, 0.5f);

// Après
S_.resize(numBins_, IMCRAConstants::ZERO_VALUE);
Smin_.resize(numBins_, IMCRAConstants::INITIAL_MINIMUM_VALUE);
xi_.resize(numBins_, IMCRAConstants::INITIAL_SNR_VALUE);
q_.resize(numBins_, IMCRAConstants::INITIAL_PROBABILITY);
```

#### Fonction `reset()`
```cpp
// Avant
std::fill(S_.begin(), S_.end(), 0.0f);
std::fill(Smin_.begin(), Smin_.end(), 1e10f);
std::fill(xi_.begin(), xi_.end(), 1.0f);

// Après
std::fill(S_.begin(), S_.end(), IMCRAConstants::ZERO_VALUE);
std::fill(Smin_.begin(), Smin_.end(), IMCRAConstants::INITIAL_MINIMUM_VALUE);
std::fill(xi_.begin(), xi_.end(), IMCRAConstants::INITIAL_SNR_VALUE);
```

#### Fonction `processFrame()`
```cpp
// Avant
float alpha_d_tilde = cfg_.alphaD + (1.0f - cfg_.alphaD) * p_[k];
lambda_d_[k] = alpha_d_tilde * lambda_d_[k] + (1.0f - alpha_d_tilde) * Y2;

// Après
float alpha_d_tilde = cfg_.alphaD + (IMCRAConstants::UNITY_VALUE - cfg_.alphaD) * p_[k];
lambda_d_[k] = alpha_d_tilde * lambda_d_[k] + (IMCRAConstants::UNITY_VALUE - alpha_d_tilde) * Y2;
```

#### Fonction `updateMinimumStatistics()`
```cpp
// Avant
S_[k] = cfg_.alphaS * S_[k] + (1.0f - cfg_.alphaS) * Y2;
float min_val = 1e10f;
float gamma_inv = 1.0f / (1.0f + (lmin_flag_[k] - 1) * 0.025f);
b_[k] = 1.0f + (1.0f - gamma_inv) * 2.12f;
b_[k] = min(b_[k], 1.0f / cfg_.betaMax);

// Après
S_[k] = cfg_.alphaS * S_[k] + (IMCRAConstants::UNITY_VALUE - cfg_.alphaS) * Y2;
float min_val = IMCRAConstants::INITIAL_MINIMUM_VALUE;
float gamma_inv = IMCRAConstants::UNITY_VALUE / (IMCRAConstants::UNITY_VALUE + (lmin_flag_[k] - 1) * IMCRAConstants::BIAS_CORRECTION_STEP);
b_[k] = IMCRAConstants::UNITY_VALUE + (IMCRAConstants::UNITY_VALUE - gamma_inv) * IMCRAConstants::BIAS_CORRECTION_FACTOR;
b_[k] = min(b_[k], IMCRAConstants::UNITY_VALUE / cfg_.betaMax);
```

#### Fonction `updateAPrioriSNR()`
```cpp
// Avant
float xiOpt = std::pow(10.0f, cfg_.xiOptDb / 10.0f);
gamma_[k] = Y2 / max(lambda_d_[k], 1e-10f);
float xiML = max(gamma_[k] - 1.0f, 0.0f);
xi_[k] = xiDD + (1.0f - cfg_.alphaD2) * xiML;
GH1_[k] = xi_[k] / (1.0f + xi_[k]);

// Après
float xiOpt = std::pow(IMCRAConstants::DB_TO_LINEAR_FACTOR, cfg_.xiOptDb / IMCRAConstants::DB_TO_LINEAR_DIVISOR);
gamma_[k] = Y2 / max(lambda_d_[k], IMCRAConstants::MIN_SNR_PROTECTION);
float xiML = max(gamma_[k] - IMCRAConstants::UNITY_VALUE, IMCRAConstants::ZERO_VALUE);
xi_[k] = xiDD + (IMCRAConstants::UNITY_VALUE - cfg_.alphaD2) * xiML;
GH1_[k] = xi_[k] / (IMCRAConstants::UNITY_VALUE + xi_[k]);
```

#### Fonction `updateSpeechPresenceProbability()`
```cpp
// Avant
float xi_local = 0.0f;
if (gamma_min > 1.0f) {
    xi_local = (gamma_min - 1.0f);
}
float log_xi_gamma = xi_local * gamma_min / (1.0f + xi_local);
float likelihood_ratio = std::exp(min(log_xi_gamma, 50.0f));
float q_tmp = 1.0f / (1.0f + likelihood_ratio);
p_[k] = 1.0f - q_[k];
p_[k] = 1.0f; // Strong speech presence
p_[k] = 0.0f; // Strong noise presence

// Après
float xi_local = IMCRAConstants::ZERO_VALUE;
if (gamma_min > IMCRAConstants::UNITY_VALUE) {
    xi_local = (gamma_min - IMCRAConstants::UNITY_VALUE);
}
float log_xi_gamma = xi_local * gamma_min / (IMCRAConstants::UNITY_VALUE + xi_local);
float likelihood_ratio = std::exp(min(log_xi_gamma, IMCRAConstants::MAX_LIKELIHOOD_RATIO));
float q_tmp = IMCRAConstants::UNITY_VALUE / (IMCRAConstants::UNITY_VALUE + likelihood_ratio);
p_[k] = IMCRAConstants::UNITY_VALUE - q_[k];
p_[k] = IMCRAConstants::UNITY_VALUE; // Strong speech presence
p_[k] = IMCRAConstants::ZERO_VALUE; // Strong noise presence
```

#### Fonction `computeSpeechProbability()`
```cpp
// Avant
float vk = xik * gammak / (1.0f + xik);
float pk = lambda * (1.0f + vk) * ei;
return clamp(pk, 0.0f, 1.0f);

// Après
float vk = xik * gammak / (IMCRAConstants::UNITY_VALUE + xik);
float pk = lambda * (IMCRAConstants::UNITY_VALUE + vk) * ei;
return clamp(pk, IMCRAConstants::ZERO_VALUE, IMCRAConstants::UNITY_VALUE);
```

## Avantages du Refactoring

### 1. **Lisibilité**
- Les constantes nommées rendent le code plus expressif
- Plus besoin de deviner la signification des nombres magiques
- Documentation intégrée dans le nom des constantes

### 2. **Maintenabilité**
- Modification centralisée des valeurs
- Cohérence dans tout le code
- Réduction des erreurs de saisie

### 3. **Debugging**
- Plus facile d'identifier les valeurs problématiques
- Possibilité de modifier les constantes pour les tests
- Traçabilité des valeurs utilisées

### 4. **Réutilisabilité**
- Constantes disponibles pour d'autres composants
- Namespace organisé et extensible
- Intégration avec le système de constantes existant

## Utilisation des Constantes

### Inclusion
```cpp
#include "../constant/NoiseContants.hpp"
```

### Accès aux Constantes
```cpp
using namespace IMCRAConstants;

// Ou utilisation directe
float value = IMCRAConstants::UNITY_VALUE;
```

### Extension
```cpp
// Ajout de nouvelles constantes
namespace IMCRAConstants {
    constexpr double NEW_CONSTANT = 42.0;
}
```

## Conclusion

Ce refactoring améliore significativement la qualité du code IMCRA en :
- Éliminant tous les nombres magiques
- Centralisant la gestion des constantes
- Améliorant la documentation et la lisibilité
- Facilitant la maintenance et l'évolution du code

Les constantes sont maintenant organisées de manière logique et peuvent être facilement étendues pour de futurs composants ou algorithmes.
