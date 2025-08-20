import * as React from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { Collapsible } from "../common/Collapsible";
import { UIText } from "../ui/Typography";

interface TopicInputSectionProps {
  topic: string;
  onTopicChange: (topic: string) => void;
}

export const TopicInputSection: React.FC<TopicInputSectionProps> = ({
  topic,
  onTopicChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Suggestions de sujets enrichies par catégorie
  const suggestedTopicsByCategory = {
    business: [
      "Améliorer sa productivité au travail",
      "Organiser son bureau efficacement",
      "Techniques de négociation commerciale",
      "Leadership et management d'équipe",
      "Économiser de l'argent au quotidien",
      "Créer son business en ligne",
      "Marketing digital pour débutants",
      "Gestion du stress professionnel",
      "Networking efficace en 2024",
      "Automatiser ses tâches répétitives",
      "Présentation PowerPoint percutante",
      "Gérer son temps comme un pro",
    ],
    lifestyle: [
      "Recette healthy en 10 minutes",
      "Exercices à faire chez soi",
      "Routine matinale énergisante",
      "Développement personnel quotidien",
      "Bien-être et méditation",
      "Décoration d'intérieur tendance",
      "Voyage budget-friendly",
      "Mode et style personnel",
      "Jardinage pour débutants",
      "Cuisine zéro déchet",
      "Sport à la maison sans équipement",
      "Sommeil réparateur naturellement",
    ],
    tech: [
      "Tendances technologiques 2024",
      "Intelligence artificielle au quotidien",
      "Applications essentielles smartphone",
      "Sécurité digitale et vie privée",
      "Productivité digitale optimisée",
      "Crypto-monnaies pour débutants",
      "Streaming et création de contenu",
      "Réseaux sociaux efficacement",
      "Smartphone photography tips",
      "Gadgets tech indispensables",
      "Cloud et stockage en ligne",
      "Cybersécurité personnelle",
    ],
    creative: [
      "Photo parfaite avec son smartphone",
      "Montage vidéo pour débutants",
      "Design graphique facile",
      "Écriture créative et storytelling",
      "Art digital et illustration",
      "Musique et composition audio",
      "Photographie de portrait",
      "Animation et motion design",
      "Podcast création et édition",
      "Calligraphie moderne",
      "DIY et projets créatifs",
      "Peinture et techniques artistiques",
    ],
    education: [
      "Apprendre une langue efficacement",
      "Techniques de mémorisation",
      "Étudier sans stress",
      "Mathématiques simplifiées",
      "Sciences pour tous",
      "Histoire fascinante",
      "Géographie interactive",
      "Philosophie accessible",
      "Économie expliquée simplement",
      "Littérature contemporaine",
      "Art et culture générale",
      "Révisions efficaces",
    ],
    health: [
      "Nutrition équilibrée au quotidien",
      "Exercices anti-stress",
      "Sommeil de qualité",
      "Hydratation optimale",
      "Posture et ergonomie",
      "Mental health awareness",
      "Yoga pour débutants",
      "Course à pied progression",
      "Musculation à domicile",
      "Stretching quotidien",
      "Respiration et relaxation",
      "Premiers secours essentiels",
    ],
    entertainment: [
      "Films incontournables 2024",
      "Séries à binge-watch",
      "Jeux vidéo tendances",
      "Livres best-sellers",
      "Musique découvertes",
      "Spectacles et concerts",
      "YouTube channels favorites",
      "Podcasts inspirants",
      "TikTok trends analysis",
      "Memes et culture internet",
      "Gaming setup parfait",
      "Streaming recommendations",
    ],
    food: [
      "Recettes rapides et savoureuses",
      "Cuisine du monde facile",
      "Pâtisserie pour débutants",
      "Cocktails et boissons",
      "Régimes alimentaires sains",
      "Cuisine végétarienne créative",
      "Meal prep efficace",
      "Street food maison",
      "Desserts sans sucre",
      "Cuisine de saison",
      "Techniques culinaires pro",
      "Food photography tips",
    ],
  };

  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof suggestedTopicsByCategory | null
  >(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const suggestionsListRef = useRef<FlatList>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Handle category selection with animation
  const handleCategoryChange = (
    category: keyof typeof suggestedTopicsByCategory
  ) => {
    // Toggle: deselect if already selected
    if (category === selectedCategory) {
      setSelectedCategory(null);
      return;
    }

    // Animate category change
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedCategory(category);

      // Reset suggestions list
      suggestionsListRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });
      setCanScrollLeft(false);
      setCanScrollRight(true);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Handle horizontal scroll indicators
  const handleSuggestionsScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollX = contentOffset.x;
    const maxScrollX = contentSize.width - layoutMeasurement.width;

    setCanScrollLeft(scrollX > 10);
    setCanScrollRight(scrollX < maxScrollX - 10);
  };

  // Get selected category display label
  const getSelectedCategoryLabel = () => {
    if (!selectedCategory) return "";
    const labels = {
      business: "💼 Business",
      lifestyle: "🌱 Lifestyle",
      tech: "💻 Tech",
      creative: "🎨 Créatif",
      education: "🎓 Éducation",
      health: "💪 Santé",
      entertainment: "🎬 Divertissement",
      food: "🍳 Cuisine",
    };
    return labels[selectedCategory];
  };

  return (
    <ScrollView
      style={tw`mb-4`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`pb-2`}
    >
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <UIText
          size="base"
          weight="semibold"
          style={[ui, { color: currentTheme.colors.text }]}
        >
          {t("topicInput.scriptTopic", "Sujet du script")}
        </UIText>
        <UIText
          size="xs"
          style={[
            ui,
            tw`px-2 py-0.5 rounded`,
            {
              color: currentTheme.colors.textSecondary,
              backgroundColor: currentTheme.colors.surface,
            },
          ]}
        >
          {topic.length} {t("topicInput.characters", "caractères")}
        </UIText>
      </View>

      <View style={tw`relative`}>
        <TextInput
          mode="outlined"
          value={topic}
          onChangeText={onTopicChange}
          placeholder={t(
            "topicInput.placeholder",
            "Décrivez votre sujet en détail..."
          )}
          style={tw`mb-2`}
          multiline
          numberOfLines={3}
          theme={{
            colors: {
              primary: currentTheme.colors.accent,
              outline: currentTheme.colors.border,
              background: currentTheme.colors.surface,
            },
          }}
        />
        {topic.length > 0 && (
          <TouchableOpacity
            onPress={() => onTopicChange("")}
            style={[
              tw`absolute right-2 top-2 w-6 h-6 rounded-full items-center justify-center`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <UIText style={[ui, { color: currentTheme.colors.text }]}>✕</UIText>
          </TouchableOpacity>
        )}
      </View>

      {/* Topic suggestions with categories */}
      <Collapsible
        title={t("topicInput.suggestions", "💡 Suggestions d'idées")}
        icon="💡"
        isDefaultOpen={false}
        selectedValue={selectedCategory}
        selectedLabel={getSelectedCategoryLabel()}
        helpMessage={t(
          "topicInput.categoryHelp",
          "Choisissez une catégorie pour voir des suggestions"
        )}
        style={tw`mb-0`}
      >
        {/* Category selection */}
        <FlatList
          data={Object.entries(suggestedTopicsByCategory)}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={tw`gap-1 mb-2 px-0.5`}
          keyExtractor={([category]) => category}
          renderItem={({ item: [category, _] }) => (
            <TouchableOpacity
              onPress={() =>
                handleCategoryChange(
                  category as keyof typeof suggestedTopicsByCategory
                )
              }
              style={[
                tw`px-2.5 py-1.5 rounded-full`,
                {
                  backgroundColor:
                    selectedCategory === category
                      ? currentTheme.colors.accent
                      : currentTheme.colors.surface,
                  borderWidth: 1,
                  borderColor:
                    selectedCategory === category
                      ? currentTheme.colors.accent
                      : currentTheme.colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedCategory === category ? 0.15 : 0.08,
                  shadowRadius: 1.5,
                  elevation: selectedCategory === category ? 1.5 : 0.5,
                },
              ]}
            >
              <UIText
                size="xs"
                weight="bold"
                style={[
                  ui,
                  {
                    color:
                      selectedCategory === category
                        ? "#ffffff"
                        : currentTheme.colors.text,
                  },
                ]}
              >
                {category === "business"
                  ? "💼 Business"
                  : category === "lifestyle"
                  ? "🌱 Lifestyle"
                  : category === "tech"
                  ? "💻 Tech"
                  : category === "creative"
                  ? "🎨 Créatif"
                  : category === "education"
                  ? "🎓 Éducation"
                  : category === "health"
                  ? "💪 Santé"
                  : category === "entertainment"
                  ? "🎬 Divertissement"
                  : "🍳 Cuisine"}
              </UIText>
            </TouchableOpacity>
          )}
        />

        {/* Topic suggestions for selected category */}
        <View style={tw`relative`}>
          {/* Scroll indicators */}
          {canScrollLeft && (
            <View
              style={[
                tw`absolute left-0 top-0 bottom-0 w-4 z-10 justify-center`,
                {
                  background: `linear-gradient(to right, ${currentTheme.colors.background}, transparent)`,
                },
              ]}
            >
              <UIText
                size="sm"
                style={[
                  ui,
                  tw`text-center`,
                  { color: currentTheme.colors.accent },
                ]}
              >
                ‹
              </UIText>
            </View>
          )}

          {canScrollRight && (
            <View
              style={[
                tw`absolute right-0 top-0 bottom-0 w-4 z-10 justify-center`,
                {
                  background: `linear-gradient(to left, ${currentTheme.colors.background}, transparent)`,
                },
              ]}
            >
              <UIText
                size="sm"
                style={[
                  ui,
                  tw`text-center`,
                  { color: currentTheme.colors.accent },
                ]}
              >
                ›
              </UIText>
            </View>
          )}

          <Animated.View style={{ opacity: fadeAnim }}>
            {selectedCategory ? (
              <FlatList
                ref={suggestionsListRef}
                data={suggestedTopicsByCategory[selectedCategory]}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={tw`gap-1.5 px-0.5`}
                keyExtractor={(item, index) => `${selectedCategory}-${index}`}
                extraData={selectedCategory}
                onScroll={handleSuggestionsScroll}
                scrollEventThrottle={16}
                renderItem={({ item: suggestion }) => (
                  <TouchableOpacity
                    onPress={() => onTopicChange(suggestion)}
                    style={[
                      tw`px-2.5 py-1.5 rounded-lg`,
                      {
                        backgroundColor:
                          topic === suggestion
                            ? currentTheme.colors.accent
                            : currentTheme.colors.surface,
                        borderWidth: 1,
                        borderColor:
                          topic === suggestion
                            ? currentTheme.colors.accent
                            : currentTheme.colors.border,
                        minWidth: 120,
                        maxWidth: 180,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 1,
                        elevation: 0.5,
                      },
                    ]}
                  >
                    <UIText
                      size="xs"
                      weight="medium"
                      style={[
                        ui,
                        tw`text-center`,
                        {
                          color:
                            topic === suggestion
                              ? "#ffffff"
                              : currentTheme.colors.text,
                        },
                      ]}
                      numberOfLines={3}
                    >
                      {suggestion}
                    </UIText>
                  </TouchableOpacity>
                )}
              />
            ) : null}
          </Animated.View>
        </View>
      </Collapsible>
    </ScrollView>
  );
};
