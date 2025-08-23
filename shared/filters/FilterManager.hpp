#pragma once

#include <string>
#include <vector>
#include <queue>
#include <memory>
#include <functional>
#include <future>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <stdexcept>
#include <cstdint>
#include <cstring>
#include <time.h>

#include "common/FilterTypes.hpp"
#include "MemoryManager.hpp"

namespace Camera {

    // Optimized Thread pool for parallel processing
class ThreadPool {
public:
    ThreadPool(size_t numThreads = std::thread::hardware_concurrency());
    ~ThreadPool();

    template<typename F>
    auto enqueue(F&& f) -> std::future<decltype(f())> {
        auto task = std::make_shared<std::packaged_task<decltype(f())()>>(
            std::forward<F>(f)
        );

        auto result = task->get_future();
        {
            std::unique_lock<std::mutex> lock(queueMutex_);
            if (stop_) {
                throw std::runtime_error("ThreadPool stopped");
            }
            tasks_.emplace([task](){ (*task)(); });
        }
        condition_.notify_one();
        return result;
    }

    // Get current queue size for monitoring
    size_t getQueueSize() const {
        std::unique_lock<std::mutex> lock(queueMutex_);
        return tasks_.size();
    }

    // Check if all threads are busy
    bool isBusy() const {
        std::unique_lock<std::mutex> lock(queueMutex_);
        return !tasks_.empty();
    }

    // Wait for all tasks to complete
    void waitForCompletion() {
        std::unique_lock<std::mutex> lock(queueMutex_);
        conditionEmpty_.wait(lock, [this] { return tasks_.empty(); });
    }

private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    mutable std::mutex queueMutex_;
    std::condition_variable condition_;
    std::condition_variable conditionEmpty_;
    bool stop_{false};
};

/**
 * Gestionnaire principal des filtres
 * Architecture modulaire permettant d'ajouter différents processeurs
 */
class FilterManager {
public:
    FilterManager();
    ~FilterManager();
    
    // Initialisation
    bool initialize();
    void shutdown();
    
    // Gestion des processeurs
    bool registerProcessor(std::shared_ptr<IFilterProcessor> processor);
    bool unregisterProcessor(const std::string& name);
    std::vector<std::string> getAvailableProcessors() const;
    
    // Gestion des filtres
    bool addFilter(const FilterState& filter);
    bool removeFilter(FilterType type);
    bool clearFilters();
    FilterState getFilter(FilterType type) const;
    std::vector<FilterState> getActiveFilters() const;
    
    // Traitement
    bool processFrame(const void* inputData, size_t inputSize,
                     void* outputData, size_t outputSize);
    
    // Traitement parallèle
    bool processFrameParallel(const void* inputData, size_t inputSize,
                             void* outputData, size_t outputSize);
    
    // Configuration
    bool setInputFormat(const std::string& format, int width, int height);
    bool setOutputFormat(const std::string& format, int width, int height);
    
    // Configuration du parallélisme
    void setParallelProcessing(bool enabled);
    bool isParallelProcessingEnabled() const;
    void setThreadPoolSize(size_t numThreads);
    
    // Informations
    bool isInitialized() const;
    std::string getLastError() const;
    std::vector<FilterInfo> getAvailableFilters() const;

    // Performance monitoring
    struct PerformanceStats {
        double averageProcessingTime{0.0};  // Temps moyen de traitement en ms
        size_t totalFramesProcessed{0};      // Nombre total de frames traitées
        double currentFPS{0.0};              // FPS actuel
        size_t activeThreads{0};             // Nombre de threads actifs
        size_t queueSize{0};                 // Taille de la file d'attente
        size_t memoryUsage{0};               // Utilisation mémoire en bytes
    };

    PerformanceStats getPerformanceStats() const;
    void resetPerformanceStats();
    void enableProfiling(bool enabled);

    // Gestion de la mémoire
    MemoryManager& getMemoryManager() const;
    MemoryManager::MemoryStats getMemoryStats() const;
    
    // Factory pour créer des filtres prédéfinis
    static FilterState createSepiaFilter(double intensity = 1.0);
    static FilterState createNoirFilter(double intensity = 1.0);
    static FilterState createMonochromeFilter(double intensity = 1.0);
    static FilterState createColorControlsFilter(double brightness = 0.0, 
                                               double contrast = 1.0, 
                                               double saturation = 1.0);
    static FilterState createVintageFilter(double intensity = 1.0);
    static FilterState createCoolFilter(double intensity = 1.0);
    static FilterState createWarmFilter(double intensity = 1.0);
    static FilterState createCustomFilter(const std::string& name, 
                                        const std::vector<double>& params);

private:
    // État interne
    mutable std::mutex mutex_;
    bool initialized_{false};
    std::string lastError_;
    
    // Processeurs enregistrés
    std::vector<std::shared_ptr<IFilterProcessor>> processors_;
    std::unordered_map<std::string, std::shared_ptr<IFilterProcessor>> processorMap_;
    
    // Filtres actifs
    std::vector<FilterState> activeFilters_;
    
    // Configuration
    std::string inputFormat_;
    std::string outputFormat_;
    int inputWidth_{0};
    int inputHeight_{0};
    int outputWidth_{0};
    int outputHeight_{0};
    
    // Thread pool pour traitement parallèle
    std::unique_ptr<ThreadPool> threadPool_;
    bool parallelProcessingEnabled_{false};
    size_t threadPoolSize_{4};
    
    // Buffers pour traitement parallèle
    mutable std::vector<std::vector<uint8_t>> parallelBuffers_;

    // Gestionnaire de mémoire
    MemoryManager* memoryManager_; // Singleton instance

    // Performance monitoring
    mutable bool profilingEnabled_{false};
    mutable std::chrono::time_point<std::chrono::high_resolution_clock> lastFrameTime_;
    mutable std::vector<double> processingTimes_;
    mutable PerformanceStats perfStats_;

    // Méthodes privées
    bool findBestProcessor(const FilterState& filter, std::shared_ptr<IFilterProcessor>& processor);
    void setLastError(const std::string& error);
    bool validateFilter(const FilterState& filter) const;
    void updatePerformanceStats(double processingTime) const;
};

} // namespace Camera
