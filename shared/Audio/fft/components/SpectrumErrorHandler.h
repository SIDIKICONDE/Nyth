#pragma once

#include <functional>
#include <memory>
#include <shared/Audio/fft/config/SpectrumConfig.h>

namespace Nyth {
namespace Audio {

// === Système de gestion d'erreurs centralisée ===

class SpectrumErrorHandler {
public:
    // === Types de callbacks d'erreur ===

    using ErrorCallback =
        std::function<void(SpectrumError error, const std::string& message, const std::string& component)>;
    using WarningCallback = std::function<void(const std::string& message, const std::string& component)>;
    using RecoveryCallback = std::function<bool(SpectrumError error, const std::string& component)>;

    // === Constructeur et destructeur ===

    SpectrumErrorHandler();
    ~SpectrumErrorHandler() = default;

    // === Configuration ===

    /**
     * @brief Configure le gestionnaire d'erreurs
     * @param enableRecovery Active la récupération automatique
     * @param maxRetries Nombre maximum de tentatives de récupération
     */
    void configure(bool enableRecovery = true, size_t maxRetries = 3);

    // === Enregistrement des callbacks ===

    /**
     * @brief Enregistre un callback pour les erreurs
     * @param callback Fonction appelée lors d'une erreur
     */
    void setErrorCallback(ErrorCallback callback);

    /**
     * @brief Enregistre un callback pour les avertissements
     * @param callback Fonction appelée lors d'un avertissement
     */
    void setWarningCallback(WarningCallback callback);

    /**
     * @brief Enregistre un callback de récupération
     * @param callback Fonction appelée pour tenter une récupération
     */
    void setRecoveryCallback(RecoveryCallback callback);

    // === Gestion des erreurs ===

    /**
     * @brief Gère une erreur dans un composant
     * @param error Code d'erreur
     * @param message Message d'erreur
     * @param component Nom du composant
     * @param recoverable Indique si l'erreur est récupérable
     */
    void handleError(SpectrumError error, const std::string& message, const std::string& component,
                     bool recoverable = true);

    /**
     * @brief Émet un avertissement
     * @param message Message d'avertissement
     * @param component Nom du composant
     */
    void handleWarning(const std::string& message, const std::string& component);

    // === Récupération automatique ===

    /**
     * @brief Tente de récupérer d'une erreur
     * @param error Code d'erreur
     * @param component Nom du composant
     * @return true si la récupération a réussi
     */
    bool attemptRecovery(SpectrumError error, const std::string& component);

    // === Statistiques ===

    /**
     * @brief Obtient les statistiques d'erreur
     * @return Structure contenant les statistiques
     */
    struct ErrorStatistics {
        size_t totalErrors = 0;
        size_t recoveredErrors = 0;
        size_t unrecoverableErrors = 0;
        size_t totalWarnings = 0;
        double lastErrorTime = 0.0;
        std::string lastErrorComponent;
    };

    const ErrorStatistics& getStatistics() const;
    void resetStatistics();

    // === Utilitaires ===

    /**
     * @brief Vérifie si une erreur est critique
     * @param error Code d'erreur à vérifier
     * @return true si l'erreur est critique
     */
    static bool isCriticalError(SpectrumError error);

    /**
     * @brief Obtient la sévérité d'une erreur
     * @param error Code d'erreur
     * @return Niveau de sévérité (0-100)
     */
    static int getErrorSeverity(SpectrumError error);

private:
    // === Membres privés ===

    struct ErrorContext {
        SpectrumError error;
        std::string message;
        std::string component;
        bool recoverable;
        double timestamp;
        size_t retryCount;
    };

    // Configuration
    bool recoveryEnabled_;
    size_t maxRetries_;

    // Callbacks
    ErrorCallback errorCallback_;
    WarningCallback warningCallback_;
    RecoveryCallback recoveryCallback_;

    // Statistiques
    ErrorStatistics statistics_;

    // Contexte d'erreur actuel
    ErrorContext lastError_;

    // === Méthodes privées ===

    /**
     * @brief Met à jour les statistiques d'erreur
     * @param error Erreur à enregistrer
     * @param recovered Indique si l'erreur a été récupérée
     */
    void updateStatistics(SpectrumError error, bool recovered);

    /**
     * @brief Exécute le callback d'erreur si configuré
     * @param context Contexte de l'erreur
     */
    void invokeErrorCallback(const ErrorContext& context);

    /**
     * @brief Exécute le callback d'avertissement si configuré
     * @param message Message d'avertissement
     * @param component Composant source
     */
    void invokeWarningCallback(const std::string& message, const std::string& component);

    /**
     * @brief Tente une récupération automatique
     * @param context Contexte de l'erreur
     * @return true si la récupération a réussi
     */
    bool performRecovery(const ErrorContext& context);
};

// === Classe utilitaire pour la gestion d'erreurs avec RAII ===

class ErrorHandlerGuard {
public:
    /**
     * @brief Constructeur qui enregistre une opération
     * @param handler Gestionnaire d'erreurs
     * @param operation Nom de l'opération
     * @param component Nom du composant
     */
    ErrorHandlerGuard(std::shared_ptr<SpectrumErrorHandler> handler, const std::string& operation,
                      const std::string& component);

    /**
     * @brief Destructeur qui signale la fin de l'opération
     */
    ~ErrorHandlerGuard();

    /**
     * @brief Signale une erreur pendant l'opération
     * @param error Code d'erreur
     * @param message Message d'erreur
     */
    void reportError(SpectrumError error, const std::string& message);

    /**
     * @brief Signale le succès de l'opération
     */
    void reportSuccess();

private:
    std::shared_ptr<SpectrumErrorHandler> handler_;
    std::string operation_;
    std::string component_;
    bool success_;
    bool errorReported_;
};

} // namespace Audio
} // namespace Nyth
