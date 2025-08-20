import { BlurView } from "@react-native-community/blur";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import tw from "twrnc";

interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  showModal?: boolean;
  onModalClose?: () => void;
  width?: number;
  thumbColor?: string;
  trackColor?: string;
}

export function CustomSlider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  showModal = false,
  onModalClose,
  width = Dimensions.get("window").width * 0.7,
  thumbColor = "white",
  trackColor = "rgba(255, 255, 255, 0.2)",
}: CustomSliderProps) {
  const [panValue] = useState(
    new Animated.Value(
      ((value - minimumValue) / (maximumValue - minimumValue)) * width
    )
  );

  const containerRef = useRef<View>(null);
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0 });

  // Mise à jour de la valeur animée quand la prop value change
  React.useEffect(() => {
    const newPosition =
      ((value - minimumValue) / (maximumValue - minimumValue)) * width;
    panValue.setValue(newPosition);
  }, [value, minimumValue, maximumValue, width, panValue]);

  // Fonction pour calculer la nouvelle valeur basée sur la position
  const calculateValue = (position: number) => {
    const clampedPosition = Math.max(0, Math.min(width, position));
    const percentage = clampedPosition / width;
    const newValue = minimumValue + percentage * (maximumValue - minimumValue);

    // Appliquer le pas si nécessaire
    if (step > 0) {
      return Math.round(newValue / step) * step;
    }
    return Math.round(newValue * 100) / 100; // Arrondir à 2 décimales
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Ne pas changer la position au début du geste
      // Garder la valeur actuelle
    },
    onPanResponderMove: (evt, gestureState) => {
      // Utiliser la position initiale + le déplacement pour plus de stabilité
      const initialPosition =
        ((value - minimumValue) / (maximumValue - minimumValue)) * width;
      const newPosition = Math.max(
        0,
        Math.min(width, initialPosition + gestureState.dx)
      );
      const newValue = calculateValue(newPosition);

      // Mettre à jour l'animation de façon fluide
      panValue.setValue(newPosition);
      onValueChange(newValue);
    },
    onPanResponderRelease: () => {
      // S'assurer que la position finale est cohérente
      const finalPosition =
        ((value - minimumValue) / (maximumValue - minimumValue)) * width;
      panValue.setValue(finalPosition);
    },
  });

  // Gestionnaire pour les taps directs sur la track
  const handleTrackPress = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    const newValue = calculateValue(touchX);
    const newPosition =
      ((newValue - minimumValue) / (maximumValue - minimumValue)) * width;

    // Animation fluide vers la nouvelle position
    Animated.timing(panValue, {
      toValue: newPosition,
      duration: 150,
      useNativeDriver: false,
    }).start();

    onValueChange(newValue);
  };

  // Le rendu du slider
  const SliderComponent = (
    <View
      ref={containerRef}
      style={{ width, height: 40, justifyContent: "center" }}
      onLayout={(event) => {
        const { x, y } = event.nativeEvent.layout;
        setContainerLayout({ x, y });
      }}
    >
      {/* Track cliquable */}
      <TouchableOpacity
        onPress={handleTrackPress}
        style={{
          position: "absolute",
          height: 40,
          width: "100%",
          justifyContent: "center",
        }}
        activeOpacity={1}
      >
        {/* Track de fond */}
        <View
          style={{
            height: 4,
            width: "100%",
            backgroundColor: trackColor,
            borderRadius: 2,
          }}
        />

        {/* Track actif */}
        <Animated.View
          style={{
            position: "absolute",
            height: 4,
            width: panValue,
            backgroundColor: thumbColor,
            borderRadius: 2,
          }}
        />
      </TouchableOpacity>

      {/* Thumb avec geste */}
      <Animated.View
        style={{
          position: "absolute",
          left: Animated.subtract(panValue, 12),
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: thumbColor,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          borderWidth: 2,
          borderColor: "rgba(255, 255, 255, 0.2)",
        }}
        {...panResponder.panHandlers}
      />
    </View>
  );

  // Si en mode modal, afficher dans un modal avec BlurView
  if (showModal) {
    return (
      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={onModalClose}
      >
        <BlurView blurAmount={20} blurType="dark"
          style={tw`flex-1 items-center justify-center`}
        >
          <TouchableWithoutFeedback onPress={onModalClose}>
            <View style={tw`absolute inset-0`} />
          </TouchableWithoutFeedback>
          {SliderComponent}
        </BlurView>
      </Modal>
    );
  }

  // Sinon, afficher directement le slider
  return SliderComponent;
}
