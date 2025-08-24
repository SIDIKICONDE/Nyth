#include "OpenGLFilterProcessor.hpp"
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <array>
#include <cstring>
#include <unordered_map>
#include <sstream>

#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

// OpenGL ES includes
#ifdef __APPLE__
// Silencer les warnings de dépréciation OpenGL ES sur iOS
#define GLES_SILENCE_DEPRECATION
#endif

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#elif __APPLE__
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#else
#include <GL/glew.h>
#include <GL/gl.h>
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Fonction de logging compatible iOS pour OpenGLFilterProcessor
inline void logOpenGLFilterProcessor(const std::string& message) {
#ifdef TARGET_OS_IOS
    // Pour iOS, on peut utiliser NSLog ou simplement ignorer
    (void)message; // Supprime l'avertissement de paramètre non utilisé
#else
    std::cout << "[OpenGLFilterProcessor] " << message << std::endl;
#endif
}

// Macro helper pour les messages avec flux
#define LOG_OPENGL_FILTER(msg) do { std::stringstream ss; ss << msg; logOpenGLFilterProcessor(ss.str()); } while(0)

namespace Camera {

OpenGLFilterProcessor::OpenGLFilterProcessor() {
    std::cout << "[OpenGLFilterProcessor] Construction" << std::endl;
}

OpenGLFilterProcessor::~OpenGLFilterProcessor() {
    shutdown();
    std::cout << "[OpenGLFilterProcessor] Destruction" << std::endl;
}

bool OpenGLFilterProcessor::initialize() {
    if (initialized_) {
        return true;
    }

    std::cout << "[OpenGLFilterProcessor] Initialisation..." << std::endl;

    // Créer le contexte OpenGL
    if (!createOpenGLContext()) {
        setLastError("Impossible de créer le contexte OpenGL");
        return false;
    }

    // Créer les ressources de base
    if (!createFramebuffers() || !createTextures()) {
        setLastError("Impossible de créer les ressources OpenGL");
        return false;
    }

    // Créer les shaders pour tous les types de filtres
    for (int i = 0; i < static_cast<int>(FilterType::CUSTOM); ++i) {
        FilterType type = static_cast<FilterType>(i);
        if (!createShaderProgram(type)) {
            std::cout << "[OpenGLFilterProcessor] Warning: Impossible de créer shader pour "
                      << static_cast<int>(type) << std::endl;
        }
    }

    initialized_ = true;
    std::cout << "[OpenGLFilterProcessor] Initialisation terminée" << std::endl;
    return true;
}

void OpenGLFilterProcessor::shutdown() {
    if (!initialized_) {
        return;
    }

    std::cout << "[OpenGLFilterProcessor] Arrêt..." << std::endl;

    destroyTextures();
    destroyFramebuffers();
    destroyOpenGLContext();

    initialized_ = false;
    std::cout << "[OpenGLFilterProcessor] Arrêt terminé" << std::endl;
}

bool OpenGLFilterProcessor::applyFilter(const FilterState& filter, const void* inputData,
                                      size_t inputSize, void* outputData, size_t outputSize) {
    if (!initialized_) {
        setLastError("Processeur non initialisé");
        return false;
    }

    if (width_ <= 0 || height_ <= 0) {
        setLastError("Format vidéo non défini");
        return false;
    }

    // Upload des données vers la texture
    if (!uploadFrameToTexture(inputData, inputSize)) {
        setLastError("Impossible d'uploader les données vers la texture");
        return false;
    }

    // Appliquer le filtre avec OpenGL
    if (!applyFilterWithOpenGL(filter, inputTexture_, outputTexture_, width_, height_)) {
        setLastError("Impossible d'appliquer le filtre OpenGL");
        return false;
    }

    // Download des données depuis la texture
    if (!downloadTextureToFrame(outputData, outputSize)) {
        setLastError("Impossible de télécharger les données depuis la texture");
        return false;
    }

    return true;
}

bool OpenGLFilterProcessor::supportsFormat(const std::string& format) const {
    // Formats supportés par OpenGL ES
    static const std::vector<std::string> supportedFormats = {
        "rgba", "bgra", "rgb", "bgr"
    };

    return std::find(supportedFormats.begin(), supportedFormats.end(), format) != supportedFormats.end();
}

bool OpenGLFilterProcessor::supportsFilter(FilterType type) const {
    // Tous les filtres sont supportés avec OpenGL
    return type != FilterType::NONE;
}

std::string OpenGLFilterProcessor::getName() const {
    return std::string("OpenGLFilterProcessor");
}

std::vector<FilterInfo> OpenGLFilterProcessor::getSupportedFilters() const {
    std::vector<FilterInfo> filters;

    filters.push_back({"sepia", "Sépia (GPU)", FilterType::SEPIA, "Effet sépia accéléré GPU", false, {"rgba", "bgra"}});
    filters.push_back({"noir", "Noir & Blanc (GPU)", FilterType::NOIR, "Conversion noir et blanc GPU", false, {"rgba", "bgra"}});
    filters.push_back({"monochrome", "Monochrome (GPU)", FilterType::MONOCHROME, "Monochrome avec teinte GPU", false, {"rgba", "bgra"}});
    filters.push_back({"color_controls", "Contrôles Couleur (GPU)", FilterType::COLOR_CONTROLS, "Luminosité, contraste, saturation GPU", false, {"rgba", "bgra"}});
    filters.push_back({"vintage", "Vintage (GPU)", FilterType::VINTAGE, "Effet vintage accéléré GPU", false, {"rgba", "bgra"}});
    filters.push_back({"cool", "Cool (GPU)", FilterType::COOL, "Effet froid bleuté GPU", false, {"rgba", "bgra"}});
    filters.push_back({"warm", "Warm (GPU)", FilterType::WARM, "Effet chaud orangé GPU", false, {"rgba", "bgra"}});

    return filters;
}

bool OpenGLFilterProcessor::setVideoFormat(int width, int height, const std::string& pixelFormat) {
    width_ = width;
    height_ = height;
    pixelFormat_ = pixelFormat;

    std::cout << "[OpenGLFilterProcessor] Format vidéo: " << width << "x" << height
              << " (" << pixelFormat << ")" << std::endl;

    // Recréer les textures avec la nouvelle taille
    destroyTextures();
    return createTextures();
}

bool OpenGLFilterProcessor::setFrameRate(int fps) {
    frameRate_ = fps;
    std::cout << "[OpenGLFilterProcessor] Frame rate: " << fps << " fps" << std::endl;
    return true;
}

// Implémentation des méthodes OpenGL

bool OpenGLFilterProcessor::createOpenGLContext() {
    // Initialiser GLEW sur desktop
#ifndef __ANDROID__
#ifndef __APPLE__
    glewExperimental = GL_TRUE;
    if (glewInit() != GLEW_OK) {
        setLastError("Impossible d'initialiser GLEW");
        return false;
    }
#endif
#endif

    // Vérifier la version OpenGL
    const char* version = reinterpret_cast<const char*>(glGetString(GL_VERSION));
    if (!version) {
        setLastError("Impossible d'obtenir la version OpenGL");
        return false;
    }

    std::cout << "[OpenGLFilterProcessor] OpenGL version: " << version << std::endl;

    // Créer les buffers de vertex
    glGenVertexArrays(1, &vertexArray_);
    glGenBuffers(1, &vertexBuffer_);
    glGenBuffers(1, &indexBuffer_);

    // Définir la géométrie du quad
    float vertices[] = {
        // Position    // UV
        -1.0f, -1.0f,  0.0f, 0.0f,
         1.0f, -1.0f,  1.0f, 0.0f,
         1.0f,  1.0f,  1.0f, 1.0f,
        -1.0f,  1.0f,  0.0f, 1.0f
    };

    GLuint indices[] = {
        0, 1, 2,
        0, 2, 3
    };

    glBindVertexArray(vertexArray_);

    glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer_);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer_);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    // Attributs de vertex
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
    glEnableVertexAttribArray(1);

    glBindVertexArray(0);

    return true;
}

void OpenGLFilterProcessor::destroyOpenGLContext() {
    if (vertexArray_) glDeleteVertexArrays(1, &vertexArray_);
    if (vertexBuffer_) glDeleteBuffers(1, &vertexBuffer_);
    if (indexBuffer_) glDeleteBuffers(1, &indexBuffer_);

    // Supprimer tous les shaders
    for (auto& pair : shaderPrograms_) {
        glDeleteProgram(pair.second);
    }
    for (auto& pair : vertexShaders_) {
        glDeleteShader(pair.second);
    }
    for (auto& pair : fragmentShaders_) {
        glDeleteShader(pair.second);
    }

    shaderPrograms_.clear();
    vertexShaders_.clear();
    fragmentShaders_.clear();
    uniformLocations_.clear();
}

std::string OpenGLFilterProcessor::getVertexShaderSource() const {
    return R"(
        #version 300 es
        precision mediump float;

        layout(location = 0) in vec2 aPosition;
        layout(location = 1) in vec2 aTexCoord;

        out vec2 vTexCoord;

        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
            vTexCoord = aTexCoord;
        }
    )";
}

std::string OpenGLFilterProcessor::getFragmentShaderSource(FilterType type) const {
    std::string baseShader = R"(
        #version 300 es
        precision mediump float;

        uniform sampler2D uTexture;
        uniform float uIntensity;
        uniform float uBrightness;
        uniform float uContrast;
        uniform float uSaturation;
        uniform float uHue;
        uniform float uGamma;
        uniform vec2 uResolution;
        uniform float uTime;

        in vec2 vTexCoord;
        out vec4 fragColor;

        // Fonctions utilitaires
        vec3 rgb2hsv(vec3 c) {
            vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }

        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
            vec4 color = texture(uTexture, vTexCoord);
    )";

    std::string filterCode;
    switch (type) {
        case FilterType::SEPIA:
            filterCode = R"(
                // Effet sépia
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                vec3 sepia = vec3(
                    min(1.0, gray * 1.2 + 0.1),
                    min(1.0, gray * 0.9 + 0.1),
                    min(1.0, gray * 0.6 + 0.1)
                );
                color.rgb = mix(color.rgb, sepia, uIntensity);
            )";
            break;

        case FilterType::NOIR:
            filterCode = R"(
                // Noir et blanc
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                color.rgb = vec3(gray);
            )";
            break;

        case FilterType::MONOCHROME:
            filterCode = R"(
                // Monochrome avec teinte
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                vec3 hsv = rgb2hsv(vec3(gray));
                hsv.x = uHue / 360.0; // Hue normalisé
                hsv.y = 0.5; // Saturation moyenne
                color.rgb = hsv2rgb(hsv);
            )";
            break;

        case FilterType::COLOR_CONTROLS:
            filterCode = R"(
                // Contrôles de couleur
                color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
                color.rgb += uBrightness;
                vec3 hsv = rgb2hsv(color.rgb);
                hsv.y *= uSaturation;
                color.rgb = hsv2rgb(hsv);
                color.rgb = pow(color.rgb, vec3(1.0 / uGamma));
            )";
            break;

        case FilterType::VINTAGE:
            filterCode = R"(
                // Effet vintage
                vec3 hsv = rgb2hsv(color.rgb);
                hsv.x = 0.1; // Teinte orangée
                hsv.y = 0.8; // Saturation
                hsv.z = hsv.z * 0.9; // Légère réduction de luminosité
                color.rgb = hsv2rgb(hsv);
                color.rgb = mix(color.rgb, color.rgb * vec3(1.2, 0.9, 0.7), uIntensity);
            )";
            break;

        case FilterType::COOL:
            filterCode = R"(
                // Effet froid bleuté
                color.rgb = mix(color.rgb, color.rgb * vec3(0.8, 0.9, 1.2), uIntensity);
            )";
            break;

        case FilterType::WARM:
            filterCode = R"(
                // Effet chaud orangé
                color.rgb = mix(color.rgb, color.rgb * vec3(1.2, 1.0, 0.8), uIntensity);
            )";
            break;

        default:
            filterCode = R"(
                // Pas de modification
            )";
            break;
    }

    return baseShader + filterCode + R"(
            fragColor = color;
        }
    )";
}

bool OpenGLFilterProcessor::createShaderProgram(FilterType type) {
    GLuint vertexShader = createShader(GL_VERTEX_SHADER, getVertexShaderSource());
    if (!vertexShader) return false;

    GLuint fragmentShader = createShader(GL_FRAGMENT_SHADER, getFragmentShaderSource(type));
    if (!fragmentShader) {
        glDeleteShader(vertexShader);
        return false;
    }

    GLuint program = glCreateProgram();
    if (!program) {
        glDeleteShader(vertexShader);
        glDeleteShader(fragmentShader);
        return false;
    }

    glAttachShader(program, vertexShader);
    glAttachShader(program, fragmentShader);
    glLinkProgram(program);

    GLint success;
    glGetProgramiv(program, GL_LINK_STATUS, &success);
    if (!success) {
        char infoLog[512];
        glGetProgramInfoLog(program, 512, nullptr, infoLog);
        setLastError(std::string("Erreur de linkage shader: ") + infoLog);
        glDeleteProgram(program);
        glDeleteShader(vertexShader);
        glDeleteShader(fragmentShader);
        return false;
    }

    // Stocker les shaders et le programme
    shaderPrograms_[type] = program;
    vertexShaders_[type] = vertexShader;
    fragmentShaders_[type] = fragmentShader;

    // Obtenir les locations des uniforms
    UniformLocations locations;
    locations.intensity = glGetUniformLocation(program, "uIntensity");
    locations.brightness = glGetUniformLocation(program, "uBrightness");
    locations.contrast = glGetUniformLocation(program, "uContrast");
    locations.saturation = glGetUniformLocation(program, "uSaturation");
    locations.hue = glGetUniformLocation(program, "uHue");
    locations.gamma = glGetUniformLocation(program, "uGamma");
    locations.texture = glGetUniformLocation(program, "uTexture");
    locations.resolution = glGetUniformLocation(program, "uResolution");
    locations.time = glGetUniformLocation(program, "uTime");

    uniformLocations_[type] = locations;

    std::cout << "[OpenGLFilterProcessor] Shader créé pour filtre "
              << static_cast<int>(type) << std::endl;

    return true;
}

GLuint OpenGLFilterProcessor::createShader(GLenum type, const std::string& source) {
    GLuint shader = glCreateShader(type);
    if (!shader) return 0;

    const char* src = source.c_str();
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);

    GLint success;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char infoLog[512];
        glGetShaderInfoLog(shader, 512, nullptr, infoLog);
        setLastError(std::string("Erreur de compilation shader: ") + infoLog);
        glDeleteShader(shader);
        return 0;
    }

    return shader;
}

bool OpenGLFilterProcessor::createFramebuffers() {
    glGenFramebuffers(1, &fbo_);
    return true;
}

void OpenGLFilterProcessor::destroyFramebuffers() {
    if (fbo_) glDeleteFramebuffers(1, &fbo_);
    fbo_ = 0;
}

bool OpenGLFilterProcessor::createTextures() {
    if (width_ <= 0 || height_ <= 0) return false;

    // Supprimer les textures existantes
    destroyTextures();

    // Créer les textures
    glGenTextures(1, &inputTexture_);
    glGenTextures(1, &outputTexture_);

    // Configurer la texture d'entrée
    glBindTexture(GL_TEXTURE_2D, inputTexture_);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width_, height_, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    // Configurer la texture de sortie
    glBindTexture(GL_TEXTURE_2D, outputTexture_);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width_, height_, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    glBindTexture(GL_TEXTURE_2D, 0);

    std::cout << "[OpenGLFilterProcessor] Textures créées: " << width_ << "x" << height_ << std::endl;
    return true;
}

void OpenGLFilterProcessor::destroyTextures() {
    if (inputTexture_) glDeleteTextures(1, &inputTexture_);
    if (outputTexture_) glDeleteTextures(1, &outputTexture_);
    inputTexture_ = outputTexture_ = 0;
}

bool OpenGLFilterProcessor::uploadFrameToTexture(const void* data, size_t size) {
    if (!inputTexture_ || !data) return false;

    glBindTexture(GL_TEXTURE_2D, inputTexture_);

    // Déterminer le format selon pixelFormat_
    GLenum format = GL_RGBA;
    if (pixelFormat_ == "bgra") format = GL_BGRA;
    else if (pixelFormat_ == "rgb") format = GL_RGB;
    else if (pixelFormat_ == "bgr") {
        // GL_BGR n'est pas supporté en OpenGL ES, utiliser RGB et convertir si nécessaire
        format = GL_RGB;
        // Note: BGR vers RGB nécessite une conversion des données
        LOG_OPENGL_FILTER("Format BGR détecté - conversion vers RGB requise");
    }

    glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, width_, height_, format, GL_UNSIGNED_BYTE, data);
    glBindTexture(GL_TEXTURE_2D, 0);

    return true;
}

bool OpenGLFilterProcessor::downloadTextureToFrame(void* data, size_t size) {
    if (!outputTexture_ || !data) return false;

    // Utiliser glReadPixels pour récupérer les données
    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, outputTexture_, 0);

    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
        setLastError("Framebuffer incomplet");
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        return false;
    }

    glReadPixels(0, 0, width_, height_, GL_RGBA, GL_UNSIGNED_BYTE, data);
    glBindFramebuffer(GL_FRAMEBUFFER, 0);

    return true;
}

bool OpenGLFilterProcessor::applyFilterWithOpenGL(const FilterState& filter,
                                                GLuint inputTexture,
                                                GLuint outputTexture,
                                                int width, int height) {
    auto it = shaderPrograms_.find(filter.type);
    if (it == shaderPrograms_.end()) {
        setLastError("Shader non trouvé pour ce filtre");
        return false;
    }

    GLuint program = it->second;
    glUseProgram(program);

    // Configurer le framebuffer
    glBindFramebuffer(GL_FRAMEBUFFER, fbo_);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, outputTexture, 0);

    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
        setLastError("Framebuffer incomplet");
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        return false;
    }

    // Configurer le viewport
    glViewport(0, 0, width, height);

    // Lier la texture d'entrée
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, inputTexture);

    // Configurer les uniforms
    setUniforms(filter, program);

    // Dessiner
    glBindVertexArray(vertexArray_);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
    glBindVertexArray(0);

    // Nettoyer
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glUseProgram(0);

    return true;
}

void OpenGLFilterProcessor::setUniforms(const FilterState& filter, GLuint program) {
    auto it = uniformLocations_.find(filter.type);
    if (it == uniformLocations_.end()) return;

    const UniformLocations& loc = it->second;

    if (loc.intensity >= 0) glUniform1f(loc.intensity, filter.params.intensity);
    if (loc.brightness >= 0) glUniform1f(loc.brightness, filter.params.brightness);
    if (loc.contrast >= 0) glUniform1f(loc.contrast, filter.params.contrast);
    if (loc.saturation >= 0) glUniform1f(loc.saturation, filter.params.saturation);
    if (loc.hue >= 0) glUniform1f(loc.hue, filter.params.hue);
    if (loc.gamma >= 0) glUniform1f(loc.gamma, filter.params.gamma);
    if (loc.texture >= 0) glUniform1i(loc.texture, 0);
    if (loc.resolution >= 0) glUniform2f(loc.resolution, width_, height_);
    if (loc.time >= 0) glUniform1f(loc.time, 0.0f); // Peut être utilisé pour les animations
}

void OpenGLFilterProcessor::setLastError(const std::string& error) {
    lastError_ = error;
    std::cout << "[OpenGLFilterProcessor] Erreur: " << error << std::endl;
}

bool OpenGLFilterProcessor::isOpenGLESAvailable() const {
    return true; // Supposons que OpenGL ES est disponible
}

std::string OpenGLFilterProcessor::getSupportedPixelFormats() const {
    return "rgba,bgra,rgb,bgr";
}

} // namespace Camera
