import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useCentralizedFont } from '../../hooks/useCentralizedFont';
import tw from 'twrnc';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  duration?: number;
  trigger?: 'press' | 'longPress' | 'hover';
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
  duration = 200,
  trigger = 'longPress',
  variant = 'info',
  size = 'medium',
  autoHide = true,
  autoHideDelay = 3000,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const [isVisible, setIsVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return '#27AE60';
      case 'warning':
        return '#F39C12';
      case 'error':
        return '#E74C3C';
      default:
        return currentTheme.colors.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: 6, fontSize: 10 };
      case 'large':
        return { padding: 12, fontSize: 14 };
      default:
        return { padding: 8, fontSize: 12 };
    }
  };

  const showTooltip = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (autoHide) {
      timeoutRef.current = setTimeout(hideTooltip, autoHideDelay);
    }
  };

  const hideTooltip = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]).start(() => setIsVisible(false));
  };

  const handlePress = () => {
    if (trigger === 'press') {
      isVisible ? hideTooltip() : showTooltip();
    }
  };

  const handleLongPress = () => {
    if (trigger === 'longPress') {
      showTooltip();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionStyles = () => {
    const basePosition = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top':
        return {
          ...basePosition,
          bottom: '100%',
          left: '50%',
          marginLeft: -50,
          marginBottom: 8,
        };
      case 'bottom':
        return {
          ...basePosition,
          top: '100%',
          left: '50%',
          marginLeft: -50,
          marginTop: 8,
        };
      case 'left':
        return {
          ...basePosition,
          right: '100%',
          top: '50%',
          marginTop: -15,
          marginRight: 8,
        };
      case 'right':
        return {
          ...basePosition,
          left: '100%',
          top: '50%',
          marginTop: -15,
          marginLeft: 8,
        };
      default:
        return basePosition;
    }
  };

  const sizeStyles = getSizeStyles();
  const variantColor = getVariantColor();

  return (
    <View style={tw`relative`}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={delay}
        style={({ pressed }) => [
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {children}
      </Pressable>

      {isVisible && (
        <Animated.View
          style={[
            getPositionStyles(),
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View
            style={[
              tw`rounded-lg border-2 shadow-lg`,
              {
                backgroundColor: currentTheme.colors.surface + 'F0',
                borderColor: variantColor + '40',
                shadowColor: variantColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                maxWidth: 200,
              },
            ]}
          >
            <Text
              style={[
                ui,
                tw`text-center font-medium`,
                {
                  color: currentTheme.colors.text,
                  fontSize: sizeStyles.fontSize,
                  paddingHorizontal: sizeStyles.padding,
                  paddingVertical: sizeStyles.padding / 1.5,
                },
              ]}
            >
              {content}
            </Text>

            {/* Flèche du tooltip */}
            <View
              style={[
                tw`absolute w-0 h-0`,
                position === 'top' && {
                  top: '100%',
                  left: '50%',
                  marginLeft: -6,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderTopWidth: 6,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: variantColor + '40',
                },
                position === 'bottom' && {
                  bottom: '100%',
                  left: '50%',
                  marginLeft: -6,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderBottomWidth: 6,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: variantColor + '40',
                },
                position === 'left' && {
                  left: '100%',
                  top: '50%',
                  marginTop: -6,
                  borderTopWidth: 6,
                  borderBottomWidth: 6,
                  borderRightWidth: 6,
                  borderTopColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderRightColor: variantColor + '40',
                },
                position === 'right' && {
                  right: '100%',
                  top: '50%',
                  marginTop: -6,
                  borderTopWidth: 6,
                  borderBottomWidth: 6,
                  borderLeftWidth: 6,
                  borderTopColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderLeftColor: variantColor + '40',
                },
              ]}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Composants spécialisés pour les gestes courants
export const GestureTooltip: React.FC<{
  children: React.ReactNode;
  gesture: 'tap' | 'longPress' | 'doubleTap' | 'swipe';
  customMessage?: string;
}> = ({ children, gesture, customMessage }) => {
  const { t } = useTranslation();

  const getGestureMessage = () => {
    if (customMessage) return customMessage;

    switch (gesture) {
      case 'tap':
        return t('tooltip.tap', 'Appuyez pour sélectionner');
      case 'longPress':
        return t('tooltip.longPress', 'Appuyez longuement pour plus d\'options');
      case 'doubleTap':
        return t('tooltip.doubleTap', 'Double-cliquez pour ajouter aux favoris');
      case 'swipe':
        return t('tooltip.swipe', 'Glissez pour supprimer');
      default:
        return t('tooltip.default', 'Interaction disponible');
    }
  };

  return (
    <Tooltip
      content={getGestureMessage()}
      position="top"
      trigger="longPress"
      size="small"
      autoHideDelay={2500}
    >
      {children}
    </Tooltip>
  );
};

// Tooltip pour les actions destructives
export const DestructiveActionTooltip: React.FC<{
  children: React.ReactNode;
  action: string;
}> = ({ children, action }) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      content={`${t('tooltip.warning', 'Attention')} : ${action}`}
      position="bottom"
      trigger="longPress"
      variant="warning"
      size="medium"
    >
      {children}
    </Tooltip>
  );
};

// Tooltip pour les informations
export const InfoTooltip: React.FC<{
  children: React.ReactNode;
  info: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ children, info, position = 'top' }) => {
  return (
    <Tooltip
      content={info}
      position={position}
      trigger="longPress"
      variant="info"
      size="small"
      autoHideDelay={4000}
    >
      {children}
    </Tooltip>
  );
};
