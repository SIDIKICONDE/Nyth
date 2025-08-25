#pragma once
#ifndef MEMORY_POOL_HPP
#define MEMORY_POOL_HPP

#include <atomic>
#include <cstdlib>
#include <cstring>
#include <memory>
#include <mutex>
#include <new>
#include <stack>
#include <vector>

namespace Nyth { namespace Audio { namespace FX {

/**
 * @brief Lock-free memory pool for real-time audio processing
 *
 * Provides O(1) allocation/deallocation without system calls.
 * Pre-allocates memory blocks to avoid runtime allocations.
 * Thread-safe and lock-free for real-time performance.
 */
template <typename T>
class LockFreeMemoryPool {
public:
    explicit LockFreeMemoryPool(size_t poolSize = 1024) : m_poolSize(poolSize), m_allocated(0) {
        // Pre-allocate all blocks
        m_memory = static_cast<T*>(aligned_alloc(64, poolSize * sizeof(T)));
        if (!m_memory) {
            throw std::bad_alloc();
        }

        // Initialize free list
        m_freeList = new std::atomic<Node*>[poolSize];
        for (size_t i = 0; i < poolSize; ++i) {
            m_freeList[i].store(reinterpret_cast<Node*>(&m_memory[i]), std::memory_order_relaxed);
        }

        m_head.store(0, std::memory_order_relaxed);
    }

    ~LockFreeMemoryPool() {
        if (m_memory) {
            std::free(m_memory);
        }
        delete[] m_freeList;
    }

    /**
     * @brief Allocate a block from the pool
     * @return Pointer to allocated block or nullptr if pool is exhausted
     */
    T* allocate() noexcept {
        size_t head = m_head.load(std::memory_order_acquire);

        while (head < m_poolSize) {
            if (m_head.compare_exchange_weak(head, head + 1, std::memory_order_release, std::memory_order_acquire)) {
                Node* node = m_freeList[head].exchange(nullptr, std::memory_order_acquire);
                if (node) {
                    m_allocated.fetch_add(1, std::memory_order_relaxed);
                    return reinterpret_cast<T*>(node);
                }
            }
        }

        return nullptr; // Pool exhausted
    }

    /**
     * @brief Return a block to the pool
     */
    void deallocate(T* ptr) noexcept {
        if (!ptr || ptr < m_memory || ptr >= m_memory + m_poolSize) {
            return; // Invalid pointer
        }

        Node* node = reinterpret_cast<Node*>(ptr);

        // Find a free slot in the free list
        for (size_t i = 0; i < m_poolSize; ++i) {
            Node* expected = nullptr;
            if (m_freeList[i].compare_exchange_strong(expected, node, std::memory_order_release)) {
                m_allocated.fetch_sub(1, std::memory_order_relaxed);
                break;
            }
        }
    }

    /**
     * @brief Get number of allocated blocks
     */
    size_t getAllocatedCount() const noexcept {
        return m_allocated.load(std::memory_order_relaxed);
    }

    /**
     * @brief Get number of available blocks
     */
    size_t getAvailableCount() const noexcept {
        return m_poolSize - getAllocatedCount();
    }

    /**
     * @brief Reset the pool (deallocate all)
     */
    void reset() noexcept {
        m_head.store(0, std::memory_order_release);
        m_allocated.store(0, std::memory_order_release);

        for (size_t i = 0; i < m_poolSize; ++i) {
            m_freeList[i].store(reinterpret_cast<Node*>(&m_memory[i]), std::memory_order_release);
        }
    }

private:
    struct Node {
        std::atomic<Node*> next;
        alignas(T) char data[sizeof(T)];
    };

    T* m_memory;
    std::atomic<Node*>* m_freeList;
    std::atomic<size_t> m_head;
    std::atomic<size_t> m_allocated;
    const size_t m_poolSize;

    // Delete copy/move
    LockFreeMemoryPool(const LockFreeMemoryPool&) = delete;
    LockFreeMemoryPool& operator=(const LockFreeMemoryPool&) = delete;
};

/**
 * @brief Ring buffer memory pool for audio buffers
 *
 * Optimized for sequential allocation/deallocation patterns
 * common in audio processing pipelines.
 */
class RingBufferPool {
public:
    explicit RingBufferPool(size_t bufferSize = 4096, size_t numBuffers = 32)
        : m_bufferSize(bufferSize), m_numBuffers(numBuffers), m_readIndex(0), m_writeIndex(0) {
        // Allocate contiguous memory for all buffers
        m_memory = static_cast<float*>(aligned_alloc(64, bufferSize * numBuffers * sizeof(float)));
        if (!m_memory) {
            throw std::bad_alloc();
        }

        // Clear memory
        std::memset(m_memory, 0, bufferSize * numBuffers * sizeof(float));

        // Initialize buffer pointers
        m_buffers.reserve(numBuffers);
        for (size_t i = 0; i < numBuffers; ++i) {
            m_buffers.push_back(&m_memory[i * bufferSize]);
        }
    }

    ~RingBufferPool() {
        if (m_memory) {
            std::free(m_memory);
        }
    }

    /**
     * @brief Get next available buffer
     * @return Pointer to buffer or nullptr if none available
     */
    float* getBuffer() noexcept {
        size_t write = m_writeIndex.load(std::memory_order_acquire);
        size_t nextWrite = (write + 1) % m_numBuffers;

        // Check if ring buffer is full
        if (nextWrite == m_readIndex.load(std::memory_order_acquire)) {
            return nullptr; // No buffers available
        }

        float* buffer = m_buffers[write];
        m_writeIndex.store(nextWrite, std::memory_order_release);

        return buffer;
    }

    /**
     * @brief Return buffer to pool
     */
    void returnBuffer(float* buffer) noexcept {
        // Buffers are returned implicitly by advancing read index
        size_t read = m_readIndex.load(std::memory_order_acquire);
        size_t nextRead = (read + 1) % m_numBuffers;
        m_readIndex.store(nextRead, std::memory_order_release);
    }

    /**
     * @brief Clear all buffers
     */
    void clearAll() noexcept {
        std::memset(m_memory, 0, m_bufferSize * m_numBuffers * sizeof(float));
    }

    size_t getBufferSize() const noexcept {
        return m_bufferSize;
    }
    size_t getNumBuffers() const noexcept {
        return m_numBuffers;
    }

private:
    float* m_memory;
    std::vector<float*> m_buffers;
    const size_t m_bufferSize;
    const size_t m_numBuffers;
    std::atomic<size_t> m_readIndex;
    std::atomic<size_t> m_writeIndex;
};

/**
 * @brief Stack-based allocator for temporary allocations
 *
 * Very fast allocation/deallocation with LIFO pattern.
 * Perfect for temporary buffers in processing functions.
 */
class StackAllocator {
public:
    explicit StackAllocator(size_t size = 1024 * 1024) // 1MB default
        : m_size(size), m_offset(0) {
        m_memory = static_cast<uint8_t*>(aligned_alloc(64, size));
        if (!m_memory) {
            throw std::bad_alloc();
        }
    }

    ~StackAllocator() {
        if (m_memory) {
            std::free(m_memory);
        }
    }

    /**
     * @brief Allocate aligned memory from stack
     */
    void* allocate(size_t size, size_t alignment = 16) noexcept {
        // Align offset
        size_t alignedOffset = (m_offset + alignment - 1) & ~(alignment - 1);

        // Check if enough space
        if (alignedOffset + size > m_size) {
            return nullptr;
        }

        void* ptr = m_memory + alignedOffset;
        m_offset = alignedOffset + size;

        return ptr;
    }

    /**
     * @brief Mark current position for later restoration
     */
    size_t mark() const noexcept {
        return m_offset;
    }

    /**
     * @brief Restore to marked position
     */
    void restore(size_t mark) noexcept {
        m_offset = std::min(mark, m_size);
    }

    /**
     * @brief Reset allocator
     */
    void reset() noexcept {
        m_offset = 0;
    }

    /**
     * @brief Get remaining space
     */
    size_t getRemaining() const noexcept {
        return m_size - m_offset;
    }

private:
    uint8_t* m_memory;
    size_t m_size;
    size_t m_offset;
};

/**
 * @brief RAII wrapper for stack allocator
 */
class StackAllocatorScope {
public:
    explicit StackAllocatorScope(StackAllocator& allocator) : m_allocator(allocator), m_mark(allocator.mark()) {}

    ~StackAllocatorScope() {
        m_allocator.restore(m_mark);
    }

private:
    StackAllocator& m_allocator;
    size_t m_mark;
};

/**
 * @brief Object pool for frequently allocated objects
 */
template <typename T>
class ObjectPool {
public:
    explicit ObjectPool(size_t poolSize = 64) : m_poolSize(poolSize) {
        m_objects.reserve(poolSize);
        for (size_t i = 0; i < poolSize; ++i) {
            m_objects.emplace_back(std::make_unique<T>());
            m_available.push(m_objects.back().get());
        }
    }

    /**
     * @brief Get object from pool
     */
    T* acquire() {
        std::lock_guard<std::mutex> lock(m_mutex);

        if (m_available.empty()) {
            // Dynamically grow pool if needed
            m_objects.emplace_back(std::make_unique<T>());
            return m_objects.back().get();
        }

        T* obj = m_available.top();
        m_available.pop();
        return obj;
    }

    /**
     * @brief Return object to pool
     */
    void release(T* obj) {
        if (!obj)
            return;

        std::lock_guard<std::mutex> lock(m_mutex);

        // Reset object state if it has a reset method
        if constexpr (std::is_member_function_pointer<decltype(&T::reset)>::value) {
            obj->reset();
        }

        m_available.push(obj);
    }

    /**
     * @brief Get pool statistics
     */
    size_t getAvailableCount() const {
        std::lock_guard<std::mutex> lock(m_mutex);
        return m_available.size();
    }

    size_t getTotalCount() const {
        return m_objects.size();
    }

private:
    std::vector<std::unique_ptr<T>> m_objects;
    std::stack<T*> m_available;
    mutable std::mutex m_mutex;
    size_t m_poolSize;
};

/**
 * @brief Scoped object from pool (RAII)
 */
template <typename T>
class PooledObject {
public:
    PooledObject(ObjectPool<T>& pool) : m_pool(pool), m_object(pool.acquire()) {}

    ~PooledObject() {
        if (m_object) {
            m_pool.release(m_object);
        }
    }

    // Move only
    PooledObject(PooledObject&& other) noexcept : m_pool(other.m_pool), m_object(other.m_object) {
        other.m_object = nullptr;
    }

    PooledObject(const PooledObject&) = delete;
    PooledObject& operator=(const PooledObject&) = delete;

    T* operator->() {
        return m_object;
    }
    const T* operator->() const {
        return m_object;
    }
    T& operator*() {
        return *m_object;
    }
    const T& operator*() const {
        return *m_object;
    }
    T* get() {
        return m_object;
    }
    const T* get() const {
        return m_object;
    }

private:
    ObjectPool<T>& m_pool;
    T* m_object;
};

} // namespace Nyth { namespace Audio { namespace FX

#endif // MEMORY_POOL_HPP
