import AsyncStorage from "@react-native-async-storage/async-storage";

type AddressForm = "tu" | "vous" | "auto";
type NameUsage = "first_name" | "none" | "auto";

interface AddressingPreference {
  form: AddressForm;
  nameUsage: NameUsage;
}

const formKey = (userId: string): string => `addr_form_${userId}`;
const nameKey = (userId: string): string => `addr_name_${userId}`;

function detectAddressFormFromText(
  message: string,
  language: "fr" | "en"
): AddressForm {
  const m = message.toLowerCase();
  if (language === "fr") {
    if (
      /\b(tutoi(e|er|ement)|tutoie[-\s]?moi|parle[-\s]?moi\s+en\s+tu|dis[-\s]?moi\s+tu|tu\s+peux\s+me\s+tutoyer)\b/.test(
        m
      )
    ) {
      return "tu";
    }
    if (
      /\b(vouvoy(e|er|ement)|vouvoie[-\s]?moi|parle[-\s]?moi\s+en\s+vous|dites[-\s]?moi\s+vous|vous\s+pouvez\s+me\s+vouvoyer)\b/.test(
        m
      )
    ) {
      return "vous";
    }
  } else {
    if (/\b(call\s+me\s+by\s+first\s+name|you\s+can\s+say\s+\btu\b)\b/.test(m))
      return "tu";
    if (/\b(use\s+formal\s+address|please\s+use\s+sir|madam)\b/.test(m))
      return "vous";
  }
  return "auto";
}

export class AddressingPreferenceService {
  static async getPreferredAddressing(
    userId: string
  ): Promise<AddressingPreference> {
    try {
      const [f, n] = await Promise.all([
        AsyncStorage.getItem(formKey(userId)),
        AsyncStorage.getItem(nameKey(userId)),
      ]);
      return {
        form: (f as AddressForm) || "auto",
        nameUsage: (n as NameUsage) || "auto",
      };
    } catch {
      return { form: "auto", nameUsage: "auto" };
    }
  }

  static async setPreferredAddressing(
    userId: string,
    pref: Partial<AddressingPreference>
  ): Promise<void> {
    const current = await this.getPreferredAddressing(userId);
    const next: AddressingPreference = {
      form: pref.form ?? current.form,
      nameUsage: pref.nameUsage ?? current.nameUsage,
    };
    await Promise.all([
      AsyncStorage.setItem(formKey(userId), next.form),
      AsyncStorage.setItem(nameKey(userId), next.nameUsage),
    ]);
    try {
      if (pref.form && pref.form !== current.form) {
        const { saveToAIMemory } = await import(
          "../../components/chat/message-handler/memory"
        );
        const label = pref.form === "tu" ? "tutoiement" : "vouvoiement";
        await saveToAIMemory(userId, {
          type: "preference",
          content: `Préférence d'adresse: ${label}`,
          importance: "medium",
        });
      }
    } catch {}
  }

  static async updateFromUtterance(
    userId: string,
    message: string,
    language: "fr" | "en"
  ): Promise<void> {
    const detected = detectAddressFormFromText(message, language);
    if (detected !== "auto") {
      await this.setPreferredAddressing(userId, { form: detected });
    }
  }

  static async buildPolicyInstruction(
    userId: string,
    firstName: string,
    language: "fr" | "en"
  ): Promise<string> {
    const pref = await this.getPreferredAddressing(userId);
    const name = firstName?.trim();
    const nameLine =
      name && pref.nameUsage !== "none"
        ? ` Prefer using the user's first name "${name}" only when it adds warmth or clarity; otherwise omit it.`
        : ` Do not include the user's name unless it adds clarity.`;
    const formLine =
      pref.form === "tu"
        ? ` Use informal address (tu) consistently.`
        : pref.form === "vous"
        ? ` Use formal address (vous) consistently.`
        : ` Choose the appropriate address (tu/vous) based on context and the user's tone.`;
    return `ADDRESSING POLICY:${nameLine} ${formLine} Avoid repeating the name in every message.`;
  }
}
