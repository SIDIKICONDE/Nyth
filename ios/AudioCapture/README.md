## AudioCapture (iOS)

Lightweight iOS audio capture module implemented with AVAudioSession and AVAudioEngine. Designed to be embedded in native apps and to be easily wrapped by a future React Native TurboModule.

### Requirements

- iOS 13+
- Swift 5.9+

### Info.plist

Add the microphone usage key to your app target:

```
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record audio.</string>
```

### Installation (Swift Package Manager)

1. Add the package to your iOS project: File > Add Packages...
2. Use the local path or your repository URL containing `ios/AudioCapture`.
3. Link the `AudioCapture` product to your app target.

### Usage (Swift)

```swift
import AudioCapture

final class Recorder: AudioCaptureDelegate {
    private let capture = AudioCapture()

    init() { capture.delegate = self }

    func start() {
        let config = AudioCaptureConfig(
            category: .playAndRecord,
            mode: .default,
            options: [.defaultToSpeaker, .allowBluetooth],
            preferredSampleRate: 44100,
            preferredIOBufferDuration: 0.01,
            channelCount: 1,
            writeToFile: true,
            fileFormat: .m4aAAC
        )

        capture.start(config: config, outputFileURL: nil) { result in
            switch result {
            case .success(let url):
                print("Recording started. File: \(url?.path ?? "temp file")")
            case .failure(let error):
                print("Start failed: \(error)")
            }
        }
    }

    func stop() { capture.stop() }

    // MARK: AudioCaptureDelegate (optional)
    func audioCapture(_ capture: AudioCapture, didCapture buffer: AVAudioPCMBuffer, at time: AVAudioTime) {}
    func audioCapture(_ capture: AudioCapture, didFinishRecordingTo fileURL: URL) { print("Saved to", fileURL) }
    func audioCapture(_ capture: AudioCapture, didFail error: Error) { print("Error:", error) }
}
```

### Usage (Objective-C friendly facade)

```swift
let oc = ObjCAudioCapture()
oc.startWithOptions([
  "sampleRate": 44100.0,
  "channels": 1,
  "writeToFile": true,
  "fileFormat": "m4a", // "caf" | "wav" | "m4a"
  "outputPath": /* optional absolute file path string */
]) { ok, error in
  print("start:", ok, error as Any)
}
// later
oc.stop()
```

### TurboModule integration (future)

- Wrap `ObjCAudioCapture` inside a TurboModule.
- Expose start/stop methods and events for state changes.
- Use a background queue for bridging callbacks to avoid blocking JS thread.

### Notes

- `AVAudioSession` is used for category/mode and session lifecycle.
- The engine installs a tap on the input node; audio is optionally written to file (CAF/WAV PCM16 or M4A AAC).
- Interruption notifications are handled and delivered to the delegate; simple resume is attempted when possible.

