import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, TextStyle, View } from "react-native";
import { useFont } from "../../contexts/FontContext";
import { processFormattedText } from "../../utils/textFormatter";

interface TypingAnimationProps {
  text: string;
  style?: StyleProp<TextStyle>;
  typingSpeed?: number;
  onComplete?: () => void;
  selectable?: boolean;
}

const TypingAnimation: React.FC<TypingAnimationProps> = React.memo(
  ({
    text,
    style,
    typingSpeed = 20, // Vitesse simple
    onComplete,
    selectable = true,
  }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const { getContentFontStyle } = useFont();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const indexRef = useRef(0);
    const isAnimatingRef = useRef(false);

    // Fonction d'animation simple avec setTimeout
    const startAnimation = useCallback(() => {
      if (isAnimatingRef.current || !text) return;

      isAnimatingRef.current = true;
      indexRef.current = 0;
      setDisplayedText("");
      setIsComplete(false);

      const animate = () => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.substring(0, indexRef.current + 1));
          indexRef.current++;

          intervalRef.current = setTimeout(animate, typingSpeed);
        } else {
          // Animation terminée
          isAnimatingRef.current = false;
          setIsComplete(true);
          if (onComplete) onComplete();
        }
      };

      // Démarrer l'animation
      intervalRef.current = setTimeout(animate, typingSpeed);
    }, [text, typingSpeed, onComplete]);

    // Fonction pour arrêter l'animation
    const stopAnimation = useCallback(() => {
      isAnimatingRef.current = false;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }, []);

    // Réinitialiser l'animation quand le texte change
    useEffect(() => {
      stopAnimation();

      if (text) {
        // Petit délai pour éviter les conflits
        const timeout = setTimeout(() => {
          startAnimation();
        }, 50);

        return () => clearTimeout(timeout);
      }

      return () => {};
    }, [text, startAnimation, stopAnimation]);

    // Nettoyer à la fin
    useEffect(() => {
      return () => {
        stopAnimation();
      };
    }, [stopAnimation]);

    // Créer le style combiné avec la police de contenu
    const combinedStyle = [style, getContentFontStyle()];

    return (
      <View>
        {processFormattedText(displayedText, combinedStyle, isComplete)}
      </View>
    );
  },
  // Optimisation du memo - ne re-render que si ces props changent
  (prevProps, nextProps) => {
    return (
      prevProps.text === nextProps.text &&
      prevProps.typingSpeed === nextProps.typingSpeed &&
      prevProps.style === nextProps.style
    );
  }
);

export default TypingAnimation;
