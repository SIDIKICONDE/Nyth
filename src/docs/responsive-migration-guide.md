# Guide de Migration Responsive pour l'Application React Native

## Introduction

Ce guide explique comment rendre votre application React Native complètement responsive en utilisant les nouveaux utilitaires et composants créés.

## 1. Utilitaires Responsive

### Fichiers créés :
- `/src/utils/responsive.ts` - Fonctions de scaling et dimensions responsive
- `/src/utils/responsiveTailwind.ts` - Extension de Tailwind avec support responsive
- `/src/hooks/useResponsive.ts` - Hook pour accéder aux fonctions responsive

## 2. Composants Responsive

### Composants de base créés :
- `ResponsiveView` - Container avec padding et safe area responsive
- `ResponsiveText` - Texte avec tailles de police adaptatives
- `ResponsiveButton` - Boutons avec dimensions adaptatives
- `ResponsiveImage` - Images avec gestion responsive
- `ResponsiveGrid` - Système de grille adaptive

## 3. Migration des Screens

### Étape 1 : Remplacer les imports

```typescript
// Avant
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

// Après
import { View } from 'react-native';
import { ResponsiveView, ResponsiveText, ResponsiveButton } from '@/components/common';
import { useResponsive } from '@/hooks/useResponsive';
```

### Étape 2 : Remplacer les dimensions fixes

```typescript
// Avant
style={{
  width: width * 0.8,
  height: 200,
  padding: 16,
  marginTop: 20
}}

// Après
const { wp, hp, moderateScale } = useResponsive();

style={{
  width: wp(80),
  height: moderateScale(200),
  padding: dimensions.padding.medium,
  marginTop: dimensions.margin.large
}}
```

### Étape 3 : Utiliser les composants responsive

```typescript
// Avant
<View style={tw`flex-1 px-4 py-6`}>
  <Text style={tw`text-2xl font-bold`}>Titre</Text>
  <TouchableOpacity style={tw`bg-blue-500 p-4 rounded-lg`}>
    <Text style={tw`text-white`}>Bouton</Text>
  </TouchableOpacity>
</View>

// Après
<ResponsiveView safeArea="both">
  <ResponsiveText variant="h2" weight="bold">Titre</ResponsiveText>
  <ResponsiveButton 
    title="Bouton"
    variant="primary"
    size="large"
    fullWidth
  />
</ResponsiveView>
```

## 4. Patterns Responsive Communs

### Container avec Safe Area
```typescript
<ResponsiveView safeArea="both" padding>
  {/* Contenu */}
</ResponsiveView>
```

### Grille Adaptive
```typescript
<ResponsiveGrid columns={2} gap={16}>
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</ResponsiveGrid>
```

### Texte Responsive
```typescript
<ResponsiveText 
  variant="h1" 
  align="center"
  color={currentTheme.colors.primary}
>
  Mon Titre
</ResponsiveText>
```

### Layout Conditionnel
```typescript
const { isTablet, isLandscape } = useResponsive();

return (
  <View style={{
    flexDirection: isTablet && isLandscape ? 'row' : 'column'
  }}>
    {/* Contenu */}
  </View>
);
```

## 5. Utilisation avec Tailwind (twrnc)

### Import du rtw (Responsive Tailwind)
```typescript
import { rtw, responsiveStyles } from '@/utils/responsiveTailwind';

// Utilisation
<View style={rtw.combine(
  'flex-1',
  rtw.p(4),
  rtw.tablet(rtw.p(8))
)}>
  {/* Contenu */}
</View>
```

### Styles prédéfinis
```typescript
// Container responsive
<View style={responsiveStyles.container()}>

// Card responsive
<View style={responsiveStyles.card(isDarkMode)}>

// Button responsive
<TouchableOpacity style={responsiveStyles.button('large')}>
```

## 6. Gestion des Orientations

```typescript
const { isLandscape, screenWidth, screenHeight } = useResponsive();

useEffect(() => {
  // Réagir aux changements d'orientation
}, [isLandscape]);
```

## 7. Bonnes Pratiques

1. **Toujours utiliser des dimensions relatives** : Préférer `wp()`, `hp()`, et `moderateScale()`
2. **Tester sur différents appareils** : iPhone SE, iPad, Android tablets
3. **Gérer les orientations** : Portrait et paysage
4. **Utiliser les breakpoints** : Adapter le layout selon la taille
5. **Safe Areas** : Toujours gérer les encoches et barres de navigation

## 8. Exemples de Migration Complète

Voir `/src/screens/WelcomeScreenResponsive.tsx` pour un exemple complet de migration d'un écran.

## 9. Checklist de Migration

- [ ] Remplacer `Dimensions.get()` par `useResponsive()`
- [ ] Remplacer les valeurs fixes par des valeurs scalées
- [ ] Utiliser les composants responsive
- [ ] Tester sur différentes tailles d'écran
- [ ] Gérer les orientations portrait/paysage
- [ ] Vérifier les safe areas
- [ ] Optimiser pour tablettes
- [ ] Éliminer tous les types "any"

## 10. Dépannage

### Problème : Le texte est trop petit/grand
Solution : Ajuster le facteur dans `responsiveFontSize()` ou utiliser les variants prédéfinis

### Problème : Layout cassé en paysage
Solution : Utiliser `isLandscape` pour adapter le layout

### Problème : Espacement incohérent
Solution : Utiliser `dimensions.padding/margin` constants

---

Pour toute question ou problème, consultez les fichiers d'exemple ou créez un issue.