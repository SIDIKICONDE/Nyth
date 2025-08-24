#pragma once

#include "../Common/IVideoFilterProcessor.hpp"
#include <string>
#include <unordered_map>

// Forward declarations Android
#ifdef __ANDROID__
#include <EGL/egl.h>
#include <GLES3/gl3.h>
typedef EGLContext NativeContext;
typedef EGLSurface NativeSurface;
typedef ANativeWindow* NativeWindow;
#else
// Fallback pour compilation hors Android
typedef void* NativeContext;
typedef void* NativeSurface;
typedef void* NativeWindow;
#endif

namespace Camera {

/**
 * Processeur de filtres vidéo optimisé pour Android
 * Utilise OpenGL ES 3.0 avec support Vulkan optionnel
 */
class AndroidVideoFilterProcessor : public IVideoFilterProcessor {
public:
    AndroidVideoFilterProcessor();
    ~AndroidVideoFilterProcessor() override;

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

    // === Méthodes spécifiques Android ===
    bool setEGLContext(NativeContext context);
    bool setEGLSurface(NativeSurface surface);
    bool setNativeWindow(NativeWindow window);
    bool enableVulkanBackend(bool enable);

private:
    // === État interne ===
    bool initialized_{false};
    std::string lastError_;
    bool useVulkan_{false}; // false = OpenGL ES, true = Vulkan

    // === Configuration ===
    int width_{0};
    int height_{0};
    std::string pixelFormat_;
    int frameRate_{30};

    // === Ressources Android ===
    NativeContext eglContext_{nullptr};
    NativeSurface eglSurface_{nullptr};
    NativeWindow nativeWindow_{nullptr};

    // === Gestionnaire de shaders ===
    class AndroidShaderManager;
    std::unique_ptr<AndroidShaderManager> shaderManager_;

    // === Gestionnaire de textures ===
    class AndroidTextureManager;
    std::unique_ptr<AndroidTextureManager> textureManager_;

    // === Méthodes privées ===
    bool initializeOpenGLES();
    bool initializeVulkan();

    bool setupVulkanPipeline();
    bool setupOpenGLESPipeline();

    bool applyFilterWithVulkan(const FilterState& filter, const void* inputData, void* outputData);

    bool applyFilterWithOpenGL(const FilterState& filter, const void* inputData, void* outputData);

    void setLastError(const std::string& error);
    void logMessage(const std::string& message);

    // === Optimisations Android ===
    bool setupHardwareBuffers();
    bool enableZeroCopyMode();
    bool configurePowerManagement();
};

} // namespace Camera
