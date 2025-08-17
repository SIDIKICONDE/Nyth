import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { UIText } from "./Typography";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('ExpandableNavMenu');

interface NavigationOption {
  id: string;
  label: string;
  icon?: string;
  onPress: () => void;
}

interface ExpandableNavMenuProps {
  options: NavigationOption[];
  style?: any;
  isHidden?: boolean;
}

export default function ExpandableNavMenu({
  options,
  style,
  isHidden = false,
}: ExpandableNavMenuProps) {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;
  const currentAnimations = useRef<Animated.CompositeAnimation[]>([]);

  // Animation pour masquer/afficher le menu
  useEffect(() => {
    const animation = Animated.timing(opacityAnimation, {
      toValue: isHidden ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    });
    animation.start();

    // Si le menu est masqué, le fermer aussi
    if (isHidden && isExpanded) {
      setIsExpanded(false);
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isHidden, isExpanded]);

  const toggleMenu = () => {
    // Ne pas permettre d'ouvrir le menu s'il est masqué
    if (isHidden) return;

    // Arrêter les animations précédentes
    currentAnimations.current.forEach((anim) => anim.stop());
    currentAnimations.current = [];

    const toValue = isExpanded ? 0 : 1;

    const animation = Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: toValue * (options.length * 44), // 44px par option - plus compact
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    // Stocker l'animation pour pouvoir l'arrêter plus tard
    currentAnimations.current.push(animation);
    animation.start();

    setIsExpanded(!isExpanded);
  };

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      logger.debug("🏁 ExpandableNavMenu unmount - Arrêt animations");
      // Arrêter toutes les animations en cours
      currentAnimations.current.forEach((anim) => {
        anim.stop();
      });
      currentAnimations.current = [];

      // Arrêter les animations directement aussi
      animatedHeight.stopAnimation();
      rotateAnimation.stopAnimation();
      opacityAnimation.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={[
        tw`absolute top-12 left-4 z-50`,
        { opacity: opacityAnimation },
        style,
      ]}
    >
      {/* Bouton principal avec flèche */}
      <TouchableOpacity
        onPress={toggleMenu}
        style={[
          tw`w-10 h-10 rounded-full items-center justify-center`,
          {
            backgroundColor: currentTheme.colors.surface,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
          },
        ]}
        activeOpacity={0.8}
        disabled={isHidden}
      >
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
          }}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={currentTheme.colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Menu déroulant */}
      <Animated.View
        style={[
          tw`mt-1 rounded-xl overflow-hidden`,
          {
            backgroundColor: currentTheme.colors.surface,
            height: animatedHeight,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 5,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
          },
        ]}
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              option.onPress();
              toggleMenu(); // Fermer le menu après sélection
            }}
            style={[
              tw`flex-row items-center px-3`,
              {
                height: 44,
                borderBottomWidth: index < options.length - 1 ? 1 : 0,
                borderBottomColor: currentTheme.colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            {option.icon && (
              <View
                style={[
                  tw`w-7 h-7 rounded-full items-center justify-center mr-2`,
                  {
                    backgroundColor: `${currentTheme.colors.primary}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={14}
                  color={currentTheme.colors.primary}
                  style={{
                    textAlign: "center",
                    textAlignVertical: "center",
                  }}
                />
              </View>
            )}
            <UIText
              size="xs"
              weight="medium"
              style={[ui, tw`flex-1`, { color: currentTheme.colors.text }]}
            >
              {option.label}
            </UIText>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Overlay pour fermer le menu en tapant à l'extérieur */}
      {isExpanded && (
        <TouchableOpacity
          style={tw`absolute inset-0 -z-10`}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </Animated.View>
  );
}
