//
//  AudioCaptureProtocol.swift
//  AudioCapture
//
//  Protocol définissant l'interface pour la capture audio
//  Conçu pour faciliter l'intégration future avec TurboModule JSI
//

import Foundation
import AVFoundation

/// Protocole définissant les callbacks pour la capture audio
@objc public protocol AudioCaptureDelegate: AnyObject {
    /// Appelé lorsque de nouvelles données audio sont disponibles
    /// - Parameter data: Les données audio au format PCM
    func audioCapture(didReceiveAudioData data: Data)
    
    /// Appelé lorsque l'enregistrement démarre avec succès
    func audioCaptureDidStart()
    
    /// Appelé lorsque l'enregistrement s'arrête
    func audioCaptureDidStop()
    
    /// Appelé en cas d'erreur
    /// - Parameter error: L'erreur qui s'est produite
    func audioCapture(didFailWithError error: Error)
    
    /// Appelé pour fournir le niveau audio en temps réel
    /// - Parameter level: Le niveau audio normalisé (0.0 - 1.0)
    @objc optional func audioCapture(didUpdateAudioLevel level: Float)
}

/// Énumération des formats audio supportés
@objc public enum AudioFormat: Int {
    case pcmFloat32 = 0
    case pcmInt16 = 1
    case pcmInt32 = 2
}

/// Configuration pour la capture audio
@objc public class AudioCaptureConfiguration: NSObject {
    /// Taux d'échantillonnage en Hz
    @objc public var sampleRate: Double = 44100.0
    
    /// Nombre de canaux (1 = mono, 2 = stéréo)
    @objc public var channelCount: Int = 1
    
    /// Format audio
    @objc public var format: AudioFormat = .pcmFloat32
    
    /// Taille du buffer en échantillons
    @objc public var bufferSize: Int = 1024
    
    /// Active ou désactive la mesure du niveau audio
    @objc public var enableLevelMeasurement: Bool = true
    
    /// Intervalle de mise à jour du niveau audio en secondes
    @objc public var levelUpdateInterval: TimeInterval = 0.1
    
    @objc public override init() {
        super.init()
    }
}

/// Protocole principal pour la capture audio
@objc public protocol AudioCaptureProtocol: AnyObject {
    /// Le delegate pour recevoir les callbacks
    var delegate: AudioCaptureDelegate? { get set }
    
    /// Configuration actuelle
    var configuration: AudioCaptureConfiguration { get }
    
    /// Indique si l'enregistrement est en cours
    var isRecording: Bool { get }
    
    /// Configure la capture audio
    /// - Parameter configuration: La configuration à appliquer
    /// - Throws: Une erreur si la configuration échoue
    func configure(with configuration: AudioCaptureConfiguration) throws
    
    /// Démarre l'enregistrement
    /// - Throws: Une erreur si le démarrage échoue
    func startRecording() throws
    
    /// Arrête l'enregistrement
    func stopRecording()
    
    /// Demande l'autorisation d'accès au microphone
    /// - Parameter completion: Callback avec le résultat de la demande
    func requestMicrophonePermission(completion: @escaping (Bool) -> Void)
    
    /// Vérifie si l'autorisation du microphone est accordée
    /// - Returns: true si l'autorisation est accordée
    func isMicrophonePermissionGranted() -> Bool
}