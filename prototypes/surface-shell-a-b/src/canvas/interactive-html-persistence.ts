import type { JsonValue } from "../../../../shared/live-canvas/protocol";

const interactiveStateByteLimit = 64 * 1024;

export type StoredInteractiveHtmlState = {
  state: JsonValue;
};

export type StoredInteractiveHtmlStates = Record<string, StoredInteractiveHtmlState>;

export type InteractiveHtmlSessionStates = ReadonlyMap<string, JsonValue>;

function readJsonState(value: unknown): JsonValue | null {
  try {
    const text = JSON.stringify(value);
    if (!text || new TextEncoder().encode(text).byteLength > interactiveStateByteLimit) return null;
    const parsed = JSON.parse(text) as JsonValue;
    return parsed === null ? null : parsed;
  } catch {
    return null;
  }
}

export function readStoredInteractiveHtmlStates(value: unknown): StoredInteractiveHtmlStates {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: StoredInteractiveHtmlStates = {};
  for (const [elementId, candidate] of Object.entries(value)) {
    if (!elementId || !candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const state = readJsonState((candidate as { state?: unknown }).state);
    if (state !== null) result[elementId] = { state };
  }
  return result;
}

export function withInteractiveHtmlState(
  states: StoredInteractiveHtmlStates,
  elementId: string,
  state: JsonValue,
): StoredInteractiveHtmlStates {
  const validState = readJsonState(state);
  if (validState === null) return states;
  return { ...states, [elementId]: { state: validState } };
}

export function withoutInteractiveHtmlState(states: StoredInteractiveHtmlStates, elementId: string) {
  if (!(elementId in states)) return states;
  const next = { ...states };
  delete next[elementId];
  return next;
}

function sameJsonValue(first: JsonValue, second: JsonValue): boolean {
  if (first === second) return true;
  if (typeof first !== "object" || first === null || typeof second !== "object" || second === null) return false;
  if (Array.isArray(first) || Array.isArray(second)) {
    return Array.isArray(first)
      && Array.isArray(second)
      && first.length === second.length
      && first.every((value, index) => sameJsonValue(value, second[index]!));
  }
  const firstKeys = Object.keys(first).sort();
  const secondKeys = Object.keys(second).sort();
  return firstKeys.length === secondKeys.length
    && firstKeys.every((key, index) => (
      key === secondKeys[index]
      && sameJsonValue(first[key]!, second[key]!)
    ));
}

export function countUnsavedInteractiveHtmlChanges(
  persistenceDisabledIds: ReadonlySet<string>,
  initialStates: InteractiveHtmlSessionStates,
  currentStates: InteractiveHtmlSessionStates,
): number {
  let count = 0;
  for (const elementId of persistenceDisabledIds) {
    const initial = initialStates.get(elementId);
    const current = currentStates.get(elementId);
    if (initial !== undefined && current !== undefined && !sameJsonValue(initial, current)) count += 1;
  }
  return count;
}
