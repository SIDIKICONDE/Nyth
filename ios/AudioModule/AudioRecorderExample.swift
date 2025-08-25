import UIKit
import AVFoundation

/// Exemple d'utilisation du module AudioRecorder
/// Cette classe montre comment intégrer et utiliser AudioRecorder dans une application iOS
class AudioRecorderExample: UIViewController {
    
    // MARK: - Properties
    
    private let audioRecorder = AudioRecorder()
    private var recordButton: UIButton!
    private var pauseButton: UIButton!
    private var statusLabel: UILabel!
    private var levelMeter: UIProgressView!
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupUI()
        setupAudioRecorder()
    }
    
    // MARK: - Setup
    
    private func setupAudioRecorder() {
        // Configure le delegate
        audioRecorder.delegate = self
        
        // Configure la session audio
        do {
            try audioRecorder.configureAudioSession()
        } catch {
            showAlert(title: "Erreur", message: "Impossible de configurer la session audio: \(error.localizedDescription)")
        }
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Bouton d'enregistrement
        recordButton = UIButton(type: .system)
        recordButton.setTitle("Démarrer l'enregistrement", for: .normal)
        recordButton.setTitle("Arrêter l'enregistrement", for: .selected)
        recordButton.addTarget(self, action: #selector(recordButtonTapped), for: .touchUpInside)
        
        // Bouton pause
        pauseButton = UIButton(type: .system)
        pauseButton.setTitle("Pause", for: .normal)
        pauseButton.setTitle("Reprendre", for: .selected)
        pauseButton.addTarget(self, action: #selector(pauseButtonTapped), for: .touchUpInside)
        pauseButton.isEnabled = false
        
        // Label de statut
        statusLabel = UILabel()
        statusLabel.text = "Prêt à enregistrer"
        statusLabel.textAlignment = .center
        
        // Indicateur de niveau
        levelMeter = UIProgressView(progressViewStyle: .default)
        levelMeter.progress = 0
        
        // Layout
        let stackView = UIStackView(arrangedSubviews: [statusLabel, levelMeter, recordButton, pauseButton])
        stackView.axis = .vertical
        stackView.spacing = 20
        stackView.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40)
        ])
    }
    
    // MARK: - Actions
    
    @objc private func recordButtonTapped() {
        if audioRecorder.isRecording {
            // Arrêter l'enregistrement
            audioRecorder.stopRecording()
            recordButton.isSelected = false
            pauseButton.isEnabled = false
            pauseButton.isSelected = false
        } else {
            // Demander les permissions et démarrer
            audioRecorder.requestMicrophonePermission { [weak self] granted in
                guard granted else {
                    self?.showAlert(title: "Permission refusée", 
                                  message: "L'accès au microphone est requis pour enregistrer")
                    return
                }
                
                // Démarrer l'enregistrement
                do {
                    try self?.audioRecorder.startRecording()
                    self?.recordButton.isSelected = true
                    self?.pauseButton.isEnabled = true
                } catch {
                    self?.showAlert(title: "Erreur", 
                                  message: "Impossible de démarrer l'enregistrement: \(error.localizedDescription)")
                }
            }
        }
    }
    
    @objc private func pauseButtonTapped() {
        if audioRecorder.isPaused {
            // Reprendre
            do {
                try audioRecorder.resumeRecording()
                pauseButton.isSelected = false
            } catch {
                showAlert(title: "Erreur", 
                         message: "Impossible de reprendre l'enregistrement: \(error.localizedDescription)")
            }
        } else {
            // Pause
            audioRecorder.pauseRecording()
            pauseButton.isSelected = true
        }
    }
    
    // MARK: - Helpers
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    private func updateStatus(_ text: String) {
        DispatchQueue.main.async {
            self.statusLabel.text = text
        }
    }
}

// MARK: - AudioRecorderDelegate

extension AudioRecorderExample: AudioRecorderDelegate {
    
    func audioRecorderDidConfigureSession(_ recorder: AudioRecorder) {
        updateStatus("Session audio configurée")
    }
    
    func audioRecorderDidStartRecording(_ recorder: AudioRecorder) {
        updateStatus("Enregistrement en cours...")
    }
    
    func audioRecorderDidPauseRecording(_ recorder: AudioRecorder) {
        updateStatus("Enregistrement en pause")
    }
    
    func audioRecorderDidResumeRecording(_ recorder: AudioRecorder) {
        updateStatus("Enregistrement repris")
    }
    
    func audioRecorder(_ recorder: AudioRecorder, didFinishRecordingToURL url: URL) {
        updateStatus("Enregistrement terminé")
        
        // Affiche les informations du fichier
        do {
            let audioFile = try AVAudioFile(forReading: url)
            let duration = Double(audioFile.length) / audioFile.fileFormat.sampleRate
            
            showAlert(title: "Enregistrement terminé", 
                     message: "Fichier sauvegardé: \(url.lastPathComponent)\nDurée: \(String(format: "%.2f", duration)) secondes")
        } catch {
            showAlert(title: "Enregistrement terminé", 
                     message: "Fichier sauvegardé: \(url.lastPathComponent)")
        }
        
        // Réinitialise le niveau
        levelMeter.progress = 0
    }
    
    func audioRecorder(_ recorder: AudioRecorder, didUpdateAudioLevel level: Float) {
        // Convertit le niveau en décibels en valeur 0-1 pour l'affichage
        // -160 dB = silence, 0 dB = niveau max
        let normalizedLevel = (level + 160) / 160
        
        DispatchQueue.main.async {
            self.levelMeter.setProgress(normalizedLevel, animated: true)
        }
    }
    
    func audioRecorder(_ recorder: AudioRecorder, didFailWithError error: AudioRecorderError) {
        updateStatus("Erreur: \(error.localizedDescription)")
        
        // Réinitialise l'UI en cas d'erreur
        recordButton.isSelected = false
        pauseButton.isEnabled = false
        pauseButton.isSelected = false
        levelMeter.progress = 0
    }
}

// MARK: - Integration Example for TurboModule

/// Exemple d'intégration pour un TurboModule React Native
class AudioRecorderTurboModuleExample {
    
    private let audioRecorder = AudioRecorder()
    
    func exampleUsage() {
        // Exemple 1: Démarrer l'enregistrement avec options
        let options: [String: Any] = [
            "fileName": "my-recording.m4a",
            "sampleRate": 44100.0,
            "channels": 1,
            "quality": "high"
        ]
        
        audioRecorder.startRecordingWithOptions(options, 
            resolver: { result in
                print("Enregistrement démarré: \(result ?? [:])")
            },
            rejecter: { code, message, error in
                print("Erreur: \(code ?? "") - \(message ?? "")")
            }
        )
        
        // Exemple 2: Obtenir le statut
        let status = audioRecorder.getRecordingStatus()
        print("Statut actuel: \(status)")
        
        // Exemple 3: Configuration avancée
        let audioOptions: [String: Any] = [
            "category": "playAndRecord",
            "mode": "voiceChat",
            "sampleRate": 48000.0,
            "ioBufferDuration": 0.005
        ]
        
        audioRecorder.configureAudioOptions(audioOptions,
            resolver: { _ in
                print("Configuration audio appliquée")
            },
            rejecter: { _, message, _ in
                print("Erreur de configuration: \(message ?? "")")
            }
        )
    }
}