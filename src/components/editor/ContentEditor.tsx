import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useContentFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { TextFormatter } from "../../utils/textFormatter";

import { createOptimizedLogger } from "../../utils/optimizedLogger";
const logger = createOptimizedLogger("ContentEditor");

interface ContentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (event: {
    nativeEvent: { selection: { start: number; end: number } };
  }) => void;
  onContentSizeChange?: () => void;
  contentInputRef?: React.RefObject<TextInput | null>;
  isLandscape?: boolean;
}

export default function ContentEditor({
  content,
  onContentChange,
  onSelectionChange,
  onContentSizeChange,
  contentInputRef,
  isLandscape = false,
}: ContentEditorProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const contentFontStyle = useContentFont({ fontSize: 16 });
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(true);
  const textInputRef = useRef<TextInput>(null);
  const [dimensions, setDimensions] = useState({
    minHeight: 200,
    maxHeight: isLandscape ? 400 : 500,
  });

  // Fusionner la référence passée avec la référence locale
  const mergedRef = useCallback(
    (node: TextInput | null) => {
      if (textInputRef.current !== node) {
        (textInputRef as React.MutableRefObject<TextInput | null>).current =
          node;
      }
      if (contentInputRef && typeof contentInputRef === "object") {
        (contentInputRef as React.MutableRefObject<TextInput | null>).current =
          node;
      }
    },
    [contentInputRef]
  );

  // Gestion du placeholder qui change en fonction de la langue
  const placeholderText = t("editor.placeholder.text");

  // Fonction sécurisée pour mettre à jour le contenu
  const handleContentChange = useCallback(
    (newContent: string) => {
      logger.debug("Content change in editor, length:", newContent.length);

      // Stocker le contenu brut sans aucun formatage
      onContentChange(newContent);
    },
    [onContentChange]
  );

  // Nettoyer le texte pour l'affichage dans l'éditeur (enlever les marqueurs Markdown)
  const cleanTextForDisplay = useCallback((text: string): string => {
    if (!text) return "";

    return (
      TextFormatter.stripHtmlTags(text)
        // Supprimer les marqueurs de formatage Markdown
        .replace(/\*\*/g, "") // gras
        .replace(/\*/g, "") // italique
        .replace(/\^/g, "") // surlignage
        .replace(/_/g, "") // italique (underscore)
        .replace(/__/g, "") // gras (double underscore)
        // Nettoyer les titres
        .replace(/^#+\s/gm, "")
        // Nettoyer les listes
        .replace(/^-\s+/gm, "")
        // Supprimer directement les caractères < et >
        .replace(/</g, "")
        .replace(/>/g, "")
    );
  }, []);

  // Recalculer les dimensions lors du changement d'orientation
  useEffect(() => {
    const updateDimensions = () => {
      const { height } = Dimensions.get("window");

      // Différentes tailles selon l'orientation et le type d'appareil
      if (isLandscape) {
        setDimensions({
          minHeight: 200,
          maxHeight: Math.min(600, height * 0.7),
        });
      } else {
        setDimensions({
          minHeight: 200,
          maxHeight: Math.min(800, height * 0.9),
        });
      }
    };

    updateDimensions();

    // Écouter les changements d'orientation
    const dimensionsSubscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );

    return () => {
      // Nettoyage de l'écouteur lors du démontage du composant
      dimensionsSubscription.remove();
    };
  }, [isLandscape]);

  // Gérer le début du défilement via détection de toucher
  const handleTouchStart = useCallback(() => {
    // Pas d'action spéciale au début du toucher
  }, []);

  // Forcer la sélection au début après mise à jour du contenu lorsqu'on n'est pas en édition
  useEffect(() => {
    if (!isFocused && textInputRef.current) {
      textInputRef.current.setNativeProps({ selection: { start: 0, end: 0 } });
    }
  }, [content, isFocused]);

  return (
    <View style={tw`flex-1`}>
      <View style={tw`flex-1`}>
        <TextInput
          ref={mergedRef}
          style={[
            contentFontStyle,
            tw`p-4 rounded-xl mb-2`,
            {
              color: currentTheme.colors.text,
              backgroundColor: currentTheme.colors.surface,
              borderRadius: 12,
              borderWidth: isFocused ? 2 : 1,
              borderColor: isFocused
                ? currentTheme.colors.primary
                : currentTheme.colors.border,
              textAlignVertical: "top",
              lineHeight: 24,
              flex: 1,
              width: "100%",
              minHeight: dimensions.minHeight,
              maxHeight: dimensions.maxHeight,
              shadowColor: isFocused
                ? currentTheme.colors.primary
                : "transparent",
              shadowOffset: { width: 0, height: isFocused ? 3 : 1 },
              shadowOpacity: isFocused ? 0.2 : 0.05,
              shadowRadius: isFocused ? 8 : 2,
              elevation: isFocused ? 6 : 2,
            },
          ]}
          placeholder={placeholderText}
          placeholderTextColor={currentTheme.colors.textMuted}
          value={cleanTextForDisplay(content)}
          onChangeText={handleContentChange}
          onSelectionChange={onSelectionChange}
          onContentSizeChange={onContentSizeChange}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          multiline={true}
          scrollEnabled={true}
          keyboardType="default"
          returnKeyType="default"
          autoCorrect={true}
          spellCheck={true}
          textBreakStrategy="balanced"
          enablesReturnKeyAutomatically={false}
          blurOnSubmit={false}
          editable={true}
          autoCapitalize="sentences"
          disableFullscreenUI={true}
          showSoftInputOnFocus={isKeyboardEnabled}
        />
      </View>

      {/* Bouton flottant pour activer/désactiver le clavier */}
      <TouchableOpacity
        onPress={() => {
          if (isKeyboardEnabled) {
            Keyboard.dismiss();
            if (textInputRef.current) {
              textInputRef.current.blur();
            }
            setIsKeyboardEnabled(false);
          } else {
            setIsKeyboardEnabled(true);
            // Séquence plus robuste pour activer le clavier
            const activateKeyboard = () => {
              if (textInputRef.current) {
                textInputRef.current.focus();
                // Forcer l'affichage du clavier avec plusieurs tentatives
                const attempts = [0, 100, 300];
                attempts.forEach((delay) => {
                  setTimeout(() => {
                    if (textInputRef.current) {
                      textInputRef.current.focus();
                      // Forcer l'affichage explicite du clavier
                      if (Platform.OS === "android") {
                        Keyboard.dismiss();
                        setTimeout(() => {
                          if (textInputRef.current) {
                            textInputRef.current.focus();
                          }
                        }, 50);
                      }
                    }
                  }, delay);
                });
              }
            };
            activateKeyboard();
          }
        }}
        style={[
          tw`absolute bottom-4 right-4 w-12 h-12 rounded-full items-center justify-center`,
          {
            backgroundColor: currentTheme.colors.primary,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          },
        ]}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={isKeyboardEnabled ? "keyboard-hide" : "keyboard"}
          size={24}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
}
