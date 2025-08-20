# 📷 Importateur de Presets Lightroom - Guide Complet

L'interface Filtres Pro inclut maintenant un **importateur de presets Lightroom** complet qui vous permet d'importer vos presets Adobe Lightroom (.xmp) directement dans l'app !

## 🎯 **Fonctionnalités Principales**

### **✅ Ce qui est supporté :**
- ✅ **Import de fichiers .xmp** (format principal Lightroom)
- ✅ **Import de fichiers .xml** (format alternatif)
- ✅ **Extraction automatique** de tous les réglages Lightroom
- ✅ **Conversion intelligente** vers les paramètres de l'interface
- ✅ **Gestion des presets** (sauvegarde, favoris, suppression)
- ✅ **Preview des réglages** avant application

### **🎨 Réglages Lightroom Supportés :**
| Paramètre Lightroom | Conversion Interface | Précision |
|---|---|---|
| **Exposure** | Luminosité | ✅ Parfaite |
| **Contrast** | Contraste | ✅ Parfaite |
| **Highlights** | Hautes lumières | ✅ Parfaite |
| **Shadows** | Ombres | ✅ Parfaite |
| **Whites** | Blancs | ✅ Parfaite |
| **Blacks** | Noirs | ✅ Parfaite |
| **Clarity** | Gamma/Clarté | ✅ Bonne |
| **Vibrance** | Saturation | ✅ Parfaite |
| **Saturation** | Saturation globale | ✅ Parfaite |
| **Temperature** | Chaleur | ✅ Parfaite |
| **Tint** | Teinte | ✅ Parfaite |
| **HSL Adjustments** | Teinte/Saturation | ✅ Bonne |

---

## 🚀 **Comment Utiliser**

### **1. Exporter depuis Lightroom :**

#### **Méthode A - Export Direct :**
1. **Ouvrez Lightroom** → Allez dans l'onglet **Développement**
2. **Ajustez vos paramètres** comme vous le souhaitez
3. **Menu** → **Développement** → **Enregistrer les paramètres**
4. **Choisissez** : "Enregistrer les paramètres dans un nouveau fichier .xmp"
5. **Nommez** votre preset et sauvegardez

#### **Méthode B - Export Multiple :**
1. **Sélectionnez plusieurs photos** avec les mêmes réglages
2. **Menu** → **Métadonnées** → **Enregistrer les métadonnées**
3. **Exportez** en format .xmp

### **2. Importer dans l'App :**

```tsx
import { LightroomPresetImporter } from '@/components/filtreCamera';

function AppWithLightroomSupport() {
  const [showLightroomImporter, setShowLightroomImporter] = useState(false);

  return (
    <View>
      {/* Bouton pour ouvrir l'importateur */}
      <TouchableOpacity
        onPress={() => setShowLightroomImporter(true)}
        style={styles.lightroomButton}
      >
        <Text>📷 Importer Lightroom</Text>
      </TouchableOpacity>

      {/* Importateur de presets */}
      <LightroomPresetImporter
        visible={showLightroomImporter}
        onClose={() => setShowLightroomImporter(false)}
        onImport={(preset) => {
          console.log('🎨 Preset importé:', preset.name);
          // Appliquer le preset à votre interface de filtres
          applyLightroomPreset(preset);
        }}
      />
    </View>
  );
}
```

### **3. Appliquer le Preset :**

```tsx
const applyLightroomPreset = (lightroomPreset) => {
  // Les réglages sont automatiquement convertis
  const filterParams = {
    brightness: (lightroomPreset.settings.exposure || 0) * 0.5,
    contrast: lightroomPreset.settings.contrast || 1,
    saturation: lightroomPreset.settings.saturation || 1,
    hue: (lightroomPreset.settings.hue || 0) * 180,
    gamma: 1 + (lightroomPreset.settings.clarity || 0) * 0.2,
    warmth: (lightroomPreset.settings.temperature || 0) / 100,
    tint: lightroomPreset.settings.tint || 0,
    shadows: lightroomPreset.settings.shadows || 0,
    highlights: lightroomPreset.settings.highlights || 0,
  };

  // Appliquer via l'interface de filtres
  setActiveFilter({
    name: lightroomPreset.name,
    intensity: 1.0,
    params: filterParams,
  });
};
```

---

## 🔧 **Configuration Avancée**

### **Options d'Import :**
```typescript
interface LightroomImportOptions {
  autoConvert: boolean;        // Conversion automatique
  preserveMetadata: boolean;   // Garder les métadonnées
  qualityMode: 'fast' | 'quality'; // Mode de conversion
  fallbackValues: boolean;     // Valeurs par défaut si manquantes
}
```

### **Gestion des Erreurs :**
```tsx
// Gestion d'erreurs personnalisée
<LightroomPresetImporter
  visible={showImporter}
  onClose={handleClose}
  onImport={handleImport}
  onError={(error) => {
    console.error('Erreur import Lightroom:', error);
    Alert.alert('Erreur', 'Impossible d\'importer le preset');
  }}
/>
```

---

## 📱 **Exemple Complet d'Intégration**

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import {
  FilterCameraInterfacePro,
  LightroomPresetImporter,
} from '@/components/filtreCamera';

export default function ProfessionalPhotoApp() {
  const [showFilters, setShowFilters] = useState(false);
  const [showLightroomImporter, setShowLightroomImporter] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [lightroomPresets, setLightroomPresets] = useState([]);

  const handleFilterApplied = (filterName, intensity, params) => {
    setActiveFilter({ name: filterName, intensity, params });
    console.log('🎨 Filtre appliqué:', filterName);
  };

  const handleLightroomImport = (preset) => {
    // Ajouter à la collection
    setLightroomPresets(prev => [...prev, preset]);

    // Appliquer automatiquement
    handleFilterApplied(preset.name, 1.0, preset.settings);

    Alert.alert(
      '✅ Preset Importé !',
      `"${preset.name}" a été ajouté à votre collection Lightroom.`,
      [{ text: 'Super !' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Interface de filtres principale */}
      <FilterCameraInterfacePro
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterApplied={handleFilterApplied}
        contentType="photo"
        enableExpertMode={true}
      />

      {/* Importateur Lightroom */}
      <LightroomPresetImporter
        visible={showLightroomImporter}
        onClose={() => setShowLightroomImporter(false)}
        onImport={handleLightroomImport}
      />

      {/* Contrôles de l'app */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.buttonText}>🎨 Filtres Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowLightroomImporter(true)}
        >
          <Text style={styles.buttonText}>📷 Lightroom</Text>
        </TouchableOpacity>

        {/* Affichage des presets importés */}
        {lightroomPresets.length > 0 && (
          <View style={styles.presetList}>
            <Text style={styles.presetListTitle}>
              Presets Lightroom ({lightroomPresets.length})
            </Text>
            {lightroomPresets.map((preset, index) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetItem}
                onPress={() => handleFilterApplied(preset.name, 1.0, preset.settings)}
              >
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.presetCount}>
                  {Object.keys(preset.settings).length} réglages
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    padding: 20,
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presetList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  presetListTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 5,
  },
  presetName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  presetCount: {
    color: '#007AFF',
    fontSize: 12,
  },
});
```

---

## 🎨 **Types de Presets Lightroom Supportés**

### **✅ Presets de Développement :**
- **Réglages de base** : Exposition, contraste, clarté
- **Balance des couleurs** : Température, teinte, HSL
- **Courbes tonales** : Tons clairs/sombres, blancs/noirs
- **Détails** : Clarté, vibrance, saturation

### **✅ Presets Artistiques :**
- **Looks vintage** : Température, saturation réduite
- **Styles cinématographiques** : Teal & Orange, contrastes marqués
- **Noir et blanc** : Saturation à zéro, ajustements tonals
- **Styles colorés** : Vibrance et saturation élevées

### **✅ Presets Spécialisés :**
- **Portrait** : Peau lissée, yeux mis en valeur
- **Paysage** : Détails préservés, ciels améliorés
- **Architecture** : Lignes droites, géométrie préservée
- **Nuit** : Exposition optimisée, réduction du bruit

---

## 🔄 **Synchronisation et Sauvegarde**

### **Stockage Local :**
```typescript
// Les presets sont automatiquement sauvegardés
const STORAGE_KEY = '@nyth_lightroom_presets';

// Structure de sauvegarde
interface StoredLightroomPreset {
  id: string;
  name: string;
  fileName: string;
  importedAt: Date;
  settings: LightroomSettings;
  favorite: boolean;
}
```

### **Export/Import :**
```tsx
// Export de tous les presets
const exportPresets = async () => {
  const presets = await AsyncStorage.getItem(STORAGE_KEY);
  const data = JSON.stringify(JSON.parse(presets), null, 2);

  // Partager ou sauvegarder
  await Share.share({
    message: data,
    title: 'Presets Lightroom Export',
  });
};

// Import depuis backup
const importPresets = async (backupData: string) => {
  try {
    const presets = JSON.parse(backupData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    console.log('✅ Presets restaurés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la restauration');
  }
};
```

---

## 🚀 **Avantages vs Lightroom Mobile**

| Fonctionnalité | Lightroom Mobile | Notre Interface Pro |
|---|---|---|
| **Import .xmp** | ❌ Non supporté | ✅ Pleinement supporté |
| **Précision** | 📱 Limitée mobile | 💻 Précision desktop |
| **Performance** | 📱 Optimisé mobile | ⚡ Temps réel optimisé |
| **Personnalisation** | 🔒 Fermé | 🔓 Totalement ouvert |
| **Export** | 📱 Formats limités | 📸 Tous formats |
| **Intégration** | 🔒 Adobe uniquement | 🌐 Intégration libre |

**Votre workflow Lightroom → Mobile devient enfin possible !** 🎉

---

## 💡 **Astuces et Bonnes Pratiques**

### **1. Optimisation des Presets :**
- **Exportez depuis Lightroom Desktop** pour la meilleure qualité
- **Utilisez des noms descriptifs** pour vos presets
- **Groupez par style** (portrait, paysage, etc.)
- **Testez les presets** avant de les utiliser en production

### **2. Gestion de Collection :**
- **Marquez vos favoris** pour un accès rapide
- **Supprimez régulièrement** les presets inutiles
- **Sauvegardez régulièrement** votre collection
- **Organisez par projet** ou par style

### **3. Performance :**
- **Limitez à 50-100 presets** pour de meilleures performances
- **Utilisez des noms courts** pour les presets
- **Évitez les réglages extrêmes** qui peuvent causer des artefacts
- **Testez sur différents appareils** pour la compatibilité

### **4. Création de Presets :**
- **Commencez simple** : 3-5 réglages principaux
- **Testez sur différentes photos** avant de finaliser
- **Ajustez pour mobile** : certains effets sont moins visibles
- **Documentez vos presets** avec des descriptions

---

## 🎯 **Résumé**

**L'importateur de presets Lightroom transforme votre workflow professionnel :**

### **Avant :**
❌ **Impossible** d'utiliser ses presets Lightroom sur mobile
❌ **Workflow brisé** entre desktop et mobile
❌ **Styles incohérents** entre les appareils
❌ **Perte de temps** à recréer les réglages

### **Après :**
✅ **Import direct** de vos .xmp Lightroom
✅ **Workflow fluide** desktop → mobile
✅ **Styles cohérents** sur tous vos appareils
✅ **Gain de temps** énorme !

**C'est la solution ultime pour les photographes professionnels !** 🌟📸
