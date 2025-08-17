import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  withTiming
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { HeadingText, UIText } from './Typography';

const { width: screenWidth } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onDismiss?: () => void;
  icon?: string;
  showIcon?: boolean;
  dismissOnBackdropPress?: boolean;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
  icon,
  showIcon = true,
  dismissOnBackdropPress = false
}) => {
  const { currentTheme } = useTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const translateY = useSharedValue(50);

  const typeConfig = {
    success: {
      color: '#10B981',
      icon: 'check-circle',
      gradient: ['#10B981', '#059669']
    },
    error: {
      color: '#EF4444',
      icon: 'alert-circle',
      gradient: ['#EF4444', '#DC2626']
    },
    warning: {
      color: '#F59E0B',
      icon: 'alert',
      gradient: ['#F59E0B', '#D97706']
    },
    info: {
      color: currentTheme.colors.primary,
      icon: 'information',
      gradient: [currentTheme.colors.primary, currentTheme.colors.secondary]
    }
  };

  const config = typeConfig[type];
  const displayIcon = icon || config.icon;

  useEffect(() => {
    if (visible) {
      // Animations d'ouverture
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      
      // Animation de l'icône
      iconRotation.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-5),
        withSpring(5),
        withSpring(0)
      );
    } else {
      // Animations de fermeture plus lentes
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(50, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }]
  }));

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = async (button: typeof buttons[0]) => {
    // Exécuter l'action du bouton s'il y en a une
    if (button.onPress) {
      await button.onPress();
    }
    
    // Attendre un peu avant de fermer pour que l'utilisateur voit l'action
    setTimeout(() => {
      handleDismiss();
    }, 300);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback 
        onPress={dismissOnBackdropPress ? handleDismiss : undefined}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          {/* Backdrop avec blur */}
          <Animated.View 
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={tw`absolute inset-0`}
          >
            <BlurView blurAmount={20} blurType="dark" 
              style={[
                tw`flex-1`,
                { backgroundColor: 'rgba(0,0,0,0.5)' }
              ]} 
            />
          </Animated.View>

          {/* Alert Container */}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                animatedStyle,
                tw`mx-8 rounded-3xl overflow-hidden`,
                {
                  backgroundColor: currentTheme.colors.surface,
                  maxWidth: screenWidth - 64,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 20,
                }
              ]}
            >
              {/* Header avec gradient */}
              {showIcon && (
                <View style={[
                  tw`h-32 items-center justify-center`,
                  {
                    backgroundColor: config.gradient[0] + '20'
                  }
                ]}>
                  <Animated.View style={iconAnimatedStyle}>
                    <View style={[
                      tw`w-20 h-20 rounded-full items-center justify-center`,
                      { backgroundColor: 'white' }
                    ]}>
                      <MaterialCommunityIcons 
                        name={displayIcon as any} 
                        size={40} 
                        color={config.color}
                      />
                    </View>
                  </Animated.View>
                </View>
              )}

              {/* Content */}
              <View style={tw`px-6 ${showIcon ? 'pt-4' : 'pt-6'} pb-6`}>
                <HeadingText
                  size="2xl"
                  align="center"
                  style={[
                    tw`mb-2`,
                    { color: currentTheme.colors.text }
                  ]}
                >
                  {title}
                </HeadingText>
                
                <UIText
                  style={[
                    tw`text-base text-center mb-6`,
                    { color: currentTheme.colors.textSecondary }
                  ]}
                >
                  {message}
                </UIText>

                {/* Buttons */}
                <View style={tw`flex-row justify-center flex-wrap`}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleButtonPress(button)}
                      style={[
                        tw`px-6 py-3 rounded-xl mx-2 mb-2`,
                        {
                          backgroundColor: button.style === 'cancel' 
                            ? currentTheme.colors.surface 
                            : button.style === 'destructive'
                            ? config.color
                            : currentTheme.colors.primary,
                          borderWidth: button.style === 'cancel' ? 1 : 0,
                          borderColor: currentTheme.colors.border
                        }
                      ]}
                      activeOpacity={0.8}
                    >
                      <UIText
                        weight="semibold"
                        style={[
                          {
                            color: button.style === 'cancel' 
                              ? currentTheme.colors.text 
                              : 'white'
                          }
                        ]}
                      >
                        {button.text}
                      </UIText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Hook pour utiliser facilement l'alerte
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<Omit<CustomAlertProps, 'visible'> & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK' }]
  });

  const showAlert = (config: Omit<CustomAlertProps, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alertConfig}
      onDismiss={hideAlert}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
}; 