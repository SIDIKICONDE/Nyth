import { createContext } from "react";
import { AchievementContextType } from "./types";

export const AchievementContext = createContext<
  AchievementContextType | undefined
>(undefined);
