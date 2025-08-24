// Header pour les exemples d'utilisation
// Ce fichier montre comment utiliser l'architecture multiplateforme

#pragma once

#include "Platform/Common/IVideoFilterProcessor.hpp"
#include <memory>

namespace VideoFilterExamples {

/**
 * Exemple simple d'utilisation
 */
class SimpleVideoProcessor {
private:
    std::unique_ptr<Camera::IVideoFilterProcessor> processor_;

public:
    SimpleVideoProcessor() {
        processor_ = Camera::VideoFilterProcessorFactory::createProcessor();
    }

    bool initialize(int width = 1920, int height = 1080, const std::string& format = "rgba") {
        if (!processor_->initialize()) {
            return false;
        }

        if (!processor_->setVideoFormat(width, height, format)) {
            return false;
        }

        return true;
    }

    bool applySepiaFilter(const void* input, size_t inputSize, void* output, size_t outputSize) {
        Camera::FilterState filter;
        filter.type = Camera::FilterType::SEPIA;
        filter.params.intensity = 0.7f;

        return processor_->applyFilter(filter, input, inputSize, output, outputSize);
    }

    std::string getPlatformInfo() const {
        return processor_->getPlatformName() + " - " +
               (processor_->isPlatformSupported() ? "Supporté" : "Non supporté");
    }
};

/**
 * Fonction d'exemple pour l'utilisation avancée
 */
void advancedExample();

} // namespace VideoFilterExamples
