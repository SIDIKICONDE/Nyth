import {
  CodeSmartText,
  ContentSmartText,
  HeadingSmartText,
  SmartText,
  UISmartText,
} from "@/components/ui/SmartText";
import {
  ButtonText,
  CodeText,
  ContentText,
  H1,
  H2,
  H3,
  HeadingText,
  HelpText,
  Label,
  Paragraph,
  UIText,
} from "@/components/ui/Typography";
import {
  useCentralizedFont,
  useContentFont,
  useUIFont,
} from "@/hooks/useCentralizedFont";
import React from "react";
import { ScrollView, View } from "react-native";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('CentralizedFontExample');

/**
 * Exemple d'utilisation du système centralisé de polices
 * Ce composant démontre toutes les approches disponibles
 */
export const CentralizedFontExample: React.FC = () => {
  // Exemple d'utilisation des hooks
  const { ui, content, heading, code } = useCentralizedFont();
  const customUIStyle = useUIFont({ color: "#007AFF" });
  const customContentStyle = useContentFont({ fontSize: 18 });

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* Section 1: Composants Typography de base */}
      <H1>🎨 Système Centralisé de Polices</H1>

      <H2>1. Composants Typography</H2>
      <Paragraph>
        Les composants Typography appliquent automatiquement les bonnes polices
        selon leur usage.
      </Paragraph>

      <View style={{ marginVertical: 10 }}>
        <Label>Texte UI (Interface)</Label>
        <UIText size="base" weight="normal">
          Texte pour l'interface utilisateur - boutons, labels, navigation
        </UIText>

        <Label style={{ marginTop: 10 }}>Texte de Contenu</Label>
        <ContentText size="base" weight="normal">
          Texte optimisé pour la lecture - messages, articles, descriptions
          longues avec un espacement confortable pour les yeux.
        </ContentText>

        <Label style={{ marginTop: 10 }}>Titre</Label>
        <HeadingText size="lg" weight="bold">
          Titre avec police d'en-tête pour l'impact visuel
        </HeadingText>

        <Label style={{ marginTop: 10 }}>Code</Label>
        <CodeText size="sm">
          logger.debug('Code avec police monospace');
        </CodeText>
      </View>

      {/* Section 2: Composants prédéfinis */}
      <H2>2. Composants Prédéfinis</H2>

      <H3>Hiérarchie des titres</H3>
      <H1>Titre H1 - Principal</H1>
      <H2>Titre H2 - Section</H2>
      <H3>Titre H3 - Sous-section</H3>

      <H3>Textes spécialisés</H3>
      <Paragraph>
        Paragraphe avec police de contenu optimisée pour la lecture.
      </Paragraph>

      <Label>Label de formulaire</Label>
      <ButtonText>Texte de bouton</ButtonText>
      <HelpText>Texte d'aide en petit</HelpText>

      {/* Section 3: SmartText avec détection automatique */}
      <H2>3. SmartText - Détection Automatique</H2>

      <SmartText style={{ fontSize: 24, fontWeight: "bold" }}>
        Titre détecté automatiquement (grande taille + bold)
      </SmartText>

      <SmartText style={{ lineHeight: 24 }}>
        Contenu détecté automatiquement (lineHeight élevé)
      </SmartText>

      <SmartText style={{ backgroundColor: "#f0f0f0", padding: 5 }}>
        Code détecté automatiquement (backgroundColor)
      </SmartText>

      {/* Section 4: SmartText explicite */}
      <H2>4. SmartText - Types Explicites</H2>

      <UISmartText size="sm" weight="medium">
        UI SmartText - Interface
      </UISmartText>

      <ContentSmartText size="base">
        Content SmartText - Lecture confortable
      </ContentSmartText>

      <HeadingSmartText size="lg" weight="bold">
        Heading SmartText - Titre
      </HeadingSmartText>

      <CodeSmartText size="sm">Code SmartText - Monospace</CodeSmartText>

      {/* Section 5: Hooks pour styles personnalisés */}
      <H2>5. Hooks pour Styles Personnalisés</H2>

      <UIText style={customUIStyle}>Style UI personnalisé avec couleur</UIText>

      <ContentText style={customContentStyle}>
        Style de contenu personnalisé avec taille
      </ContentText>

      {/* Section 6: Compatibilité avec anciennes API */}
      <H2>6. Compatibilité Ancienne API</H2>

      <UIText size={16} weight="600" color="#FF6B6B">
        Taille numérique et poids numérique (compatibilité)
      </UIText>

      <ContentText size={14} align="center">
        Texte centré avec taille numérique
      </ContentText>

      {/* Section 7: Démonstration des polices disponibles */}
      <H2>7. Aperçu des Polices Disponibles</H2>

      <View style={{ marginBottom: 20 }}>
        <Label>Police UI actuelle :</Label>
        <UIText>Abcdefghijklmnopqrstuvwxyz 123456789</UIText>

        <Label style={{ marginTop: 10 }}>Police Contenu actuelle :</Label>
        <ContentText>Abcdefghijklmnopqrstuvwxyz 123456789</ContentText>

        <Label style={{ marginTop: 10 }}>Police Titre actuelle :</Label>
        <HeadingText>Abcdefghijklmnopqrstuvwxyz 123456789</HeadingText>

        <Label style={{ marginTop: 10 }}>Police Code actuelle :</Label>
        <CodeText>Abcdefghijklmnopqrstuvwxyz 123456789</CodeText>
      </View>

      <HelpText style={{ marginTop: 20, fontStyle: "italic" }}>
        💡 Toutes les polices s'appliquent automatiquement et changent en temps
        réel selon les préférences utilisateur !
      </HelpText>
    </ScrollView>
  );
};

export default CentralizedFontExample;
