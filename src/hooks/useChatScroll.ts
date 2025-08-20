import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";

interface UseChatScrollProps {
  messages: any[];
  isTyping: boolean;
  keyboardVisible: boolean;
  autoScrollEnabled?: boolean;
}

export const useChatScroll = ({
  messages,
  isTyping,
  keyboardVisible,
  autoScrollEnabled = true, // ✅ Activé par défaut
}: UseChatScrollProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingToBottom = useRef(false);
  const userIsScrolling = useRef(false);
  const lastScrollTime = useRef(Date.now());
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false);
  const contentSizeRef = useRef({ width: 0, height: 0 });
  const layoutSizeRef = useRef({ width: 0, height: 0 });

  // ✅ Fonction de scroll simplifiée et plus fiable
  const scrollToBottom = useCallback(
    (animated = true, force = false) => {
      if (!scrollViewRef.current) return;

      // Si le scroll auto est désactivé et ce n'est pas forcé, ne pas scroller
      if (!autoScrollEnabled && !force) return;

      // Si l'utilisateur scroll manuellement et ce n'est pas forcé, ne pas interrompre
      if (
        userIsScrolling.current &&
        !force &&
        Date.now() - lastScrollTime.current < 3000
      ) {
        return;
      }

      isScrollingToBottom.current = true;

      // ✅ Utiliser scrollToEnd qui est plus fiable
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated });

          // ✅ Double vérification pour s'assurer que le scroll fonctionne
          setTimeout(
            () => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: false });
              }
              isScrollingToBottom.current = false;
            },
            animated ? 300 : 50
          );
        }
      }, 50);

      // Réinitialiser le flag si forcé
      if (force) {
        userIsScrolling.current = false;
        setShowScrollToBottomButton(false);
      }
    },
    [autoScrollEnabled]
  );

  // ✅ Gestionnaire de scroll simplifié
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    // Mettre à jour les références de taille
    contentSizeRef.current = {
      width: contentSize.width,
      height: contentSize.height,
    };
    layoutSizeRef.current = {
      width: layoutMeasurement.width,
      height: layoutMeasurement.height,
    };

    // Calculer si on est proche du bas
    const isNearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;

    lastScrollTime.current = Date.now();

    if (isNearBottom) {
      // ✅ En bas : réactiver le scroll automatique
      userIsScrolling.current = false;
      setShowScrollToBottomButton(false);
    } else if (!isScrollingToBottom.current) {
      // ✅ L'utilisateur a scrollé vers le haut
      userIsScrolling.current = true;
      setShowScrollToBottomButton(true);

      // ✅ Réactiver le scroll automatique après 5 secondes d'inactivité
      setTimeout(() => {
        const timeSinceLastScroll = Date.now() - lastScrollTime.current;
        if (timeSinceLastScroll >= 5000) {
          userIsScrolling.current = false;
        }
      }, 5000);
    }
  }, []);

  // ✅ Gestionnaire de changement de taille de contenu
  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentSizeRef.current = { width, height };

      // ✅ Scroll automatique si le contenu grandit et qu'on n'est pas en train de scroller manuellement
      if (!userIsScrolling.current && autoScrollEnabled) {
        scrollToBottom(true);
      }
    },
    [scrollToBottom, autoScrollEnabled]
  );

  // ✅ Effet pour nouveaux messages - simplifié
  useEffect(() => {
    if (messages.length > 0 && autoScrollEnabled && !userIsScrolling.current) {
      // ✅ Délai court pour laisser le temps au rendu de se faire
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [messages.length, scrollToBottom, autoScrollEnabled]);

  // ✅ Effet pour le clavier
  useEffect(() => {
    if (keyboardVisible && autoScrollEnabled && !userIsScrolling.current) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 300);
    }
  }, [keyboardVisible, scrollToBottom, autoScrollEnabled]);

  // ✅ Effet pour la fin de la frappe de l'IA
  useEffect(() => {
    if (!isTyping && autoScrollEnabled && !userIsScrolling.current) {
      // ✅ Scroll à la fin de la réponse de l'IA
      setTimeout(() => {
        scrollToBottom(true);
      }, 200);
    }
  }, [isTyping, scrollToBottom, autoScrollEnabled]);

  return {
    scrollViewRef,
    scrollToBottom,
    handleContentSizeChange,
    handleScroll,
    showScrollToBottomButton,
    userIsScrolling: userIsScrolling.current,
  };
};
