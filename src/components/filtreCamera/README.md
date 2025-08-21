# Interface de Filtres pour Caméra

Cette interface moderne permet aux utilisateurs d'appliquer des filtres en temps réel sur la caméra avec des contrôles avancés et support des LUT 3D.

## 🎨 Fonctionnalités

- **Filtres prédéfinis** : Sépia, Noir & Blanc, Vintage, Cool, Warm, etc.
- **Contrôles avancés** : 12 paramètres ajustables (luminosité, contraste, saturation, etc.)
- **Support LUT 3D** : Import et application de fichiers .cube professionnels
- **Presets** : Collection de looks prédéfinis pour différents styles
- **Interface moderne** : Animations fluides, design glassmorphism, optimisé mobile
- **Performance** : Support du traitement parallèle et optimisations SIMD

## 📱 Utilisation

### Import basique

```tsx
import { FilterCameraInterface } from '@/components/filtreCamera';

function CameraScreen() {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterApplied = (filterName: string, intensity: number, params?: AdvancedFilterParams) => {
    console.log('Filtre appliqué:', filterName, intensity, params);
    // Le filtre est déjà appliqué nativement
  };

  return (
    <>
      <Camera style={styles.camera}>
        {/* Votre UI de caméra */}
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Icon name="color-filter" />
        </TouchableOpacity>
      </Camera>

      <FilterCameraInterface
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterApplied={handleFilterApplied}
        currentImage={capturedPhotoUri} // Optionnel : pour preview
      />
    </>
  );
}
```

### Utilisation avancée avec l'API

```tsx
import { cameraFiltersAPI } from '@/services/camera/filters/CameraFiltersAPI';

// Obtenir les capacités du système
const capabilities = await cameraFiltersAPI.getCapabilities();
console.log('FFmpeg disponible:', capabilities.ffmpegAvailable);
console.log('Processeurs:', capabilities.availableProcessors);

// Changer de processeur (ex: OpenGL)
if (capabilities.availableProcessors.includes('OPENGL')) {
  await cameraFiltersAPI.setProcessor('OPENGL');
}

// Configurer la performance
await cameraFiltersAPI.setPerformanceConfig({
  parallelProcessing: true,
  threadPoolSize: 8
});

// Appliquer un filtre avec paramètres personnalisés
await cameraFiltersAPI.setFilterWithParams('vintage', 0.8, {
  brightness: 0.1,
  contrast: 1.2,
  saturation: 0.8,
  vignette: 0.3,
  grain: 0.4
});

// Appliquer une LUT 3D
await cameraFiltersAPI.setLUT3D('/path/to/teal-orange.cube', 'tetrahedral');

// Obtenir l'état actuel complet
const currentFilter = await cameraFiltersAPI.getFilterWithParams();
console.log('Filtre actif:', currentFilter);
```

## 🎛️ Paramètres avancés

| Paramètre | Plage | Par défaut | Description |
|-----------|-------|------------|-------------|
| brightness | -1.0 à 1.0 | 0.0 | Luminosité globale |
| contrast | 0.0 à 2.0 | 1.0 | Contraste de l'image |
| saturation | 0.0 à 2.0 | 1.0 | Intensité des couleurs |
| hue | -180 à 180 | 0.0 | Rotation de la teinte (degrés) |
| gamma | 0.1 à 3.0 | 1.0 | Correction gamma |
| warmth | -1.0 à 1.0 | 0.0 | Température de couleur |
| tint | -1.0 à 1.0 | 0.0 | Balance magenta/vert |
| exposure | -2.0 à 2.0 | 0.0 | Exposition (EV) |
| shadows | -1.0 à 1.0 | 0.0 | Ajustement des ombres |
| highlights | -1.0 à 1.0 | 0.0 | Ajustement des hautes lumières |
| vignette | 0.0 à 1.0 | 0.0 | Effet de vignettage |
| grain | 0.0 à 1.0 | 0.0 | Grain de film |

## 🎬 Presets inclus

### Portrait
- **Portrait Doux** : Adoucit la peau avec une lueur chaleureuse
- **Portrait Dramatique** : Contraste élevé pour des portraits intenses

### Paysage
- **Paysage Vibrant** : Couleurs éclatantes pour la nature
- **Paysage Mélancolique** : Ambiance sombre et mystérieuse

### Artistique
- **Film Analogique** : Émulation de pellicule cinéma
- **Noir Contrasté** : Noir et blanc dramatique

### Cinématique
- **Teal & Orange** : Look cinématographique populaire
- **Blockbuster** : Style de film à gros budget

### Vintage
- **Années 70** : Couleurs chaudes et délavées
- **Délavé** : Effet photo ancienne décolorée

## 🔧 Configuration requise

### Images de preview (optionnel)
Créez les images de preview dans `assets/filters/` :
- `preview-none.jpg`
- `preview-sepia.jpg`
- `preview-noir.jpg`
- `preview-monochrome.jpg`
- `preview-vintage.jpg`
- `preview-cool.jpg`
- `preview-warm.jpg`

### Dépendances (React Native, sans Expo)
Installer les librairies suivantes:

```bash
yarn add @react-native-community/blur react-native-linear-gradient react-native-document-picker react-native-fs react-native-vector-icons @react-native-async-storage/async-storage @react-native-community/slider

# ou
npm i @react-native-community/blur react-native-linear-gradient react-native-document-picker react-native-fs react-native-vector-icons @react-native-async-storage/async-storage @react-native-community/slider
```

#### iOS
```bash
cd ios && pod install && cd -
```

Assurez-vous que `react-native-vector-icons` charge bien ses polices:
- Auto-linking gère normalement l’intégration. Si besoin, ajoutez les fonts dans Info.plist (UIAppFonts) ou vérifiez le postinstall.

#### Android
- Vérifiez que les permissions sont présentes si nécessaire (DocumentPicker/FS):
  - READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE (Android < 10) ou MANAGE_EXTERNAL_STORAGE selon votre stratégie.
- `react-native-vector-icons` est auto-linké (fonts via Gradle).

## 🚀 Performance

- **Traitement parallèle** : Division automatique en bandes pour multi-threading
- **Optimisations SIMD** : Support AVX2/SSE2/NEON selon la plateforme
- **Cache de graphe FFmpeg** : Évite la reconstruction inutile
- **Double buffering** : Minimise les copies mémoire
- **Pool de threads** : Configurable de 1 à 16 threads

## 📱 Support multi-plateforme

- **iOS** : FFmpeg uniquement
- **Android** : FFmpeg + OpenGL
- **Fallback** : Mode CPU optimisé si FFmpeg non disponible

## 🎯 Roadmap


- [ ] Pipeline OpenGL complet pour Android
- [ ] Export/import de presets personnalisés
- [ ] Historique des filtres appliqués
- [ ] Mode comparaison avant/après
- [ ] Support des masques et filtres localisés
- [ ] Intégration IA pour suggestions de filtres

## 📄 License

Propriétaire - Nyth App
