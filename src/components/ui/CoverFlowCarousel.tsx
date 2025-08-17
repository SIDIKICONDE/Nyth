import React, { useRef, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { UIText } from "./Typography";

const { width: screenWidth } = Dimensions.get("window");

// Fonction d'interpolation simple
const interpolateValue = (
  value: number,
  inputRange: number[],
  outputRange: number[]
): number => {
  const [inputMin, inputMid, inputMax] = inputRange;
  const [outputMin, outputMid, outputMax] = outputRange;

  if (value <= inputMin) return outputMin;
  if (value >= inputMax) return outputMax;
  if (value <= inputMid) {
    const ratio = (value - inputMin) / (inputMid - inputMin);
    return outputMin + ratio * (outputMid - outputMin);
  } else {
    const ratio = (value - inputMid) / (inputMax - inputMid);
    return outputMid + ratio * (outputMax - outputMid);
  }
};

type CoverFlowCarouselProps = {
  images: string[]; // Array of image URLs
  onImagePress?: (index: number) => void;
  itemWidth?: number;
  itemHeight?: number;
  maxVisibleItems?: number;
  themeColors?: {
    border: string;
    textSecondary: string;
  };
};

// Utilisation d'Image normal avec style animé

export const CoverFlowCarousel: React.FC<CoverFlowCarouselProps> = ({
  images,
  onImagePress,
  itemWidth = 50,
  itemHeight = 40,
  maxVisibleItems = 3,
  themeColors = {
    border: "#e0e0e0",
    textSecondary: "#666",
  },
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(screenWidth);

  if (!images || images.length === 0) {
    return null;
  }

  const displayedImages = images.slice(0, maxVisibleItems);
  const hasMoreImages = images.length > maxVisibleItems;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  };

  const renderImage = (imageUrl: string, index: number) => {
    const inputRange = [
      (index - 1) * itemWidth,
      index * itemWidth,
      (index + 1) * itemWidth,
    ];

    // Calcul des transformations sophistiquées avec effets de profondeur
    const scale = interpolateValue(scrollX, inputRange, [0.75, 1.25, 0.75]);
    const rotateY = interpolateValue(scrollX, inputRange, [25, 0, -25]);
    const translateX = interpolateValue(scrollX, inputRange, [18, 0, -18]);
    const opacity = interpolateValue(scrollX, inputRange, [0.4, 1, 0.4]);

    // Effets d'ombre sophistiqués basés sur la position
    const shadowOffsetX = translateX * 0.3;
    const shadowOffsetY = Math.abs(translateX) * 0.2;
    const shadowOpacity = (1 - Math.abs(translateX) / 18) * 0.4;
    const elevation = Math.abs(translateX) * 0.3;

    const animatedStyle = {
      transform: [
        { scale },
        { perspective: 1200 },
        { rotateY: `${rotateY}deg` },
        { translateX },
      ],
      opacity,
      shadowColor: "#000",
      shadowOffset: {
        width: shadowOffsetX,
        height: shadowOffsetY,
      },
      shadowOpacity,
      shadowRadius: 6 + Math.abs(translateX) * 0.2,
      elevation,
    };

    return (
      <TouchableOpacity
        key={`${imageUrl}-${index}`}
        onPress={() => onImagePress?.(index)}
        activeOpacity={0.9}
        style={{
          width: itemWidth,
          height: itemHeight,
          marginHorizontal: 1,
        }}
      >
        {/* Conteneur avec effet de brillance */}
        <View
          style={[
            {
              width: itemWidth,
              height: itemHeight,
              borderRadius: 6,
              overflow: "hidden",
              backgroundColor: themeColors.border,
            },
            animatedStyle,
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: itemWidth,
              height: itemHeight,
              borderRadius: 6,
            }}
            resizeMode="cover"
          />

          {/* Effet de reflet sophistiqué */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "60%",
              height: "100%",
              backgroundColor: `rgba(255,255,255,${opacity * 0.15})`,
              opacity: scale - 0.85,
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
              pointerEvents: "none",
            }}
          />

          {/* Bordure subtile avec effet de profondeur */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 6,
              borderWidth: 0.5,
              borderColor: `rgba(255,255,255,${opacity * 0.3})`,
              pointerEvents: "none",
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        height: itemHeight,
        marginVertical: 0,
      }}
      onLayout={(event) => {
        setContainerWidth(event.nativeEvent.layout.width);
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={itemWidth + 1} // itemWidth + marginHorizontal * 2
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: (containerWidth - itemWidth) / 2,
          alignItems: "center",
        }}
        bounces={false}
        style={{
          flexGrow: 0,
        }}
      >
        {displayedImages.map((imageUrl, index) => renderImage(imageUrl, index))}
      </ScrollView>

      {/* Indicateur sophistiqué pour plus d'images */}
      {hasMoreImages && (
        <View
          style={{
            position: "absolute",
            bottom: 2,
            right: 4,
            backgroundColor: "rgba(0,0,0,0.75)",
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.2)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <UIText size="xs" color="white" weight="bold">
            +{images.length - maxVisibleItems}
          </UIText>
        </View>
      )}
    </View>
  );
};
