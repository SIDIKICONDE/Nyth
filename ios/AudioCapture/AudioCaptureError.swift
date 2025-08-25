//
//  AudioCaptureError.swift
//  AudioCapture
//
//  Définition des erreurs pour la capture audio
//

import Foundation

/// Erreurs possibles lors de la capture audio
public enum AudioCaptureError: LocalizedError {
    case microphonePermissionDenied
    case audioEngineNotInitialized
    case audioFormatNotSupported
    case sessionConfigurationFailed(Error)
    case engineStartFailed(Error)
    case bufferAllocationFailed
    case recordingAlreadyInProgress
    case noRecordingInProgress
    case invalidConfiguration(String)
    
    public var errorDescription: String? {
        switch self {
        case .microphonePermissionDenied:
            return "L'accès au microphone a été refusé. Veuillez autoriser l'accès dans les réglages."
        case .audioEngineNotInitialized:
            return "Le moteur audio n'est pas initialisé."
        case .audioFormatNotSupported:
            return "Le format audio n'est pas supporté."
        case .sessionConfigurationFailed(let error):
            return "Erreur lors de la configuration de la session audio: \(error.localizedDescription)"
        case .engineStartFailed(let error):
            return "Erreur lors du démarrage du moteur audio: \(error.localizedDescription)"
        case .bufferAllocationFailed:
            return "Impossible d'allouer le buffer audio."
        case .recordingAlreadyInProgress:
            return "Un enregistrement est déjà en cours."
        case .noRecordingInProgress:
            return "Aucun enregistrement n'est en cours."
        case .invalidConfiguration(let message):
            return "Configuration invalide: \(message)"
        }
    }
}