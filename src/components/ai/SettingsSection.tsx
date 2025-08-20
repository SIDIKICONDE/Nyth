import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Layout,
  SlideInLeft,
} from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { UIText } from "../ui/Typography";

interface SettingsSectionProps {
  title: string;
  icon: string;
  iconColor?: string;
  delay?: number;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  iconColor,
  delay = 100,
  children,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  const iconScale = useSharedValue(1);
  const headerOpacity = useSharedValue(0.8);

  React.useEffect(() => {
    iconScale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const finalIconColor = iconColor || currentTheme.colors.accent;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(600).springify()}
      layout={Layout.springify()}
      style={tw`mb-6`}
    >
      <Animated.View
        entering={SlideInLeft.delay(delay + 100).duration(500)}
        style={[
          tw`mb-4 p-3 rounded-xl`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
          },
          headerAnimatedStyle,
        ]}
      >
        <View style={tw`flex-row items-center`}>
          <Animated.View
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
              { backgroundColor: `${finalIconColor}15` },
              iconAnimatedStyle,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={finalIconColor}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInRight.delay(delay + 200).duration(500)}
            style={tw`flex-1`}
          >
            <UIText
              size="lg"
              weight="bold"
              style={[ui, { color: currentTheme.colors.text }, tw`mb-1`]}
              children={title}
            />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(delay + 200)
          .duration(700)
          .springify()}
        style={tw`gap-3`}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

export default SettingsSection;
