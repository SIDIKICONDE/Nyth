import { HelpItem } from "../../types";
import { advancedItems } from "./advanced";
import { advancedItemsPart2 } from "./advancedPart2";
import { advancedItemsPart3 } from "./advancedPart3";
import { advancedItemsPart4 } from "./advancedPart4";
import { basicsItems } from "./basics";
import { tipsItems } from "./tips";
import { tipsItemsPart2 } from "./tipsPart2";
import { troubleshootingItems } from "./troubleshooting";

export const helpItems: HelpItem[] = [
  ...basicsItems,
  ...advancedItems,
  ...advancedItemsPart2,
  ...advancedItemsPart3,
  ...advancedItemsPart4,
  ...troubleshootingItems,
  ...tipsItems,
  ...tipsItemsPart2,
];
