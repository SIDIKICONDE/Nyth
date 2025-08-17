import { useScripts } from "@/contexts/ScriptsContext";
import { useTheme } from "@/contexts/ThemeContext";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

export const StatsCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const { scripts } = useScripts();

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(600)}
      style={tw`px-4 mb-6`}
    >
      <LinearGradient
        colors={[currentTheme.colors.primary, currentTheme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`p-4 rounded-2xl`}
      >
        <View style={tw`flex-row justify-around`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-white text-2xl font-bold`}>
              {scripts.length}
            </Text>
            <Text style={tw`text-white text-sm`}>Scripts</Text>
          </View>
          <View style={tw`w-px h-12 bg-white opacity-30`} />
          <View style={tw`items-center`}>
            <Text style={tw`text-white text-2xl font-bold`}>0</Text>
            <Text style={tw`text-white text-sm`}>Vidéos</Text>
          </View>
          <View style={tw`w-px h-12 bg-white opacity-30`} />
          <View style={tw`items-center`}>
            <Text style={tw`text-white text-2xl font-bold`}>∞</Text>
            <Text style={tw`text-white text-sm`}>Possibilités</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
