# Module Camera

Ce module fournit une interface complète pour la caméra utilisant React Native Vision Camera.

## Composants

### CameraModule

Le composant principal qui combine la vue caméra et les contrôles.

```tsx
import { CameraModule } from "../camera";

<CameraModule
  onRecordingComplete={(video) => console.log("Vidéo enregistrée:", video)}
  onPhotoTaken={(photo) => console.log("Photo prise:", photo)}
  onError={(error) => console.error("Erreur caméra:", error)}
  initialPosition="front" // 'front' ou 'back'
  showControls={true}
/>;
```

### CameraView

Vue caméra sans contrôles intégrés pour une utilisation personnalisée.

```tsx
import { CameraView } from "../camera";

<CameraView
  onRecordingComplete={(video) => handleVideo(video)}
  onError={(error) => handleError(error)}
  initialPosition="back"
/>;
```

## Hooks

### useCamera

Hook principal pour gérer la caméra.

```tsx
import { useCamera } from "../camera";

const {
  cameraRef,
  device,
  position,
  isFlashOn,
  recordingState,
  hasCameraPermission,
  hasMicrophonePermission,
  requestPermissions,
  controls,
  setStartRecordingOptions,
} = useCamera("back");

// Contrôles disponibles
controls.startRecording();
controls.stopRecording();
controls.pauseRecording();
controls.resumeRecording();
controls.takePhoto();
controls.switchCamera();
controls.toggleFlash();

// Optionnel: définir dynamiquement les options d'enregistrement (codec, bitrate...)
setStartRecordingOptions({
  fileType: 'mp4',
  videoCodec: 'h264',
  videoBitRate: 8_000_000, // 8 Mbps
  audioBitRate: 256_000,   // 256 kbps
});
```

## Fonctionnalités

- ✅ Enregistrement vidéo avec audio
- ✅ Prise de photos
- ✅ Basculement entre caméras avant/arrière
- ✅ Contrôle du flash
- ✅ Pause/reprise de l'enregistrement
- ✅ Gestion des permissions
- ✅ Indicateur d'enregistrement avec durée
- ✅ Zoom par gestes
- ✅ Interface utilisateur intuitive

## Installation

Le module utilise `react-native-vision-camera` qui doit être installé et configuré :

```bash
npm install react-native-vision-camera
```

Suivez la documentation officielle pour la configuration native :
https://react-native-vision-camera.com/docs/guides

## Permissions

Le module gère automatiquement les demandes de permissions pour :

- Caméra
- Microphone

Les permissions sont vérifiées au montage du composant.

## Types

Tous les types TypeScript sont exportés depuis `./types/index.ts` :

- `CameraConfig`
- `RecordingState`
- `CameraControls`
- `CameraPermissions`
- Et plus...
