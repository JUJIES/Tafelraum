import assert from "node:assert/strict";
import test from "node:test";
import { defaultThemeVariants, readThemeVariants } from "./theme-preferences.ts";

test("keeps the established themes as the default", () => {
  assert.deepEqual(readThemeVariants(null), defaultThemeVariants);
});

test("restores one independently selected variant per light mode", () => {
  assert.deepEqual(readThemeVariants('{"light":"tinted","dark":"clear"}'), {
    light: "tinted",
    dark: "clear",
  });
});

test("repairs invalid or old preference data without losing a valid side", () => {
  assert.deepEqual(readThemeVariants('{"light":"unknown","dark":"tinted"}'), {
    light: "calm",
    dark: "tinted",
  });
  assert.deepEqual(readThemeVariants("not json"), defaultThemeVariants);
});
