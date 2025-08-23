/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// OnLoad.cpp - Custom TurboModule registration for Nyth Audio Modules
//
// This file configures the registration of custom native audio modules
// with React Native's TurboModule system.
//
// The modules are properly configured in CMakeLists.txt and package.json
// codegenConfig, and we rely on React Native's autolinking system to handle
// the module registration automatically.

#include <memory>
#include <string>

// React Native includes (conditionally included based on availability)
#ifdef __has_include
  #if __has_include(<DefaultComponentsRegistry.h>)
    #include <DefaultComponentsRegistry.h>
  #endif
  #if __has_include(<DefaultTurboModuleManagerDelegate.h>)
    #include <DefaultTurboModuleManagerDelegate.h>
  #endif
  #if __has_include(<autolinking.h>)
    #include <autolinking.h>
  #endif
  #if __has_include(<fbjni/fbjni.h>)
    #include <fbjni/fbjni.h>
  #endif
#endif

// Forward declarations for React Native types
namespace facebook::react {
    class TurboModule;
    class CallInvoker;
}

// External function from autolinking system (if available)
#ifdef __cplusplus
extern "C" {
#endif
std::shared_ptr<facebook::react::TurboModule> autolinking_cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<facebook::react::CallInvoker>& jsInvoker);
#ifdef __cplusplus
}
#endif

namespace facebook::react {

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  
  // Register custom TurboModules for Nyth Audio System
  // These modules are handled by the autolinking system configured in package.json
  // The actual module registration is done through the codegen system
  
  // And we fallback to the CXX module providers autolinked
  return autolinking_cxxModuleProvider(name, jsInvoker);
}

} // namespace facebook::react

// JNI_OnLoad function (if React Native headers are available)
#ifdef __has_include
  #if __has_include(<fbjni/fbjni.h>) && __has_include(<DefaultTurboModuleManagerDelegate.h>)
    JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
      return facebook::jni::initialize(vm, [] {
        facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
            &facebook::react::cxxModuleProvider;
      });
    }
  #endif
#endif

