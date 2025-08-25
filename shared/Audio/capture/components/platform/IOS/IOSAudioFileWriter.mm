#ifdef __APPLE__
#if TARGET_OS_IOS

#include "IOSAudioFileWriter.h"
#include "IOSAudioFormats.h"
#include <AudioToolbox/AudioToolbox.h>
#include <AVFoundation/AVFoundation.h>

namespace Nyth {
namespace Audio {
namespace iOS {

class IOSAudioFileWriter::Impl {
public:
    AudioFileID audioFile = nullptr;
    AVAssetWriter* assetWriter = nil;
    AVAssetWriterInput* writerInput = nil;
    AudioStreamBasicDescription audioFormat;
    std::string filePath;
    AudioFileFormat format;
    bool isOpen = false;
    size_t framesWritten = 0;
    
    ~Impl() {
        close();
    }
    
    void close() {
        if (audioFile) {
            AudioFileClose(audioFile);
            audioFile = nullptr;
        }
        
        if (assetWriter) {
            if (assetWriter.status == AVAssetWriterStatusWriting) {
                [writerInput markAsFinished];
                [assetWriter finishWritingWithCompletionHandler:^{}];
            }
            assetWriter = nil;
            writerInput = nil;
        }
        
        isOpen = false;
    }
};

IOSAudioFileWriter::IOSAudioFileWriter() : pImpl(std::make_unique<Impl>()) {}

IOSAudioFileWriter::~IOSAudioFileWriter() = default;

bool IOSAudioFileWriter::open(const AudioFileWriterConfig& config) {
    if (pImpl->isOpen) {
        return false;
    }
    
    pImpl->filePath = config.filePath;
    pImpl->format = config.format;
    
    // Configuration audio de base
    AudioStreamBasicDescription audioFormat = {0};
    audioFormat.mSampleRate = config.sampleRate;
    audioFormat.mChannelsPerFrame = config.channelCount;
    
    OSStatus status = noErr;
    
    switch (config.format) {
        case AudioFileFormat::ALAC:
            return openALAC(config, audioFormat);
            
        case AudioFileFormat::CAF:
            return openCAF(config, audioFormat);
            
        case AudioFileFormat::AMR:
            return openAMR(config, audioFormat);
            
        default:
            return false;  // Format non supporté sur iOS
    }
}

bool IOSAudioFileWriter::openALAC(const AudioFileWriterConfig& config, 
                                  AudioStreamBasicDescription& audioFormat) {
    // Configuration ALAC
    audioFormat.mFormatID = kAudioFormatAppleLossless;
    audioFormat.mFormatFlags = kAppleLosslessFormatFlag_16BitSourceData;
    audioFormat.mBitsPerChannel = config.bitsPerSample;
    audioFormat.mFramesPerPacket = 4096;
    audioFormat.mBytesPerFrame = 0;  // Variable pour ALAC
    audioFormat.mBytesPerPacket = 0; // Variable pour ALAC
    
    // Utiliser AVAssetWriter pour ALAC/M4A
    NSURL* outputURL = [NSURL fileURLWithPath:
        [NSString stringWithUTF8String:pImpl->filePath.c_str()]];
    
    NSError* error = nil;
    pImpl->assetWriter = [[AVAssetWriter alloc] 
        initWithURL:outputURL 
        fileType:AVFileTypeAppleM4A 
        error:&error];
    
    if (error) {
        return false;
    }
    
    // Configuration du writer input
    AudioChannelLayout channelLayout = {0};
    channelLayout.mChannelLayoutTag = (config.channelCount == 2) ? 
        kAudioChannelLayoutTag_Stereo : kAudioChannelLayoutTag_Mono;
    
    NSDictionary* outputSettings = @{
        AVFormatIDKey: @(kAudioFormatAppleLossless),
        AVSampleRateKey: @(config.sampleRate),
        AVNumberOfChannelsKey: @(config.channelCount),
        AVChannelLayoutKey: [NSData dataWithBytes:&channelLayout 
                                          length:sizeof(channelLayout)],
        AVEncoderBitDepthHintKey: @(config.bitsPerSample)
    };
    
    pImpl->writerInput = [AVAssetWriterInput 
        assetWriterInputWithMediaType:AVMediaTypeAudio 
        outputSettings:outputSettings];
    
    if (![pImpl->assetWriter canAddInput:pImpl->writerInput]) {
        return false;
    }
    
    [pImpl->assetWriter addInput:pImpl->writerInput];
    
    if (![pImpl->assetWriter startWriting]) {
        return false;
    }
    
    [pImpl->assetWriter startSessionAtSourceTime:kCMTimeZero];
    
    pImpl->audioFormat = audioFormat;
    pImpl->isOpen = true;
    return true;
}

bool IOSAudioFileWriter::openCAF(const AudioFileWriterConfig& config,
                                AudioStreamBasicDescription& audioFormat) {
    // Configuration CAF (supporte plusieurs formats internes)
    audioFormat.mFormatID = kAudioFormatLinearPCM;
    audioFormat.mFormatFlags = kAudioFormatFlagIsFloat | 
                              kAudioFormatFlagIsPacked;
    audioFormat.mBitsPerChannel = 32;  // Float 32-bit
    audioFormat.mFramesPerPacket = 1;
    audioFormat.mBytesPerFrame = audioFormat.mChannelsPerFrame * 4;
    audioFormat.mBytesPerPacket = audioFormat.mBytesPerFrame;
    
    // Créer le fichier CAF
    CFURLRef fileURL = CFURLCreateFromFileSystemRepresentation(
        kCFAllocatorDefault,
        (const UInt8*)pImpl->filePath.c_str(),
        pImpl->filePath.length(),
        false
    );
    
    OSStatus status = AudioFileCreateWithURL(
        fileURL,
        kAudioFileCAFType,
        &audioFormat,
        kAudioFileFlags_EraseFile,
        &pImpl->audioFile
    );
    
    CFRelease(fileURL);
    
    if (status != noErr) {
        return false;
    }
    
    pImpl->audioFormat = audioFormat;
    pImpl->isOpen = true;
    return true;
}

bool IOSAudioFileWriter::openAMR(const AudioFileWriterConfig& config,
                                AudioStreamBasicDescription& audioFormat) {
    // Configuration AMR (pour la voix)
    audioFormat.mFormatID = kAudioFormatAMR;
    audioFormat.mSampleRate = 8000;  // AMR-NB utilise toujours 8kHz
    audioFormat.mChannelsPerFrame = 1;  // Mono seulement
    audioFormat.mFramesPerPacket = 160;  // 20ms frames
    
    // Créer le fichier AMR
    CFURLRef fileURL = CFURLCreateFromFileSystemRepresentation(
        kCFAllocatorDefault,
        (const UInt8*)pImpl->filePath.c_str(),
        pImpl->filePath.length(),
        false
    );
    
    OSStatus status = AudioFileCreateWithURL(
        fileURL,
        kAudioFileAMRType,
        &audioFormat,
        kAudioFileFlags_EraseFile,
        &pImpl->audioFile
    );
    
    CFRelease(fileURL);
    
    if (status != noErr) {
        return false;
    }
    
    pImpl->audioFormat = audioFormat;
    pImpl->isOpen = true;
    return true;
}

bool IOSAudioFileWriter::write(const float* data, size_t frameCount) {
    if (!pImpl->isOpen) {
        return false;
    }
    
    if (pImpl->format == AudioFileFormat::ALAC) {
        return writeALAC(data, frameCount);
    } else if (pImpl->audioFile) {
        return writeWithAudioFile(data, frameCount);
    }
    
    return false;
}

bool IOSAudioFileWriter::writeALAC(const float* data, size_t frameCount) {
    if (!pImpl->writerInput.readyForMoreMediaData) {
        return false;
    }
    
    // Convertir float vers int16 pour ALAC
    std::vector<int16_t> intData(frameCount * pImpl->audioFormat.mChannelsPerFrame);
    for (size_t i = 0; i < intData.size(); ++i) {
        float sample = data[i];
        sample = std::max(-1.0f, std::min(1.0f, sample));
        intData[i] = static_cast<int16_t>(sample * 32767.0f);
    }
    
    // Créer CMSampleBuffer
    CMBlockBufferRef blockBuffer = nullptr;
    OSStatus status = CMBlockBufferCreateWithMemoryBlock(
        kCFAllocatorDefault,
        intData.data(),
        intData.size() * sizeof(int16_t),
        kCFAllocatorNull,
        nullptr,
        0,
        intData.size() * sizeof(int16_t),
        0,
        &blockBuffer
    );
    
    if (status != noErr) {
        return false;
    }
    
    CMSampleBufferRef sampleBuffer = nullptr;
    CMAudioFormatDescriptionRef formatDesc = nullptr;
    
    // Créer la description du format
    status = CMAudioFormatDescriptionCreate(
        kCFAllocatorDefault,
        &pImpl->audioFormat,
        0, nullptr,
        0, nullptr,
        nullptr,
        &formatDesc
    );
    
    if (status == noErr) {
        CMSampleTimingInfo timing = {
            CMTimeMake(frameCount, pImpl->audioFormat.mSampleRate),
            CMTimeMake(pImpl->framesWritten, pImpl->audioFormat.mSampleRate),
            kCMTimeInvalid
        };
        
        status = CMSampleBufferCreate(
            kCFAllocatorDefault,
            blockBuffer,
            true,
            nullptr, nullptr,
            formatDesc,
            frameCount,
            1, &timing,
            0, nullptr,
            &sampleBuffer
        );
    }
    
    bool success = false;
    if (status == noErr && sampleBuffer) {
        success = [pImpl->writerInput appendSampleBuffer:sampleBuffer];
        if (success) {
            pImpl->framesWritten += frameCount;
        }
    }
    
    if (formatDesc) CFRelease(formatDesc);
    if (sampleBuffer) CFRelease(sampleBuffer);
    if (blockBuffer) CFRelease(blockBuffer);
    
    return success;
}

bool IOSAudioFileWriter::writeWithAudioFile(const float* data, size_t frameCount) {
    UInt32 bytesToWrite = frameCount * pImpl->audioFormat.mBytesPerFrame;
    
    OSStatus status = AudioFileWriteBytes(
        pImpl->audioFile,
        false,  // Don't use cache
        pImpl->framesWritten * pImpl->audioFormat.mBytesPerFrame,
        &bytesToWrite,
        data
    );
    
    if (status == noErr) {
        pImpl->framesWritten += frameCount;
        return true;
    }
    
    return false;
}

void IOSAudioFileWriter::close() {
    pImpl->close();
}

size_t IOSAudioFileWriter::getFramesWritten() const {
    return pImpl->framesWritten;
}

bool IOSAudioFileWriter::isOpen() const {
    return pImpl->isOpen;
}

} // namespace iOS
} // namespace Audio
} // namespace Nyth

#endif // TARGET_OS_IOS
#endif // __APPLE__
