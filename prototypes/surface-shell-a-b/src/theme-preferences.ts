export type Theme = "light" | "dark";
export type ThemeVariant = "calm" | "clear" | "tinted";
export type ThemeVariants = Record<Theme, ThemeVariant>;

export const themeVariantStorageKey = "surface-lab-theme-variants-v1";

export const themeVariantOptions: Record<Theme, readonly { label: string; value: ThemeVariant }[]> = {
  light: [
    { value: "calm", label: "Warm" },
    { value: "clear", label: "Klar" },
    { value: "tinted", label: "Salbei" },
  ],
  dark: [
    { value: "calm", label: "Abend" },
    { value: "clear", label: "Graphit" },
    { value: "tinted", label: "Nachtblau" },
  ],
};

export const defaultThemeVariants: ThemeVariants = { light: "calm", dark: "calm" };

export const canvasBackgrounds: Record<Theme, Record<ThemeVariant, string>> = {
  light: { calm: "#efe8da", clear: "#edf2f6", tinted: "#e3ede1" },
  dark: { calm: "#2b2726", clear: "#27292c", tinted: "#162a42" },
};

export function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function isThemeVariant(value: unknown): value is ThemeVariant {
  return value === "calm" || value === "clear" || value === "tinted";
}

export function readThemeVariants(value: string | null): ThemeVariants {
  if (!value) return defaultThemeVariants;
  try {
    const candidate = JSON.parse(value) as Partial<ThemeVariants>;
    return {
      light: isThemeVariant(candidate.light) ? candidate.light : defaultThemeVariants.light,
      dark: isThemeVariant(candidate.dark) ? candidate.dark : defaultThemeVariants.dark,
    };
  } catch {
    return defaultThemeVariants;
  }
}
