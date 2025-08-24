#pragma once

#include <memory>
#include <string>
#include <vector>


// Include des types communs
#include "../../common/FilterTypes.hpp"

namespace Camera {

/**
 * Interface commune pour tous les processeurs de filtres vidéo
 * Cette interface définit le contrat que doivent respecter toutes les
 * implémentations spécifiques aux plateformes (iOS, Android, Desktop)
 */
class IVideoFilterProcessor {
public:
    virtual ~IVideoFilterProcessor() = default;

    // === Initialisation et cycle de vie ===
    virtual bool initialize() = 0;
    virtual void shutdown() = 0;

    // === Traitement des filtres ===
    virtual bool applyFilter(const FilterState& filter, const void* inputData, size_t inputSize, void* outputData,
                             size_t outputSize) = 0;

    // === Configuration ===
    virtual bool setVideoFormat(int width, int height, const std::string& pixelFormat) = 0;
    virtual bool setFrameRate(int fps) = 0;

    // === Informations et support ===
    virtual bool supportsFormat(const std::string& format) const = 0;
    virtual bool supportsFilter(FilterType type) const = 0;
    virtual std::string getName() const = 0;
    virtual std::vector<FilterInfo> getSupportedFilters() const = 0;

    // === État et diagnostic ===
    virtual bool isInitialized() const = 0;
    virtual const std::string& getLastError() const = 0;

    // === Informations sur la plateforme ===
    virtual std::string getPlatformName() const = 0;
    virtual bool isPlatformSupported() const = 0;
};

/**
 * Factory pour créer des processeurs selon la plateforme
 */
class VideoFilterProcessorFactory {
public:
    static std::unique_ptr<IVideoFilterProcessor> createProcessor();
    static std::unique_ptr<IVideoFilterProcessor> createProcessorForPlatform(const std::string& platform);
};

/**
 * Informations sur la plateforme courante
 */
class PlatformInfo {
public:
    static std::string getCurrentPlatform();
    static bool isIOS();
    static bool isAndroid();
    static bool isDesktop();
    static std::string getPlatformVersion();
};

} // namespace Camera
