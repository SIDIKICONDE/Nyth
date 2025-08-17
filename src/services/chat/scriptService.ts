import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import i18next from "../../locales/i18n";

// Type pour les scripts
export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isAIGenerated?: boolean;
}

export const ScriptService = {
  // Fonction pour sauvegarder un script
  saveAsScript: async (content: string): Promise<Script | null> => {
    const t = i18next.t.bind(i18next);

    try {
      // Extraire un titre du contenu (première ligne ou début du texte)
      let title = content.split("\n")[0].trim();
      if (title.length > 30) {
        title = title.substring(0, 30) + "...";
      }

      // Créer un nouvel objet script - version simplifiée
      const newScript: Script = {
        id: Date.now().toString(),
        title: title,
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAIGenerated: true,
      };

      // Récupérer les scripts existants et ajouter le nouveau
      const savedScripts = await AsyncStorage.getItem("scripts");
      const scripts: Script[] = savedScripts ? JSON.parse(savedScripts) : [];
      scripts.push(newScript);

      // Sauvegarder les scripts mis à jour
      await AsyncStorage.setItem("scripts", JSON.stringify(scripts));

      return newScript;
    } catch (error) {
      return null;
    }
  },

  // Fonction pour afficher une alerte de confirmation
  showSaveConfirmation: (
    script: Script,
    onOpenEditor: (scriptId: string) => void
  ) => {
    const t = i18next.t.bind(i18next);

    Alert.alert(
      t("script.service.saveConfirmation.title"),
      t("script.service.saveConfirmation.message"),
      [
        {
          text: t("script.service.saveConfirmation.no"),
          style: "cancel",
        },
        {
          text: t("script.service.saveConfirmation.yes"),
          onPress: () => onOpenEditor(script.id),
        },
      ]
    );
  },
};
