#pragma once

#include "../common/FilterTypes.hpp"
#include <string>
#include <vector>

namespace Camera {

/**
 * Constructeur de filtres FFmpeg
 * Responsable de la génération des chaînes de filtres FFmpeg
 */
class FFmpegFilterBuilder {
public:
    FFmpegFilterBuilder() = default;
    ~FFmpegFilterBuilder() = default;

    /**
     * Construit la chaîne de filtres FFmpeg pour un état de filtre donné
     * @param filter État du filtre
     * @return Chaîne de filtres FFmpeg ou chaîne vide si erreur
     */
    std::string buildFilterString(const FilterState& filter) const;

    /**
     * Vérifie si un type de filtre est supporté
     * @param type Type de filtre à vérifier
     * @return true si supporté, false sinon
     */
    static bool isFilterTypeSupported(FilterType type);

private:
    /**
     * Échappe une chaîne pour FFmpeg
     * @param path Chemin à échapper
     * @return Chaîne échappée
     */
    static std::string escapeForFFmpeg(const std::string& path);

    /**
     * Construit les ajustements de couleur (eq, hue, gamma)
     * @param params Paramètres du filtre
     * @return Vecteur de parties de filtre
     */
    std::vector<std::string> buildColorAdjustments(const FilterParams& params) const;

    /**
     * Construit l'effet principal selon le type
     * @param type Type de filtre
     * @param params Paramètres du filtre
     * @return Partie de filtre pour l'effet principal
     */
    std::string buildMainEffect(FilterType type, const FilterParams& params) const;

    // Constantes pour les tolérances
    static constexpr double EPSILON = 1e-6;
    static constexpr double PI = 3.14159265358979323846;
};

} // namespace Camera
