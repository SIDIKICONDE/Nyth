#pragma once

#include <functional>
#include <memory>
#include <string>

namespace facebook {
namespace react {

/**
 * @brief Gestionnaire de callbacks pour la communication JSI
 * 
 * Ce gestionnaire permet de notifier le côté JavaScript des événements
 * du système de réduction de bruit (statistiques, erreurs, etc.)
 */
class JSICallbackManager {
public:
    JSICallbackManager() = default;
    virtual ~JSICallbackManager() = default;
    
    // === Notifications vers JavaScript ===
    
    /**
     * @brief Notifie des statistiques de traitement
     * @param stats Chaîne JSON des statistiques
     */
    virtual void notifyStatistics(const std::string& stats) = 0;
    
    /**
     * @brief Notifie d'une erreur
     * @param error Message d'erreur
     */
    virtual void notifyError(const std::string& error) = 0;
    
    /**
     * @brief Notifie d'informations de traitement
     * @param info Informations de traitement
     */
    virtual void notifyProcessing(const std::string& info) = 0;
    
    /**
     * @brief Notifie d'un changement d'état
     * @param state Nouvel état du système
     */
    virtual void notifyStateChange(const std::string& state) = 0;
    
    // === Callbacks configurables ===
    
    /**
     * @brief Définit le callback pour les statistiques
     * @param callback Fonction de callback
     */
    virtual void setStatisticsCallback(std::function<void(const std::string&)> callback) = 0;
    
    /**
     * @brief Définit le callback pour les erreurs
     * @param callback Fonction de callback
     */
    virtual void setErrorCallback(std::function<void(const std::string&)> callback) = 0;
    
    /**
     * @brief Définit le callback pour le traitement
     * @param callback Fonction de callback
     */
    virtual void setProcessingCallback(std::function<void(const std::string&)> callback) = 0;
    
    /**
     * @brief Définit le callback pour les changements d'état
     * @param callback Fonction de callback
     */
    virtual void setStateChangeCallback(std::function<void(const std::string&)> callback) = 0;
    
    // === Gestion de l'état ===
    
    /**
     * @brief Vérifie si le gestionnaire est actif
     * @return true si actif, false sinon
     */
    virtual bool isActive() const = 0;
    
    /**
     * @brief Active le gestionnaire
     */
    virtual void activate() = 0;
    
    /**
     * @brief Désactive le gestionnaire
     */
    virtual void deactivate() = 0;
};

} // namespace react
} // namespace facebook

