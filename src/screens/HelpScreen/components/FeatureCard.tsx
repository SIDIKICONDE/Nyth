import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Dimensions, Text } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import tw from "twrnc";
import { FeatureCard as FeatureCardType } from "../types";

const { width: screenWidth } = Dimensions.get("window");

interface FeatureCardProps {
  feature: FeatureCardType;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  return (
    <Animated.View
      key={feature.id}
      entering={FadeInUp.delay(index * 100).duration(600)}
      style={tw`w-[${screenWidth / 2 - 24}px] mb-4`}
    >
      <LinearGradient
        colors={[...feature.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`p-4 rounded-2xl h-40`}
      >
        <MaterialCommunityIcons
          name={feature.icon as any}
          size={40}
          color="white"
        />
        <Text style={tw`text-white font-bold text-base mt-2`}>
          {feature.title}
        </Text>
        <Text style={tw`text-white text-xs mt-1 opacity-90`}>
          {feature.description}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};
