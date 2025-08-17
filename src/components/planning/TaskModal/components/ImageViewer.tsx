import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { UIText } from "../../../ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { TaskImage } from "../../../../types/planning";

interface ImageViewerProps {
  visible: boolean;
  images: TaskImage[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    // Scroll vers l'index initial quand le modal s'ouvre
    if (visible && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * screenWidth,
          animated: false,
        });
      }, 100);
    }
  }, [initialIndex, visible]);

  const handleImagePress = () => {
    // Optionnel: zoom/dézoom sur tap
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * screenWidth,
        animated: true,
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * screenWidth,
        animated: true,
      });
    }
  };

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  // Fonction pour formater le nom de l'image pour l'affichage
  const getDisplayName = (image: TaskImage): string => {
    if (image.originalName) {
      // Retirer l'extension pour un affichage plus propre
      return image.originalName.replace(/\.[^/.]+$/, "");
    }
    return `Image ${currentIndex + 1}`;
  };

  // Fonction pour formater les informations techniques
  const getTechnicalInfo = (image: TaskImage): string => {
    const sizeKB = Math.round(image.fileSize / 1024);
    const sizeDisplay =
      sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`;

    return `${image.width} × ${image.height} • ${sizeDisplay}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Header */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 20,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 10,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <UIText size="lg" color="white" weight="bold">
              ✕
            </UIText>
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <UIText size="sm" color="white" weight="medium">
              {getDisplayName(currentImage)}
            </UIText>
            <UIText
              size="xs"
              color="rgba(255,255,255,0.7)"
              style={{ marginTop: 2 }}
            >
              {currentIndex + 1} / {images.length}
            </UIText>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Image principale */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / screenWidth
            );
            setCurrentIndex(newIndex);
          }}
          style={{ flex: 1, width: screenWidth }}
        >
          {images.map((image, index) => (
            <View
              key={image.id}
              style={{
                width: screenWidth,
                height: screenHeight,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableOpacity onPress={handleImagePress} style={{ flex: 1 }}>
                <Image
                  source={{ uri: image.url }}
                  style={{
                    width: screenWidth,
                    height: screenHeight,
                    resizeMode: "contain",
                  }}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <TouchableOpacity
              onPress={goToPrevious}
              disabled={currentIndex === 0}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: [{ translateY: -25 }],
                padding: 15,
                borderRadius: 25,
                backgroundColor:
                  currentIndex === 0
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.3)",
                opacity: currentIndex === 0 ? 0.5 : 1,
              }}
            >
              <UIText size="lg" color="white" weight="bold">
                ‹
              </UIText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNext}
              disabled={currentIndex === images.length - 1}
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: [{ translateY: -25 }],
                padding: 15,
                borderRadius: 25,
                backgroundColor:
                  currentIndex === images.length - 1
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.3)",
                opacity: currentIndex === images.length - 1 ? 0.5 : 1,
              }}
            >
              <UIText size="lg" color="white" weight="bold">
                ›
              </UIText>
            </TouchableOpacity>
          </>
        )}

        {/* Footer info */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 50,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <UIText size="sm" color="white" weight="medium" numberOfLines={1}>
            {getDisplayName(currentImage)}
          </UIText>
          <UIText
            size="xs"
            color="rgba(255,255,255,0.7)"
            style={{ marginTop: 4 }}
          >
            {getTechnicalInfo(currentImage)}
          </UIText>
        </View>
      </View>
    </Modal>
  );
};
