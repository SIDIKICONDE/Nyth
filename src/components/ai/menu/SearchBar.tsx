import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { Animated, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useFont } from "../../../contexts/FontContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getContentFontStyle } = useFont();
  const [isFocused, setIsFocused] = React.useState(false);
  const animatedScale = React.useRef(new Animated.Value(1)).current;
  const animatedOpacity = React.useRef(new Animated.Value(0.6)).current;

  // Animations pour le focus
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: isFocused ? 1.02 : 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isFocused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, animatedScale, animatedOpacity]);

  return (
    <View style={tw`px-5`}>
      <Animated.View
        style={[
          tw`flex-row items-center px-4 py-2.5 rounded-full`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
            borderWidth: 1,
            borderColor: isFocused
              ? currentTheme.colors.accent + "40"
              : "transparent",
            transform: [{ scale: animatedScale }],
          },
        ]}
      >
        <Animated.View style={{ opacity: animatedOpacity }}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={
              isFocused
                ? currentTheme.colors.accent
                : currentTheme.colors.textSecondary
            }
          />
        </Animated.View>

        <TextInput
          placeholder={placeholder || t("menu.search")}
          placeholderTextColor={
            currentTheme.isDark
              ? "rgba(255, 255, 255, 0.4)"
              : "rgba(0, 0, 0, 0.4)"
          }
          style={[
            tw`flex-1 mx-3 text-base`,
            {
              color: currentTheme.colors.text,
            },
            getContentFontStyle(),
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {value.length > 0 && (
          <Animated.View
            style={{
              opacity: animatedOpacity,
            }}
          >
            <TouchableOpacity
              onPress={() => onChangeText("")}
              style={[
                tw`p-1.5 rounded-full`,
                {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={14}
                color={currentTheme.colors.text}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

export default SearchBar;
