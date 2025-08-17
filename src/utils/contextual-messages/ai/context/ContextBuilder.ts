import { UserContext } from "@/utils/contextual-messages/types";
import { getDeviceLanguage } from "@/utils/languageDetector";
import { getTimeContext } from "../instructions/TypeInstructions";
import i18n from "i18next";

type ContextMap = {
  [key: string]: (
    context: UserContext,
    t: (key: string) => string
  ) => string | number;
};

const comprehensiveContextMap: ContextMap = {
  name: (c, t) => c.userName || t("user"),
  status: (c, t) => (c.isFirstLogin ? t("firstLogin") : t("existingUser")),
  level: (c, t) => c.skillLevel,
  scriptsCreated: (c, t) => c.scriptsCount,
  wordsWritten: (c, t) => c.totalWordsWritten,
  averagePerScript: (c, t) => `${c.averageScriptLength} mots`,
  consecutiveDays: (c, t) => c.consecutiveDays,
  engagement: (c, t) => `${c.engagementScore}/100`,
  productivityTrend: (c, t) => c.productivityTrend,
  time: (c, t) =>
    `${getTimeContext(
      c.timeOfDay,
      c.preferredLanguage || getDeviceLanguage()
    )} (${c.timeOfDay})`,
  day: (c, t) => `${c.dayOfWeek} ${c.isHoliday ? t("holiday") : ""}`,
  season: (c, t) => c.season,
  lastLogin: (c, t) => `${c.daysSinceLastLogin} ${t("daysAgo")}`,
  frequency: (c, t) => c.loginFrequency,
  preferredTopics: (c, t) => c.mostUsedTopics.join(", ") || t("none"),
  contentQuality: (c, t) => `${c.contentQualityScore}/100`,
  preferredTone: (c, t) => c.preferredMessageTone,
  device: (c, t) => `${c.deviceType} (${c.platform})`,
  preferredFeatures: (c, t) => c.preferredFeatures.join(", ") || t("none"),
  planningUpcoming: (c, t) => c.planning?.upcomingEventsCount ?? 0,
  planningOverdue: (c, t) => c.planning?.overdueEventsCount ?? 0,
  planningGoals: (c, t) => c.planning?.activeGoalsCount ?? 0,
};

const detailedContextMap: ContextMap = {
  name: (c, t) => c.userName || t("user"),
  new: (c, t) => (c.isFirstLogin ? t("yes") : t("no")),
  scripts: (c, t) => c.scriptsCount,
  totalWords: (c, t) => c.totalWordsWritten,
  activeDays: (c, t) => `${c.consecutiveDays} ${t("consecutive")}`,
  engagement: (c, t) => `${c.engagementScore}/100`,
  time: (c, t) =>
    getTimeContext(c.timeOfDay, c.preferredLanguage || getDeviceLanguage()),
  level: (c, t) => c.skillLevel,
  preferredTone: (c, t) => c.preferredMessageTone,
  planning: (c, t) =>
    `${c.planning?.upcomingEventsCount ?? 0} ${t("events")}, ${
      c.planning?.overdueEventsCount ?? 0
    } ${t("overdue")}, ${c.planning?.activeGoalsCount ?? 0} ${t("goals")}`,
};

const basicContextMap: ContextMap = {
  userStatus: (c, t) =>
    `${t("user")} ${c.isFirstLogin ? t("newUser") : t("existingUser")}`,
  scriptsCreated: (c, t) => `${c.scriptsCount} ${t("scriptsCreated")}`,
  time: (c, t) =>
    getTimeContext(c.timeOfDay, c.preferredLanguage || getDeviceLanguage()),
  level: (c, t) => c.skillLevel,
  planning: (c, t) =>
    `${c.planning?.upcomingEventsCount ?? 0} ${t("events")}/${
      c.planning?.activeGoalsCount ?? 0
    } ${t("goals")}`,
};

function buildContext(
  context: UserContext,
  type: "comprehensive" | "detailed" | "basic"
): string {
  const language = context.preferredLanguage || getDeviceLanguage();
  const t = i18n.getFixedT(language, "context");

  let contextMap: ContextMap;
  switch (type) {
    case "comprehensive":
      contextMap = comprehensiveContextMap;
      break;
    case "detailed":
      contextMap = detailedContextMap;
      break;
    case "basic":
      contextMap = basicContextMap;
      break;
  }

  return Object.entries(contextMap)
    .map(([key, valueFn]) => {
      const translatedLabel = t(`${type}.${key}`);
      const value = valueFn(context, (k) => t(`${type}.${k}`));
      // Pour basic, qui n'a pas de clé/valeur
      if (type === "basic") return `- ${value}`;
      return `- ${translatedLabel}: ${value}`;
    })
    .join("\n");
}

export function buildComprehensiveContext(context: UserContext): string {
  return buildContext(context, "comprehensive");
}

export function buildDetailedContext(context: UserContext): string {
  return buildContext(context, "detailed");
}

export function buildBasicContext(context: UserContext): string {
  return buildContext(context, "basic");
}
