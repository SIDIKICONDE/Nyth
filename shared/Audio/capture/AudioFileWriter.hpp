#pragma once

#include <cstddef>
#include <cstdint>
#include <fstream>
#include <string>

namespace AudioFX {
namespace Capture {

class WavFileWriter {
public:
  WavFileWriter();
  ~WavFileWriter();

  bool open(const std::string& filePath,
            uint32_t sampleRate,
            uint16_t numChannels);

  bool writeInterleavedFloat(const float* interleavedSamples, size_t numFrames);
  bool writeInterleavedInt16(const int16_t* interleavedSamples, size_t numFrames);

  void close();
  bool isOpen() const { return m_stream.is_open(); }

private:
  void writeHeaderPlaceholder();
  void finalizeHeader();

private:
  std::ofstream m_stream;
  uint32_t m_sampleRate = 0;
  uint16_t m_numChannels = 0;
  uint32_t m_bytesWritten = 0;
};

} // namespace Capture
} // namespace AudioFX