import { BlurView } from "@react-native-community/blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { EventDetailModalProps } from "../../types";
import { getEventColor } from "../../utils";
import { EventDetails } from "./EventDetails";
import { EventHeader } from "./EventHeader";
import { ModalHeader } from "./ModalHeader";
import { StatusChangeSection } from "./StatusChangeSection";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  visible,
  event,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { currentTheme } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Animation d'ouverture
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation de fermeture
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!event) return null;

  const eventColor = getEventColor(event);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Fond avec blur */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView blurAmount={20} blurType="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          />
        )}
      </Animated.View>

      {/* Contenu du modal */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          {/* Fond décoratif en haut */}
          <View
            style={[
              styles.topGradient,
              { backgroundColor: eventColor + "20" },
            ]}
          />

          <ModalHeader
            event={event}
            onClose={onClose}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <EventHeader event={event} />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <EventDetails event={event} />
            </Animated.View>

            {onStatusChange && (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                }}
              >
                <StatusChangeSection
                  event={event}
                  onStatusChange={onStatusChange}
                />
              </Animated.View>
            )}

            {/* Espacement en bas */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 40 : 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    zIndex: 0,
  },
  content: {
    flex: 1,
    padding: 12,
  },
});
