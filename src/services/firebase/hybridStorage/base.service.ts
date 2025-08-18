import RNFS from "react-native-fs";
import { THUMBNAIL_DIR, VIDEO_DIR } from "./constants";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("BaseStorageService");

export class BaseStorageService {
  // Initialiser les répertoires locaux
  async initializeLocalStorage() {
    try {
      await RNFS.mkdir(VIDEO_DIR, { NSURLIsExcludedFromBackupKey: true });
      await RNFS.mkdir(THUMBNAIL_DIR, { NSURLIsExcludedFromBackupKey: true });
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du stockage local", error);
      throw new Error(
        `Impossible d'initialiser le stockage local : ${
          (error as Error).message
        }`
      );
    }
  }
}
