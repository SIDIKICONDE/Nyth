# 🎨 ProfessionalBlock Component

Un composant de bloc professionnel modulaire et hautement personnalisable pour React Native, conçu pour s'intégrer parfaitement avec l'écosystème de votre application.

## ✨ Fonctionnalités

- 🎨 **6 variantes de style** : default, elevated, outlined, minimal, gradient, glass
- 📏 **5 tailles configurables** : xs, sm, md, lg, xl
- 🎪 **Animations fluides** avec React Native Reanimated
- 🔧 **Collapsible** avec gestion d'état intégrée
- 🎯 **Indicateurs de statut** : success, warning, error, info, pending
- ♿ **Accessibilité complète** avec labels et hints
- 🎭 **Support d'icônes** MaterialCommunityIcons
- 🎨 **Thème adaptatif** avec votre ThemeContext
- 📱 **Responsive design** avec Tailwind CSS
- 🧩 **Architecture modulaire** avec sous-composants

## 🚀 Installation

Le composant est déjà intégré dans votre système UI. Importez-le simplement :

```tsx
import { ProfessionalBlock } from "@/components/ui";
```

## 📖 Utilisation de base

### Exemple simple

```tsx
import React from "react";
import { ProfessionalBlock } from "@/components/ui";
import { Text } from "react-native";

const BasicExample = () => (
  <ProfessionalBlock
    title="Mon Premier Bloc"
    subtitle="Un exemple simple et efficace"
  >
    <Text>Contenu de votre bloc professionnel</Text>
  </ProfessionalBlock>
);
```

### Avec icône et statut

```tsx
<ProfessionalBlock
  title="Statistiques"
  subtitle="Données en temps réel"
  icon="chart-line"
  statusIndicator="success"
  variant="elevated"
  size="lg"
>
  <Text>Vos métriques importantes ici</Text>
</ProfessionalBlock>
```

### Bloc collapsible

```tsx
<ProfessionalBlock
  title="Section Détaillée"
  subtitle="Cliquez pour développer"
  collapsible
  initiallyExpanded={false}
  icon="information"
  variant="outlined"
>
  <Text>Contenu masquable pour optimiser l'espace</Text>
</ProfessionalBlock>
```

## 🎨 Variantes de style

### Default

```tsx
<ProfessionalBlock variant="default" title="Style par défaut" />
```

### Elevated (avec ombre)

```tsx
<ProfessionalBlock variant="elevated" title="Bloc avec élévation" />
```

### Outlined (avec bordure)

```tsx
<ProfessionalBlock variant="outlined" title="Bloc avec bordure" />
```

### Minimal (transparent)

```tsx
<ProfessionalBlock variant="minimal" title="Style minimal" />
```

### Gradient (avec effet dégradé)

```tsx
<ProfessionalBlock variant="gradient" title="Effet gradient" />
```

### Glass (effet verre)

```tsx
<ProfessionalBlock variant="glass" title="Effet glassmorphisme" />
```

## 📏 Tailles disponibles

| Taille | Titre | Icône | Usage recommandé     |
| ------ | ----- | ----- | -------------------- |
| `xs`   | sm    | 16px  | Éléments compacts    |
| `sm`   | base  | 20px  | Cartes simples       |
| `md`   | lg    | 24px  | Usage standard       |
| `lg`   | xl    | 28px  | Sections importantes |
| `xl`   | 2xl   | 32px  | Headers principaux   |

## 🎯 Indicateurs de statut

```tsx
// Différents états avec couleurs automatiques
<ProfessionalBlock statusIndicator="success" title="Succès" />
<ProfessionalBlock statusIndicator="warning" title="Attention" />
<ProfessionalBlock statusIndicator="error" title="Erreur" />
<ProfessionalBlock statusIndicator="info" title="Information" />
<ProfessionalBlock statusIndicator="pending" title="En attente" />
```

## 🔧 Exemples avancés

### Avec actions d'en-tête et pied de page

```tsx
import { TouchableOpacity } from "react-native";
import { CustomButton } from "@/components/common";

<ProfessionalBlock
  title="Gestion de Projet"
  subtitle="TaskFlow Pro"
  icon="briefcase"
  variant="elevated"
  headerAction={
    <TouchableOpacity onPress={() => console.log("Options")}>
      <MaterialCommunityIcons name="dots-vertical" size={20} />
    </TouchableOpacity>
  }
  footerAction={
    <CustomButton
      title="Voir plus"
      variant="outline"
      size="sm"
      onPress={() => console.log("Voir plus")}
    />
  }
>
  <Text>Contenu principal de votre projet</Text>
</ProfessionalBlock>;
```

### Gestion d'erreur intégrée

```tsx
<ProfessionalBlock
  title="Chargement des données"
  loading={isLoading}
  error={errorMessage}
  variant="outlined"
>
  {data && <DataDisplay data={data} />}
</ProfessionalBlock>
```

### Avec hook personnalisé

```tsx
import { useProfessionalBlock } from "@/components/ui";

const CustomComponent = () => {
  const blockConfig = useProfessionalBlock({
    variant: "elevated",
    size: "lg",
    collapsible: true,
  });

  return (
    <View>{/* Utiliser blockConfig pour des customisations avancées */}</View>
  );
};
```

## 📱 Responsive Design

Le composant s'adapte automatiquement aux différentes tailles d'écran :

```tsx
// Configuration responsive avec breakpoints
<ProfessionalBlock
  size="sm" // Mobile
  // size="md"     // Tablette
  // size="lg"     // Desktop
  title="Responsive Block"
/>
```

## ⚡ Props API

| Prop                | Type                       | Défaut      | Description                        |
| ------------------- | -------------------------- | ----------- | ---------------------------------- |
| `title`             | `string`                   | -           | **Requis** - Titre principal       |
| `subtitle`          | `string?`                  | -           | Sous-titre optionnel               |
| `description`       | `string?`                  | -           | Description détaillée              |
| `children`          | `ReactNode?`               | -           | Contenu du bloc                    |
| `variant`           | `ProfessionalBlockVariant` | `'default'` | Style visuel                       |
| `size`              | `ProfessionalBlockSize`    | `'md'`      | Taille du composant                |
| `padding`           | `ProfessionalBlockPadding` | `'md'`      | Espacement interne                 |
| `borderRadius`      | `ProfessionalBlockRadius`  | `'md'`      | Arrondi des bordures               |
| `collapsible`       | `boolean`                  | `false`     | Peut être replié                   |
| `initiallyExpanded` | `boolean`                  | `true`      | État initial si collapsible        |
| `loading`           | `boolean`                  | `false`     | Affichage du loader                |
| `error`             | `string?`                  | -           | Message d'erreur                   |
| `animated`          | `boolean`                  | `true`      | Animations activées                |
| `animationDelay`    | `number`                   | `0`         | Délai d'animation (ms)             |
| `icon`              | `string?`                  | -           | Nom de l'icône MaterialCommunity   |
| `iconColor`         | `string?`                  | -           | Couleur personnalisée de l'icône   |
| `iconSize`          | `number?`                  | -           | Taille personnalisée de l'icône    |
| `statusIndicator`   | `ProfessionalBlockStatus?` | -           | Indicateur de statut               |
| `onPress`           | `() => void?`              | -           | Action au tap                      |
| `onLongPress`       | `() => void?`              | -           | Action au long press               |
| `headerAction`      | `ReactNode?`               | -           | Composant d'action dans l'en-tête  |
| `footerAction`      | `ReactNode?`               | -           | Composant d'action dans le pied    |
| `style`             | `StyleProp<ViewStyle>?`    | -           | Styles personnalisés du conteneur  |
| `headerStyle`       | `StyleProp<ViewStyle>?`    | -           | Styles personnalisés de l'en-tête  |
| `contentStyle`      | `StyleProp<ViewStyle>?`    | -           | Styles personnalisés du contenu    |
| `titleStyle`        | `StyleProp<TextStyle>?`    | -           | Styles personnalisés du titre      |
| `subtitleStyle`     | `StyleProp<TextStyle>?`    | -           | Styles personnalisés du sous-titre |

## 🎨 Presets disponibles

Utilisez les presets pour des configurations rapides :

```tsx
import { VARIANT_PRESETS } from '@/components/ui';

// Équivalent à variant="elevated", borderRadius="lg", padding="md"
<ProfessionalBlock {...VARIANT_PRESETS.card} title="Carte" />

// Équivalent à variant="outlined", borderRadius="md", padding="lg"
<ProfessionalBlock {...VARIANT_PRESETS.panel} title="Panneau" />

// Équivalent à variant="gradient", borderRadius="xl", padding="lg"
<ProfessionalBlock {...VARIANT_PRESETS.banner} title="Bannière" />

// Équivalent à variant="minimal", borderRadius="none", padding="sm"
<ProfessionalBlock {...VARIANT_PRESETS.minimal} title="Minimal" />
```

## 🔧 Customisation avancée

### Thème personnalisé

Le composant utilise automatiquement votre `ThemeContext`. Les couleurs s'adaptent au thème sombre/clair.

### Styles personnalisés

```tsx
<ProfessionalBlock
  title="Bloc personnalisé"
  style={{ backgroundColor: "#f0f0f0" }}
  headerStyle={{ paddingVertical: 20 }}
  titleStyle={{ fontWeight: "bold" }}
/>
```

### Animation personnalisée

```tsx
<ProfessionalBlock
  title="Animation personnalisée"
  animated={true}
  animationDelay={200}
/>
```

## 📚 Cas d'usage

### Dashboard Analytics

```tsx
<ProfessionalBlock
  title="Revenus"
  subtitle="Ce mois"
  icon="currency-usd"
  statusIndicator="success"
  variant="elevated"
  headerAction={<OptionsMenu />}
>
  <AnalyticsChart data={revenueData} />
</ProfessionalBlock>
```

### Profile Card

```tsx
<ProfessionalBlock
  title={user.name}
  subtitle={user.role}
  icon="account"
  variant="gradient"
  footerAction={<CustomButton title="Voir Profil" onPress={viewProfile} />}
>
  <UserStats stats={user.stats} />
</ProfessionalBlock>
```

### Settings Section

```tsx
<ProfessionalBlock
  title="Préférences"
  subtitle="Personnalisez votre expérience"
  icon="cog"
  collapsible
  variant="outlined"
>
  <SettingsForm />
</ProfessionalBlock>
```

## 🧪 Tests

Le composant inclut une suite de tests complète :

```bash
# Lancer les tests
npm run test -- professional-block

# Tests avec coverage
npm run test:coverage -- professional-block
```

## 🚀 Performance

- **Optimisé** : Re-renders minimisés avec `useMemo` et `useCallback`
- **Léger** : Bundle size optimisé
- **Fluide** : Animations 60fps avec Reanimated
- **Accessible** : Support complet des lecteurs d'écran

## 🤝 Contribution

Pour contribuer à ce composant :

1. Suivez les conventions de nommage existantes
2. Ajoutez des tests pour les nouvelles fonctionnalités
3. Mettez à jour cette documentation
4. Respectez l'architecture modulaire

## 📝 Changelog

### v1.0.0

- ✨ Release initiale
- 🎨 6 variantes de style
- 📏 5 tailles configurables
- 🎪 Animations Reanimated
- 🔧 Support collapsible
- ♿ Accessibilité complète
