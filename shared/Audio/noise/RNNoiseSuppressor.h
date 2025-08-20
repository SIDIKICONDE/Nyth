#pragma once

#ifdef __cplusplus
#include <cstddef>
#include <cstdint>
#include <vector>

#ifdef FFMPEG_AVAILABLE
// Global forward declarations to avoid introducing nested types that shadow FFmpeg C structs
struct AVFilterGraph;
struct AVFilterContext;
struct AVFrame;
#endif

#ifdef NAAYA_RNNOISE
// Forward declaration for RNNoise C struct
struct DenoiseState;
#endif

namespace AudioNR {

/**
 * @brief Machine learning-based noise suppressor using RNNoise
 * 
 * This class provides a wrapper around RNNoise, a recurrent neural network
 * designed for real-time noise suppression. RNNoise is particularly effective
 * at removing non-stationary noise like keyboard typing, background chatter, etc.
 * 
 * Features:
 * - Uses deep learning model trained on diverse noise types
 * - Very low latency (10ms frame size)
 * - Excellent quality for voice applications
 * - Can use either native RNNoise library or FFmpeg's arnndn filter
 * 
 * @note Requires either NAAYA_RNNOISE or FFMPEG_AVAILABLE to be defined
 * @note Without these, acts as a pass-through
 */
class RNNoiseSuppressor {
public:
    RNNoiseSuppressor();
    ~RNNoiseSuppressor();

    /**
     * @brief Initialize the RNNoise engine
     * @param sampleRate Sample rate (RNNoise works best at 48kHz)
     * @param numChannels Number of channels (1 or 2)
     * @return true if RNNoise is available and initialized
     */
    bool initialize(uint32_t sampleRate, int numChannels);

    /**
     * @brief Check if RNNoise implementation is available
     * @return true if library is linked and initialized
     */
    bool isAvailable() const;

    /**
     * @brief Set noise suppression aggressiveness
     * @param aggressiveness 0.0 (gentle) to 3.0 (aggressive)
     * @note Exact behavior depends on backend implementation
     */
    void setAggressiveness(double aggressiveness);

    /**
     * @brief Process mono audio
     * @param input Input samples in [-1, 1] range
     * @param output Output buffer (can be same as input)
     * @param numSamples Number of samples
     * @note RNNoise processes in 10ms frames (480 samples @ 48kHz)
     */
    void processMono(const float* input, float* output, size_t numSamples);
    
    /**
     * @brief Process stereo audio
     * @param inL Left input channel
     * @param inR Right input channel
     * @param outL Left output channel
     * @param outR Right output channel
     * @param numSamples Samples per channel
     * @note Currently downmixes to mono for processing
     */
    void processStereo(const float* inL, const float* inR,
                       float* outL, float* outR,
                       size_t numSamples);

private:
    bool available_{false};
    uint32_t sampleRate_{48000};
    int channels_{1};
    double aggressiveness_{1.0};

#ifdef FFMPEG_AVAILABLE
    // FFmpeg graph for arnndn
    ::AVFilterGraph* filterGraph_{nullptr};
    ::AVFilterContext* sourceContext_{nullptr};
    ::AVFilterContext* sinkContext_{nullptr};
    ::AVFrame* inputFrame_{nullptr};
    ::AVFrame* outputFrame_{nullptr};
    bool graphReady_{false};
    bool buildGraph();
    void destroyGraph();
#endif

#ifdef NAAYA_RNNOISE
    ::DenoiseState* rnnsState_{nullptr};
    // Tampon d'agrégation pour traiter par trames de 480 échantillons (10 ms @ 48k)
    std::vector<float> pendingMono_;
    void destroyRNNoise();
#endif
};

} // namespace AudioNR
#endif // __cplusplus


