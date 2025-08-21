#pragma once

#include <memory>
#include <unordered_map>
#include <mutex>
#include <vector>
#include <atomic>
#include <functional>

namespace Camera {

/**
 * Gestionnaire de mémoire unifié pour le système de filtres
 * Optimise l'allocation et la réutilisation des buffers mémoire
 */
class MemoryManager {
public:
    static MemoryManager& getInstance();

    // Types de buffers supportés
    enum class BufferType {
        FRAME_RGB,      // Frames RGB/BGR
        FRAME_YUV,      // Frames YUV
        TEMPORARY,      // Buffers temporaires
        GPU_TEXTURE,    // Données de texture GPU
        SHADER_DATA     // Données de shader
    };

    // Structure pour un bloc mémoire
    struct MemoryBlock {
        void* data{nullptr};
        size_t size{0};
        BufferType type{BufferType::TEMPORARY};
        bool inUse{false};
        std::chrono::time_point<std::chrono::steady_clock> lastUsed;
        std::string tag; // Pour debug

        MemoryBlock() = default;
        MemoryBlock(size_t s, BufferType t) : size(s), type(t) {}
    };

    // Allocation de mémoire
    std::shared_ptr<MemoryBlock> allocate(size_t size, BufferType type = BufferType::TEMPORARY,
                                        const std::string& tag = "");
    void deallocate(std::shared_ptr<MemoryBlock> block);

    // Pool de buffers réutilisables
    void* getReusableBuffer(size_t size, BufferType type = BufferType::TEMPORARY);
    void returnReusableBuffer(void* buffer, size_t size, BufferType type = BufferType::TEMPORARY);

    // Statistiques
    struct MemoryStats {
        size_t totalAllocated{0};
        size_t currentlyUsed{0};
        size_t peakUsage{0};
        size_t allocationCount{0};
        size_t deallocationCount{0};
        size_t cacheHits{0};
        size_t cacheMisses{0};
        std::unordered_map<BufferType, size_t> usageByType;
    };

    MemoryStats getStats() const;

    // Configuration
    void setMaxCacheSize(size_t maxSize);
    void setCleanupThreshold(size_t threshold);
    void enableProfiling(bool enable);

    // Nettoyage automatique
    void cleanupUnused();
    void cleanupAll();

private:
    MemoryManager();
    ~MemoryManager();

    // Pool de buffers par taille et type
    struct BufferPool {
        std::vector<void*> available;
        std::vector<void*> all;
        std::unordered_map<void*, size_t> sizes;
    };

    std::unordered_map<BufferType, std::unordered_map<size_t, BufferPool>> bufferPools_;
    std::unordered_map<void*, std::pair<BufferType, size_t>> bufferInfo_;

    // Gestion des blocs mémoire
    std::vector<std::shared_ptr<MemoryBlock>> activeBlocks_;
    std::vector<std::shared_ptr<MemoryBlock>> freeBlocks_;

    // Statistiques
    mutable std::mutex statsMutex_;
    MemoryStats stats_;
    bool profilingEnabled_{false};

    // Configuration
    size_t maxCacheSize_{100 * 1024 * 1024}; // 100 MB par défaut
    size_t cleanupThreshold_{50 * 1024 * 1024}; // 50 MB
    std::chrono::minutes cleanupInterval_{5}; // 5 minutes

    mutable std::mutex mutex_;

    // Méthodes privées
    void* allocateRaw(size_t size, BufferType type);
    void deallocateRaw(void* buffer, size_t size, BufferType type);
    void updateStats(size_t size, bool allocate);
    size_t getAlignedSize(size_t size) const;
    void performCleanupIfNeeded();
};

} // namespace Camera
