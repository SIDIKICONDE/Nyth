#pragma once
#ifndef AUDIOEQUALIZERTEMPLATES_HPP_INCLUDED
#define AUDIOEQUALIZERTEMPLATES_HPP_INCLUDED

#include <vector>
#include <algorithm>
#include <type_traits>
#include <sstream>

namespace AudioFX {

// Forward declaration
class AudioEqualizer;

// Template implementations for AudioEqualizer class
// These are included directly in the header to avoid linker issues

template<typename T, typename>
inline void AudioEqualizer::process(const std::vector<T>& input, 
                                    std::vector<T>& output,
                                    const std::string& location) {
    static_assert(std::is_floating_point_v<T>, 
                  "AudioEqualizer::process requires floating point type");
    
    // Validate buffer sizes
    if (input.size() != output.size()) {
        output.resize(input.size());
    }
    
    if (m_bypass.load()) {
        // Bypass mode - just copy input to output
        if (input.data() != output.data()) {
            std::copy(input.begin(), input.end(), output.begin());
        }
        return;
    }
    
    // Check if parameters have changed
    if (m_parametersChanged.load()) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        updateFilters();
        m_parametersChanged.store(false);
    }
    
    // Process with type conversion if needed
    if constexpr (std::is_same_v<T, float>) {
        processOptimized(input, output);
    } else {
        // Convert to float for processing
        std::vector<float> tempInput(input.begin(), input.end());
        std::vector<float> tempOutput(tempInput.size());
        
        processOptimized(tempInput, tempOutput);
        
        // Convert back to original type
        std::copy(tempOutput.begin(), tempOutput.end(), output.begin());
    }
}

template<typename T, typename>
inline void AudioEqualizer::processStereo(const std::vector<T>& inputL, 
                                          const std::vector<T>& inputR,
                                          std::vector<T>& outputL, 
                                          std::vector<T>& outputR,
                                          const std::string& location) {
    static_assert(std::is_floating_point_v<T>, 
                  "AudioEqualizer::processStereo requires floating point type");
    
    // Validate buffer sizes
    if (inputL.size() != outputL.size()) {
        outputL.resize(inputL.size());
    }
    if (inputR.size() != outputR.size()) {
        outputR.resize(inputR.size());
    }
    
    if (m_bypass.load()) {
        // Bypass mode
        if (outputL.data() != inputL.data()) {
            std::copy(inputL.begin(), inputL.end(), outputL.begin());
        }
        if (outputR.data() != inputR.data()) {
            std::copy(inputR.begin(), inputR.end(), outputR.begin());
        }
        return;
    }
    
    // Check if parameters have changed
    if (m_parametersChanged.load()) {
        std::lock_guard<std::mutex> lock(m_parameterMutex);
        updateFilters();
        m_parametersChanged.store(false);
    }
    
    // Process with type conversion if needed
    if constexpr (std::is_same_v<T, float>) {
        processStereoOptimized(inputL, inputR, outputL, outputR);
    } else {
        // Convert to float for processing
        std::vector<float> tempInputL(inputL.begin(), inputL.end());
        std::vector<float> tempInputR(inputR.begin(), inputR.end());
        std::vector<float> tempOutputL(tempInputL.size());
        std::vector<float> tempOutputR(tempInputR.size());
        
        processStereoOptimized(tempInputL, tempInputR, tempOutputL, tempOutputR);
        
        // Convert back to original type
        std::copy(tempOutputL.begin(), tempOutputL.end(), outputL.begin());
        std::copy(tempOutputR.begin(), tempOutputR.end(), outputR.begin());
    }
}

template<typename T, typename>
inline bool AudioEqualizer::validateAudioBuffer(const std::vector<T>& buffer,
                                                const std::string& location) const {
    static_assert(std::is_floating_point_v<T>, 
                  "validateAudioBuffer requires floating point type");
    
    if (buffer.empty()) {
        return false;
    }
    
    // Check for NaN or Inf values
    for (const auto& sample : buffer) {
        if (!std::isfinite(sample)) {
            return false;
        }
    }
    
    return true;
}

} // namespace AudioFX

#endif // AUDIOEQUALIZERTEMPLATES_HPP_INCLUDED