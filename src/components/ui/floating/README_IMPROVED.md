# 🎨 Composants Flottants Améliorés - React Native Pur

Ce guide explique comment utiliser les nouveaux composants flottants optimisés pour React Native pur après la migration d'Expo.

## 🎯 Problèmes Résolus

Après la migration d'Expo vers React Native pur, les menus flottants peuvent présenter des problèmes :

- ✅ **BlurView** maintenant configuré correctement
- ✅ **Styles d'ombrage** optimisés pour iOS et Android
- ✅ **Z-Index** équilibrés pour éviter les conflits
- ✅ **Glassmorphisme** adapté aux deux plateformes
- ✅ **Animations** fluides et performantes

## 📦 Nouveaux Composants

### `ImprovedFloatingButton`

Bouton flottant avec styles améliorés et animations fluides.

```tsx
import { ImprovedFloatingButton } from "@/components/ui/floating";

<ImprovedFloatingButton
  onPress={handlePress}
  icon="plus"
  variant="gradient"
  gradientColors={["#FF6B6B", "#FF8E8E"]}
  size="large"
  position="bottom-right"
  animated={true}
  pulseAnimation={true}
/>;
```

#### Props

| Prop             | Type                                                 | Défaut           | Description                      |
| ---------------- | ---------------------------------------------------- | ---------------- | -------------------------------- |
| `onPress`        | `() => void`                                         | -                | Fonction appelée au clic         |
| `icon`           | `string`                                             | `"plus"`         | Nom de l'icône MaterialCommunity |
| `iconComponent`  | `React.ReactNode`                                    | -                | Composant d'icône personnalisé   |
| `size`           | `"small" \| "medium" \| "large"`                     | `"medium"`       | Taille du bouton                 |
| `position`       | `"bottom-right" \| "bottom-left" \| "bottom-center"` | `"bottom-right"` | Position                         |
| `variant`        | `"standard" \| "gradient" \| "glassmorphism"`        | `"standard"`     | Style visuel                     |
| `animated`       | `boolean`                                            | `true`           | Animation d'apparition           |
| `pulseAnimation` | `boolean`                                            | `false`          | Animation de pulsation           |

### `ImprovedFloatingMenu`

Menu flottant avec effet de verre et animations élégantes.

```tsx
import { ImprovedFloatingMenu } from "@/components/ui/floating";

<ImprovedFloatingMenu
  visible={menuVisible}
  onClose={handleClose}
  position="bottom-right"
  glassEffect={true}
  backdropBlur={true}
>
  <View>{/* Contenu de votre menu */}</View>
</ImprovedFloatingMenu>;
```

#### Props

| Prop           | Type                                          | Défaut          | Description           |
| -------------- | --------------------------------------------- | --------------- | --------------------- |
| `visible`      | `boolean`                                     | -               | Visibilité du menu    |
| `onClose`      | `() => void`                                  | -               | Fonction de fermeture |
| `position`     | `"bottom-left" \| "bottom-right" \| "center"` | `"bottom-left"` | Position              |
| `children`     | `React.ReactNode`                             | -               | Contenu du menu       |
| `backdropBlur` | `boolean`                                     | `true`          | Flou d'arrière-plan   |
| `glassEffect`  | `boolean`                                     | `true`          | Effet glassmorphisme  |

## 🔄 Migration des Anciens Composants

### Ancien Code (avec problèmes)

```tsx
// ❌ Ancien style avec problèmes
<View
  style={{
    position: "absolute",
    bottom: 100,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    zIndex: 10000, // Trop élevé
  }}
>
  <BlurView blurAmount={100} blurType="dark" />
  {/* Contenu */}
</View>
```

### Nouveau Code (optimisé)

```tsx
// ✅ Nouveau style optimisé
<ImprovedFloatingMenu
  visible={true}
  onClose={handleClose}
  position="bottom-left"
>
  {/* Contenu */}
</ImprovedFloatingMenu>
```

## 🎨 Variantes de Style

### Standard

```tsx
<ImprovedFloatingButton variant="standard" backgroundColor="#007AFF" />
```

### Gradient

```tsx
<ImprovedFloatingButton
  variant="gradient"
  gradientColors={["#FF6B6B", "#FF8E8E"]}
/>
```

### Glassmorphisme

```tsx
<ImprovedFloatingButton variant="glassmorphism" />
```

## 📱 Adaptations Plateforme

Les composants s'adaptent automatiquement :

### iOS

- ✅ BlurView natif pour les effets de flou
- ✅ Glassmorphisme avec transparence
- ✅ Ombres iOS natives

### Android

- ✅ Alternatives sans BlurView
- ✅ Élévation Material Design
- ✅ Styles adaptés Android

## 🔧 Exemple Complet

Voir `ExampleUsage.tsx` pour un exemple complet d'utilisation.

```tsx
import { FloatingComponentsExample } from "@/components/ui/floating/ExampleUsage";

// Dans votre écran
<FloatingComponentsExample />;
```

## 🚀 Performance

### Optimisations Incluses

- ✅ **Native Driver** pour les animations
- ✅ **Z-Index optimisés** (≤ 10000)
- ✅ **Mémoire** : nettoyage automatique des animations
- ✅ **Rendu conditionnel** des effets par plateforme

### Bonnes Pratiques

1. **Utilisez `pulseAnimation` avec modération** (consomme plus de batterie)
2. **Préférez `variant="standard"`** pour les performances maximales
3. **Limitez le nombre de menus flottants** simultanés
4. **Testez sur de vrais appareils** pour valider les performances

## 🐛 Dépannage

### BlurView ne fonctionne pas

```bash
# Vérifiez l'installation
cd ios && pod install
```

### Animations saccadées

```tsx
// Utilisez native driver
useNativeDriver: true;
```

### Z-Index conflicts

```tsx
// Les composants utilisent des z-index optimisés automatiquement
// Pas besoin de les modifier manuellement
```

## 📚 Migration Complète

Pour migrer tous vos menus flottants :

1. **Remplacez** les anciens composants par `ImprovedFloatingButton` et `ImprovedFloatingMenu`
2. **Testez** sur iOS et Android
3. **Ajustez** les couleurs et tailles selon vos besoins
4. **Supprimez** les anciens fichiers de style flottant
