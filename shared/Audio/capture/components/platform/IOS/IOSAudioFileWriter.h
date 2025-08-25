#pragma once

#ifdef __APPLE__
#if TARGET_OS_IOS

#include "../../AudioFileWriter.hpp"
#include <memory>

namespace Nyth {
namespace Audio {
namespace iOS {

// Writer spécialisé pour les formats iOS
class IOSAudioFileWriter {
public:
    IOSAudioFileWriter();
    ~IOSAudioFileWriter();
    
    // Interface similaire à AudioFileWriter
    bool open(const AudioFileWriterConfig& config);
    void close();
    bool write(const float* data, size_t frameCount);
    size_t getFramesWritten() const;
    bool isOpen() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
    
    // Méthodes spécifiques pour chaque format
    bool openALAC(const AudioFileWriterConfig& config, 
                  AudioStreamBasicDescription& audioFormat);
    bool openCAF(const AudioFileWriterConfig& config,
                 AudioStreamBasicDescription& audioFormat);
    bool openAMR(const AudioFileWriterConfig& config,
                AudioStreamBasicDescription& audioFormat);
    
    bool writeALAC(const float* data, size_t frameCount);
    bool writeWithAudioFile(const float* data, size_t frameCount);
};

} // namespace iOS
} // namespace Audio
} // namespace Nyth

#endif // TARGET_OS_IOS
#endif // __APPLE__