import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';

export default function CameraWithFiltersPro() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  const device = useCameraDevice('back');

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Simulation pour l'exemple
        setHasPermission(true);
      } catch (error) {
        console.error('Erreur de permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      // Simulation de capture
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Succès', 'Photo capturée avec filtres Pro !');
    } catch (error) {
      console.error('Erreur de capture:', error);
      Alert.alert('Erreur', 'Impossible de capturer la photo');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Permissions requises</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Appareil photo non disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* UI Overlay */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Filtres Pro</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <MaterialIcons name="camera" size={32} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isCapturing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Traitement Pro en cours...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
});