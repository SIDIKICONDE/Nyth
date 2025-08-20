import React from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { ProfessionalBlockProps } from "./types";
import { DEFAULT_VALUES, PADDING_MAP, RADIUS_MAP } from "./constants";
import { useProfessionalBlock } from "./hooks/useProfessionalBlock";
import { BlockHeader } from "./components/BlockHeader";
import { BlockContent } from "./components/BlockContent";
import { BlockFooter } from "./components/BlockFooter";
import { BlockError } from "./components/BlockError";

/**
 * 🎨 Composant ProfessionalBlock
 *
 * Un composant bloc professionnel et modulaire avec :
 * - Support des thèmes
 * - Animations fluides
 * - Variantes de style multiples
 * - Gestion d'état avancée
 * - Accessibilité complète
 *
 * @example
 * ```tsx
 * <ProfessionalBlock
 *   title="Mon Titre"
 *   subtitle="Sous-titre"
 *   variant="elevated"
 *   size="md"
 *   icon="heart"
 *   statusIndicator="success"
 *   collapsible
 * >
 *   <Text>Contenu du bloc</Text>
 * </ProfessionalBlock>
 * ```
 */
export const ProfessionalBlock: React.FC<ProfessionalBlockProps> = (props) => {
  // 📝 Extraction des props avec valeurs par défaut
  const {
    title,
    subtitle,
    description,
    children,
    variant = DEFAULT_VALUES.variant,
    size = DEFAULT_VALUES.size,
    padding = DEFAULT_VALUES.padding,
    borderRadius = DEFAULT_VALUES.borderRadius,
    collapsible = DEFAULT_VALUES.collapsible,
    loading = DEFAULT_VALUES.loading,
    error,
    animated = DEFAULT_VALUES.animated,
    animationDelay = DEFAULT_VALUES.animationDelay,
    style,
    headerStyle,
    contentStyle,
    titleStyle,
    subtitleStyle,
    headerAction,
    footerAction,
    icon,
    iconColor,
    iconSize,
    statusIndicator,
    onLongPress,
  } = props;

  // 🔧 Utilisation du hook personnalisé
  const {
    sizeConfig,
    variantStyles,
    isExpanded,
    animatedContainerStyle,
    handlePress,
    handlePressIn,
    handlePressOut,
    statusColor,
    isInteractive,
  } = useProfessionalBlock(props);

  // 📦 Configuration du conteneur
  const paddingValue = PADDING_MAP[padding];
  const radiusValue = RADIUS_MAP[borderRadius];

  // 🎪 Conteneur animé ou statique
  const Container = animated ? Animated.View : View;

  // 🎨 Styles combinés du conteneur
  const containerStyles = [tw`rounded-${radiusValue}`, variantStyles, style];

  // 📦 Rendu du contenu principal
  const renderContent = () => (
    <>
      {/* 📑 En-tête du bloc */}
      <BlockHeader
        title={title}
        subtitle={subtitle}
        description={description}
        icon={icon}
        iconColor={iconColor}
        iconSize={iconSize}
        statusColor={statusColor}
        statusIndicator={statusIndicator}
        headerAction={headerAction}
        collapsible={collapsible}
        isExpanded={isExpanded}
        sizeConfig={sizeConfig}
        padding={paddingValue}
        headerStyle={headerStyle}
        titleStyle={titleStyle}
        subtitleStyle={subtitleStyle}
      />

      {/* ⚠️ Affichage d'erreur */}
      {error && <BlockError error={error} padding={paddingValue} />}

      {/* 📋 Contenu principal */}
      {children && (!collapsible || isExpanded) && (
        <BlockContent
          loading={loading}
          padding={paddingValue}
          contentStyle={contentStyle}
        >
          {children}
        </BlockContent>
      )}

      {/* 🦶 Pied de page */}
      {footerAction && (
        <BlockFooter footerAction={footerAction} padding={paddingValue} />
      )}
    </>
  );

  return (
    <Container
      entering={animated ? FadeIn.delay(animationDelay) : undefined}
      style={[animatedContainerStyle]}
    >
      {isInteractive ? (
        <TouchableOpacity
          style={containerStyles}
          onPress={handlePress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
          accessibilityHint={
            collapsible
              ? "Double tap to expand or collapse"
              : "Double tap to activate"
          }
        >
          {renderContent()}
        </TouchableOpacity>
      ) : (
        <View
          style={containerStyles}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
        >
          {renderContent()}
        </View>
      )}
    </Container>
  );
};
