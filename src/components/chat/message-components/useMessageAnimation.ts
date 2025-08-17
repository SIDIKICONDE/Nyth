import { useCallback, useEffect, useRef, useState } from "react";
import { Message } from "../../../types/chat";
import { useAnimatedMessages } from "../AnimatedMessagesContext";

export const useMessageAnimation = (
  message: Message,
  isNewMessage: boolean
) => {
  const { isMessageAnimated, markMessageAsAnimated, unmarkMessageAsAnimated } =
    useAnimatedMessages();

  // Référence pour détecter les changements de contenu
  const previousContentRef = useRef(message.content);
  const hasContentChanged = useRef(false);
  const isInitializedRef = useRef(false);

  // État pour contrôler l'animation - optimisé
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(() => {
    // Animer seulement si c'est un message IA non-animé ET nouveau
    if (message.isUser) return false;
    if (!isNewMessage) return false;
    return !isMessageAnimated(message.id);
  });

  // Callback optimisé pour marquer l'animation comme terminée
  const handleAnimationComplete = useCallback(() => {
    markMessageAsAnimated(message.id);
    setShouldAnimate(false);
  }, [message.id, markMessageAsAnimated]);

  // Détecter les modifications de message de manière optimisée
  useEffect(() => {
    // Éviter les vérifications inutiles lors de l'initialisation
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      previousContentRef.current = message.content;
      return;
    }

    // Vérifier uniquement si le contenu a réellement changé
    if (previousContentRef.current !== message.content && !message.isUser) {
      hasContentChanged.current = true;
      unmarkMessageAsAnimated(message.id);
      previousContentRef.current = message.content;
    }
  }, [message.content, message.id, message.isUser, unmarkMessageAsAnimated]);

  // Gérer l'animation - logique optimisée
  useEffect(() => {
    // Ignorer les messages utilisateur
    if (message.isUser) {
      setShouldAnimate(false);
      return;
    }

    const wasAnimated = isMessageAnimated(message.id);

    // Logique simplifiée pour déterminer si l'animation est nécessaire
    const needsAnimation =
      hasContentChanged.current || // Le contenu a changé
      (!wasAnimated && isNewMessage); // Nouveau message non-animé

    // Mettre à jour l'état d'animation seulement si nécessaire
    if (needsAnimation !== shouldAnimate) {
      setShouldAnimate(needsAnimation);
    }

    // Réinitialiser le flag de changement de contenu
    if (hasContentChanged.current) {
      hasContentChanged.current = false;
    }
  }, [
    message.id,
    message.isUser,
    isMessageAnimated,
    shouldAnimate,
    isNewMessage,
  ]);

  return {
    shouldAnimate,
    handleAnimationComplete,
  };
};
