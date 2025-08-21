Modern C++20 audio effects engine for Nyth with zero-cost abstractions.

🎯 **C++20 Features Used (100% Migration Completed):**
- ✅ **Concepts**: Type-safe constraints for audio processing
- ✅ **std::span**: Safe buffer management (replaces raw pointers)
- ✅ **std::format**: Type-safe string formatting for errors/debug
- ✅ **std::source_location**: Enhanced debugging with file/line info
- ✅ **std::ranges**: Functional programming for audio operations
- ✅ **std::ranges::transform**: Modern audio processing loops
- ✅ **std::ranges::copy**: Safe buffer operations
- ✅ **std::ranges::for_each**: Modern iteration patterns
- ✅ **std::views::iota**: Range-based indexing
- ✅ **consteval**: Compile-time computation of audio constants
- ✅ **using enum**: Cleaner enum access patterns

📦 **Components (100% C++20 Modernized):**
- ✅ `EffectBase.hpp`: Pure C++20 base interface with concepts and modern processing
- ✅ `Compressor.hpp`: Feed-forward compressor with C++20 ranges-based processing
- ✅ `Delay.hpp`: Delay effect with modern buffer management using ranges
- ✅ `EffectChain.hpp`: Effect chaining with pure C++20 range-based processing

🔧 **Integration (Modernized):**
- ✅ Android: Modern AudioEQBridge with C++20 features
- ✅ iOS: Enhanced VideoCaptureIOS with zero-cost abstractions
- ✅ **No legacy methods**: All deprecated methods removed, pure C++20 implementation

⚡ **Performance (C++20 Optimized):**
- ✅ Zero-cost abstractions through concepts and constexpr
- ✅ Type-safe at compile time with concepts
- ✅ Enhanced error messages with source locations
- ✅ Range-based algorithms for better optimization
- ✅ Modern audio processing with std::ranges::transform
- ✅ Safe buffer management with std::span
- ✅ Functional programming patterns throughout

