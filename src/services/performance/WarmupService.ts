import { getApp } from "@react-native-firebase/app";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";

export class WarmupService {
  private static started = false;

  static init(): void {
    if (this.started) return;
    this.started = true;
    void this.warmApp();
    const auth = getAuth(getApp());
    onAuthStateChanged(auth, (u) => {
      if (u?.uid) {
        void this.warmForUser(u.uid);
      }
    });
    const u = auth.currentUser;
    if (u?.uid) {
      void this.warmForUser(u.uid);
    }
  }

  private static async warmApp(): Promise<void> {
    try {
      const tasks: Array<Promise<unknown>> = [];
      tasks.push(
        (async () => {
          try {
            const auth = getAuth(getApp());
            if (auth.currentUser) {
              await auth.currentUser.getIdToken();
            }
          } catch {}
        })()
      );
      await Promise.race([
        Promise.all(tasks),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {}
  }

  private static async warmForUser(userId: string): Promise<void> {
    try {
      const { default: NetInfo } = await import(
        "@react-native-community/netinfo"
      );
      const state = await NetInfo.fetch();
      if (!state.isConnected || state.type === "cellular") {
        return;
      }
      const { memoryManager } = await import("../memory/MemoryManager");
      await memoryManager.loadUserMemory(userId);
    } catch {}
  }
}
