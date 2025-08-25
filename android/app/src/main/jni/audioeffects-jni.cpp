#include <jni.h>
#include <memory>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/JMessageQueueThread.h>

#include "NativeAudioEffectsModule.h"
#include "RNOH/CallInvoker.h"

using namespace facebook;
using namespace react;

// Helper function to convert ReadableMap to jsi::Object
jsi::Object convertReadableMapToJsiObject(JNIEnv *env, jsi::Runtime &runtime, jobject readableMap) {
    auto map = facebook::jni::dynamic_ref_cast<react::ReadableNativeMap::jhybridobject>(
        facebook::jni::adopt_local(readableMap));
    return jsi::Object::createFromHostObject(runtime, map->cthis()->GetMap());
}


extern "C" {

JNIEXPORT jlong JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeInitialize(JNIEnv *env, jobject thiz, jlong jsContextPointer) {
    auto runtime = reinterpret_cast<jsi::Runtime *>(jsContextPointer);
    if (!runtime) {
        return 0;
    }

    // The C++ module requires a CallInvoker. We can't easily create one here.
    // This highlights a dependency issue. For now, we'll pass a nullptr,
    // which will likely cause issues with callbacks, but will allow initialization.
    auto callInvoker = std::shared_ptr<CallInvoker>(nullptr);

    auto module = std::make_shared<NativeAudioEffectsModule>(callInvoker);
    module->setRuntime(runtime);

    // We need to keep the module alive. We'll return a pointer to it.
    // This is a simplified memory management approach. A robust solution would use
    // a structure that manages the lifecycle of these objects.
    auto *modulePtr = new std::shared_ptr<NativeAudioEffectsModule>(module);
    return reinterpret_cast<jlong>(modulePtr);
}

JNIEXPORT void JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeDispose(JNIEnv *env, jobject thiz, jlong nativeModulePtr) {
    if (nativeModulePtr == 0) {
        return;
    }
    auto *modulePtr = reinterpret_cast<std::shared_ptr<NativeAudioEffectsModule> *>(nativeModulePtr);
    (*modulePtr)->invalidateRuntime();
    delete modulePtr;
}

JNIEXPORT jboolean JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeStart(JNIEnv *env, jobject thiz, jlong nativeModulePtr) {
    if (nativeModulePtr == 0) {
        return false;
    }
    auto module = *reinterpret_cast<std::shared_ptr<NativeAudioEffectsModule> *>(nativeModulePtr);

    if(module->getRuntime()) {
        jsi::Value result = module->start(*module->getRuntime());
        return result.getBool();
    }
    return false;
}

JNIEXPORT jboolean JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeStop(JNIEnv *env, jobject thiz, jlong nativeModulePtr) {
    if (nativeModulePtr == 0) {
        return false;
    }
    auto module = *reinterpret_cast<std::shared_ptr<NativeAudioEffectsModule> *>(nativeModulePtr);

    if(module->getRuntime()) {
        jsi::Value result = module->stop(*module->getRuntime());
        return result.getBool();
    }
    return false;
}

JNIEXPORT jdouble JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeCreateEffect(JNIEnv *env, jobject thiz, jlong nativeModulePtr, jobject config) {
    if (nativeModulePtr == 0) {
        return -1.0;
    }
    auto module = *reinterpret_cast<std::shared_ptr<NativeAudioEffectsModule> *>(nativeModulePtr);
    auto runtime = module->getRuntime();
    if (!runtime) {
        return -1.0;
    }

    try {
        jsi::Object configObj = convertReadableMapToJsiObject(env, *runtime, config);
        jsi::Value result = module->createEffect(*runtime, configObj);
        if (result.isNumber()) {
            return result.asNumber();
        }
    } catch (const std::exception& e) {
        // Log the exception
    }

    return -1.0;
}

JNIEXPORT jboolean JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeDestroyEffect(JNIEnv *env, jobject thiz, jlong nativeModulePtr, jint effectId) {
    if (nativeModulePtr == 0) {
        return false;
    }
    auto module = *reinterpret_cast<std::shared_ptr<NativeAudioEffectsModule> *>(nativeModulePtr);
    auto runtime = module->getRuntime();
    if (!runtime) {
        return false;
    }

    jsi::Value result = module->destroyEffect(*runtime, effectId);
    return result.getBool();
}

JNIEXPORT jboolean JNICALL
Java_com_nyth_NativeAudioEffectsModule_nativeUpdateEffect(JNIEnv *env, jobject thiz, jlong nativeModulePtr, jint effectId, jobject config) {
    if (nativeModulePtr == 0) {
        return false;
    }
    auto module = *reinterpret_cast<std::shared_ptr<NativeAudioEffectsModule> *>(nativeModulePtr);
    auto runtime = module->getRuntime();
    if (!runtime) {
        return false;
    }

    try {
        jsi::Object configObj = convertReadableMapToJsiObject(env, *runtime, config);
        jsi::Value result = module->updateEffect(*runtime, effectId, configObj);
        return result.getBool();
    } catch (const std::exception& e) {
        // Log error
    }

    return false;
}

} // extern "C"
