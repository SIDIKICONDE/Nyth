#pragma once

#include <jsi/jsi.h>
#include "../NativeAudioCoreModule.h"
#include <vector>
#include <string>

namespace facebook {
namespace react {

class JSIConverters {
public:
    // === Configuration converters ===
    static NythCoreEqualizerConfig parseEqualizerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig, uint32_t defaultSampleRate);
    static jsi::Object equalizerConfigToJS(jsi::Runtime& rt, const NythCoreEqualizerConfig& config);
    static jsi::Object equalizerInfoToJS(jsi::Runtime& rt, const NythCoreEqualizerInfo& info);
    
    static NythCoreBandConfig parseBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object bandConfigToJS(jsi::Runtime& rt, const NythCoreBandConfig& config);
    
    static NythCoreFilterConfig parseFilterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object filterConfigToJS(jsi::Runtime& rt, const NythCoreFilterConfig& config);
    static jsi::Object filterInfoToJS(jsi::Runtime& rt, const NythCoreFilterInfo& info);

    // === Array converters ===
    static std::vector<float> arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array);
    static jsi::Array floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector);

    // === Type converters ===
    static NythCoreFilterType stringToFilterType(const std::string& typeStr);
    static std::string filterTypeToString(NythCoreFilterType type);
    
    static std::string stateToString(NythCoreState state);
    static std::string errorToString(NythCoreError error);
    static NythCoreError stringToError(const std::string& error);
};

} // namespace react
} // namespace facebook