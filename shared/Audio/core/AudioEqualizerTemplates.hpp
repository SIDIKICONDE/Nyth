#pragma once
#ifndef AUDIOFX_AUDIOEQUALIZERTEMPLATES_HPP
#define AUDIOFX_AUDIOEQUALIZERTEMPLATES_HPP

#include <algorithm>
#include <atomic>
#include <memory>
#include <mutex>
#include <sstream>
#include <type_traits>
#include <vector>

namespace AudioFX {

// Forward declarations et déclarations partielles pour éviter les inclusions
// circulaires Les templates ont besoin d'accéder aux membres privés, mais nous
// évitons l'inclusion complète

// ============================================================================
// Template implementations for AudioEqualizer class
// These are included directly in the header to avoid linker issues
// ============================================================================

template <typename T, typename SFINAE>
inline void AudioEqualizer::process(const std::vector<T> &input,
                                    std::vector<T> &output,
                                    const std::string &location) {
  // C++17 static assertion pour validation de type à la compilation
  static_assert(
      std::is_floating_point_v<T>,
      "AudioEqualizer::process requires floating point type (float or double)");

  // Validation des tailles de buffers
  if (input.size() != output.size()) {
    output.resize(input.size());
  }

  // Mode bypass - copie directe optimisée
  if (m_bypass.load()) {
    if (input.data() != output.data()) {
      std::copy(input.begin(), input.end(), output.begin());
    }
    return;
  }

  // Mise à jour des filtres si nécessaire
  if (m_parametersChanged.load()) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    updateFilters();
    m_parametersChanged.store(false);
  }

  // Traitement spécialisé selon le type avec constexpr if (C++17)
  if constexpr (std::is_same_v<T, float>) {
    // Traitement direct pour float (type natif)
    processOptimized(input, output);
  } else {
    // Pour double: traiter directement sans conversion si possible
    // Sinon, utiliser une version optimisée pour double
    // TODO: Implémenter processOptimizedDouble pour éviter les conversions
    std::vector<float> tempInput(input.begin(), input.end());
    std::vector<float> tempOutput(tempInput.size());

    processOptimized(tempInput, tempOutput);

    // Conversion retour vers le type original
    std::transform(tempOutput.begin(), tempOutput.end(), output.begin(),
                   [](float val) { return static_cast<T>(val); });
  }
}

template <typename T, typename SFINAE>
inline void AudioEqualizer::processStereo(const std::vector<T> &inputL,
                                          const std::vector<T> &inputR,
                                          std::vector<T> &outputL,
                                          std::vector<T> &outputR,
                                          const std::string &location) {
  // C++17 static assertion pour validation de type à la compilation
  static_assert(std::is_floating_point_v<T>,
                "AudioEqualizer::processStereo requires floating point type "
                "(float or double)");

  // Validation des tailles de buffers stéréo
  if (inputL.size() != outputL.size()) {
    outputL.resize(inputL.size());
  }
  if (inputR.size() != outputR.size()) {
    outputR.resize(inputR.size());
  }

  // Mode bypass - copie directe optimisée
  if (m_bypass.load()) {
    if (outputL.data() != inputL.data()) {
      std::copy(inputL.begin(), inputL.end(), outputL.begin());
    }
    if (outputR.data() != inputR.data()) {
      std::copy(inputR.begin(), inputR.end(), outputR.begin());
    }
    return;
  }

  // Mise à jour des filtres si nécessaire
  if (m_parametersChanged.load()) {
    std::lock_guard<std::mutex> lock(m_parameterMutex);
    updateFilters();
    m_parametersChanged.store(false);
  }

  // Traitement spécialisé selon le type avec constexpr if (C++17)
  if constexpr (std::is_same_v<T, float>) {
    // Traitement direct pour float (type natif)
    processStereoOptimized(inputL, inputR, outputL, outputR);
  } else {
    // Conversion vers float pour les autres types (double)
    std::vector<float> tempInputL(inputL.begin(), inputL.end());
    std::vector<float> tempInputR(inputR.begin(), inputR.end());
    std::vector<float> tempOutputL(tempInputL.size());
    std::vector<float> tempOutputR(tempInputR.size());

    processStereoOptimized(tempInputL, tempInputR, tempOutputL, tempOutputR);

    // Conversion retour vers le type original
    std::copy(tempOutputL.begin(), tempOutputL.end(), outputL.begin());
    std::copy(tempOutputR.begin(), tempOutputR.end(), outputR.begin());
  }
}

template <typename T, typename SFINAE>
inline bool
AudioEqualizer::validateAudioBuffer(const std::vector<T> &buffer,
                                    const std::string &location) const {
  // C++17 static assertion pour validation de type à la compilation
  static_assert(std::is_floating_point_v<T>,
                "AudioEqualizer::validateAudioBuffer requires floating point "
                "type (float or double)");

  // Vérification basique du buffer
  if (buffer.empty()) {
    return false;
  }

  // C++17 algorithm pour vérifier les valeurs NaN/Inf avec std::all_of
  return std::all_of(buffer.begin(), buffer.end(),
                     [](const T &sample) { return std::isfinite(sample); });
}

} // namespace AudioFX

#endif // AUDIOFX_AUDIOEQUALIZERTEMPLATES_HPP
