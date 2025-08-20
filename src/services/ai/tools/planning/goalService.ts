import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "@react-native-firebase/firestore";

import { processDate } from "./dateUtils";
import { t } from "./messages";
import { CreateGoalArgs } from "./types";

/**
 * Crée un nouvel objectif dans Firestore
 */
export const processCreateGoal = async (
  args: CreateGoalArgs,
  userId: string,
  lang: string = "fr"
): Promise<{ success: boolean; message: string; goalId?: string }> => {
  try {
    const goalData = {
      title: args.title,
      target: args.target,
      unit: args.unit,
      current: 0,
      endDate: args.endDate
        ? Timestamp.fromDate(processDate(args.endDate))
        : null,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (args.endDate) {}

    const db = getFirestore(getApp());
    const docRef = await addDoc(collection(db, "goals"), goalData);

    return {
      success: true,
      message: t("GOAL_CREATED", lang, { title: args.title }),
      goalId: docRef.id,
    };
  } catch (error) {
    return {
      success: false,
      message: t("ERROR_GENERIC", lang),
    };
  }
};
