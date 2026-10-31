import english from "./en.json" with { type: "json" };
import { getUiLocale } from "./locale.ts";

// App-owned source copy only. Values are never translated (names, paths, input).
export function t(source: string, ...values: (string | number)[]): string {
  const message = getUiLocale() === "en" && Object.hasOwn(english, source) ? (english as Record<string, string>)[source] : source;
  return message.replace(/\{(\d+)\}/g, (token, index: string) => values[Number(index)] === undefined ? token : String(values[Number(index)]));
}
