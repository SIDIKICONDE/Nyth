#include "NativeCameraFiltersModule.h"
#include <cstdint>
#include <mutex>
#include <string>
#include <chrono>
#include <thread>
#include <memory>

// État global filtres accessible depuis ObjC/ObjC++ (toujours défini pour le lint)
static std::mutex g_naaya_filters_mutex;
static bool g_naaya_filters_hasFilter = false;
static std::string g_naaya_filters_name;
static double g_naaya_filters_intensity = 1.0;
static NaayaAdvancedFilterParams g_naaya_filters_advanced_params = {
  0.0, // brightness
  1.0, // contrast
  1.0, // saturation
  0.0, // hue
  1.0, // gamma
  0.0, // warmth
  0.0, // tint
  0.0, // exposure
  0.0, // shadows
  0.0, // highlights
  0.0, // vignette
  0.0  // grain
};
#if NAAYA_CAMERA_FILTERS_ENABLED
#include "filters/FilterManager.hpp"
#include "filters/FilterFactory.hpp"
#include "filters/FFmpegFilterProcessor.hpp"
#include "filters/ProductionConfig.hpp"
#include "filters/ProductionSetup.hpp"
#include <iostream>

namespace facebook::react {

NativeCameraFiltersModule::NativeCameraFiltersModule(std::shared_ptr<CallInvoker> jsInvoker)
  : NativeCameraFiltersModuleCxxSpec<NativeCameraFiltersModule>(jsInvoker) {
  // Initialiser le gestionnaire de filtres
  filterManager_ = std::make_unique<Camera::FilterManager>();
  filterManager_->initialize();
  
  // Configuration de production automatique
  auto& prodConfig = Camera::ProductionConfig::getInstance();
  if (prodConfig.isProductionMode()) {
    Camera::ProductionSetup::configureForProduction(*filterManager_);
    std::cout << "[NativeCameraFiltersModule] Mode production activé" << std::endl;
  }
  
  // Enregistrer les processeurs disponibles
  auto ffmpegProcessor = Camera::FilterFactory::createProcessor(Camera::FilterFactory::ProcessorType::FFMPEG);
  filterManager_->registerProcessor(ffmpegProcessor);
  
  // Essayer d'enregistrer OpenGL si disponible
  if (Camera::FilterFactory::isProcessorTypeAvailable(Camera::FilterFactory::ProcessorType::OPENGL)) {
    auto openglProcessor = Camera::FilterFactory::createProcessor(Camera::FilterFactory::ProcessorType::OPENGL);
    if (openglProcessor) {
      filterManager_->registerProcessor(openglProcessor);
      std::cout << "[NativeCameraFiltersModule] Processeur OpenGL enregistré" << std::endl;
    }
  }
}

NativeCameraFiltersModule::~NativeCameraFiltersModule() = default;

jsi::Array NativeCameraFiltersModule::getAvailableFilters(jsi::Runtime& rt) {
  if (!filterManager_) {
    jsi::Array arr(rt, 0);
    return arr;
  }
  
  auto filters = filterManager_->getAvailableFilters();
  jsi::Array arr(rt, filters.size());
  
  for (size_t i = 0; i < filters.size(); ++i) {
    arr.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, filters[i].name));
  }
  
  return arr;
}

bool NativeCameraFiltersModule::setFilter(jsi::Runtime& rt, jsi::String name, double intensity) {
  (void)rt;
  std::lock_guard<std::mutex> lock(mutex_);
  state_.name = name.utf8(rt);
  // Conserver la query dans state_.name pour FFmpeg, mais normaliser pour la logique iOS de type
  state_.intensity = intensity;
  hasFilter_ = state_.name != "none";
  std::cout << "[Filters] setFilter name=" << state_.name << " intensity=" << state_.intensity << std::endl;

  // Propager à l'API C globale (accès ObjC)
  {
    std::lock_guard<std::mutex> g(g_naaya_filters_mutex);
    g_naaya_filters_hasFilter = hasFilter_;
    g_naaya_filters_name = state_.name;
    g_naaya_filters_intensity = state_.intensity;
    // Conserver les paramètres avancés actuels inchangés ici
  }
  // Mémoriser un éventuel LUT path pour iOS
  if (state_.name.rfind("lut3d:", 0) == 0) {
    lastLUTPath_ = state_.name.substr(6);
  } else {
    lastLUTPath_.clear();
  }
  return true;
}

bool NativeCameraFiltersModule::setFilterWithParams(jsi::Runtime& rt, jsi::String name, double intensity, jsi::Object params) {
  std::lock_guard<std::mutex> lock(mutex_);
  state_.name = name.utf8(rt);
  state_.intensity = intensity;
  hasFilter_ = state_.name != "none";

  // Convertir params JSI -> Camera::FilterParams et NaayaAdvancedFilterParams
  auto getNumber = [&](const char* key, double fallback) -> double {
    if (!params.hasProperty(rt, key)) return fallback;
    auto v = params.getProperty(rt, key);
    if (v.isNumber()) return v.getNumber();
    return fallback;
  };

  advancedParams_.intensity = intensity;
  advancedParams_.brightness = getNumber("brightness", 0.0);
  advancedParams_.contrast = getNumber("contrast", 1.0);
  advancedParams_.saturation = getNumber("saturation", 1.0);
  advancedParams_.hue = getNumber("hue", 0.0);
  advancedParams_.gamma = getNumber("gamma", 1.0);
  // Champs additionnels non présents dans FilterParams de base
  // warmth/tint/exposure/shadows/highlights/vignette/grain conservés en global C

  std::lock_guard<std::mutex> g(g_naaya_filters_mutex);
  g_naaya_filters_hasFilter = hasFilter_;
  g_naaya_filters_name = state_.name;
  g_naaya_filters_intensity = state_.intensity;
  g_naaya_filters_advanced_params.brightness = getNumber("brightness", 0.0);
  g_naaya_filters_advanced_params.contrast = getNumber("contrast", 1.0);
  g_naaya_filters_advanced_params.saturation = getNumber("saturation", 1.0);
  g_naaya_filters_advanced_params.hue = getNumber("hue", 0.0);
  g_naaya_filters_advanced_params.gamma = getNumber("gamma", 1.0);
  g_naaya_filters_advanced_params.warmth = getNumber("warmth", 0.0);
  g_naaya_filters_advanced_params.tint = getNumber("tint", 0.0);
  g_naaya_filters_advanced_params.exposure = getNumber("exposure", 0.0);
  g_naaya_filters_advanced_params.shadows = getNumber("shadows", 0.0);
  g_naaya_filters_advanced_params.highlights = getNumber("highlights", 0.0);
  g_naaya_filters_advanced_params.vignette = getNumber("vignette", 0.0);
  g_naaya_filters_advanced_params.grain = getNumber("grain", 0.0);

  // Mémoriser LUT si demandé
  if (state_.name.rfind("lut3d:", 0) == 0) {
    // Retirer la query éventuelle pour le chemin LUT côté iOS
    std::string rest = state_.name.substr(6);
    auto qpos2 = rest.find('?');
    if (qpos2 != std::string::npos) rest = rest.substr(0, qpos2);
    lastLUTPath_ = rest;
  } else {
    lastLUTPath_.clear();
  }
  return true;
}

std::optional<jsi::Object> NativeCameraFiltersModule::getFilter(jsi::Runtime& rt) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!hasFilter_) return std::nullopt;
  jsi::Object obj(rt);
  obj.setProperty(rt, "name", jsi::String::createFromUtf8(rt, state_.name));
  obj.setProperty(rt, "intensity", jsi::Value(state_.intensity));
  return obj;
}

bool NativeCameraFiltersModule::clearFilter(jsi::Runtime& rt) {
  (void)rt;
  std::lock_guard<std::mutex> lock(mutex_);
  hasFilter_ = false;
  state_ = {};
  {
    std::lock_guard<std::mutex> g(g_naaya_filters_mutex);
    g_naaya_filters_hasFilter = false;
    g_naaya_filters_name.clear();
    g_naaya_filters_intensity = 1.0;
    // Réinitialiser les paramètres avancés à des valeurs neutres
    g_naaya_filters_advanced_params.brightness = 0.0;
    g_naaya_filters_advanced_params.contrast = 1.0;
    g_naaya_filters_advanced_params.saturation = 1.0;
    g_naaya_filters_advanced_params.hue = 0.0;
    g_naaya_filters_advanced_params.gamma = 1.0;
    g_naaya_filters_advanced_params.warmth = 0.0;
    g_naaya_filters_advanced_params.tint = 0.0;
    g_naaya_filters_advanced_params.exposure = 0.0;
    g_naaya_filters_advanced_params.shadows = 0.0;
    g_naaya_filters_advanced_params.highlights = 0.0;
    g_naaya_filters_advanced_params.vignette = 0.0;
    g_naaya_filters_advanced_params.grain = 0.0;
  }
  return true;
}

// === Implémentation de l'API étendue ===

jsi::Array NativeCameraFiltersModule::getAvailableFiltersDetailed(jsi::Runtime& rt) {
  if (!filterManager_) {
    return jsi::Array(rt, 0);
  }
  
  auto filters = filterManager_->getAvailableFilters();
  jsi::Array arr(rt, filters.size());
  
  for (size_t i = 0; i < filters.size(); ++i) {
    jsi::Object filterObj(rt);
    filterObj.setProperty(rt, "name", jsi::String::createFromUtf8(rt, filters[i].name));
    filterObj.setProperty(rt, "displayName", jsi::String::createFromUtf8(rt, filters[i].displayName));
    filterObj.setProperty(rt, "type", jsi::String::createFromUtf8(rt, 
        filters[i].type == Camera::FilterType::SEPIA ? "SEPIA" :
        filters[i].type == Camera::FilterType::NOIR ? "NOIR" :
        filters[i].type == Camera::FilterType::MONOCHROME ? "MONOCHROME" :
        filters[i].type == Camera::FilterType::COLOR_CONTROLS ? "COLOR_CONTROLS" :
        filters[i].type == Camera::FilterType::VINTAGE ? "VINTAGE" :
        filters[i].type == Camera::FilterType::COOL ? "COOL" :
        filters[i].type == Camera::FilterType::WARM ? "WARM" :
        filters[i].type == Camera::FilterType::CUSTOM ? "CUSTOM" : "NONE"));
    filterObj.setProperty(rt, "description", jsi::String::createFromUtf8(rt, filters[i].description));
    filterObj.setProperty(rt, "isCustom", jsi::Value(filters[i].isCustom));
    
    jsi::Array formats(rt, filters[i].supportedFormats.size());
    for (size_t j = 0; j < filters[i].supportedFormats.size(); ++j) {
      formats.setValueAtIndex(rt, j, jsi::String::createFromUtf8(rt, filters[i].supportedFormats[j]));
    }
    filterObj.setProperty(rt, "supportedFormats", std::move(formats));
    
    arr.setValueAtIndex(rt, i, std::move(filterObj));
  }
  
  return arr;
}

std::optional<jsi::Object> NativeCameraFiltersModule::getFilterWithParams(jsi::Runtime& rt) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!hasFilter_) return std::nullopt;
  
  jsi::Object obj(rt);
  obj.setProperty(rt, "name", jsi::String::createFromUtf8(rt, state_.name));
  obj.setProperty(rt, "intensity", jsi::Value(state_.intensity));
  
  // Ajouter les paramètres avancés
  jsi::Object params(rt);
  params.setProperty(rt, "brightness", jsi::Value(advancedParams_.brightness));
  params.setProperty(rt, "contrast", jsi::Value(advancedParams_.contrast));
  params.setProperty(rt, "saturation", jsi::Value(advancedParams_.saturation));
  params.setProperty(rt, "hue", jsi::Value(advancedParams_.hue));
  params.setProperty(rt, "gamma", jsi::Value(advancedParams_.gamma));
  
  // Récupérer depuis les paramètres globaux C
  NaayaAdvancedFilterParams globalParams;
  if (NaayaFilters_GetAdvancedParams(&globalParams)) {
    params.setProperty(rt, "warmth", jsi::Value(globalParams.warmth));
    params.setProperty(rt, "tint", jsi::Value(globalParams.tint));
    params.setProperty(rt, "exposure", jsi::Value(globalParams.exposure));
    params.setProperty(rt, "shadows", jsi::Value(globalParams.shadows));
    params.setProperty(rt, "highlights", jsi::Value(globalParams.highlights));
    params.setProperty(rt, "vignette", jsi::Value(globalParams.vignette));
    params.setProperty(rt, "grain", jsi::Value(globalParams.grain));
  }
  
  obj.setProperty(rt, "params", std::move(params));
  return obj;
}

bool NativeCameraFiltersModule::setLUT3D(jsi::Runtime& rt, jsi::Object options) {
  if (!options.hasProperty(rt, "path")) {
    lastError_ = "LUT3D options must include 'path'";
    return false;
  }
  
  std::string path = options.getProperty(rt, "path").getString(rt).utf8(rt);
  std::string interpolation = "tetrahedral";
  
  if (options.hasProperty(rt, "interpolation")) {
    interpolation = options.getProperty(rt, "interpolation").getString(rt).utf8(rt);
  }
  
  // Construire le nom de filtre avec query string
  std::string filterName = "lut3d:" + path;
  if (interpolation != "tetrahedral") {
    filterName += "?interp=" + interpolation;
  }
  
  return setFilter(rt, jsi::String::createFromUtf8(rt, filterName), 1.0);
}

std::optional<jsi::String> NativeCameraFiltersModule::getLUT3DPath(jsi::Runtime& rt) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (lastLUTPath_.empty()) {
    return std::nullopt;
  }
  return jsi::String::createFromUtf8(rt, lastLUTPath_);
}

jsi::Object NativeCameraFiltersModule::getCapabilities(jsi::Runtime& rt) {
  jsi::Object caps(rt);
  
  // FFmpeg toujours disponible maintenant
  caps.setProperty(rt, "ffmpegAvailable", jsi::Value(true));
  
  // Processeurs disponibles
  auto availableProcessors = Camera::FilterFactory::getAvailableProcessorTypes();
  jsi::Array processors(rt, availableProcessors.size());
  for (size_t i = 0; i < availableProcessors.size(); ++i) {
    processors.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, availableProcessors[i]));
  }
  caps.setProperty(rt, "availableProcessors", std::move(processors));
  
  // Formats pixel supportés
  std::vector<std::string> formats = {"bgra", "rgba", "rgb0", "yuv420p", "rgb24", "bgr24"};
  jsi::Array pixelFormats(rt, formats.size());
  for (size_t i = 0; i < formats.size(); ++i) {
    pixelFormats.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, formats[i]));
  }
  caps.setProperty(rt, "supportedPixelFormats", std::move(pixelFormats));
  
  // Processeur actuel
  std::string currentProc =
    currentProcessor_ == Camera::FilterFactory::ProcessorType::FFMPEG ? "FFMPEG" :
    currentProcessor_ == Camera::FilterFactory::ProcessorType::OPENGL ? "OPENGL" : "CUSTOM";
  caps.setProperty(rt, "currentProcessor", jsi::String::createFromUtf8(rt, currentProc));
  
  caps.setProperty(rt, "parallelProcessingEnabled", jsi::Value(parallelProcessingEnabled_));
  caps.setProperty(rt, "threadPoolSize", jsi::Value(static_cast<double>(threadPoolSize_)));
  
  if (!lastError_.empty()) {
    caps.setProperty(rt, "lastError", jsi::String::createFromUtf8(rt, lastError_));
  }
  
  return caps;
}

bool NativeCameraFiltersModule::setProcessor(jsi::Runtime& rt, jsi::String type) {
  std::string typeStr = type.utf8(rt);
  
  Camera::FilterFactory::ProcessorType processorType;
  if (typeStr == "FFMPEG") {
    processorType = Camera::FilterFactory::ProcessorType::FFMPEG;
  } else if (typeStr == "OPENGL") {
    processorType = Camera::FilterFactory::ProcessorType::OPENGL;
  } else {
    lastError_ = "Invalid processor type: " + typeStr;
    return false;
  }
  
  if (!Camera::FilterFactory::isProcessorTypeAvailable(processorType)) {
    lastError_ = "Processor type not available: " + typeStr;
    return false;
  }
  
  currentProcessor_ = processorType;
  Camera::FilterFactory::setDefaultProcessor(processorType);
  
  // Recréer le processeur
  if (filterManager_) {
    filterManager_->clearFilters();
    auto processor = Camera::FilterFactory::createProcessor(currentProcessor_);
    filterManager_->registerProcessor(processor);
  }
  
  return true;
}

jsi::String NativeCameraFiltersModule::getProcessor(jsi::Runtime& rt) {
  std::string proc =
    currentProcessor_ == Camera::FilterFactory::ProcessorType::FFMPEG ? "FFMPEG" :
    currentProcessor_ == Camera::FilterFactory::ProcessorType::OPENGL ? "OPENGL" : "CUSTOM";
  return jsi::String::createFromUtf8(rt, proc);
}

bool NativeCameraFiltersModule::setVideoFormat(jsi::Runtime& rt, jsi::Object format) {
  if (!format.hasProperty(rt, "width") || !format.hasProperty(rt, "height") || 
      !format.hasProperty(rt, "pixelFormat")) {
    lastError_ = "VideoFormat must include width, height, and pixelFormat";
    return false;
  }
  
  videoFormat_.width = static_cast<int>(format.getProperty(rt, "width").getNumber());
  videoFormat_.height = static_cast<int>(format.getProperty(rt, "height").getNumber());
  videoFormat_.pixelFormat = format.getProperty(rt, "pixelFormat").getString(rt).utf8(rt);
  
  if (format.hasProperty(rt, "frameRate")) {
    videoFormat_.frameRate = static_cast<int>(format.getProperty(rt, "frameRate").getNumber());
  }
  
  // Configurer le filter manager
  if (filterManager_) {
    filterManager_->setInputFormat(videoFormat_.pixelFormat, videoFormat_.width, videoFormat_.height);
    filterManager_->setOutputFormat(videoFormat_.pixelFormat, videoFormat_.width, videoFormat_.height);
  }
  
  return true;
}

std::optional<jsi::Object> NativeCameraFiltersModule::getVideoFormat(jsi::Runtime& rt) {
  if (videoFormat_.width == 0 || videoFormat_.height == 0) {
    return std::nullopt;
  }
  
  jsi::Object format(rt);
  format.setProperty(rt, "width", jsi::Value(videoFormat_.width));
  format.setProperty(rt, "height", jsi::Value(videoFormat_.height));
  format.setProperty(rt, "pixelFormat", jsi::String::createFromUtf8(rt, videoFormat_.pixelFormat));
  format.setProperty(rt, "frameRate", jsi::Value(videoFormat_.frameRate));
  return format;
}

bool NativeCameraFiltersModule::setPerformanceConfig(jsi::Runtime& rt, jsi::Object config) {
  if (config.hasProperty(rt, "parallelProcessing")) {
    parallelProcessingEnabled_ = config.getProperty(rt, "parallelProcessing").getBool();
    if (filterManager_) {
      filterManager_->setParallelProcessing(parallelProcessingEnabled_);
    }
  }
  
  if (config.hasProperty(rt, "threadPoolSize")) {
    threadPoolSize_ = static_cast<size_t>(config.getProperty(rt, "threadPoolSize").getNumber());
    if (filterManager_) {
      filterManager_->setThreadPoolSize(threadPoolSize_);
    }
  }
  
  return true;
}

jsi::Object NativeCameraFiltersModule::getPerformanceConfig(jsi::Runtime& rt) {
  jsi::Object config(rt);
  config.setProperty(rt, "parallelProcessing", jsi::Value(parallelProcessingEnabled_));
  config.setProperty(rt, "threadPoolSize", jsi::Value(static_cast<double>(threadPoolSize_)));
  return config;
}

bool NativeCameraFiltersModule::processFrame(jsi::Runtime& rt, jsi::Object inputData, 
                                            jsi::Object outputData, jsi::Object format) {
  // Note: Cette méthode nécessiterait un accès aux ArrayBuffer depuis JSI
  // Pour une implémentation complète, il faudrait utiliser TypedArray
  lastError_ = "processFrame not implemented yet - requires TypedArray support";
  return false;
}

std::optional<jsi::String> NativeCameraFiltersModule::getLastError(jsi::Runtime& rt) {
  if (lastError_.empty()) {
    return std::nullopt;
  }
  return jsi::String::createFromUtf8(rt, lastError_);
}

void NativeCameraFiltersModule::clearLastError(jsi::Runtime& rt) {
  (void)rt;
  lastError_.clear();
}

bool NativeCameraFiltersModule::validateLUTFile(jsi::Runtime& rt, jsi::String path) {
  std::string pathStr = path.utf8(rt);
  
  // Vérifier l'extension
  if (pathStr.size() < 5 || pathStr.substr(pathStr.size() - 5) != ".cube") {
    lastError_ = "LUT file must have .cube extension";
    return false;
  }
  
  // TODO: Vérifier l'existence du fichier et son format
  // Pour l'instant, on considère que c'est valide si l'extension est correcte
  return true;
}

bool NativeCameraFiltersModule::supportsFormat(jsi::Runtime& rt, jsi::String pixelFormat) {
  std::string format = pixelFormat.utf8(rt);
  
  if (!filterManager_) {
    return false;
  }
  
  // Vérifier avec tous les processeurs enregistrés
  auto processors = filterManager_->getAvailableProcessors();
  for (const auto& procName : processors) {
    // TODO: Obtenir le processeur par nom et vérifier le support
    // Pour l'instant, on utilise une liste statique
    if (format == "bgra" || format == "rgba" || format == "rgb0" || 
        format == "yuv420p" || format == "rgb24" || format == "bgr24") {
      return true;
    }
  }
  
  return false;
}

bool NativeCameraFiltersModule::supportsFilter(jsi::Runtime& rt, jsi::String filterName) {
  std::string name = filterName.utf8(rt);
  
  if (!filterManager_) {
    return false;
  }
  
  auto filters = filterManager_->getAvailableFilters();
  for (const auto& filter : filters) {
    if (filter.name == name) {
      return true;
    }
  }
  
  return false;
}

// === Implémentation API de production ===

bool NativeCameraFiltersModule::setProductionConfig(jsi::Runtime& rt, jsi::Object config) {
  try {
    auto& prodConfig = Camera::ProductionConfig::getInstance();
    
    // Configuration générale
    if (config.hasProperty(rt, "productionMode")) {
      prodConfig.setProductionMode(config.getProperty(rt, "productionMode").getBool());
    }
    
    if (config.hasProperty(rt, "enableLogging")) {
      prodConfig.setLogging(config.getProperty(rt, "enableLogging").getBool());
    }
    
    if (config.hasProperty(rt, "cacheSize")) {
      size_t cacheSize = static_cast<size_t>(config.getProperty(rt, "cacheSize").getNumber());
      prodConfig.setCacheSize(cacheSize);
    }
    
    if (config.hasProperty(rt, "targetFPS")) {
      int fps = static_cast<int>(config.getProperty(rt, "targetFPS").getNumber());
      prodConfig.setTargetFPS(fps);
    }
    
    // Appliquer la configuration au FilterManager
    if (filterManager_) {
      const auto& memConfig = prodConfig.getMemory();
      const auto& perfConfig = prodConfig.getPerformance();
      
      filterManager_->getMemoryManager().setMaxCacheSize(memConfig.maxCacheSize);
      filterManager_->setThreadPoolSize(perfConfig.maxProcessingThreads);
      filterManager_->setParallelProcessing(perfConfig.enableThreadPooling);
      filterManager_->enableProfiling(prodConfig.isProfilingEnabled());
    }
    
    std::cout << "[NativeCameraFiltersModule] Configuration de production appliquée" << std::endl;
    return true;
  } catch (const std::exception& e) {
    lastError_ = std::string("Erreur configuration production: ") + e.what();
    return false;
  }
}

jsi::Object NativeCameraFiltersModule::getProductionConfig(jsi::Runtime& rt) {
  jsi::Object config(rt);
  
  const auto& prodConfig = Camera::ProductionConfig::getInstance();
  const auto& general = prodConfig.getGeneral();
  const auto& memory = prodConfig.getMemory();
  const auto& gpu = prodConfig.getGPU();
  const auto& performance = prodConfig.getPerformance();
  
  // Configuration générale
  config.setProperty(rt, "productionMode", jsi::Value(general.enableProductionMode));
  config.setProperty(rt, "enableLogging", jsi::Value(general.enableLogging));
  config.setProperty(rt, "enableCache", jsi::Value(general.enableCache));
  config.setProperty(rt, "enableOpenGL", jsi::Value(general.enableOpenGL));
  
  // Configuration mémoire
  config.setProperty(rt, "cacheSize", jsi::Value(static_cast<double>(memory.maxCacheSize)));
  config.setProperty(rt, "cleanupThreshold", jsi::Value(static_cast<double>(memory.cleanupThreshold)));
  
  // Configuration GPU
  config.setProperty(rt, "preferOpenGL", jsi::Value(gpu.preferOpenGL));
  config.setProperty(rt, "enableShaderCache", jsi::Value(gpu.enableShaderCache));
  config.setProperty(rt, "maxTextureSize", jsi::Value(gpu.maxTextureSize));
  
  // Configuration performances
  config.setProperty(rt, "targetFPS", jsi::Value(performance.targetFPS));
  config.setProperty(rt, "maxThreads", jsi::Value(performance.maxProcessingThreads));
  config.setProperty(rt, "enablePrediction", jsi::Value(performance.enablePrediction));
  
  return config;
}

jsi::Object NativeCameraFiltersModule::getSystemInfo(jsi::Runtime& rt) {
  jsi::Object info(rt);
  
  // Informations système de base
  info.setProperty(rt, "cpuCores", jsi::Value(std::thread::hardware_concurrency()));
  
  // Détection OpenGL
  bool hasOpenGL = Camera::FilterFactory::isProcessorTypeAvailable(Camera::FilterFactory::ProcessorType::OPENGL);
  info.setProperty(rt, "hasGPU", jsi::Value(hasOpenGL));
  info.setProperty(rt, "supportsOpenGLES3", jsi::Value(hasOpenGL));
  
  // Informations mémoire (estimation)
  info.setProperty(rt, "totalMemory", jsi::Value(4096.0)); // 4GB par défaut
  
  // Informations écran (valeurs par défaut)
  info.setProperty(rt, "screenWidth", jsi::Value(1080.0));
  info.setProperty(rt, "screenHeight", jsi::Value(1920.0));
  
  // Mode économie d'énergie (non détectable facilement)
  info.setProperty(rt, "isLowPowerMode", jsi::Value(false));
  
  return info;
}

jsi::Object NativeCameraFiltersModule::getPerformanceStats(jsi::Runtime& rt) {
  jsi::Object stats(rt);
  
  if (filterManager_) {
    auto perfStats = filterManager_->getPerformanceStats();
    
    stats.setProperty(rt, "averageFPS", jsi::Value(perfStats.currentFPS));
    stats.setProperty(rt, "averageProcessingTime", jsi::Value(perfStats.averageProcessingTime));
    stats.setProperty(rt, "totalFramesProcessed", jsi::Value(static_cast<double>(perfStats.totalFramesProcessed)));
    stats.setProperty(rt, "activeThreads", jsi::Value(static_cast<double>(perfStats.activeThreads)));
    stats.setProperty(rt, "queueSize", jsi::Value(static_cast<double>(perfStats.queueSize)));
    stats.setProperty(rt, "memoryUsage", jsi::Value(static_cast<double>(perfStats.memoryUsage)));
  } else {
    // Valeurs par défaut si pas de FilterManager
    stats.setProperty(rt, "averageFPS", jsi::Value(0.0));
    stats.setProperty(rt, "averageProcessingTime", jsi::Value(0.0));
    stats.setProperty(rt, "totalFramesProcessed", jsi::Value(0.0));
    stats.setProperty(rt, "activeThreads", jsi::Value(0.0));
    stats.setProperty(rt, "queueSize", jsi::Value(0.0));
    stats.setProperty(rt, "memoryUsage", jsi::Value(0.0));
  }
  
  return stats;
}

jsi::Object NativeCameraFiltersModule::getMemoryStats(jsi::Runtime& rt) {
  jsi::Object stats(rt);
  
  if (filterManager_) {
    auto memStats = filterManager_->getMemoryStats();
    
    stats.setProperty(rt, "totalAllocated", jsi::Value(static_cast<double>(memStats.totalAllocated)));
    stats.setProperty(rt, "currentlyUsed", jsi::Value(static_cast<double>(memStats.currentlyUsed)));
    stats.setProperty(rt, "peakUsage", jsi::Value(static_cast<double>(memStats.peakUsage)));
    stats.setProperty(rt, "allocationCount", jsi::Value(static_cast<double>(memStats.allocationCount)));
    stats.setProperty(rt, "deallocationCount", jsi::Value(static_cast<double>(memStats.deallocationCount)));
    stats.setProperty(rt, "cacheHits", jsi::Value(static_cast<double>(memStats.cacheHits)));
    stats.setProperty(rt, "cacheMisses", jsi::Value(static_cast<double>(memStats.cacheMisses)));
    
    // Calculer le taux de hit du cache
    double hitRate = 0.0;
    if (memStats.cacheHits + memStats.cacheMisses > 0) {
      hitRate = static_cast<double>(memStats.cacheHits) / (memStats.cacheHits + memStats.cacheMisses);
    }
    stats.setProperty(rt, "cacheHitRate", jsi::Value(hitRate));
  } else {
    // Valeurs par défaut
    stats.setProperty(rt, "totalAllocated", jsi::Value(0.0));
    stats.setProperty(rt, "currentlyUsed", jsi::Value(0.0));
    stats.setProperty(rt, "peakUsage", jsi::Value(0.0));
    stats.setProperty(rt, "allocationCount", jsi::Value(0.0));
    stats.setProperty(rt, "deallocationCount", jsi::Value(0.0));
    stats.setProperty(rt, "cacheHits", jsi::Value(0.0));
    stats.setProperty(rt, "cacheMisses", jsi::Value(0.0));
    stats.setProperty(rt, "cacheHitRate", jsi::Value(0.0));
  }
  
  return stats;
}

bool NativeCameraFiltersModule::preloadFilters(jsi::Runtime& rt, jsi::Array filterNames) {
  if (!filterManager_) {
    lastError_ = "FilterManager non initialisé";
    return false;
  }
  
  try {
    size_t count = filterNames.size(rt);
    std::vector<std::string> filters;
    filters.reserve(count);
    
    for (size_t i = 0; i < count; ++i) {
      auto value = filterNames.getValueAtIndex(rt, i);
      if (value.isString()) {
        filters.push_back(value.getString(rt).utf8(rt));
      }
    }
    
    // Précharger chaque filtre
    for (const auto& filterName : filters) {
      Camera::FilterState state;
      state.isActive = true;
      state.params.intensity = 1.0;
      
      // Mapper le nom vers le type
      if (filterName == "sepia") {
        state.type = Camera::FilterType::SEPIA;
      } else if (filterName == "vintage") {
        state.type = Camera::FilterType::VINTAGE;
      } else if (filterName == "cool") {
        state.type = Camera::FilterType::COOL;
      } else if (filterName == "warm") {
        state.type = Camera::FilterType::WARM;
      } else {
        continue; // Ignorer les filtres non reconnus
      }
      
      // Ajouter temporairement pour précharger
      filterManager_->addFilter(state);
      filterManager_->removeFilter(state.type);
    }
    
    std::cout << "[NativeCameraFiltersModule] " << filters.size() << " filtres préchargés" << std::endl;
    return true;
  } catch (const std::exception& e) {
    lastError_ = std::string("Erreur préchargement: ") + e.what();
    return false;
  }
}

bool NativeCameraFiltersModule::cleanup(jsi::Runtime& rt) {
  (void)rt;
  
  if (filterManager_) {
    // Nettoyer le cache et optimiser la mémoire
    filterManager_->clearFilters();
    filterManager_->getMemoryManager().cleanupUnused();
    
    std::cout << "[NativeCameraFiltersModule] Nettoyage effectué" << std::endl;
    return true;
  }
  
  return false;
}

bool NativeCameraFiltersModule::enableProfiling(jsi::Runtime& rt, bool enable) {
  (void)rt;
  
  if (filterManager_) {
    filterManager_->enableProfiling(enable);
    filterManager_->getMemoryManager().enableProfiling(enable);
    
    std::cout << "[NativeCameraFiltersModule] Profiling: " << (enable ? "activé" : "désactivé") << std::endl;
    return true;
  }
  
  return false;
}

bool NativeCameraFiltersModule::setTargetFPS(jsi::Runtime& rt, double fps) {
  (void)rt;
  
  auto& prodConfig = Camera::ProductionConfig::getInstance();
  prodConfig.setTargetFPS(static_cast<int>(fps));
  
  std::cout << "[NativeCameraFiltersModule] FPS cible défini: " << fps << std::endl;
  return true;
}

bool NativeCameraFiltersModule::setCacheSize(jsi::Runtime& rt, double sizeInMB) {
  (void)rt;
  
  size_t sizeInBytes = static_cast<size_t>(sizeInMB * 1024 * 1024);
  
  auto& prodConfig = Camera::ProductionConfig::getInstance();
  prodConfig.setCacheSize(sizeInBytes);
  
  if (filterManager_) {
    filterManager_->getMemoryManager().setMaxCacheSize(sizeInBytes);
  }
  
  std::cout << "[NativeCameraFiltersModule] Taille cache définie: " << sizeInMB << " MB" << std::endl;
  return true;
}

} // namespace facebook::react


#endif // NAAYA_CAMERA_FILTERS_ENABLED

// Implémentation de l'API C minimale pour l'accès Objective-C (toujours dispo)
extern "C" bool NaayaFilters_HasFilter();
extern "C" const char* NaayaFilters_GetCurrentName();
extern "C" double NaayaFilters_GetCurrentIntensity();
extern "C" bool NaayaFilters_GetAdvancedParams(NaayaAdvancedFilterParams* outParams);

extern "C" bool NaayaFilters_HasFilter() {
  std::lock_guard<std::mutex> lock(g_naaya_filters_mutex);
  return g_naaya_filters_hasFilter;
}

extern "C" const char* NaayaFilters_GetCurrentName() {
  std::lock_guard<std::mutex> lock(g_naaya_filters_mutex);
  return g_naaya_filters_name.c_str();
}

extern "C" double NaayaFilters_GetCurrentIntensity() {
  std::lock_guard<std::mutex> lock(g_naaya_filters_mutex);
  return g_naaya_filters_intensity;
}

extern "C" bool NaayaFilters_GetAdvancedParams(NaayaAdvancedFilterParams* outParams) {
  if (!outParams) return false;
  std::lock_guard<std::mutex> lock(g_naaya_filters_mutex);
  *outParams = g_naaya_filters_advanced_params;
  return true;
}

// === API de traitement FFmpeg pour iOS ===
// Traite un buffer BGRA via FFmpeg si disponible
extern "C" bool NaayaFilters_ProcessBGRA(const uint8_t* inData,
                                         int inStride,
                                         int width,
                                         int height,
                                         double fps,
                                         uint8_t* outData,
                                         int outStride);

extern "C" bool NaayaFilters_ProcessBGRA(const uint8_t* inData,
                                         int inStride,
                                         int width,
                                         int height,
                                         double fps,
                                         uint8_t* outData,
                                         int outStride) {
  // Implémentation FFmpeg obligatoire
  if (!inData || !outData || width <= 0 || height <= 0) {
    return false;
  }
  
  if (!NaayaFilters_HasFilter()) {
    return false;
  }
  
  static std::mutex sMutex;
  static std::unique_ptr<Camera::FFmpegFilterProcessor> sProcessor;
  static int sLastW = 0, sLastH = 0;
  
  std::lock_guard<std::mutex> lock(sMutex);
  
  if (!sProcessor) {
    sProcessor = std::make_unique<Camera::FFmpegFilterProcessor>();
    if (!sProcessor->initialize()) {
      sProcessor.reset();
      return false;
    }
  }
  
  // Configurer le format si changé
  if (width != sLastW || height != sLastH) {
    sProcessor->setVideoFormat(width, height, "bgra");
    sLastW = width;
    sLastH = height;
  }
  // Propager fps au processeur
  if (fps > 0) {
    sProcessor->setFrameRate((int)fps);
  }
  
  // Construire l'état du filtre
  const char* name = NaayaFilters_GetCurrentName();
  std::string filterName = name ? name : "";
  // Normaliser: retirer une éventuelle query (ex: ?interp=)
  auto qpos = filterName.find('?');
  if (qpos != std::string::npos) {
    filterName = filterName.substr(0, qpos);
  }
  
  Camera::FilterState state;
  state.isActive = true;
  state.params.intensity = NaayaFilters_GetCurrentIntensity();
  
  // Récupérer les paramètres avancés
  NaayaAdvancedFilterParams adv{};
  if (NaayaFilters_GetAdvancedParams(&adv)) {
    state.params.brightness = adv.brightness;
    state.params.contrast = adv.contrast;
    state.params.saturation = adv.saturation;
    state.params.hue = adv.hue;
    state.params.gamma = adv.gamma;
  }
  
  // Mapper le nom vers le type
  if (filterName == "sepia") {
    state.type = Camera::FilterType::SEPIA;
  } else if (filterName == "noir") {
    state.type = Camera::FilterType::NOIR;
  } else if (filterName == "monochrome") {
    state.type = Camera::FilterType::MONOCHROME;
  } else if (filterName == "color_controls") {
    state.type = Camera::FilterType::COLOR_CONTROLS;
  } else if (filterName == "vintage") {
    state.type = Camera::FilterType::VINTAGE;
  } else if (filterName == "cool") {
    state.type = Camera::FilterType::COOL;
  } else if (filterName == "warm") {
    state.type = Camera::FilterType::WARM;
  } else if (filterName.find("lut3d:") == 0) {
    state.type = Camera::FilterType::CUSTOM;
    state.params.customFilterName = filterName;
  } else {
    return false;
  }
  
  // Application sans copies intermédiaires (strides)
  bool ok = sProcessor->applyFilterWithStride(state,
                                              inData,
                                              inStride,
                                              width,
                                              height,
                                              "bgra",
                                              outData,
                                              outStride);
  return ok;
}
