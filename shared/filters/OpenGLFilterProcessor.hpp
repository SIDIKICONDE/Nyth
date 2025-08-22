#pragma once

#include "common/FilterTypes.hpp"
#include <string>
#include <unordered_map>

// Forward declarations OpenGL
typedef unsigned int GLuint;
typedef int GLint;
typedef unsigned int GLenum;

namespace Camera {

/**
 * Processeur de filtres utilisant OpenGL ES
 * Optimisé pour le traitement GPU sur mobile
 */
class OpenGLFilterProcessor : public IFilterProcessor {
public:
    OpenGLFilterProcessor();
    ~OpenGLFilterProcessor() override;

    // IFilterProcessor interface
    bool initialize() override;
    void shutdown() override;

    bool applyFilter(const FilterState& filter, const void* inputData,
                   size_t inputSize, void* outputData, size_t outputSize) override;

    bool supportsFormat(const std::string& format) const override;
    bool supportsFilter(FilterType type) const override;

    std::string getName() const override;
    std::vector<FilterInfo> getSupportedFilters() const override;

    // Configuration spécifique OpenGL
    bool setVideoFormat(int width, int height, const std::string& pixelFormat);
    bool setFrameRate(int fps);

    // Méthodes OpenGL optimisées
    bool applyFilterWithOpenGL(const FilterState& filter,
                              GLuint inputTexture,
                              GLuint outputTexture,
                              int width, int height);

private:
    // État OpenGL
    bool initialized_{false};
    std::string lastError_;

    // Configuration vidéo
    int width_{0};
    int height_{0};
    std::string pixelFormat_;
    int frameRate_{30};

    // Ressources OpenGL
    GLuint vertexArray_{0};
    GLuint vertexBuffer_{0};
    GLuint indexBuffer_{0};
    GLuint inputTexture_{0};
    GLuint outputTexture_{0};

    // Framebuffer objects
    GLuint fbo_{0};

    // Shaders
    std::unordered_map<FilterType, GLuint> shaderPrograms_;
    std::unordered_map<FilterType, GLuint> vertexShaders_;
    std::unordered_map<FilterType, GLuint> fragmentShaders_;

    // Uniform locations cache
    struct UniformLocations {
        GLint intensity{0};
        GLint brightness{0};
        GLint contrast{0};
        GLint saturation{0};
        GLint hue{0};
        GLint gamma{0};
        GLint texture{0};
        GLint resolution{0};
        GLint time{0};
    };
    std::unordered_map<FilterType, UniformLocations> uniformLocations_;

    // Méthodes privées
    bool createOpenGLContext();
    void destroyOpenGLContext();

    bool createShaderProgram(FilterType type);
    GLuint createShader(GLenum type, const std::string& source);
    std::string getVertexShaderSource() const;
    std::string getFragmentShaderSource(FilterType type) const;

    bool createFramebuffers();
    void destroyFramebuffers();

    bool createTextures();
    void destroyTextures();

    bool uploadFrameToTexture(const void* data, size_t size);
    bool downloadTextureToFrame(void* data, size_t size);

    void setUniforms(const FilterState& filter, GLuint program);

    void setLastError(const std::string& error);

    // Utilitaires
    bool isOpenGLESAvailable() const;
    std::string getSupportedPixelFormats() const;
};

} // namespace Camera
