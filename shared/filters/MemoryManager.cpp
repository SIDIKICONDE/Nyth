#include "MemoryManager.hpp"
#include <iostream>
#include <algorithm>
#include <chrono>
#include <cstring>

namespace Camera {

MemoryManager& MemoryManager::getInstance() {
    static MemoryManager instance;
    return instance;
}

MemoryManager::MemoryManager() {
    std::cout << "[MemoryManager] Initialisé avec cache max: "
              << (maxCacheSize_ / 1024 / 1024) << " MB" << std::endl;
}

MemoryManager::~MemoryManager() {
    cleanupAll();
    std::cout << "[MemoryManager] Arrêt - mémoire libérée" << std::endl;
}

std::shared_ptr<MemoryManager::MemoryBlock> MemoryManager::allocate(
    size_t size, BufferType type, const std::string& tag) {

    std::lock_guard<std::mutex> lock(mutex_);

    size_t alignedSize = getAlignedSize(size);

    // Chercher dans les blocs libres
    for (auto it = freeBlocks_.begin(); it != freeBlocks_.end(); ++it) {
        auto& block = *it;
        if (block->size >= alignedSize && block->type == type && !block->inUse) {
            block->inUse = true;
            block->lastUsed = std::chrono::steady_clock::now();
            block->tag = tag;

            activeBlocks_.push_back(block);
            freeBlocks_.erase(it);

            updateStats(alignedSize, true);
            return block;
        }
    }

    // Allouer un nouveau bloc
    auto block = std::make_shared<MemoryBlock>(alignedSize, type);
    block->data = allocateRaw(alignedSize, type);
    block->inUse = true;
    block->lastUsed = std::chrono::steady_clock::now();
    block->tag = tag;

    if (!block->data) {
        std::cout << "[MemoryManager] Échec allocation: " << alignedSize << " bytes" << std::endl;
        return nullptr;
    }

    activeBlocks_.push_back(block);
    updateStats(alignedSize, true);

    if (profilingEnabled_) {
        std::cout << "[MemoryManager] Allocation: " << alignedSize << " bytes (" << tag << ")" << std::endl;
    }

    return block;
}

void MemoryManager::deallocate(std::shared_ptr<MemoryBlock> block) {
    if (!block) return;

    std::lock_guard<std::mutex> lock(mutex_);

    block->inUse = false;
    block->lastUsed = std::chrono::steady_clock::now();

    // Retirer des blocs actifs
    auto it = std::find(activeBlocks_.begin(), activeBlocks_.end(), block);
    if (it != activeBlocks_.end()) {
        activeBlocks_.erase(it);
    }

    // Ajouter aux blocs libres
    freeBlocks_.push_back(block);

    updateStats(block->size, false);

    if (profilingEnabled_) {
        std::cout << "[MemoryManager] Désallocation: " << block->size << " bytes" << std::endl;
    }

    performCleanupIfNeeded();
}

void* MemoryManager::getReusableBuffer(size_t size, BufferType type) {
    std::lock_guard<std::mutex> lock(mutex_);

    size_t alignedSize = getAlignedSize(size);
    auto& pool = bufferPools_[type][alignedSize];

    // Chercher un buffer disponible
    if (!pool.available.empty()) {
        void* buffer = pool.available.back();
        pool.available.pop_back();
        stats_.cacheHits++;

        if (profilingEnabled_) {
            std::cout << "[MemoryManager] Cache hit: " << alignedSize << " bytes" << std::endl;
        }

        return buffer;
    }

    // Allouer un nouveau buffer
    void* buffer = allocateRaw(alignedSize, type);
    if (buffer) {
        pool.all.push_back(buffer);
        pool.sizes[buffer] = alignedSize;
        bufferInfo_[buffer] = {type, alignedSize};
        stats_.cacheMisses++;

        if (profilingEnabled_) {
            std::cout << "[MemoryManager] Cache miss: " << alignedSize << " bytes" << std::endl;
        }
    }

    return buffer;
}

void MemoryManager::returnReusableBuffer(void* buffer, size_t size, BufferType type) {
    if (!buffer) return;

    std::lock_guard<std::mutex> lock(mutex_);

    size_t alignedSize = getAlignedSize(size);
    auto& pool = bufferPools_[type][alignedSize];

    // Vérifier que le buffer appartient bien à ce pool
    auto it = pool.sizes.find(buffer);
    if (it != pool.sizes.end()) {
        pool.available.push_back(buffer);
    }
}

MemoryManager::MemoryStats MemoryManager::getStats() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return stats_;
}

void MemoryManager::setMaxCacheSize(size_t maxSize) {
    std::lock_guard<std::mutex> lock(mutex_);
    maxCacheSize_ = maxSize;
    std::cout << "[MemoryManager] Cache max défini: " << (maxSize / 1024 / 1024) << " MB" << std::endl;
}

void MemoryManager::setCleanupThreshold(size_t threshold) {
    std::lock_guard<std::mutex> lock(mutex_);
    cleanupThreshold_ = threshold;
}

void MemoryManager::enableProfiling(bool enable) {
    std::lock_guard<std::mutex> lock(mutex_);
    profilingEnabled_ = enable;
    std::cout << "[MemoryManager] Profiling: " << (enable ? "activé" : "désactivé") << std::endl;
}

void MemoryManager::cleanupUnused() {
    std::lock_guard<std::mutex> lock(mutex_);

    auto now = std::chrono::steady_clock::now();
    auto cutoff = now - cleanupInterval_;

    // Nettoyer les blocs libres anciens
    auto it = freeBlocks_.begin();
    while (it != freeBlocks_.end()) {
        if (!(*it)->inUse && (*it)->lastUsed < cutoff) {
            deallocateRaw((*it)->data, (*it)->size, (*it)->type);
            it = freeBlocks_.erase(it);
        } else {
            ++it;
        }
    }

    // Nettoyer les buffers disponibles dans les pools
    for (auto& typePools : bufferPools_) {
        for (auto& sizePool : typePools.second) {
            auto& pool = sizePool.second;
            if (pool.available.size() > 10) { // Garder max 10 buffers par pool
                size_t toRemove = pool.available.size() - 10;
                for (size_t i = 0; i < toRemove; ++i) {
                    void* buffer = pool.available.back();
                    pool.available.pop_back();

                    // Retirer du pool
                    auto it = std::find(pool.all.begin(), pool.all.end(), buffer);
                    if (it != pool.all.end()) {
                        pool.all.erase(it);
                        pool.sizes.erase(buffer);
                        bufferInfo_.erase(buffer);
                        deallocateRaw(buffer, sizePool.first, typePools.first);
                    }
                }
            }
        }
    }

    std::cout << "[MemoryManager] Nettoyage terminé" << std::endl;
}

void MemoryManager::cleanupAll() {
    std::lock_guard<std::mutex> lock(mutex_);

    // Libérer tous les blocs
    for (auto& block : activeBlocks_) {
        if (block->data) {
            deallocateRaw(block->data, block->size, block->type);
        }
    }
    activeBlocks_.clear();

    for (auto& block : freeBlocks_) {
        if (block->data) {
            deallocateRaw(block->data, block->size, block->type);
        }
    }
    freeBlocks_.clear();

    // Libérer tous les buffers des pools
    for (auto& typePools : bufferPools_) {
        for (auto& sizePool : typePools.second) {
            auto& pool = sizePool.second;
            for (void* buffer : pool.all) {
                deallocateRaw(buffer, sizePool.first, typePools.first);
            }
            pool.available.clear();
            pool.all.clear();
            pool.sizes.clear();
        }
    }
    bufferPools_.clear();
    bufferInfo_.clear();

    std::cout << "[MemoryManager] Nettoyage complet terminé" << std::endl;
}

// Méthodes privées

void* MemoryManager::allocateRaw(size_t size, BufferType type) {
    void* data = nullptr;

    switch (type) {
        case BufferType::GPU_TEXTURE:
            // Pour les données GPU, utiliser des allocations alignées
            #ifdef _WIN32
            data = _aligned_malloc(size, 64);
            #elif defined(__APPLE__) || defined(__ANDROID__)
            posix_memalign(&data, 64, size);
            #else
            data = aligned_alloc(64, size);
            #endif
            break;

        default:
            // Allocation standard alignée
            #ifdef _WIN32
            data = _aligned_malloc(size, 32);
            #elif defined(__APPLE__) || defined(__ANDROID__)
            posix_memalign(&data, 32, size);
            #else
            data = aligned_alloc(32, size);
            #endif
            break;
    }

    if (!data) {
        std::cerr << "[MemoryManager] Échec allocation raw: " << size << " bytes" << std::endl;
    }

    return data;
}

void MemoryManager::deallocateRaw(void* buffer, size_t size, BufferType type) {
    if (!buffer) return;

    #ifdef _WIN32
    _aligned_free(buffer);
    #else
    free(buffer);
    #endif
}

void MemoryManager::updateStats(size_t size, bool allocate) {
    std::lock_guard<std::mutex> lock(statsMutex_);

    if (allocate) {
        stats_.totalAllocated += size;
        stats_.currentlyUsed += size;
        stats_.allocationCount++;

        if (stats_.currentlyUsed > stats_.peakUsage) {
            stats_.peakUsage = stats_.currentlyUsed;
        }
    } else {
        stats_.currentlyUsed -= size;
        stats_.deallocationCount++;
    }
}

size_t MemoryManager::getAlignedSize(size_t size) const {
    // Aligner à 64 bytes pour optimiser les performances SIMD
    return (size + 63) & ~63;
}

void MemoryManager::performCleanupIfNeeded() {
    if (stats_.currentlyUsed >= cleanupThreshold_) {
        cleanupUnused();
    }
}

} // namespace Camera
