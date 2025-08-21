#pragma once

#include "common/FilterTypes.hpp"
#include <memory>
#include <string>
#include <vector>
#include <unordered_map>
#include <functional>

namespace Camera {

/**
 * Interface pour les plugins de filtres
 */
class IFilterPlugin {
public:
    virtual ~IFilterPlugin() = default;

    // Informations du plugin
    virtual std::string getName() const = 0;
    virtual std::string getDescription() const = 0;
    virtual std::string getVersion() const = 0;
    virtual std::string getAuthor() const = 0;

    // Filtres fournis par le plugin
    virtual std::vector<FilterInfo> getProvidedFilters() const = 0;

    // Création d'instance de filtre
    virtual std::shared_ptr<IFilterProcessor> createProcessor(const std::string& filterName) = 0;

    // Gestion du cycle de vie
    virtual bool initialize() = 0;
    virtual void shutdown() = 0;
};

/**
 * Métadonnées d'un plugin
 */
struct PluginMetadata {
    std::string name;
    std::string description;
    std::string version;
    std::string author;
    std::string filePath;
    bool isLoaded{false};
    std::vector<FilterInfo> supportedFilters;
};

/**
 * Gestionnaire de plugins
 */
class PluginManager {
public:
    static PluginManager& getInstance();

    // Chargement de plugins
    bool loadPlugin(const std::string& pluginPath);
    bool unloadPlugin(const std::string& pluginName);
    void unloadAllPlugins();

    // Découverte de plugins
    std::vector<PluginMetadata> discoverPlugins(const std::string& directory);
    std::vector<PluginMetadata> getLoadedPlugins() const;

    // Création de processeurs depuis plugins
    std::shared_ptr<IFilterProcessor> createProcessorFromPlugin(
        const std::string& pluginName,
        const std::string& filterName
    );

    // Informations
    PluginMetadata getPluginInfo(const std::string& pluginName) const;
    bool isPluginLoaded(const std::string& pluginName) const;

    // Gestion des chemins de recherche
    void addSearchPath(const std::string& path);
    void removeSearchPath(const std::string& path);
    std::vector<std::string> getSearchPaths() const;

private:
    PluginManager();
    ~PluginManager();

    // Types pour le stockage des plugins
    using PluginCreator = std::function<std::shared_ptr<IFilterPlugin>()>;
    using ProcessorCreator = std::function<std::shared_ptr<IFilterProcessor>(const std::string&)>;

    std::unordered_map<std::string, std::shared_ptr<IFilterPlugin>> loadedPlugins_;
    std::unordered_map<std::string, PluginMetadata> pluginMetadata_;
    std::vector<std::string> searchPaths_;

    // Méthodes internes
    bool validatePlugin(const std::string& pluginPath) const;
    std::string getPluginNameFromPath(const std::string& pluginPath) const;
    void updatePluginMetadata(const std::string& pluginName);
};

/**
 * Classe de base pour les plugins intégrés
 */
class BuiltInFilterPlugin : public IFilterPlugin {
public:
    BuiltInFilterPlugin(const std::string& name,
                       const std::string& description,
                       const std::string& version,
                       const std::string& author);
    ~BuiltInFilterPlugin() override;

    // IFilterPlugin interface
    std::string getName() const override { return name_; }
    std::string getDescription() const override { return description_; }
    std::string getVersion() const override { return version_; }
    std::string getAuthor() const override { return author_; }

    std::vector<FilterInfo> getProvidedFilters() const override;
    std::shared_ptr<IFilterProcessor> createProcessor(const std::string& filterName) override;

    bool initialize() override;
    void shutdown() override;

protected:
    // Méthodes à surcharger par les plugins dérivés
    virtual std::vector<FilterInfo> createFilterInfoList() const = 0;
    virtual std::shared_ptr<IFilterProcessor> createFilterProcessor(const std::string& filterName) = 0;

private:
    std::string name_;
    std::string description_;
    std::string version_;
    std::string author_;
    bool initialized_{false};
    std::vector<FilterInfo> filterInfo_;
};

/**
 * Plugin pour les filtres LUT 3D personnalisés
 */
class LUT3DFilterPlugin : public BuiltInFilterPlugin {
public:
    LUT3DFilterPlugin();
    ~LUT3DFilterPlugin() override;

protected:
    std::vector<FilterInfo> createFilterInfoList() const override;
    std::shared_ptr<IFilterProcessor> createFilterProcessor(const std::string& filterName) override;

private:
    // Cache des LUTs chargées
    std::unordered_map<std::string, std::vector<float>> lutCache_;
};

/**
 * Plugin pour les filtres artistiques avancés
 */
class ArtisticFilterPlugin : public BuiltInFilterPlugin {
public:
    ArtisticFilterPlugin();
    ~ArtisticFilterPlugin() override;

protected:
    std::vector<FilterInfo> createFilterInfoList() const override;
    std::shared_ptr<IFilterProcessor> createFilterProcessor(const std::string& filterName) override;
};

} // namespace Camera
