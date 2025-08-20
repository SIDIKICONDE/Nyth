import { SCRIPT_DURATION } from "../../config/scriptConstants";
import { AIPrompt } from "../../types/ai";
import i18n from "i18next";

export class PromptBuilder {
  static buildSystemPrompt(prompt: AIPrompt): string {
    const language = prompt.language || "en"; // default to english
    const t = i18n.getFixedT(language, "scriptPrompts");

    const lengthConstraints = this.getLengthConstraints(prompt, t);

    return `${t("system.role", { platform: prompt.platform })}
${t("system.languageInstruction")}

${t("system.constraintsTitle")}
${lengthConstraints}
${t("system.tone", { tone: prompt.tone || "casual" })}
${t("system.platform", { platform: prompt.platform })}
${t("system.readability")}
${t("system.styleAdaptation")}

${t("system.structureTitle")}
${t("system.structure")}

${t("system.optimizationTitle")}
${t("system.optimization")}

${t("system.technicalInstructionRule")}
${t("system.generationRule")}`;
  }

  static buildUserPrompt(prompt: AIPrompt): string {
    const language = prompt.language || "en";
    const t = i18n.getFixedT(language, "scriptPrompts");

    const structureNote = prompt.narrativeStructure
      ? t("user.narrativeStructure", { structure: prompt.narrativeStructure })
      : "";

    const emotionalNote = prompt.emotionalTone
      ? t("user.emotionalTone", { tone: prompt.emotionalTone })
      : "";

    return `${t("user.mainInstruction", { topic: prompt.topic })}

${structureNote}
${emotionalNote}

${t("user.formatInstruction")}`;
  }

  private static getLengthConstraints(
    prompt: AIPrompt,
    t: (key: string, options?: any) => string
  ): string {
    const constraints: string[] = [];

    if (prompt.wordCount) {
      constraints.push(t("length.exactWords", { count: prompt.wordCount }));
    } else if (prompt.duration) {
      const durationInfo = this.getDurationInfo(prompt.duration, t);
      constraints.push(
        t("length.duration", {
          description: durationInfo.description,
          range: durationInfo.wordsRange,
        })
      );
    } else {
      const durationInfo = this.getDurationInfo("medium", t);
      constraints.push(
        t("length.duration", {
          description: durationInfo.description,
          range: durationInfo.wordsRange,
        })
      );
    }

    if (prompt.characterCount) {
      constraints.push(
        t("length.characterCount", { count: prompt.characterCount })
      );
    }

    if (prompt.paragraphCount) {
      constraints.push(
        t("length.paragraphCount", { count: prompt.paragraphCount })
      );
    }

    return constraints.join("\n");
  }

  private static getDurationInfo(
    duration: "short" | "medium" | "long",
    t: (key: string) => string
  ): {
    description: string;
    seconds: number;
    wordsRange: string;
  } {
    const durationKey = `duration.${duration}`;
    const durationConfig =
      SCRIPT_DURATION[duration.toUpperCase() as keyof typeof SCRIPT_DURATION];

    return {
      description: t(durationKey),
      seconds: durationConfig.seconds,
      wordsRange: `${durationConfig.minWords}-${durationConfig.maxWords}`,
    };
  }
}
