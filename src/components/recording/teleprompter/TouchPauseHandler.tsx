import React, { useRef, useState } from "react";
import { View, GestureResponderEvent } from "react-native";
import { useTranslation } from "../../../hooks/useTranslation";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('TouchPauseHandler');

interface TouchPauseHandlerProps {
  onTogglePause?: () => void; // 🆕 Pour le tap rapide (toggle intelligent)
  onPauseScroll?: () => void; // Pour le hold start
  onResumeScroll?: () => void; // Pour le hold end
  onDoubleTap?: () => void;
  children: React.ReactNode;
}

export function TouchPauseHandler({
  onTogglePause,
  onPauseScroll,
  onResumeScroll,
  onDoubleTap,
  children,
}: TouchPauseHandlerProps) {
  const { t } = useTranslation();

  // État du touch
  const [isTouching, setIsTouching] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  // Références pour la logique
  const touchStartTimeRef = useRef<number>(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const lastTapPositionRef = useRef({ x: 0, y: 0 });
  const isProcessingDoubleTapRef = useRef(false);

  // Constantes claires
  const DOUBLE_TAP_DELAY = 300;
  const HOLD_DELAY = 500; // Temps avant de considérer comme "hold"
  const TAP_DISTANCE_THRESHOLD = 50;

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    const now = Date.now();

    logger.debug("🖐️ Touch Start - Position:", { x: pageX, y: pageY });
    setIsTouching(true);
    touchStartTimeRef.current = now;

    // 1. VÉRIFIER DOUBLE TAP EN PREMIER
    if (lastTapRef.current > 0) {
      const timeDiff = now - lastTapRef.current;
      const distance = Math.sqrt(
        Math.pow(pageX - lastTapPositionRef.current.x, 2) +
          Math.pow(pageY - lastTapPositionRef.current.y, 2)
      );

      if (timeDiff <= DOUBLE_TAP_DELAY && distance <= TAP_DISTANCE_THRESHOLD) {
        logger.debug("👆👆 DOUBLE TAP DÉTECTÉ - RESET!");
        isProcessingDoubleTapRef.current = true;

        // Nettoyer les timeouts
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = null;
        }
        if (doubleTapTimeoutRef.current) {
          clearTimeout(doubleTapTimeoutRef.current);
          doubleTapTimeoutRef.current = null;
        }
        if (singleTapTimeoutRef.current) {
          clearTimeout(singleTapTimeoutRef.current);
          singleTapTimeoutRef.current = null;
        }

        // Exécuter le reset
        if (onDoubleTap) {
          onDoubleTap();
        }

        // Reset état
        lastTapRef.current = 0;
        return; // SORTIR - ne pas traiter comme touch normal
      }
    }

    // 2. CONFIGURER HOLD TIMER (seulement si pas double tap)
    if (!isProcessingDoubleTapRef.current) {
      holdTimeoutRef.current = setTimeout(() => {
        logger.debug("🖐️ HOLD DÉTECTÉ - PAUSE pendant maintien");
        setIsHolding(true);
        if (onPauseScroll) {
          onPauseScroll();
        }
      }, HOLD_DELAY);
    }

    // 3. ENREGISTRER POUR DOUBLE TAP FUTUR
    lastTapRef.current = now;
    lastTapPositionRef.current = { x: pageX, y: pageY };

    // 4. TIMEOUT POUR NETTOYER DOUBLE TAP
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
    }
    doubleTapTimeoutRef.current = setTimeout(() => {
      lastTapRef.current = 0;
      doubleTapTimeoutRef.current = null;
    }, DOUBLE_TAP_DELAY);
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    const touchDuration = Date.now() - touchStartTimeRef.current;
    logger.debug("🖐️ Touch End - Durée:", touchDuration + "ms");

    setIsTouching(false);

    // Nettoyer le hold timeout
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    // Si c'était un double tap, ne rien faire d'autre
    if (isProcessingDoubleTapRef.current) {
      logger.debug("👆👆 Double tap traité - ignorer TouchEnd");
      isProcessingDoubleTapRef.current = false;
      setIsHolding(false);
      return;
    }

    // Si c'était un HOLD, reprendre le défilement
    if (isHolding) {
      logger.debug("🖐️ Fin du HOLD - REPRENDRE défilement");
      setIsHolding(false);
      if (onResumeScroll) {
        onResumeScroll();
      }
      return;
    }

    // Si c'était un TAP RAPIDE (< HOLD_DELAY), toggle pause/reprise
    if (touchDuration < HOLD_DELAY) {
      logger.debug(
        "👆 Tap rapide (" + touchDuration + "ms) - TOGGLE PAUSE/REPRISE"
      );

      // Différer le simple tap pour laisser la fenêtre au double-tap
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      singleTapTimeoutRef.current = setTimeout(() => {
        if (!isProcessingDoubleTapRef.current && onTogglePause) {
          onTogglePause();
        }
        singleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY + 20);
      return;
    }
  };

  // Cleanup à la destruction
  React.useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isTouching
          ? "rgba(255, 255, 255, 0.05)"
          : "transparent",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      {/* Indicateur visuel de hold */}
      {isHolding && (
        <View
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          {/* Texte indicateur optionnel */}
        </View>
      )}
    </View>
  );
}
