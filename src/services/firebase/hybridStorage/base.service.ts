import RNFS from "react-native-fs";
import { THUMBNAIL_DIR, VIDEO_DIR } from "./constants";

export class BaseStorageService {
  // Initialiser les répertoires locaux
  async initializeLocalStorage() {
    try {
      await RNFS.mkdir(VIDEO_DIR);
      await RNFS.mkdir(THUMBNAIL_DIR);
    } catch (error) {}
  }
}
