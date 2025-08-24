#pragma once

#ifdef __cplusplus
#include <memory>
#include <vector>

namespace AudioNR {

/**
 * @brief Multi-band audio processor for frequency-dependent noise reduction
 */
class MultibandProcessor {
public:
    struct Config {
        enum BandMode {
            LINEAR,
            BARK_SCALE,
            MEL_SCALE,
            ERB_SCALE
        };
        
        BandMode bandMode = BARK_SCALE;
        size_t numBands = 24;
        float lowFreq = 20.0f;
        float highFreq = 20000.0f;
    };
    
    explicit MultibandProcessor(const Config& config);
    ~MultibandProcessor();
    
    // Process methods
    void process(const float* input, float* output, size_t frameSize);
    void processBands(const std::vector<float>& spectrum, std::vector<float>& output);
    
    // Configuration
    void setConfig(const Config& config);
    const Config& getConfig() const { return config_; }
    
private:
    Config config_;
    std::vector<float> bandGains_;
    std::vector<int> bandIndices_;
};

} // namespace AudioNR

#endif // __cplusplus
