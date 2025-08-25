import Foundation
import AVFoundation

enum PCMConverter {
    static func interleavedBytes(from buffer: AVAudioPCMBuffer, targetChannels: Int, as format: AudioSampleFormat) -> Data {
        precondition(targetChannels >= 1)

        let srcFormat = buffer.format.commonFormat
        let frameCount = Int(buffer.frameLength)
        let srcChannels = Int(buffer.format.channelCount)
        let outChannels = targetChannels

        let bytesPerSample = format.bytesPerSample
        var out = Data(count: frameCount * outChannels * bytesPerSample)

        switch (srcFormat, format) {
        case (.pcmFormatFloat32, .float32):
            out.withUnsafeMutableBytes { rawBuf in
                let outPtr = rawBuf.bindMemory(to: Float.self)
                writeInterleavedFloatFromFloat(buffer: buffer, srcChannels: srcChannels, outChannels: outChannels, frameCount: frameCount, out: outPtr)
            }
        case (.pcmFormatFloat32, .int16):
            out.withUnsafeMutableBytes { rawBuf in
                let outPtr = rawBuf.bindMemory(to: Int16.self)
                writeInterleavedInt16FromFloat(buffer: buffer, srcChannels: srcChannels, outChannels: outChannels, frameCount: frameCount, out: outPtr)
            }
        case (.pcmFormatInt16, .int16):
            out.withUnsafeMutableBytes { rawBuf in
                let outPtr = rawBuf.bindMemory(to: Int16.self)
                writeInterleavedInt16FromInt16(buffer: buffer, srcChannels: srcChannels, outChannels: outChannels, frameCount: frameCount, out: outPtr)
            }
        case (.pcmFormatInt16, .float32):
            out.withUnsafeMutableBytes { rawBuf in
                let outPtr = rawBuf.bindMemory(to: Float.self)
                writeInterleavedFloatFromInt16(buffer: buffer, srcChannels: srcChannels, outChannels: outChannels, frameCount: frameCount, out: outPtr)
            }
        default:
            // Fallback: attempt treating as float32
            out.withUnsafeMutableBytes { rawBuf in
                let outPtr = rawBuf.bindMemory(to: Float.self)
                writeInterleavedFloatFromFloat(buffer: buffer, srcChannels: srcChannels, outChannels: outChannels, frameCount: frameCount, out: outPtr)
            }
        }
        return out
    }

    private static func writeInterleavedFloatFromFloat(
        buffer: AVAudioPCMBuffer,
        srcChannels: Int,
        outChannels: Int,
        frameCount: Int,
        out: UnsafeMutableBufferPointer<Float>
    ) {
        guard let src = buffer.floatChannelData else { return }
        for frame in 0..<frameCount {
            for ch in 0..<outChannels {
                let srcChannelIndex = ch < srcChannels ? ch : (srcChannels - 1)
                out[frame * outChannels + ch] = src[srcChannelIndex][frame]
            }
        }
    }

    private static func writeInterleavedInt16FromFloat(
        buffer: AVAudioPCMBuffer,
        srcChannels: Int,
        outChannels: Int,
        frameCount: Int,
        out: UnsafeMutableBufferPointer<Int16>
    ) {
        guard let src = buffer.floatChannelData else { return }
        for frame in 0..<frameCount {
            for ch in 0..<outChannels {
                let srcChannelIndex = ch < srcChannels ? ch : (srcChannels - 1)
                var sample = src[srcChannelIndex][frame]
                if sample > 1.0 { sample = 1.0 }
                if sample < -1.0 { sample = -1.0 }
                let intSample = Int16(sample * Float(32767))
                out[frame * outChannels + ch] = intSample
            }
        }
    }

    private static func writeInterleavedInt16FromInt16(
        buffer: AVAudioPCMBuffer,
        srcChannels: Int,
        outChannels: Int,
        frameCount: Int,
        out: UnsafeMutableBufferPointer<Int16>
    ) {
        guard let src = buffer.int16ChannelData else { return }
        for frame in 0..<frameCount {
            for ch in 0..<outChannels {
                let srcChannelIndex = ch < srcChannels ? ch : (srcChannels - 1)
                out[frame * outChannels + ch] = src[srcChannelIndex][frame]
            }
        }
    }

    private static func writeInterleavedFloatFromInt16(
        buffer: AVAudioPCMBuffer,
        srcChannels: Int,
        outChannels: Int,
        frameCount: Int,
        out: UnsafeMutableBufferPointer<Float>
    ) {
        guard let src = buffer.int16ChannelData else { return }
        let scale: Float = 1.0 / 32768.0
        for frame in 0..<frameCount {
            for ch in 0..<outChannels {
                let srcChannelIndex = ch < srcChannels ? ch : (srcChannels - 1)
                let intSample = src[srcChannelIndex][frame]
                out[frame * outChannels + ch] = Float(intSample) * scale
            }
        }
    }
}

