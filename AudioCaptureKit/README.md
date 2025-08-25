## AudioCaptureKit

Lightweight, standalone iOS audio capture module written in Swift. Uses the public AVAudioSession API and AVAudioEngine to capture microphone audio, with a JSI-ready byte callback for future TurboModule integration. No third-party dependencies.

### Features
- AVAudioSession permission + configuration
- AVAudioEngine-based mic capture
- Delegate callbacks with `AVAudioPCMBuffer`
- Zero-copy style byte callback (interleaved Int16 or Float32)
- Optional WAV file writing
- Handles interruptions and route changes

### Minimums
- iOS 13+
- Swift 5.7+

### Installation (Swift Package Manager)
Add to your Package dependencies:

```
.package(path: "../AudioCaptureKit")
```

Then add `AudioCaptureKit` to your target dependencies.

### Quick Start
```swift
import AudioCaptureKit

let capture = AudioCapture()

let config = AudioCaptureConfig(
    sampleRate: 48000,
    channelCount: 1,
    framesPerBuffer: 480, // 10ms @ 48kHz
    sampleFormat: .int16,
    interleaved: true,
    outputURL: nil,
    allowsBluetooth: true,
    usesSpeaker: false
)

capture.start(config: config, byteHandler: { bytes, length, tsNs in
    // Send bytes to your JSI bridge or native consumer
}) { result in
    switch result {
    case .success:
        print("Capture started")
    case .failure(let error):
        print("Failed: \(error)")
    }
}

// ... later
capture.stop()
```

### TurboModule / JSI Integration Notes
- The `ByteChunkHandler` signature is compatible with bridging to a JSI host function.
- Prefer `.int16` interleaved for minimal conversion overhead across the bridge.
- The timestamp provided is in nanoseconds, derived from CoreAudio host time.

### License
MIT

