import distribution from "../distribution.json" with {type:"json"};

export type EmbeddedAppId = string;

export type EmbeddedAppDefinition = Readonly<{
  id: EmbeddedAppId;
  name: string;
  iconUrl: string;
  sourceUrl: string;
  directUrl: string;
  roomView?: Readonly<{protocol:"rrweb-2.2-v1"}>;
  defaultViewport: Readonly<{ width: number; height: number }>;
}>;

/** Product allowlist: entries are code-reviewed configuration, never user URLs. */
export const embeddedApps: readonly EmbeddedAppDefinition[] = Object.freeze(
  distribution.embeddedApps.map((app) => Object.freeze(app as EmbeddedAppDefinition)),
);

export function embeddedAppById(value: unknown): EmbeddedAppDefinition | null {
  return typeof value === "string"
    ? embeddedApps.find((app) => app.id === value) ?? null
    : null;
}

export function isEmbeddedAppElement(element: {
  customData?: Record<string, unknown>;
  isDeleted?: boolean;
} | null | undefined) {
  return Boolean(
    element
    && !element.isDeleted
    && element.customData?.surfaceKind === "embedded-app"
    && embeddedAppById(element.customData?.embeddedAppId),
  );
}

/** The German physical plus key shares BracketRight with Excalidraw's layer shortcut. */
export function shouldPreserveBrowserPlusShortcut(event: {
  altKey:boolean;code?:string;ctrlKey:boolean;isComposing:boolean;key:string;metaKey:boolean;shiftKey:boolean;
}) {
  return !event.shiftKey && !event.altKey && !event.isComposing
    && (event.metaKey || event.ctrlKey) && event.code === "BracketRight";
}

/** Explicit local presentation capability, independently of registry membership. */
export function canMirrorEmbeddedApp(element:Parameters<typeof isEmbeddedAppElement>[0]) {
  return Boolean(isEmbeddedAppElement(element)&&embeddedAppById(element?.customData?.embeddedAppId)?.roomView?.protocol==='rrweb-2.2-v1');
}
