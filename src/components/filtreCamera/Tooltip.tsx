/**
 * Composant Tooltip pour l'aide contextuelle
 * Affiche des messages d'aide avec animations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TooltipProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  animation?: Animated.Value<number>;
  position?: 'top' | 'bottom' | 'center';
  autoHide?: boolean;
  duration?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  visible,
  message,
  onClose,
  animation,
  position = 'center',
  autoHide = false,
  duration = 4000,
}) => {
  React.useEffect(() => {
    if (visible && autoHide) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoHide, duration, onClose]);

  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: 100 };
      case 'bottom':
        return { bottom: 100 };
      default:
        return { top: SCREEN_HEIGHT / 2 - 100 };
    }
  };

  const tooltipContent = (
    <View style={[styles.tooltipContainer, getPositionStyle()]}>
      <BlurView
        blurType="dark"
        blurAmount={20}
        style={styles.tooltipBlur}
      >
        <View style={styles.tooltipContent}>
          <Icon name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.tooltipText}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.tooltipClose}>
            <Icon name="close" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );

  if (animation) {
    return (
      <Animated.View style={{ opacity: animation }}>
        {tooltipContent}
      </Animated.View>
    );
  }

  return tooltipContent;
};

const styles = StyleSheet.create({
  tooltipContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  tooltipBlur: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  tooltipClose: {
    padding: 5,
  },
});

export default Tooltip;
