#pragma once

#include "../Common/IVideoFilterProcessor.hpp"
#include <string>
#include <unordered_map>

// Forward declarations iOS
#ifdef __APPLE__
#import <Foundation/Foundation.h>
#import <GLKit/GLKit.h>
typedef EAGLContext* NativeContext;
typedef GLKView* NativeView;
#else
// Fallback pour compilation hors iOS
typedef void* NativeContext;
typedef void* NativeView;
#endif

namespace Camera {

/**
 * Processeur de filtres vidéo optimisé pour iOS
 * Utilise Metal ou OpenGL ES selon la configuration
 */
class iOSVideoFilterProcessor : public IVideoFilterProcessor {
public:
    iOSVideoFilterProcessor();
    ~iOSVideoFilterProcessor() override;

    // === Interface IVideoFilterProcessor ===
    bool initialize() override;
    void shutdown() override;

    bool applyFilter(const FilterState& filter, const void* inputData, size_t inputSize, void* outputData,
                     size_t outputSize) override;

    bool setVideoFormat(int width, int height, const std::string& pixelFormat) override;
    bool setFrameRate(int fps) override;

    bool supportsFormat(const std::string& format) const override;
    bool supportsFilter(FilterType type) const override;
    std::string getName() const override;
    std::vector<FilterInfo> getSupportedFilters() const override;

    bool isInitialized() const override;
    const std::string& getLastError() const override;

    std::string getPlatformName() const override;
    bool isPlatformSupported() const override;

    // === Méthodes spécifiques iOS ===
    bool setEAGLContext(NativeContext context);
    bool setGLKView(NativeView view);
    bool useMetalBackend(bool enable);

private:
    // === État interne ===
    bool initialized_{false};
    std::string lastError_;
    bool useMetal_{false}; // false = OpenGL ES, true = Metal

    // === Configuration ===
    int width_{0};
    int height_{0};
    std::string pixelFormat_;
    int frameRate_{30};

    // === Ressources iOS ===
    NativeContext eaglContext_{nullptr};
    NativeView glkView_{nullptr};

    // === Gestionnaire de shaders ===
    class iOSShaderManager;
    std::unique_ptr<iOSShaderManager> shaderManager_;

    // === Gestionnaire de textures ===
    class iOSTextureManager;
    std::unique_ptr<iOSTextureManager> textureManager_;

    // === Méthodes privées ===
    bool initializeOpenGLES();
    bool initializeMetal();

    bool setupMetalPipeline();
    bool setupOpenGLESPipeline();

    bool applyFilterWithMetal(const FilterState& filter, const void* inputData, void* outputData);

    bool applyFilterWithOpenGL(const FilterState& filter, const void* inputData, void* outputData);

    void setLastError(const std::string& error);
    void logMessage(const std::string& message);
};

} // namespace Camera
