#pragma once

#include "../common/FilterTypes.hpp"
#include <string>
#include <vector>

namespace Camera {

/**
 * Utilitaires pour FFmpegFilterProcessor
 * Fonctions helper communes et utilitaires
 */
class FFmpegUtils {
public:
    FFmpegUtils() = default;
    ~FFmpegUtils() = default;

    /**
     * Calcule le stride pour un format de pixel donné
     * @param format Format de pixel (ex: "bgra", "yuv420p")
     * @param width Largeur de l'image
     * @return Stride calculé ou 0 si format non supporté
     */
    static int calculateStride(const std::string& format, int width);

    /**
     * Vérifie si un format de pixel est supporté
     * @param format Format à vérifier
     * @return true si supporté, false sinon
     */
    static bool isPixelFormatSupported(const std::string& format);

    /**
     * Liste des formats de pixels supportés
     * @return Vecteur des formats supportés
     */
    static std::vector<std::string> getSupportedPixelFormats();

    /**
     * Calcule le nombre de bytes par pixel pour un format
     * @param format Format de pixel
     * @return Nombre de bytes par pixel ou 0 si inconnu
     */
    static int getBytesPerPixel(const std::string& format);

    /**
     * Convertit un format de pixel FFmpeg en string
     * @param pixFmt Format FFmpeg
     * @return String représentant le format
     */
    static std::string pixelFormatToString(int pixFmt);

    /**
     * Vérifie la disponibilité de FFmpeg
     * @return true si FFmpeg est disponible, false sinon
     */
    static bool isFFmpegAvailable();

    /**
     * Obtient les informations sur les filtres supportés
     * @return Vecteur des informations de filtres
     */
    static std::vector<FilterInfo> getSupportedFilters();

private:
    // Liste statique des formats supportés
    static const std::vector<std::string> SUPPORTED_FORMATS;
};
