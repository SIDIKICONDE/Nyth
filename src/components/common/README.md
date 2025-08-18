# Composants Responsive

## Vue d'ensemble

Ce dossier contient tous les composants responsive réutilisables pour créer une interface utilisateur adaptative dans l'application React Native.

## Composants disponibles

### ResponsiveView
Container de base avec gestion des safe areas et padding responsive.

```tsx
<ResponsiveView safeArea="both" padding>
  {/* Contenu */}
</ResponsiveView>
```

### ResponsiveText
Composant de texte avec tailles de police adaptatives.

```tsx
<ResponsiveText variant="h1" weight="bold" align="center">
  Mon titre
</ResponsiveText>
```

Variants disponibles : `h1`, `h2`, `h3`, `h4`, `body`, `caption`, `small`

### ResponsiveButton
Bouton avec dimensions et styles adaptatifs.

```tsx
<ResponsiveButton
  title="Cliquez-moi"
  variant="primary"
  size="large"
  fullWidth
  onPress={handlePress}
/>
```

Variants : `primary`, `secondary`, `outline`, `ghost`
Tailles : `small`, `medium`, `large`

### ResponsiveImage
Image avec gestion responsive des dimensions.

```tsx
<ResponsiveImage
  source={{ uri: 'https://example.com/image.jpg' }}
  aspectRatioValue={16/9}
  showLoading
/>
```

### ResponsiveGrid
Système de grille flexible qui s'adapte selon l'appareil.

```tsx
<ResponsiveGrid columns={2} gap={16}>
  {items.map(item => <Card key={item.id} />)}
</ResponsiveGrid>
```

### ResponsiveModal
Modal adaptatif avec gestion du clavier et des dimensions.

```tsx
<ResponsiveModal
  visible={isVisible}
  title="Mon Modal"
  onClose={handleClose}
  footer={<FooterButtons />}
>
  <ModalContent />
</ResponsiveModal>
```

### ResponsiveCard
Carte avec différents styles et padding responsive.

```tsx
<ResponsiveCard variant="elevated" padding="medium">
  <CardContent />
</ResponsiveCard>
```

Variants : `elevated`, `outlined`, `filled`

## Utilisation des Hooks

### useResponsive
Hook principal pour accéder aux fonctions et valeurs responsive.

```tsx
const {
  screenWidth,
  screenHeight,
  moderateScale,
  wp,
  hp,
  isTablet,
  isLandscape,
  breakpoint
} = useResponsive();
```

## Utilitaires

### dimensions
Objet contenant toutes les dimensions prédéfinies.

```tsx
import { dimensions } from '@/utils/responsive';

style={{
  padding: dimensions.padding.medium,
  borderRadius: dimensions.borderRadius.large
}}
```

### responsiveTailwind (rtw)
Extension de tailwind pour le responsive.

```tsx
import { rtw } from '@/utils/responsiveTailwind';

style={rtw.combine(
  'flex-1',
  rtw.p(4),
  rtw.tablet(rtw.p(8))
)}
```

## Bonnes pratiques

1. **Toujours utiliser des dimensions relatives** plutôt que des valeurs fixes
2. **Tester sur différents appareils** (téléphones, tablettes)
3. **Gérer les orientations** portrait et paysage
4. **Utiliser les composants responsive** plutôt que les composants natifs
5. **Éviter les types "any"** - utiliser des types spécifiques

## Exemples d'utilisation

Voir `/src/screens/ResponsiveDemoScreen.tsx` pour des exemples complets.

## Performance

- Les composants sont optimisés avec React.memo quand nécessaire
- Les calculs de dimensions sont mémorisés
- Les listeners d'orientation sont nettoyés proprement
