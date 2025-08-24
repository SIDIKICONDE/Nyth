#include "FFmpegUtils.hpp"
#include <algorithm>
#include <iostream>

namespace Camera {

// Initialisation de la liste statique des formats supportés
const std::vector<std::string> FFmpegUtils::SUPPORTED_FORMATS = {"yuv420p", "yuv422p", "yuv444p", "rgb24",
                                                                 "bgr24",   "rgba",    "bgra"};

int FFmpegUtils::calculateStride(const std::string& format, int width) {
    // Formats RGB/RGBA
    if (format == "bgra" || format == "rgba" || format == "rgb0") {
        return width * 4;
    } else if (format == "rgb24" || format == "bgr24") {
        return width * 3;
    }

    // Pour les autres formats, utiliser une valeur par défaut
    return width * 4;
}

bool FFmpegUtils::isPixelFormatSupported(const std::string& format) {
    return std::find(SUPPORTED_FORMATS.begin(), SUPPORTED_FORMATS.end(), format) != SUPPORTED_FORMATS.end();
}

std::vector<std::string> FFmpegUtils::getSupportedPixelFormats() {
    return SUPPORTED_FORMATS;
}

int FFmpegUtils::getBytesPerPixel(const std::string& format) {
    if (format == "bgra" || format == "rgba" || format == "rgb0") {
        return 4;
    } else if (format == "rgb24" || format == "bgr24") {
        return 3;
    } else if (format.find("yuv420p") != std::string::npos) {
        return 1; // YUV 4:2:0 utilise 1.5 bytes par pixel, mais on retourne 1 pour la composante Y
    } else if (format.find("yuv422p") != std::string::npos) {
        return 1; // YUV 4:2:2 utilise 2 bytes par pixel
    } else if (format.find("yuv444p") != std::string::npos) {
        return 1; // YUV 4:4:4 utilise 3 bytes par pixel
    }

    return 4; // Valeur par défaut
}

std::string FFmpegUtils::pixelFormatToString(int pixFmt) {
    // Cette fonction pourrait être étendue pour convertir tous les formats FFmpeg
    // Pour l'instant, on retourne une valeur par défaut
    return "bgra";
}

bool FFmpegUtils::isFFmpegAvailable() {
    return true; // FFmpeg est considéré comme disponible si cette classe est compilée
}

std::vector<FilterInfo> FFmpegUtils::getSupportedFilters() {
    std::vector<FilterInfo> filters;

    // Filtres FFmpeg complets
    filters.push_back({"sepia", "Sépia", FilterType::SEPIA, "Effet sépia vintage", false, SUPPORTED_FORMATS});
    filters.push_back({"noir", "Noir & Blanc", FilterType::NOIR, "Conversion noir et blanc", false, SUPPORTED_FORMATS});
    filters.push_back(
        {"monochrome", "Monochrome", FilterType::MONOCHROME, "Monochrome avec teinte", false, SUPPORTED_FORMATS});
    filters.push_back({"color_controls", "Contrôles Couleur", FilterType::COLOR_CONTROLS,
                       "Luminosité, contraste, saturation", false, SUPPORTED_FORMATS});
    filters.push_back({"vintage", "Vintage", FilterType::VINTAGE, "Effet vintage années 70", false, SUPPORTED_FORMATS});
    filters.push_back({"cool", "Cool", FilterType::COOL, "Effet froid bleuté", false, SUPPORTED_FORMATS});
    filters.push_back({"warm", "Warm", FilterType::WARM, "Effet chaud orangé", false, SUPPORTED_FORMATS});
    // Filtre personnalisé LUT 3D (.cube). Usage: setFilter('lut3d:/abs/path.cube', intensity)
    filters.push_back({"lut3d", "LUT 3D (.cube)", FilterType::CUSTOM,
                       "Applique une LUT 3D au format .cube (DaVinci, etc.)", true, SUPPORTED_FORMATS});

    return filters;
}

} // namespace Camera
