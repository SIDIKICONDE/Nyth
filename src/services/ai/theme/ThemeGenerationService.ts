import { AIUtilsService } from "../utils/AIUtilsService";
import { CustomTheme, ThemeColors } from "../../../types/theme";

type ParsedTheme = {
  name?: string;
  isDark?: boolean;
  colors?: Partial<ThemeColors> & { gradient?: string[] };
};

function isHexColor(value: string): boolean {
  const v = value.trim();
  return /^#([0-9a-fA-F]{6})$/.test(v);
}

function clampHex(value: string, fallback: string): string {
  return isHexColor(value) ? value : fallback;
}

function ensureGradient(colors: ThemeColors): string[] {
  const g =
    colors.gradient && Array.isArray(colors.gradient) ? colors.gradient : [];
  if (g.length >= 2 && isHexColor(g[0]) && isHexColor(g[1]))
    return [g[0], g[1]];
  return [colors.primary, colors.secondary];
}

function inferIsDark(background: string): boolean {
  const hex = background.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 128;
}

function sanitizeColors(
  parsed: ParsedTheme,
  preferDark: boolean | undefined
): ThemeColors {
  const defaults: ThemeColors = {
    primary: "#3B82F6",
    secondary: "#6366F1",
    accent: "#8B5CF6",
    background: preferDark ? "#0B0B0F" : "#F8FAFC",
    surface: preferDark ? "#1C1C21" : "#FFFFFF",
    card: preferDark ? "#202027" : "#FFFFFF",
    text: preferDark ? "#FFFFFF" : "#1E293B",
    textSecondary: preferDark ? "#C7D2FE" : "#64748B",
    textMuted: preferDark ? "#94A3B8" : "#9CA3AF",
    border: preferDark ? "#2B2B33" : "#E2E8F0",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    gradient: ["#3B82F6", "#6366F1"],
  };

  const p = parsed.colors || {};
  const background = clampHex(
    p.background || defaults.background,
    defaults.background
  );
  const surface = clampHex(p.surface || defaults.surface, defaults.surface);
  const card = clampHex(p.card || defaults.card, defaults.card);
  const primary = clampHex(p.primary || defaults.primary, defaults.primary);
  const secondary = clampHex(
    p.secondary || defaults.secondary,
    defaults.secondary
  );
  const accent = clampHex(p.accent || defaults.accent, defaults.accent);
  const text = clampHex(p.text || defaults.text, defaults.text);
  const textSecondary = clampHex(
    p.textSecondary || defaults.textSecondary,
    defaults.textSecondary
  );
  const textMuted = clampHex(
    p.textMuted || defaults.textMuted,
    defaults.textMuted
  );
  const border = clampHex(p.border || defaults.border, defaults.border);
  const success = clampHex(p.success || defaults.success, defaults.success);
  const warning = clampHex(p.warning || defaults.warning, defaults.warning);
  const error = clampHex(p.error || defaults.error, defaults.error);

  const colors: ThemeColors = {
    primary,
    secondary,
    accent,
    background,
    surface,
    card,
    text,
    textSecondary,
    textMuted,
    border,
    success,
    warning,
    error,
    gradient: Array.isArray(p.gradient)
      ? p.gradient.map((c) => clampHex(String(c), primary))
      : [primary, secondary],
  };

  colors.gradient = ensureGradient(colors);
  return colors;
}

function extractJson(text: string): string | null {
  const codeFence = /```\s*json\s*([\s\S]*?)```/i.exec(text);
  if (codeFence && codeFence[1]) return codeFence[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return null;
}

function parseThemeResponse(raw: string): ParsedTheme {
  const json = extractJson(raw) || "";
  try {
    const obj = JSON.parse(json) as ParsedTheme;
    return obj || {};
  } catch (_) {
    return {};
  }
}

export class ThemeGenerationService {
  static async generateThemeFromDescription(
    description: string,
    preferDark?: boolean,
    locale?: string
  ): Promise<CustomTheme> {
    const prompt = ThemeGenerationService.buildPrompt(
      description,
      preferDark,
      locale
    );
    const reply = await AIUtilsService.simpleChatWithAI(prompt);
    const parsed = parseThemeResponse(reply);
    const colors = sanitizeColors(parsed, preferDark);
    const isDark =
      typeof parsed.isDark === "boolean"
        ? parsed.isDark
        : inferIsDark(colors.background);
    const safeName =
      parsed.name && parsed.name.trim().length > 0
        ? parsed.name.trim()
        : ThemeGenerationService.defaultName(description);
    const id = `custom-ai-${Date.now()}`;
    const theme: CustomTheme = {
      id,
      name: safeName,
      isDark,
      colors,
    };
    return theme;
  }

  private static buildPrompt(
    description: string,
    preferDark?: boolean,
    locale?: string
  ): string {
    const targetLocale = (
      locale && locale.length > 0 ? locale : "fr"
    ).toLowerCase();
    const modeInstruction =
      preferDark === undefined ? "" : preferDark ? "Mode sombre" : "Mode clair";
    const fields = [
      "name",
      "isDark",
      "colors.primary",
      "colors.secondary",
      "colors.accent",
      "colors.background",
      "colors.surface",
      "colors.card",
      "colors.text",
      "colors.textSecondary",
      "colors.textMuted",
      "colors.border",
      "colors.success",
      "colors.warning",
      "colors.error",
      "colors.gradient[2]",
    ].join(", ");
    const languageLine =
      targetLocale === "en"
        ? "Respond in JSON without comments."
        : "Réponds en JSON sans commentaires.";
    const specLine =
      targetLocale === "en"
        ? `Return only a JSON object with fields: ${fields}. Colors must be hex like #RRGGBB.`
        : `Retourne uniquement un objet JSON avec les champs: ${fields}. Les couleurs doivent être en hex #RRGGBB.`;
    const nameHint =
      targetLocale === "en"
        ? "Use a short, human-friendly name."
        : "Utilise un nom court et lisible.";
    const noExtra =
      targetLocale === "en"
        ? "Do not include any text outside JSON."
        : "N'inclus aucun texte hors du JSON.";
    const base =
      targetLocale === "en"
        ? "Create a mobile UI theme palette"
        : "Crée une palette de thème d'interface mobile";
    return `${base}. ${modeInstruction}. ${specLine} ${nameHint} ${noExtra} Description: ${description}`;
  }

  private static defaultName(description: string): string {
    const d = description.trim();
    if (d.length === 0) return "Thème IA";
    const max = 32;
    return d.length > max ? `${d.substring(0, max)}…` : d;
  }
}
