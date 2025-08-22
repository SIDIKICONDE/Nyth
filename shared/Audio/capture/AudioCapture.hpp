#pragma once
#ifndef NYTH_AUDIO_CAPTURE_AUDIOCAPTURE_HPP
#define NYTH_AUDIO_CAPTURE_AUDIOCAPTURE_HPP

#include <cstddef>
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace NythAudio {

// Channel layout
enum class ChannelLayout : uint8_t {
	Mono = 1,
	Stereo = 2
};

// Sample format (only float32 supported initially; extensible)
enum class SampleFormat : uint8_t {
	Float32 = 1
};

// High-level configuration for capture
struct CaptureConfig {
	uint32_t sampleRateHz = 48000;
	ChannelLayout layout = ChannelLayout::Stereo;
	SampleFormat format = SampleFormat::Float32;
	// Size of the internal ring buffer in frames per channel
	size_t ringBufferFrames = 48000; // 1s at 48kHz per channel
	// Optional DC removal
	bool dcRemovalEnabled = true;
	float dcAlpha = 0.995f; // IIR HPF coefficient if enabled
};

// Simple rolling statistics for monitoring
struct CaptureStats {
	double peak = 0.0;         // absolute peak in last window
	double rms = 0.0;          // RMS in last window
	double dcOffset = 0.0;     // estimated DC component
	uint64_t clippedSamples = 0; // number of clipped samples seen
	uint64_t framesCaptured = 0; // total frames pushed since start
};

// Callback invoked when a chunk of audio is available for consumers.
// The buffer is interleaved if layout==Stereo. Size is frames*channels.
using AudioCallback = std::function<void(const float* interleaved, size_t frames, uint32_t sampleRate)>;

class AudioCapture {
public:
	virtual ~AudioCapture() = default;

	// Control
	virtual bool start() = 0;
	virtual void stop() = 0;
	virtual bool isRunning() const = 0;

	// Push interleaved PCM float32 frames from platform layer
	// Returns number of frames accepted (may be less than provided on overflow)
	virtual size_t pushInterleaved(const float* data, size_t frames) = 0;

	// Non-interleaved convenience helpers
	virtual size_t pushMono(const float* mono, size_t frames) = 0;
	virtual size_t pushStereo(const float* left, const float* right, size_t frames) = 0;

	// Stats
	virtual CaptureStats getStats() const = 0;
	virtual void resetStats() = 0;

	// Configuration
	virtual const CaptureConfig& getConfig() const = 0;

	// Consumer registration: last-added callback is retained; providing empty resets
	virtual void setConsumer(AudioCallback callback) = 0;

	// Factory
	static std::unique_ptr<AudioCapture> create(const CaptureConfig& config);
};

} // namespace NythAudio

#endif // NYTH_AUDIO_CAPTURE_AUDIOCAPTURE_HPP