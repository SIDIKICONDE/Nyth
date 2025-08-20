import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useRef, useEffect } from "react";
import {
  FlatList,
  Modal,
  TouchableOpacity,
  View,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import SettingRow from "./SettingRow";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const languages = [
  {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    nativeName: "Français",
    greeting: "Bonjour ! Comment allez-vous ?",
  },
  {
    code: "en",
    name: "English",
    flag: "🇺🇸",
    nativeName: "English",
    greeting: "Hello! How are you today?",
  },
  {
    code: "es",
    name: "Español",
    flag: "🇪🇸",
    nativeName: "Español",
    greeting: "¡Hola! ¿Cómo estás?",
  },
  {
    code: "pt",
    name: "Português",
    flag: "🇵🇹",
    nativeName: "Português",
    greeting: "Olá! Como você está?",
  },
  {
    code: "it",
    name: "Italiano",
    flag: "🇮🇹",
    nativeName: "Italiano",
    greeting: "Ciao! Come stai?",
  },
  {
    code: "de",
    name: "Deutsch",
    flag: "🇩🇪",
    nativeName: "Deutsch",
    greeting: "Hallo! Wie geht es dir?",
  },
  {
    code: "ja",
    name: "日本語",
    flag: "🇯🇵",
    nativeName: "日本語",
    greeting: "こんにちは！元気ですか？",
  },
  {
    code: "ko",
    name: "한국어",
    flag: "🇰🇷",
    nativeName: "한국어",
    greeting: "안녕하세요! 어떻게 지내세요?",
  },
  {
    code: "hi",
    name: "हिन्दी",
    flag: "🇮🇳",
    nativeName: "हिन्दी",
    greeting: "नमस्ते! आप कैसे हैं?",
  },
  {
    code: "zh",
    name: "中文",
    flag: "🇨🇳",
    nativeName: "中文",
    greeting: "你好！你好吗？",
  },
  {
    code: "ru",
    name: "Русский",
    flag: "🇷🇺",
    nativeName: "Русский",
    greeting: "Привет! Как дела?",
  },
];

export default function LanguageSection() {
  const { currentTheme } = useTheme();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const itemAnimations = useRef(
    languages.map(() => new Animated.Value(0))
  ).current;

  const currentLanguageData = languages.find(
    (lang) => lang.code === currentLanguage
  );

  useEffect(() => {
    if (isModalVisible) {
      // Animation d'ouverture
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation séquentielle des éléments
      const staggeredAnimations = itemAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        })
      );

      Animated.stagger(50, staggeredAnimations).start();
    } else {
      // Reset des animations
      fadeAnim.setValue(0);
      slideAnim.setValue(screenHeight);
      scaleAnim.setValue(0.9);
      itemAnimations.forEach((anim) => anim.setValue(0));
    }
  }, [isModalVisible]);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);

    // Animation de fermeture puis changement de langue
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      changeLanguage(languageCode);
      setIsModalVisible(false);
    });
  };

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsModalVisible(false);
    });
  };

  const renderLanguageItem = ({
    item,
    index,
  }: {
    item: (typeof languages)[0];
    index: number;
  }) => {
    const isSelected = selectedLanguage === item.code;
    const isCurrentLanguage = currentLanguage === item.code;

    return (
      <Animated.View
        style={{
          opacity: itemAnimations[index],
          transform: [
            {
              translateY: itemAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          onPress={() => handleLanguageSelect(item.code)}
          style={[
            tw`flex-row items-center px-6 py-4 mx-4 mb-2 rounded-2xl`,
            {
              backgroundColor:
                isSelected || isCurrentLanguage
                  ? currentTheme.colors.primary + "15"
                  : currentTheme.colors.surface,
              borderWidth: isSelected || isCurrentLanguage ? 2 : 1,
              borderColor:
                isSelected || isCurrentLanguage
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border + "30",
              shadowColor:
                isSelected || isCurrentLanguage
                  ? currentTheme.colors.primary
                  : "#000",
              shadowOffset: {
                width: 0,
                height: isSelected || isCurrentLanguage ? 4 : 2,
              },
              shadowOpacity: isSelected || isCurrentLanguage ? 0.3 : 0.1,
              shadowRadius: isSelected || isCurrentLanguage ? 8 : 4,
              elevation: isSelected || isCurrentLanguage ? 8 : 2,
            },
          ]}
          activeOpacity={0.8}
        >
          {/* Flag avec animation */}
          <View
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center mr-4`,
              {
                backgroundColor:
                  isSelected || isCurrentLanguage
                    ? currentTheme.colors.primary + "20"
                    : currentTheme.colors.background,
              },
            ]}
          >
            <UIText style={tw`text-2xl`} color={currentTheme.colors.text}>
              {item.flag}
            </UIText>
          </View>

          {/* Informations de langue */}
          <View style={tw`flex-1`}>
            <UIText
              size="lg"
              weight="semibold"
              color={
                isSelected || isCurrentLanguage
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text
              }
              style={tw`mb-1`}
            >
              {item.nativeName}
            </UIText>
            <UIText
              size="sm"
              color={currentTheme.colors.textSecondary}
              style={tw`opacity-80`}
            >
              {item.greeting}
            </UIText>
          </View>

          {/* Indicateur de sélection */}
          {(isSelected || isCurrentLanguage) && (
            <Animated.View
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center ml-3`,
                {
                  backgroundColor: currentTheme.colors.primary,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <SectionHeader title={t("settings.language.title")} />
      <Card>
        <SettingRow
          icon="translate"
          iconColor="#ffffff"
          iconBgColor="#10b981"
          title={t("settings.language.title")}
          subtitle={currentLanguageData?.name || currentLanguage}
          onPress={() => setIsModalVisible(true)}
          rightElement={
            <View style={tw`flex-row items-center`}>
              <UIText style={tw`text-lg mr-2`} color={currentTheme.colors.text}>
                {currentLanguageData?.flag || "🌐"}
              </UIText>
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={currentTheme.colors.textSecondary}
              />
            </View>
          }
        />
      </Card>

      <Modal
        visible={isModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <Animated.View
            style={[
              tw`flex-1`,
              {
                backgroundColor: "rgba(0, 0, 0, 0.6)", // Fond plus foncé pour mieux voir
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={tw`flex-1 justify-end`}>
                <Animated.View
                  style={[
                    tw`rounded-t-3xl overflow-hidden`,
                    {
                      backgroundColor: currentTheme.colors.background,
                      maxHeight: screenHeight * 0.75, // Hauteur réduite pour éviter les conflits
                      minHeight: screenHeight * 0.4,
                      transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim },
                      ],
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: -4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 30,
                      // Forcer le positionnement au premier plan
                      position: "relative",
                      zIndex: 1,
                    },
                  ]}
                >
                  {/* Barre de glissement */}
                  <View style={tw`items-center py-3`}>
                    <View
                      style={[
                        tw`w-12 h-1 rounded-full`,
                        { backgroundColor: currentTheme.colors.border },
                      ]}
                    />
                  </View>

                  {/* Header amélioré */}
                  <View
                    style={[
                      tw`flex-row items-center justify-between px-6 pb-4`,
                      {
                        backgroundColor: currentTheme.colors.background,
                      },
                    ]}
                  >
                    <View>
                      <UIText
                        size="xl"
                        weight="bold"
                        color={currentTheme.colors.text}
                        style={tw`mb-1`}
                      >
                        {t("settings.language.selectLanguage")}
                      </UIText>
                      <UIText
                        size="sm"
                        color={currentTheme.colors.textSecondary}
                      >
                        {t(
                          "settings.language.selectLanguageSubtitle",
                          "Choisissez votre langue préférée"
                        )}
                      </UIText>
                    </View>

                    <TouchableOpacity
                      onPress={handleCloseModal}
                      style={[
                        tw`w-10 h-10 rounded-full items-center justify-center`,
                        {
                          backgroundColor: currentTheme.colors.surface,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={22}
                        color={currentTheme.colors.text}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Liste des langues avec design amélioré */}
                  <FlatList
                    data={languages}
                    renderItem={renderLanguageItem}
                    keyExtractor={(item) => item.code}
                    style={tw`flex-1 px-0`}
                    contentContainerStyle={tw`pb-8`}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    decelerationRate="fast"
                  />
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
