import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types/navigation";
import { UIText } from "../ui/Typography";

type LoginActionsNavigationProp = StackNavigationProp<RootStackParamList>;

interface LoginActionsProps {
  isLoading: boolean;
  onLogin: () => void;
  onForgotPassword: () => void;
}

export default function LoginActions({
  isLoading,
  onLogin,
  onForgotPassword,
}: LoginActionsProps) {
  const navigation = useNavigation<LoginActionsNavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const buttonAnim = React.useRef(new Animated.Value(0)).current;
  const textAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePrivacyPolicyPress = () => {
    navigation.navigate("PrivacyPolicyScreen");
  };

  return (
    <View style={tw`mt-0`}>
      {/* Login Button */}
      <Animated.View
        style={[
          tw`mb-2`,
          {
            opacity: buttonAnim,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[
              currentTheme.colors.primary,
              currentTheme.colors.secondary,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              tw`py-3.5 rounded-xl items-center justify-center flex-row`,
              {
                shadowColor: currentTheme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <UIText
                  size="base"
                  weight="bold"
                  style={[ui, tw`text-white mr-2`]}
                >
                  {t("login.signIn")}
                </UIText>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#ffffff"
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Sign Up Link */}
      <Animated.View
        style={[
          tw`flex-row justify-center items-center mb-2`,
          {
            opacity: textAnim,
            transform: [
              {
                translateY: textAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <UIText
          size="sm"
          weight="medium"
          style={[ui, { color: currentTheme.colors.text + "80" }]}
        >
          {t("login.noAccount")}
        </UIText>
        <TouchableOpacity
          onPress={() => navigation.navigate("RegisterScreen")}
          activeOpacity={0.7}
          style={tw`ml-1`}
        >
          <UIText
            size="sm"
            weight="bold"
            style={[ui, { color: currentTheme.colors.primary }]}
          >
            {t("login.signUp")}
          </UIText>
        </TouchableOpacity>
      </Animated.View>

      {/* Privacy Policy Link */}
      <Animated.View
        style={[
          tw`flex-row justify-center items-center`,
          {
            opacity: textAnim,
            transform: [
              {
                translateY: textAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrivacyPolicyPress}
          activeOpacity={0.7}
        >
          <UIText
            size="xs"
            weight="medium"
            style={[ui, { color: currentTheme.colors.textSecondary }]}
          >
            {t("login.privacyPolicy", "Politique de confidentialité")}
          </UIText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
