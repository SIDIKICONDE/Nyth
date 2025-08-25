import Foundation

public enum AudioSampleFormat: Equatable {
    case float32
    case int16

    public var bytesPerSample: Int {
        switch self {
        case .float32: return 4
        case .int16: return 2
        }
    }
}

public struct AudioCaptureConfig: Equatable {
    public var sampleRate: Double
    public var channelCount: UInt32
    public var framesPerBuffer: UInt32?
    public var sampleFormat: AudioSampleFormat
    public var interleaved: Bool
    public var outputURL: URL?
    public var allowsBluetooth: Bool
    public var usesSpeaker: Bool
    public var categoryPlayAndRecord: Bool

    public init(
        sampleRate: Double = 48000,
        channelCount: UInt32 = 1,
        framesPerBuffer: UInt32? = 480,
        sampleFormat: AudioSampleFormat = .int16,
        interleaved: Bool = true,
        outputURL: URL? = nil,
        allowsBluetooth: Bool = true,
        usesSpeaker: Bool = false,
        categoryPlayAndRecord: Bool = true
    ) {
        self.sampleRate = sampleRate
        self.channelCount = channelCount
        self.framesPerBuffer = framesPerBuffer
        self.sampleFormat = sampleFormat
        self.interleaved = interleaved
        self.outputURL = outputURL
        self.allowsBluetooth = allowsBluetooth
        self.usesSpeaker = usesSpeaker
        self.categoryPlayAndRecord = categoryPlayAndRecord
    }
}

