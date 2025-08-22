/**
 * GUIDE COMPLET POUR CRÉER UNE UI ULTRA-MODERNE
 *
 * Ce guide explique comment créer une interface utilisateur qui donne
 * vraiment l'impression d'une application premium et professionnelle.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';

export default function UIModernGuide() {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const techniques = [
    {
      title: '🎨 Effets Visuels Avancés',
      items: [
        'Gradients dynamiques avec animations',
        'Effets de verre (BlurView) sur iOS',
        'Ombres portées avec elevation',
        'Bordures lumineuses animées',
        'Particules flottantes',
        'Effets de brillance',
      ],
    },
    {
      title: '⚡ Animations Ultra-Fluides',
      items: [
        'React Native Reanimated pour performances',
        'Easing personnalisés (bezier curves)',
        'Animations parallèles et séquentielles',
        'Feedbacks tactiles instantanés',
        'Transitions entre écrans smooth',
        'Micro-interactions subtiles',
      ],
    },
    {
      title: '🎯 Interactions Utilisateur',
      items: [
        'Appui long avec feedback visuel',
        'Gestes swipe et drag',
        'Haptic feedback (vibrations)',
        'Scale animations on press',
        'Pull to refresh avec animations',
        'Context menus intelligents',
      ],
    },
    {
      title: '🌈 Palette et Thème',
      items: [
        'Couleurs adaptatives dark/light',
        'Accent colors cohérents',
        'Gradients subtils partout',
        'Contrastes optimisés',
        'Accessibilité des couleurs',
        'Brand colors intégrés',
      ],
    },
    {
      title: '📱 UX Design Patterns',
      items: [
        'Skeleton loading screens',
        'Empty states engageants',
        'Progressive disclosure',
        'Smart defaults',
        'Contextual actions',
        'Intuitive navigation',
      ],
    },
    {
      title: '🚀 Performance Optimisations',
      items: [
        'useNativeDriver: true partout',
        'Memoization des composants',
        'Optimisation des images',
        'Lazy loading intelligent',
        'Memory management',
        'Frame rate 60fps',
      ],
    },
  ];

  const premiumFeatures = [
    {
      icon: 'diamond',
      title: 'Effet Premium',
      description: 'Badge premium dans le header',
      code: `<LinearGradient colors={[accent, accent+'E6']} style={tw\`px-3 py-1 rounded-full\`}>`,
    },
    {
      icon: 'sparkles',
      title: 'Particules Animées',
      description: '20 particules flottant aléatoirement',
      code: `particleAnimations.map((particle, index) => <Animated.View key={index} />)`,
    },
    {
      icon: 'color-palette',
      title: 'Glass Morphism',
      description: 'Effets de verre sur iOS',
      code: `<BlurView blurType="light" blurAmount={10} />`,
    },
    {
      icon: 'pulse',
      title: 'Pulse Animations',
      description: "Battements réguliers pour l'attention",
      code: `Animated.loop(Animated.sequence([expand, contract]))`,
    },
    {
      icon: 'resize',
      title: 'Scale Feedback',
      description: 'Réduction à 0.95 lors du press',
      code: `Animated.spring(scale, { toValue: 0.95, friction: 8 })`,
    },
    {
      icon: 'trail-sign',
      title: 'Bordures Lumineuses',
      description: 'Gradients animés autour des éléments',
      code: `<LinearGradient colors={[accent+'40', 'transparent', accent+'40']}`,
    },
  ];

  const designPrinciples = [
    {
      principle: '🎭 Immersion Visuelle',
      tips: [
        'Chaque pixel doit avoir un but',
        'Les animations doivent raconter une histoire',
        'La hiérarchie visuelle doit être claire',
        'Les couleurs doivent évoquer des émotions',
      ],
    },
    {
      principle: '⚡ Performance First',
      tips: [
        '60fps minimum sur tous les devices',
        'Pas de blocking operations sur main thread',
        'Optimisation des assets et images',
        'Memory leaks interdits',
      ],
    },
    {
      principle: '👆 Touch Excellence',
      tips: [
        'Feedback immédiat à chaque interaction',
        'Zones de touch minimum 44x44px',
        'Gestes intuitifs et naturels',
        'Haptic feedback quand approprié',
      ],
    },
    {
      principle: '🎨 Brand Consistency',
      tips: [
        'Palette de couleurs cohérente',
        'Typography hiérarchisée',
        'Iconographie uniforme',
        'Spacing system rigoureux',
      ],
    },
  ];

  return (
    <ScrollView
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={tw`p-4 pb-8`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[currentTheme.colors.accent, currentTheme.colors.accent + '80']}
        style={[
          tw`pt-12 pb-6 px-6 mb-6 rounded-2xl`,
          { paddingTop: insets.top },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={tw`text-white text-2xl font-bold text-center mb-2`}>
          🚀 UI Ultra-MODERNE
        </Text>
        <Text style={tw`text-white/80 text-center text-sm`}>
          Guide complet pour impressionner vos utilisateurs
        </Text>
      </LinearGradient>

      {/* Introduction */}
      <View
        style={[
          tw`p-4 rounded-xl mb-6`,
          {
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            tw`text-lg font-bold mb-3`,
            { color: currentTheme.colors.text },
          ]}
        >
          🎯 Comment créer une UI qui WOW les utilisateurs
        </Text>
        <Text
          style={[
            tw`text-sm leading-5`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Une UI ultra-moderne ne se résume pas à de jolis gradients. C'est une
          expérience complète qui engage l'utilisateur à tous les niveaux :
          visuel, tactile, émotionnel et fonctionnel.
        </Text>
      </View>

      {/* Techniques principales */}
      <Text
        style={[
          tw`text-xl font-bold mb-4`,
          { color: currentTheme.colors.text },
        ]}
      >
        🛠️ Techniques Essentielles
      </Text>

      {techniques.map((technique, index) => (
        <View
          key={index}
          style={[
            tw`p-4 rounded-xl mb-4`,
            {
              backgroundColor: currentTheme.colors.background,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <Text
            style={[tw`font-bold mb-3`, { color: currentTheme.colors.text }]}
          >
            {technique.title}
          </Text>
          {technique.items.map((item, itemIndex) => (
            <View key={itemIndex} style={tw`flex-row items-center mb-2`}>
              <Icon
                name="checkmark-circle"
                size={16}
                color={currentTheme.colors.accent}
                style={tw`mr-2`}
              />
              <Text
                style={[
                  tw`text-sm flex-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      ))}

      {/* Fonctionnalités Premium */}
      <Text
        style={[
          tw`text-xl font-bold mb-4 mt-6`,
          { color: currentTheme.colors.text },
        ]}
      >
        💎 Fonctionnalités Premium
      </Text>

      <View style={tw`grid grid-cols-2 gap-4`}>
        {premiumFeatures.map((feature, index) => (
          <LinearGradient
            key={index}
            colors={[
              currentTheme.colors.accent + '20',
              currentTheme.colors.accent + '10',
            ]}
            style={tw`p-4 rounded-xl`}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon
              name={feature.icon as any}
              size={24}
              color={currentTheme.colors.accent}
              style={tw`mb-2`}
            />
            <Text
              style={[
                tw`font-semibold mb-1`,
                { color: currentTheme.colors.text },
              ]}
            >
              {feature.title}
            </Text>
            <Text
              style={[
                tw`text-xs mb-2`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {feature.description}
            </Text>
            <Text
              style={[
                tw`text-xs font-mono p-2 rounded bg-black/10 dark:bg-white/10`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {feature.code}
            </Text>
          </LinearGradient>
        ))}
      </View>

      {/* Principes de Design */}
      <Text
        style={[
          tw`text-xl font-bold mb-4 mt-6`,
          { color: currentTheme.colors.text },
        ]}
      >
        🎨 Principes de Design
      </Text>

      {designPrinciples.map((principle, index) => (
        <View
          key={index}
          style={[
            tw`p-4 rounded-xl mb-4`,
            {
              backgroundColor: currentTheme.colors.background,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <Text
            style={[tw`font-bold mb-3`, { color: currentTheme.colors.text }]}
          >
            {principle.principle}
          </Text>
          {principle.tips.map((tip, tipIndex) => (
            <Text
              key={tipIndex}
              style={[
                tw`text-sm mb-2 ml-2`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              • {tip}
            </Text>
          ))}
        </View>
      ))}

      {/* Checklist de Qualité */}
      <View
        style={[
          tw`p-4 rounded-xl mb-6`,
          {
            backgroundColor: currentTheme.colors.accent + '10',
            borderWidth: 1,
            borderColor: currentTheme.colors.accent + '30',
          },
        ]}
      >
        <Text
          style={[
            tw`text-lg font-bold mb-3`,
            { color: currentTheme.colors.accent },
          ]}
        >
          ✅ Checklist Qualité Ultra-Moderne
        </Text>

        <Text
          style={[
            tw`text-sm leading-5 mb-3`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Avant de publier, vérifiez que votre app respecte ces critères :
        </Text>

        {[
          'Animations fluides à 60fps sur tous les devices',
          'Feedback tactile à chaque interaction',
          'Transitions smooth entre écrans',
          'Loading states engageants',
          'Error states informatifs',
          'Empty states créatifs',
          'Dark/Light mode parfait',
          'Accessibilité complète',
          'Performance optimisée',
          'User experience intuitive',
        ].map((item, index) => (
          <View key={index} style={tw`flex-row items-center mb-2`}>
            <Icon
              name="checkmark-circle"
              size={16}
              color={currentTheme.colors.accent}
              style={tw`mr-2`}
            />
            <Text
              style={[
                tw`text-sm flex-1`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>

      {/* Call to Action */}
      <LinearGradient
        colors={[currentTheme.colors.accent, currentTheme.colors.accent + 'E6']}
        style={tw`p-6 rounded-2xl`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={tw`text-white text-lg font-bold text-center mb-2`}>
          🎉 Prêt à créer votre UI ultra-moderne ?
        </Text>
        <Text style={tw`text-white/80 text-center text-sm mb-4`}>
          Utilisez les composants fournis dans UltraModernUI.tsx et appliquez
          ces principes pour créer une expérience utilisateur exceptionnelle.
        </Text>

        <Text style={tw`text-white/70 text-center text-xs`}>
          💡 Souvenez-vous : La perfection n'est pas atteignable, mais la
          poursuite de l'excellence l'est. Chaque détail compte !
        </Text>
      </LinearGradient>
    </ScrollView>
  );
}
