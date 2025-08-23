package com.nyth.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.TurboReactPackage
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Package pour enregistrer les modules natifs audio dans React Native
 * Ce package permet d'exposer les modules C++ à JavaScript
 */
class NativeAudioModulesPackage : TurboReactPackage() {
    
    /**
     * Retourne la liste des modules natifs à enregistrer
     * Les modules C++ sont automatiquement chargés via OnLoad.cpp
     */
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        // Les modules C++ sont enregistrés directement dans OnLoad.cpp
        // via le cxxModuleProvider, donc on retourne null ici
        return null
    }
    
    /**
     * Fournit les informations sur les modules disponibles
     */
    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleInfos = mutableMapOf<String, ReactModuleInfo>()
            
            // Déclaration des modules C++ disponibles
            val cxxModules = listOf(
                "NativeAudioCaptureModule",
                "NativeAudioCoreModule",
                "NativeAudioEffectsModule",
                "NativeAudioNoiseModule",
                "NativeAudioPipelineModule",
                "NativeAudioSafetyModule",
                "NativeAudioSpectrumModule",
                "NativeAudioUtilsModule",
                "NativeCameraFiltersModule"
            )
            
            // Enregistrer chaque module C++ comme TurboModule
            cxxModules.forEach { moduleName ->
                moduleInfos[moduleName] = ReactModuleInfo(
                    moduleName,
                    moduleName,
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    false,  // isCxxModule - false car géré par cxxModuleProvider
                    true    // isTurboModule
                )
            }
            
            moduleInfos
        }
    }
}