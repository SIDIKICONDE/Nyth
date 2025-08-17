import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";

export class StatsService {
  async updateUserStats(userId: string, stats: any) {
    try {
      const db = getFirestore(getApp());
      await setDoc(
        doc(
          collection(db, "userStats"),
          `${userId}_${new Date().toISOString().split("T")[0]}`
        ),
        {
          userId,
          ...stats,
          date: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {}
  }
}
