Nyth Audio Capture (C++17)

- Interface: `Audio/capture/AudioCapture.hpp`
- Implementations: `Audio/capture/AudioCaptureImpl.hpp` (ALSA if available, else a sine-wave dummy)
- Utilities: `Audio/capture/AudioCaptureUtils*.hpp`
- WAV writer: `Audio/capture/AudioFileWriter*.hpp`
- Example: `Audio/capture/examples/audio_recorder_example.cpp`

Build example (standalone):

```bash
cd shared/Audio/capture
cmake -S . -B build
cmake --build build -j
./build/audio_recorder_example
```

If `libasound2-dev` (ALSA) is installed, native microphone capture is used. Otherwise, a 440 Hz tone is recorded for 5 seconds to `output.wav`.