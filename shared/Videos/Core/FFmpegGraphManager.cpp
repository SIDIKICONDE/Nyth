#include "FFmpegGraphManager.hpp"
#include "FFmpegFilterBuilder.hpp"
#include <algorithm>
#include <array>
#include <iostream>

// Includes FFmpeg obligatoires
extern "C" {
#include <libavcodec/avcodec.h>
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/pixfmt.h>
}

namespace Camera {

FFmpegGraphManager::FFmpegGraphManager() {
    std::cout << "[FFmpegGraphManager] Construction" << std::endl;
}

FFmpegGraphManager::~FFmpegGraphManager() {
    shutdown();
    std::cout << "[FFmpegGraphManager] Destruction" << std::endl;
}

bool FFmpegGraphManager::initialize() {
    if (initialized_) {
        return true;
    }

    std::cout << "[FFmpegGraphManager] Initialisation..." << std::endl;

    initialized_ = true;
    std::cout << "[FFmpegGraphManager] Initialisation terminée" << std::endl;

    return true;
}

void FFmpegGraphManager::shutdown() {
    if (!initialized_) {
        return;
    }

    std::cout << "[FFmpegGraphManager] Arrêt..." << std::endl;

    destroyFilterGraph();

    initialized_ = false;
    std::cout << "[FFmpegGraphManager] Arrêt terminé" << std::endl;
}

bool FFmpegGraphManager::setVideoFormat(int width, int height, const std::string& pixelFormat, int frameRate) {
    width_ = width;
    height_ = height;
    pixelFormat_ = pixelFormat;
    frameRate_ = frameRate;

    std::cout << "[FFmpegGraphManager] Format vidéo: " << width << "x" << height << " (" << pixelFormat << "), "
              << frameRate << " fps" << std::endl;
    return true;
}

bool FFmpegGraphManager::ensureGraph(const FilterState& filter) {
    // Optimisation: cache le graphe et évite la reconstruction inutile
    FFmpegFilterBuilder filterBuilder;
    std::string filterString = filterBuilder.buildFilterString(filter);
    if (filterString.empty()) {
        setLastError("Filtre FFmpeg non supporté");
        return false;
    }

    bool formatChanged = (lastWidth_ != width_) || (lastHeight_ != height_) || (lastPixelFormat_ != pixelFormat_) ||
                         (lastFrameRate_ != frameRate_);
    bool filterChanged = (lastFilterDesc_ != filterString);

    // Optimisation: ne reconstruire que si vraiment nécessaire
    if (filterGraph_ && !formatChanged && !filterChanged) {
        return true;
    }

    // (Re)créer graphe si nécessaire
    if (formatChanged || !filterGraph_) {
        destroyFilterGraph();
        if (!createFilterGraph()) {
            return false;
        }
        if (!addFilterToGraph(filter)) {
            return false;
        }
    }

    lastWidth_ = width_;
    lastHeight_ = height_;
    lastPixelFormat_ = pixelFormat_;
    lastFrameRate_ = frameRate_;
    lastFilterDesc_ = filterString;
    return true;
}

bool FFmpegGraphManager::createFilterGraph() {
    if (filterGraph_) {
        destroyFilterGraph();
    }

    filterGraph_ = avfilter_graph_alloc();
    if (!filterGraph_) {
        setLastError("Impossible de créer le graphe de filtres FFmpeg");
        return false;
    }

    return true;
}

void FFmpegGraphManager::destroyFilterGraph() {
    if (filterGraph_) {
        avfilter_graph_free(&filterGraph_);
        filterGraph_ = nullptr;
    }

    sourceContext_ = nullptr;
    sinkContext_ = nullptr;
}

bool FFmpegGraphManager::addFilterToGraph(const FilterState& filter) {
    if (!filterGraph_) {
        return false;
    }

    FFmpegFilterBuilder filterBuilder;
    std::string filterString = filterBuilder.buildFilterString(filter);
    if (filterString.empty()) {
        setLastError("Filtre FFmpeg non supporté");
        return false;
    }

    // Créer buffersrc/buffersink
    const AVFilter* buffersrc = avfilter_get_by_name("buffer");
    const AVFilter* buffersink = avfilter_get_by_name("buffersink");
    if (!buffersrc || !buffersink) {
        setLastError("Impossible d'obtenir buffer/buffersink");
        return false;
    }

    char args[256];
    AVPixelFormat pix = av_get_pix_fmt(pixelFormat_.empty() ? "yuv420p" : pixelFormat_.c_str());
    if (pix == AV_PIX_FMT_NONE) {
        pix = AV_PIX_FMT_YUV420P;
    }
    snprintf(args, sizeof(args), "video_size=%dx%d:pix_fmt=%d:time_base=1/%d:frame_rate=%d/1:pixel_aspect=1/1", width_,
             height_, pix, frameRate_, frameRate_);

    int ret = avfilter_graph_create_filter(&sourceContext_, buffersrc, "in", args, NULL, filterGraph_);
    if (ret < 0) {
        setLastError("create_filter buffer a échoué");
        return false;
    }

    ret = avfilter_graph_create_filter(&sinkContext_, buffersink, "out", NULL, NULL, filterGraph_);
    if (ret < 0) {
        setLastError("create_filter buffersink a échoué");
        return false;
    }

    // Verrouiller le format de sortie pour éviter conversions implicites
    static const AVPixelFormat pix_fmts[] = {pix, AV_PIX_FMT_NONE};
    ret = av_opt_set_int_list(sinkContext_, "pix_fmts", pix_fmts, AV_PIX_FMT_NONE, AV_OPT_SEARCH_CHILDREN);
    if (ret < 0) {
        setLastError("Impossible de fixer pix_fmts sur buffersink");
        return false;
    }

    // Construire la description: [in]filterString[out]
    std::string desc = "[in]" + filterString + "[out]";

    AVFilterInOut* outputs = avfilter_inout_alloc();
    AVFilterInOut* inputs = avfilter_inout_alloc();
    if (!outputs || !inputs) {
        if (outputs)
            avfilter_inout_free(&outputs);
        if (inputs)
            avfilter_inout_free(&inputs);
        setLastError("Allocation AVFilterInOut a échoué");
        return false;
    }

    outputs->name = av_strdup("in");
    outputs->filter_ctx = sourceContext_;
    outputs->pad_idx = 0;
    outputs->next = nullptr;

    inputs->name = av_strdup("out");
    inputs->filter_ctx = sinkContext_;
    inputs->pad_idx = 0;
    inputs->next = nullptr;

    ret = avfilter_graph_parse_ptr(filterGraph_, desc.c_str(), &inputs, &outputs, NULL);
    if (ret < 0) {
        avfilter_inout_free(&outputs);
        avfilter_inout_free(&inputs);
        setLastError("avfilter_graph_parse_ptr a échoué");
        return false;
    }

    // Libérer les in/out maintenant que le graphe est parsé
    avfilter_inout_free(&outputs);
    avfilter_inout_free(&inputs);

    ret = avfilter_graph_config(filterGraph_, NULL);
    if (ret < 0) {
        setLastError("avfilter_graph_config a échoué");
        return false;
    }

    std::cout << "[FFmpegGraphManager] Graphe FFmpeg configuré: " << filterString << std::endl;
    return true;
}

void FFmpegGraphManager::setLastError(const std::string& error) {
    lastError_ = error;
    std::cout << "[FFmpegGraphManager] Erreur: " << error << std::endl;
}

} // namespace Camera
