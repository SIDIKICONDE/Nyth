import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeModules } from 'react-native';

interface ModuleStatus {
  name: string;
  isAvailable: boolean;
  methods: string[];
  error?: string;
}

const TestNativeModules: React.FC = () => {
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Liste des modules natifs attendus
  const expectedModules = [
    'NativeAudioCaptureModule',
    'NativeAudioCoreModule',
    'NativeAudioEffectsModule',
    'NativeAudioNoiseModule',
    'NativeAudioPipelineModule',
    'NativeAudioSafetyModule',
    'NativeAudioSpectrumModule',
    'NativeAudioUtilsModule',
    'NativeCameraFiltersModule',
  ];

  useEffect(() => {
    checkModules();
  }, []);

  const checkModules = () => {
    const statuses: ModuleStatus[] = [];

    expectedModules.forEach((moduleName) => {
      const module = NativeModules[moduleName];
      const status: ModuleStatus = {
        name: moduleName,
        isAvailable: !!module,
        methods: [],
      };

      if (module) {
        // Récupérer les méthodes disponibles
        status.methods = Object.keys(module).filter(
          (key) => typeof module[key] === 'function'
        );
      }

      statuses.push(status);
    });

    setModuleStatuses(statuses);
    setIsLoading(false);
  };

  const testAudioCapture = async () => {
    const module = NativeModules.NativeAudioCaptureModule;
    
    if (!module) {
      Alert.alert('Erreur', 'Le module NativeAudioCaptureModule n\'est pas disponible');
      return;
    }

    setIsInitializing(true);

    try {
      // Test d'initialisation
      if (typeof module.initialize === 'function') {
        const config = {
          sampleRate: 44100,
          channelCount: 1,
          bitsPerSample: 16,
          bufferSizeFrames: 1024,
        };

        const result = await module.initialize(config);
        
        Alert.alert(
          'Succès',
          `Module de capture audio initialisé avec succès!\nRésultat: ${JSON.stringify(result)}`
        );
      } else {
        Alert.alert('Erreur', 'La méthode initialize n\'est pas disponible');
      }
    } catch (error: any) {
      Alert.alert('Erreur', `Échec de l'initialisation: ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? '#4CAF50' : '#F44336';
  };

  const getStatusIcon = (isAvailable: boolean) => {
    return isAvailable ? '✅' : '❌';
  };

  const availableCount = moduleStatuses.filter((m) => m.isAvailable).length;
  const totalCount = moduleStatuses.length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Vérification des modules natifs...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test des Modules Natifs</Text>
        <Text style={styles.subtitle}>
          {availableCount}/{totalCount} modules disponibles
        </Text>
        
        {availableCount === totalCount && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              ✅ Tous les modules sont correctement initialisés!
            </Text>
          </View>
        )}
        
        {availableCount < totalCount && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              ⚠️ Certains modules ne sont pas disponibles
            </Text>
            <Text style={styles.errorHint}>
              Recompilez l'application après les modifications
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={testAudioCapture}
        disabled={isInitializing}
      >
        {isInitializing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.testButtonText}>
            Tester NativeAudioCaptureModule
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.modulesList}>
        {moduleStatuses.map((module, index) => (
          <View key={index} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>{getStatusIcon(module.isAvailable)}</Text>
              <Text style={styles.moduleName}>{module.name}</Text>
            </View>
            
            <View style={styles.moduleStatus}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(module.isAvailable) },
                ]}
              />
              <Text style={styles.statusText}>
                {module.isAvailable ? 'Disponible' : 'Non disponible'}
              </Text>
            </View>

            {module.isAvailable && module.methods.length > 0 && (
              <View style={styles.methodsList}>
                <Text style={styles.methodsTitle}>
                  Méthodes ({module.methods.length}):
                </Text>
                <Text style={styles.methodsText}>
                  {module.methods.slice(0, 3).join(', ')}
                  {module.methods.length > 3 ? '...' : ''}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions de compilation:</Text>
        <Text style={styles.instructionsText}>
          1. Android: npx react-native run-android{'\n'}
          2. iOS: cd ios && pod install && cd .. && npx react-native run-ios{'\n'}
          3. Nettoyage: cd android && ./gradlew clean{'\n'}
          4. Rebuild: cd android && ./gradlew assembleDebug
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
  errorHint: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
  testButton: {
    backgroundColor: '#2196F3',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modulesList: {
    padding: 20,
  },
  moduleCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  moduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  methodsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  methodsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  methodsText: {
    fontSize: 12,
    color: '#666',
  },
  instructions: {
    backgroundColor: '#FFF9C4',
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 20,
  },
});

export default TestNativeModules;