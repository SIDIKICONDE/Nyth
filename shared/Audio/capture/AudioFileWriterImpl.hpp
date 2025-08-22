#pragma once

#include <cstring>
#include <vector>
#include "Audio/capture/AudioFileWriter.hpp"
#include "Audio/capture/AudioCaptureUtilsImpl.hpp"

namespace AudioFX {
namespace Capture {

inline WavFileWriter::WavFileWriter() = default;

inline WavFileWriter::~WavFileWriter() {
  close();
}

inline bool WavFileWriter::open(const std::string& filePath,
                                uint32_t sampleRate,
                                uint16_t numChannels) {
  close();
  m_stream.open(filePath, std::ios::binary | std::ios::out | std::ios::trunc);
  if (!m_stream.is_open()) return false;

  m_sampleRate = sampleRate;
  m_numChannels = numChannels;
  m_bytesWritten = 0;

  writeHeaderPlaceholder();
  return true;
}

inline bool WavFileWriter::writeInterleavedFloat(const float* interleavedSamples,
                                                 size_t numFrames) {
  if (!m_stream.is_open() || interleavedSamples == nullptr || numFrames == 0) return false;

  const size_t numSamples = numFrames * static_cast<size_t>(m_numChannels);
  std::vector<int16_t> temp(numSamples);
  for (size_t i = 0; i < numSamples; ++i) {
    float v = interleavedSamples[i];
    if (v < -1.0f) v = -1.0f;
    if (v > 1.0f) v = 1.0f;
    temp[i] = static_cast<int16_t>(std::lrintf(v * 32767.0f));
  }
  return writeInterleavedInt16(temp.data(), numFrames);
}

inline bool WavFileWriter::writeInterleavedInt16(const int16_t* interleavedSamples,
                                                 size_t numFrames) {
  if (!m_stream.is_open() || interleavedSamples == nullptr || numFrames == 0) return false;

  const size_t numSamples = numFrames * static_cast<size_t>(m_numChannels);
  const size_t numBytes = numSamples * sizeof(int16_t);
  m_stream.write(reinterpret_cast<const char*>(interleavedSamples), static_cast<std::streamsize>(numBytes));
  if (!m_stream.good()) return false;
  m_bytesWritten += static_cast<uint32_t>(numBytes);
  return true;
}

inline void WavFileWriter::close() {
  if (m_stream.is_open()) {
    finalizeHeader();
    m_stream.close();
  }
}

inline void WavFileWriter::writeHeaderPlaceholder() {
  // RIFF header with placeholder sizes (will be updated in finalizeHeader)
  struct RiffHeader {
    char chunkId[4];
    uint32_t chunkSize;
    char format[4];

    char subchunk1Id[4];
    uint32_t subchunk1Size;
    uint16_t audioFormat;
    uint16_t numChannels;
    uint32_t sampleRate;
    uint32_t byteRate;
    uint16_t blockAlign;
    uint16_t bitsPerSample;

    char subchunk2Id[4];
    uint32_t subchunk2Size;
  } header;

  std::memcpy(header.chunkId, "RIFF", 4);
  header.chunkSize = 36; // placeholder
  std::memcpy(header.format, "WAVE", 4);

  std::memcpy(header.subchunk1Id, "fmt ", 4);
  header.subchunk1Size = 16;
  header.audioFormat = 1; // PCM
  header.numChannels = m_numChannels;
  header.sampleRate = m_sampleRate;
  header.bitsPerSample = 16; // 16-bit PCM
  header.byteRate = header.sampleRate * header.numChannels * (header.bitsPerSample / 8);
  header.blockAlign = header.numChannels * (header.bitsPerSample / 8);

  std::memcpy(header.subchunk2Id, "data", 4);
  header.subchunk2Size = 0; // placeholder

  m_stream.write(reinterpret_cast<const char*>(&header), sizeof(header));
}

inline void WavFileWriter::finalizeHeader() {
  if (!m_stream.is_open()) return;

  const uint32_t dataSize = m_bytesWritten;
  const uint32_t riffSize = 36u + dataSize;

  m_stream.seekp(4, std::ios::beg);
  m_stream.write(reinterpret_cast<const char*>(&riffSize), sizeof(riffSize));

  m_stream.seekp(40, std::ios::beg);
  m_stream.write(reinterpret_cast<const char*>(&dataSize), sizeof(dataSize));

  m_stream.seekp(0, std::ios::end);
}

} // namespace Capture
} // namespace AudioFX