#include "FFmpegFilterBuilder.hpp"
#include <algorithm>
#include <cmath>
#include <iostream>

namespace Camera {

std::string FFmpegFilterBuilder::buildFilterString(const FilterState& filter) const {
    std::vector<std::string> parts;

    // 1) Ajustements globaux à partir de FilterParams
    auto adjustments = buildColorAdjustments(filter.params);
    parts.insert(parts.end(), adjustments.begin(), adjustments.end());

    // 2) Effet principal selon le type
    std::string mainEffect = buildMainEffect(filter.type, filter.params);
    if (!mainEffect.empty()) {
        parts.push_back(mainEffect);
    }

    if (parts.empty()) {
        return "";
    }

    // Joindre par virgule
    std::string combined = parts[0];
    for (size_t i = 1; i < parts.size(); ++i) {
        combined += "," + parts[i];
    }
    return combined;
}

bool FFmpegFilterBuilder::isFilterTypeSupported(FilterType type) {
    return type != FilterType::NONE;
}

std::string FFmpegFilterBuilder::escapeForFFmpeg(const std::string& path) {
    std::string escaped;
    escaped.reserve(path.size() + 8);
    for (char c : path) {
        if (c == '\'' || c == ':') {
            escaped.push_back('\\');
        }
        escaped.push_back(c);
    }
    return escaped;
}

std::vector<std::string> FFmpegFilterBuilder::buildColorAdjustments(const FilterParams& params) const {
    std::vector<std::string> parts;

    // Vérifier si des ajustements sont nécessaires
    const bool needsEq = (std::abs(params.brightness) > EPSILON) || (std::abs(params.contrast - 1.0) > EPSILON) ||
                         (std::abs(params.saturation - 1.0) > EPSILON) || (std::abs(params.gamma - 1.0) > EPSILON);

    if (needsEq) {
        std::string eq = "eq=brightness=" + std::to_string(params.brightness) +
                         ":contrast=" + std::to_string(params.contrast) +
                         ":saturation=" + std::to_string(params.saturation);
        if (std::abs(params.gamma - 1.0) > EPSILON) {
            eq += ":gamma=" + std::to_string(params.gamma);
        }
        parts.push_back(eq);
    }

    if (std::abs(params.hue) > EPSILON) {
        // Convertir degrés -> radians pour FFmpeg hue=h
        const double radians = params.hue * PI / 180.0;
        parts.push_back("hue=h=" + std::to_string(radians));
    }

    return parts;
}

std::string FFmpegFilterBuilder::buildMainEffect(FilterType type, const FilterParams& params) const {
    switch (type) {
        case FilterType::SEPIA: {
            return "colorbalance=rs=" + std::to_string(params.intensity * 0.3) +
                   ":gs=" + std::to_string(params.intensity * 0.1) + ":bs=" + std::to_string(-params.intensity * 0.4);
        }
        case FilterType::NOIR: {
            return "hue=s=0";
        }
        case FilterType::MONOCHROME: {
            return "hue=s=0.5";
        }
        case FilterType::COLOR_CONTROLS: {
            // Rien d'autre: déjà couvert par eq/hue/gamma ci-dessus
            return "";
        }
        case FilterType::VINTAGE: {
            return "colorbalance=rs=0.2:gs=0.1:bs=-0.3,hue=s=0.8";
        }
        case FilterType::COOL: {
            return "colorbalance=rs=-0.2:gs=0.1:bs=0.3";
        }
        case FilterType::WARM: {
            return "colorbalance=rs=0.3:gs=0.1:bs=-0.2";
        }
        case FilterType::CUSTOM: {
            const std::string& name = params.customFilterName;
            const std::string lutPrefix = "lut3d:";
            if (name.rfind(lutPrefix, 0) == 0 && name.size() > lutPrefix.size()) {
                std::string rest = name.substr(lutPrefix.size());
                std::string path = rest;
                std::string interp = "tetrahedral";
                auto qpos = rest.find('?');
                if (qpos != std::string::npos) {
                    path = rest.substr(0, qpos);
                    std::string query = rest.substr(qpos + 1);
                    size_t start = 0;
                    while (start < query.size()) {
                        size_t amp = query.find('&', start);
                        std::string pair =
                            amp == std::string::npos ? query.substr(start) : query.substr(start, amp - start);
                        size_t eq = pair.find('=');
                        if (eq != std::string::npos) {
                            std::string key = pair.substr(0, eq);
                            std::string value = pair.substr(eq + 1);
                            if (key == "interp") {
                                if (value == "nearest" || value == "trilinear" || value == "tetrahedral") {
                                    interp = value;
                                }
                            }
                        }
                        if (amp == std::string::npos)
                            break;
                        start = amp + 1;
                    }
                }
                std::string escapedPath = escapeForFFmpeg(path);
                return "lut3d=file='" + escapedPath + "':interp=" + interp;
            }
            return "";
        }
        default:
            return "";
    }
}

} // namespace Camera
