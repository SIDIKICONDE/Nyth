//
//  AudioCaptureExample.swift
//  AudioCapture
//
//  Exemple d'utilisation du module de capture audio
//

import Foundation
import AVFoundation

/// Exemple d'utilisation simple du module AudioCapture
class AudioCaptureExample {
    
    private let audioManager = AudioCaptureManager.shared
    private var audioEngine: AudioCaptureEngine?
    
    /// Exemple 1 : Utilisation basique avec le manager singleton
    func basicUsageExample() {
        print("=== Exemple 1 : Utilisation basique ===")
        
        // 1. Vérifier les permissions
        if !audioManager.hasPermission() {
            print("Demande de permission...")
            audioManager.requestPermission { granted in
                if granted {
                    print("✅ Permission accordée")
                    self.startBasicRecording()
                } else {
                    print("❌ Permission refusée")
                }
            }
        } else {
            startBasicRecording()
        }
    }
    
    private func startBasicRecording() {
        do {
            // 2. Configuration simple
            try audioManager.configure(
                sampleRate: 44100,
                channels: 1,
                format: "float32"
            )
            
            // 3. Définir les callbacks
            audioManager.onAudioData = { data in
                print("📊 Données audio reçues: \(data.count) bytes")
            }
            
            audioManager.onStateChange = { state in
                print("🔄 Changement d'état: \(state)")
            }
            
            audioManager.onError = { code, message in
                print("❌ Erreur [\(code)]: \(message)")
            }
            
            audioManager.onAudioLevel = { level in
                let levelBar = String(repeating: "█", count: Int(level * 10))
                print("🎤 Niveau: \(levelBar)")
            }
            
            // 4. Démarrer l'enregistrement
            try audioManager.startRecording()
            print("🎙️ Enregistrement démarré")
            
            // 5. Arrêter après 5 secondes
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                self.audioManager.stopRecording()
                print("⏹️ Enregistrement arrêté")
            }
            
        } catch {
            print("❌ Erreur: \(error)")
        }
    }
    
    /// Exemple 2 : Utilisation avancée avec AudioCaptureEngine
    func advancedUsageExample() {
        print("\n=== Exemple 2 : Utilisation avancée ===")
        
        // 1. Créer une instance du moteur
        let engine = AudioCaptureEngine()
        self.audioEngine = engine
        
        // 2. Créer un delegate personnalisé
        let delegate = CustomAudioDelegate()
        engine.delegate = delegate
        
        // 3. Configuration avancée
        let config = AudioCaptureConfiguration()
        config.sampleRate = 48000
        config.channelCount = 2  // Stéréo
        config.format = .pcmInt16
        config.bufferSize = 2048
        config.enableLevelMeasurement = true
        config.levelUpdateInterval = 0.05  // 50ms
        
        do {
            try engine.configure(with: config)
            print("✅ Configuration appliquée:")
            print("   - Taux d'échantillonnage: \(config.sampleRate) Hz")
            print("   - Canaux: \(config.channelCount)")
            print("   - Format: PCM Int16")
            print("   - Taille du buffer: \(config.bufferSize)")
            
            // 4. Démarrer l'enregistrement
            try engine.startRecording()
            
        } catch {
            print("❌ Erreur: \(error)")
        }
    }
    
    /// Exemple 3 : Sauvegarde audio dans un fichier
    func recordToFileExample() {
        print("\n=== Exemple 3 : Enregistrement dans un fichier ===")
        
        let fileRecorder = AudioFileRecorder()
        
        do {
            // Configuration pour fichier WAV
            try audioManager.configure(
                sampleRate: 44100,
                channels: 1,
                format: "int16"  // WAV utilise généralement int16
            )
            
            // Préparer le fichier
            let documentsPath = FileManager.default.urls(for: .documentDirectory, 
                                                        in: .userDomainMask)[0]
            let audioURL = documentsPath.appendingPathComponent("recording.wav")
            
            try fileRecorder.prepareFile(at: audioURL, sampleRate: 44100, channels: 1)
            
            // Callback pour écrire dans le fichier
            audioManager.onAudioData = { data in
                fileRecorder.writeData(data)
            }
            
            // Démarrer l'enregistrement
            try audioManager.startRecording()
            print("🎙️ Enregistrement dans: \(audioURL.lastPathComponent)")
            
            // Arrêter et finaliser après 10 secondes
            DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
                self.audioManager.stopRecording()
                fileRecorder.finalizeFile()
                print("💾 Fichier sauvegardé: \(audioURL.path)")
            }
            
        } catch {
            print("❌ Erreur: \(error)")
        }
    }
    
    /// Exemple 4 : Streaming audio en temps réel
    func realtimeStreamingExample() {
        print("\n=== Exemple 4 : Streaming temps réel ===")
        
        do {
            // Configuration optimisée pour le streaming
            let config = AudioCaptureConfiguration()
            config.sampleRate = 16000  // Taux réduit pour le streaming
            config.channelCount = 1
            config.format = .pcmInt16
            config.bufferSize = 512  // Buffer plus petit pour la latence
            
            let engine = AudioCaptureEngine()
            engine.delegate = StreamingDelegate()
            
            try engine.configure(with: config)
            try engine.startRecording()
            
            print("📡 Streaming démarré...")
            print("   - Latence estimée: \(config.bufferSize / Int(config.sampleRate) * 1000)ms")
            
        } catch {
            print("❌ Erreur: \(error)")
        }
    }
}

// MARK: - Delegate personnalisé

class CustomAudioDelegate: NSObject, AudioCaptureDelegate {
    private var totalSamples = 0
    private var startTime = Date()
    
    func audioCapture(didReceiveAudioData data: Data) {
        totalSamples += data.count / MemoryLayout<Int16>.size
        let duration = Date().timeIntervalSince(startTime)
        print("📊 Échantillons: \(totalSamples), Durée: \(String(format: "%.1f", duration))s")
    }
    
    func audioCaptureDidStart() {
        print("✅ Capture démarrée")
        startTime = Date()
    }
    
    func audioCaptureDidStop() {
        print("⏹️ Capture arrêtée")
        let duration = Date().timeIntervalSince(startTime)
        print("📊 Durée totale: \(String(format: "%.1f", duration))s")
    }
    
    func audioCapture(didFailWithError error: Error) {
        print("❌ Erreur: \(error)")
    }
    
    func audioCapture(didUpdateAudioLevel level: Float) {
        // Affichage visuel du niveau
        let bars = Int(level * 20)
        let levelDisplay = String(repeating: "▪", count: bars) + 
                          String(repeating: "▫", count: 20 - bars)
        print("🎤 [\(levelDisplay)] \(String(format: "%.1f%%", level * 100))")
    }
}

// MARK: - Helpers

/// Helper pour enregistrer dans un fichier WAV
class AudioFileRecorder {
    private var fileHandle: FileHandle?
    private var totalDataSize: Int = 0
    
    func prepareFile(at url: URL, sampleRate: Int, channels: Int) throws {
        // Créer le fichier avec l'en-tête WAV
        let header = createWAVHeader(sampleRate: sampleRate, channels: channels)
        try header.write(to: url)
        
        // Ouvrir pour l'écriture
        fileHandle = try FileHandle(forWritingTo: url)
        fileHandle?.seekToEndOfFile()
    }
    
    func writeData(_ data: Data) {
        fileHandle?.write(data)
        totalDataSize += data.count
    }
    
    func finalizeFile() {
        guard let handle = fileHandle else { return }
        
        // Mettre à jour la taille dans l'en-tête WAV
        handle.seek(toFileOffset: 4)
        var fileSize = Int32(totalDataSize + 44 - 8)
        handle.write(Data(bytes: &fileSize, count: 4))
        
        handle.seek(toFileOffset: 40)
        var dataSize = Int32(totalDataSize)
        handle.write(Data(bytes: &dataSize, count: 4))
        
        handle.closeFile()
        fileHandle = nil
    }
    
    private func createWAVHeader(sampleRate: Int, channels: Int) -> Data {
        var header = Data()
        
        // RIFF header
        header.append("RIFF".data(using: .ascii)!)
        header.append(Data(count: 4)) // Taille du fichier (à mettre à jour plus tard)
        header.append("WAVE".data(using: .ascii)!)
        
        // Format chunk
        header.append("fmt ".data(using: .ascii)!)
        var chunkSize: Int32 = 16
        header.append(Data(bytes: &chunkSize, count: 4))
        var audioFormat: Int16 = 1 // PCM
        header.append(Data(bytes: &audioFormat, count: 2))
        var channelCount: Int16 = Int16(channels)
        header.append(Data(bytes: &channelCount, count: 2))
        var sampleRateValue: Int32 = Int32(sampleRate)
        header.append(Data(bytes: &sampleRateValue, count: 4))
        var byteRate: Int32 = Int32(sampleRate * channels * 2)
        header.append(Data(bytes: &byteRate, count: 4))
        var blockAlign: Int16 = Int16(channels * 2)
        header.append(Data(bytes: &blockAlign, count: 2))
        var bitsPerSample: Int16 = 16
        header.append(Data(bytes: &bitsPerSample, count: 2))
        
        // Data chunk
        header.append("data".data(using: .ascii)!)
        header.append(Data(count: 4)) // Taille des données (à mettre à jour plus tard)
        
        return header
    }
}

/// Delegate pour le streaming
class StreamingDelegate: NSObject, AudioCaptureDelegate {
    private let chunkSize = 1024  // Taille des chunks pour le streaming
    private var buffer = Data()
    
    func audioCapture(didReceiveAudioData data: Data) {
        buffer.append(data)
        
        // Envoyer par chunks
        while buffer.count >= chunkSize {
            let chunk = buffer.prefix(chunkSize)
            sendChunkToServer(chunk)
            buffer.removeFirst(chunkSize)
        }
    }
    
    func audioCaptureDidStart() {
        print("📡 Streaming démarré")
    }
    
    func audioCaptureDidStop() {
        // Envoyer le dernier chunk s'il reste des données
        if !buffer.isEmpty {
            sendChunkToServer(buffer)
            buffer.removeAll()
        }
        print("📡 Streaming arrêté")
    }
    
    func audioCapture(didFailWithError error: Error) {
        print("❌ Erreur streaming: \(error)")
    }
    
    private func sendChunkToServer(_ chunk: Data) {
        // Simuler l'envoi au serveur
        print("📤 Envoi chunk: \(chunk.count) bytes")
        // Ici, vous implémenteriez l'envoi réel via WebSocket, HTTP, etc.
    }
}