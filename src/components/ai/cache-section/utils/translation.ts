import { TFunction } from "i18next";

export const createTranslationWrapper = (
  t: TFunction | ((key: string, options?: any) => string)
) => {
  const wrapper = (key: string, defaultValue: string, params?: any): string => {
    try {
      const result = t(key, params || {});
      if (typeof result === "string") {
        return result;
      }
      return defaultValue || key;
    } catch (error) {
      return defaultValue || key;
    }
  };

  return wrapper;
};
