import React, { useState } from 'react';
import { ScrollView, View, Switch } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import {
  ResponsiveView,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveRow,
  ResponsiveColumn,
  ResponsiveModal,
} from '../components/common';
import { dimensions } from '../utils/responsive';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ResponsiveDemoScreen = () => {
  const { currentTheme } = useTheme();
  const {
    screenWidth,
    screenHeight,
    isTablet,
    isLandscape,
    breakpoint,
    moderateScale,
  } = useResponsive();

  const [modalVisible, setModalVisible] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);

  const demoCards = [
    { id: 1, title: 'Card 1', icon: 'home', color: '#FF6B6B' },
    { id: 2, title: 'Card 2', icon: 'star', color: '#4ECDC4' },
    { id: 3, title: 'Card 3', icon: 'heart', color: '#45B7D1' },
    { id: 4, title: 'Card 4', icon: 'bell', color: '#F7DC6F' },
  ];

  return (
    <ResponsiveView safeArea="top" flex>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ResponsiveCard variant="filled" margin="medium">
          <ResponsiveText variant="h2" weight="bold" align="center">
            Responsive Demo
          </ResponsiveText>
          <ResponsiveText
            variant="caption"
            color={currentTheme.colors.textSecondary}
            align="center"
            style={{ marginTop: moderateScale(8) }}
          >
            Cette page démontre les composants responsive
          </ResponsiveText>
        </ResponsiveCard>

        {/* Device Info */}
        <ResponsiveCard variant="outlined" margin="medium">
          <ResponsiveText variant="h4" weight="medium">
            Informations de l'appareil
          </ResponsiveText>
          <View style={{ marginTop: dimensions.margin.small }}>
            <InfoRow label="Largeur" value={`${Math.round(screenWidth)}px`} />
            <InfoRow label="Hauteur" value={`${Math.round(screenHeight)}px`} />
            <InfoRow label="Type" value={isTablet ? 'Tablette' : 'Téléphone'} />
            <InfoRow label="Orientation" value={isLandscape ? 'Paysage' : 'Portrait'} />
            <InfoRow label="Breakpoint" value={breakpoint} />
          </View>
        </ResponsiveCard>

        {/* Buttons Demo */}
        <ResponsiveCard variant="elevated" margin="medium">
          <ResponsiveText variant="h4" weight="medium">
            Boutons Responsive
          </ResponsiveText>
          <ResponsiveColumn gap={12} style={{ marginTop: dimensions.margin.medium }}>
            <ResponsiveButton
              title="Bouton Large"
              variant="primary"
              size="large"
              fullWidth
              onPress={() => setModalVisible(true)}
            />
            <ResponsiveRow gap={12}>
              <View style={{ flex: 1 }}>
                <ResponsiveButton
                  title="Medium"
                  variant="secondary"
                  size="medium"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <ResponsiveButton
                  title="Small"
                  variant="outline"
                  size="small"
                  fullWidth
                />
              </View>
            </ResponsiveRow>
            <ResponsiveButton
              title="Ghost Button"
              variant="ghost"
              size="medium"
              fullWidth
              icon={
                <MaterialCommunityIcons
                  name="rocket"
                  size={moderateScale(20)}
                  color={currentTheme.colors.primary}
                />
              }
            />
          </ResponsiveColumn>
        </ResponsiveCard>

        {/* Grid Demo */}
        <ResponsiveCard variant="elevated" margin="medium">
          <ResponsiveText variant="h4" weight="medium">
            Grille Responsive
          </ResponsiveText>
          <ResponsiveText
            variant="caption"
            color={currentTheme.colors.textSecondary}
            style={{ marginTop: moderateScale(4), marginBottom: dimensions.margin.medium }}
          >
            {isTablet ? '4 colonnes sur tablette' : '2 colonnes sur téléphone'}
          </ResponsiveText>
          <ResponsiveGrid columns={2} gap={12}>
            {demoCards.map((card) => (
              <ResponsiveCard
                key={card.id}
                variant="outlined"
                padding="medium"
                style={{ alignItems: 'center' }}
                onPress={() => console.log(`Card ${card.id} pressed`)}
              >
                <View
                  style={{
                    width: moderateScale(48),
                    height: moderateScale(48),
                    borderRadius: dimensions.borderRadius.round,
                    backgroundColor: card.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: dimensions.margin.small,
                  }}
                >
                  <MaterialCommunityIcons
                    name={card.icon}
                    size={moderateScale(24)}
                    color={card.color}
                  />
                </View>
                <ResponsiveText variant="body" weight="medium">
                  {card.title}
                </ResponsiveText>
              </ResponsiveCard>
            ))}
          </ResponsiveGrid>
        </ResponsiveCard>

        {/* Typography Demo */}
        <ResponsiveCard variant="elevated" margin="medium">
          <ResponsiveText variant="h4" weight="medium">
            Typographie Responsive
          </ResponsiveText>
          <ResponsiveColumn gap={8} style={{ marginTop: dimensions.margin.medium }}>
            <ResponsiveText variant="h1">Heading 1</ResponsiveText>
            <ResponsiveText variant="h2">Heading 2</ResponsiveText>
            <ResponsiveText variant="h3">Heading 3</ResponsiveText>
            <ResponsiveText variant="h4">Heading 4</ResponsiveText>
            <ResponsiveText variant="body">Body text - Lorem ipsum dolor sit amet</ResponsiveText>
            <ResponsiveText variant="caption">Caption text - Consectetur adipiscing elit</ResponsiveText>
            <ResponsiveText variant="small">Small text - Sed do eiusmod tempor</ResponsiveText>
          </ResponsiveColumn>
        </ResponsiveCard>

        {/* Controls Demo */}
        <ResponsiveCard variant="elevated" margin="medium">
          <ResponsiveText variant="h4" weight="medium">
            Contrôles
          </ResponsiveText>
          <ResponsiveRow
            gap={16}
            align="space-between"
            style={{ marginTop: dimensions.margin.medium }}
          >
            <ResponsiveText variant="body">Switch responsive</ResponsiveText>
            <Switch
              value={switchValue}
              onValueChange={setSwitchValue}
              trackColor={{
                false: currentTheme.colors.disabled,
                true: currentTheme.colors.primary + '80',
              }}
              thumbColor={
                switchValue ? currentTheme.colors.primary : currentTheme.colors.surface
              }
            />
          </ResponsiveRow>
        </ResponsiveCard>

        {/* Spacing visualization */}
        <ResponsiveCard variant="outlined" margin="medium">
          <ResponsiveText variant="h4" weight="medium">
            Espacements Responsive
          </ResponsiveText>
          <ResponsiveColumn gap={8} style={{ marginTop: dimensions.margin.medium }}>
            {Object.entries(dimensions.padding).map(([key, value]) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ResponsiveText variant="caption" style={{ width: moderateScale(60) }}>
                  {key}:
                </ResponsiveText>
                <View
                  style={{
                    height: moderateScale(20),
                    backgroundColor: currentTheme.colors.primary + '40',
                    width: value,
                    marginLeft: dimensions.margin.small,
                  }}
                />
                <ResponsiveText
                  variant="small"
                  color={currentTheme.colors.textSecondary}
                  style={{ marginLeft: dimensions.margin.small }}
                >
                  {Math.round(value)}px
                </ResponsiveText>
              </View>
            ))}
          </ResponsiveColumn>
        </ResponsiveCard>
      </ScrollView>

      {/* Modal Demo */}
      <ResponsiveModal
        visible={modalVisible}
        title="Modal Responsive"
        onClose={() => setModalVisible(false)}
        footer={
          <ResponsiveRow gap={12}>
            <View style={{ flex: 1 }}>
              <ResponsiveButton
                title="Annuler"
                variant="outline"
                size="medium"
                fullWidth
                onPress={() => setModalVisible(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ResponsiveButton
                title="Confirmer"
                variant="primary"
                size="medium"
                fullWidth
                onPress={() => setModalVisible(false)}
              />
            </View>
          </ResponsiveRow>
        }
      >
        <ResponsiveText variant="body">
          Ceci est un modal responsive qui s'adapte à la taille de l'écran.
        </ResponsiveText>
        <ResponsiveText
          variant="caption"
          color={currentTheme.colors.textSecondary}
          style={{ marginTop: dimensions.margin.medium }}
        >
          Sur tablette, il est plus large. Sur téléphone, il prend presque toute la largeur.
        </ResponsiveText>
      </ResponsiveModal>
    </ResponsiveView>
  );
};

// Composant helper pour afficher les infos
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { currentTheme } = useTheme();
  const { moderateScale } = useResponsive();

  return (
    <ResponsiveRow gap={8} align="space-between" style={{ marginVertical: moderateScale(4) }}>
      <ResponsiveText variant="caption" color={currentTheme.colors.textSecondary}>
        {label}:
      </ResponsiveText>
      <ResponsiveText variant="caption" weight="medium">
        {value}
      </ResponsiveText>
    </ResponsiveRow>
  );
};

export default ResponsiveDemoScreen;