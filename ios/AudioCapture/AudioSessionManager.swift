//
//  AudioSessionManager.swift
//  AudioCapture
//
//  Gestionnaire pour AVAudioSession
//  Centralise la configuration et la gestion de la session audio
//

import AVFoundation

/// Gestionnaire pour la session audio iOS
public class AudioSessionManager {
    
    /// Instance singleton
    public static let shared = AudioSessionManager()
    
    /// La session audio
    private let audioSession = AVAudioSession.sharedInstance()
    
    /// Empêche l'initialisation externe
    private init() {}
    
    /// Configure la session audio pour l'enregistrement
    /// - Parameters:
    ///   - sampleRate: Le taux d'échantillonnage souhaité
    ///   - bufferDuration: La durée du buffer en secondes
    /// - Throws: Une erreur si la configuration échoue
    public func configureForRecording(sampleRate: Double, bufferDuration: TimeInterval) throws {
        do {
            // Configure la catégorie pour l'enregistrement
            try audioSession.setCategory(.playAndRecord, options: [.defaultToSpeaker, .allowBluetooth])
            
            // Configure le taux d'échantillonnage
            try audioSession.setPreferredSampleRate(sampleRate)
            
            // Configure la durée du buffer
            try audioSession.setPreferredIOBufferDuration(bufferDuration)
            
            // Active la session
            try audioSession.setActive(true)
            
        } catch {
            throw AudioCaptureError.sessionConfigurationFailed(error)
        }
    }
    
    /// Désactive la session audio
    /// - Throws: Une erreur si la désactivation échoue
    public func deactivateSession() throws {
        try audioSession.setActive(false)
    }
    
    /// Observe les interruptions audio (appels, alarmes, etc.)
    /// - Parameter handler: Le gestionnaire d'interruption
    public func observeInterruptions(handler: @escaping (AVAudioSession.InterruptionType) -> Void) {
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: audioSession,
            queue: .main
        ) { notification in
            guard let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
                return
            }
            handler(type)
        }
    }
    
    /// Observe les changements de route audio (branchement/débranchement écouteurs, etc.)
    /// - Parameter handler: Le gestionnaire de changement de route
    public func observeRouteChanges(handler: @escaping (AVAudioSession.RouteChangeReason) -> Void) {
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: audioSession,
            queue: .main
        ) { notification in
            guard let reasonValue = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
                return
            }
            handler(reason)
        }
    }
    
    /// Supprime tous les observateurs
    public func removeAllObservers() {
        NotificationCenter.default.removeObserver(self)
    }
}