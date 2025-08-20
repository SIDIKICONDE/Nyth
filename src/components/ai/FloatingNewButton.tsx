import * as React from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';

interface FloatingNewButtonProps {
  onPress: () => void;
  isMenuVisible: boolean;
}

const FloatingNewButton: React.FC<FloatingNewButtonProps> = ({ 
  onPress,
  isMenuVisible
}) => {
  const { currentTheme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  // Animation initiale au montage du composant
  React.useEffect(() => {
    // Animation d'entrée avec rebond
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true
    }).start();
    
    // Lancer l'animation de pulsation
    startPulseAnimation();
  }, []);
  
  // Animation de pulsation continue
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      })
    ]).start(() => {
      // Répéter l'animation
      startPulseAnimation();
    });
  };
  
  // Animation lors de l'apparition et disparition du menu
  React.useEffect(() => {
    if (isMenuVisible) {
      // Cacher le bouton quand le menu est visible
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.back(2),
        useNativeDriver: true
      }).start();
    } else {
      // Montrer le bouton quand le menu est fermé avec un effet de rebond
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  }, [isMenuVisible, scaleAnim]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 15 : 10, // Adjusted to be lower than before
      width: 45,
      height: 45,
      borderRadius: 22.5,
      backgroundColor: currentTheme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: currentTheme.colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      zIndex: 1000,
    }
  });

  // Combiner les animations de pulsation et d'apparition/disparition
  const animatedStyle = {
    transform: [
      { scale: Animated.multiply(scaleAnim, pulseAnim) }
    ],
    opacity: scaleAnim
  };

  return (
    <Animated.View style={[{
      position: 'absolute',
      top: Platform.OS === 'ios' ? 30 : 25,
    }, animatedStyle]}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          // Ajout d'un petit effet d'échelle lors du clic
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.85,
              duration: 100,
              useNativeDriver: true
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true
            })
          ]).start();
          
          // Exécuter la fonction onPress passée en prop
          onPress();
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons 
          name="chat-plus" 
          size={22} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingNewButton; 