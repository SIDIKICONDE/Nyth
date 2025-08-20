import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useCallback, useState } from "react";
import { usePlanningAI } from "../../../../hooks/usePlanningAI";
import { RootStackParamList } from "../../../../types/navigation";
import { LABELS } from "../constants";
import { PlanningAIAssistantProps } from "../types";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const usePlanningAIAssistant = (props: PlanningAIAssistantProps) => {
  const { isExpanded = false, onToggle } = props;
  const navigation = useNavigation<NavigationProp>();
  const {
    insights,
    systemPrompt,
    quickSuggestions,
    hasOverdueEvents,
    eventMetrics,
  } = usePlanningAI();

  const [isVisible, setIsVisible] = useState(true);

  // Déterminer l'état d'expansion
  const displayExpanded = isExpanded || isVisible;

  // Vérifier s'il y a des données à afficher
  const hasData = eventMetrics.total > 0;

  // Gestion de la navigation vers le chat IA
  const handleChatWithContext = useCallback(
    (initialMessage?: string) => {
      navigation.navigate("AIChat", {
        initialMessage: initialMessage || LABELS.DEFAULT_CHAT_MESSAGE,
        invisibleContext: systemPrompt,
      });
    },
    [navigation, systemPrompt]
  );

  // Gestion des suggestions
  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      handleChatWithContext(suggestion);
    },
    [handleChatWithContext]
  );

  // Gestion du toggle de visibilité
  const handleToggleVisibility = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setIsVisible(!isVisible);
    }
  }, [onToggle, isVisible]);

  // Gestion du bouton chat principal
  const handleChatButtonPress = useCallback(() => {
    handleChatWithContext();
  }, [handleChatWithContext]);

  // Déterminer si le composant doit être affiché
  const shouldRender = hasData || isExpanded;

  return {
    // État
    displayExpanded,
    shouldRender,
    hasData,

    // Données AI
    suggestions: insights.suggestions,
    eventMetrics,
    completionRate: insights.completionRate,
    hasOverdueEvents,
    quickActions: quickSuggestions,

    // Actions
    handleToggleVisibility,
    handleSuggestionPress,
    handleChatButtonPress,
  };
};
