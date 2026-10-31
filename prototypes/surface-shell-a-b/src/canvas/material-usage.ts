export type CanvasMaterialUsage = {
  archivePaths: readonly string[];
  legacyFileNames: readonly string[];
};

type CanvasMaterialElement = {
  type: string;
  isDeleted?: boolean;
  customData?: Record<string, unknown> | null;
};

export const emptyCanvasMaterialUsage: CanvasMaterialUsage = {
  archivePaths: [],
  legacyFileNames: [],
};

export function isCanvasMaterialElement(element: CanvasMaterialElement) {
  return !element.isDeleted && (element.type === "image"
    || ["audio", "video", "interactive-html", "link", "youtube"].includes(String(element.customData?.materialKind)));
}

export function archiveMaterialElements<T extends CanvasMaterialElement>(elements: readonly T[], archivePath: string, legacyFileName?: string): T[] {
  return elements.filter(element => isCanvasMaterialElement(element) && (
    element.customData?.archiveMaterialPath === archivePath
    || (!nonEmptyString(element.customData?.archiveMaterialPath) && legacyFileName !== undefined
      && element.customData?.sourceFileName === legacyFileName)
  ));
}

export function nextArchiveMaterialElement<T extends { id: string }>(elements: readonly T[], previousId: string | null): T | null {
  if (!elements.length) return null;
  const index = elements.findIndex(element => element.id === previousId);
  return elements[(index + 1) % elements.length];
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function canvasMaterialUsageFromElements(elements: readonly CanvasMaterialElement[]): CanvasMaterialUsage {
  const archivePaths = new Set<string>();
  const legacyFileNames = new Set<string>();

  for (const element of elements) {
    if (!isCanvasMaterialElement(element)) continue;
    const archivePath = nonEmptyString(element.customData?.archiveMaterialPath);
    if (archivePath) {
      archivePaths.add(archivePath);
      continue;
    }
    const fileName = nonEmptyString(element.customData?.sourceFileName);
    if (fileName) legacyFileNames.add(fileName);
  }

  return {
    archivePaths: [...archivePaths].sort(),
    legacyFileNames: [...legacyFileNames].sort(),
  };
}

export function sameCanvasMaterialUsage(previous: CanvasMaterialUsage, next: CanvasMaterialUsage) {
  return previous.archivePaths.length === next.archivePaths.length
    && previous.legacyFileNames.length === next.legacyFileNames.length
    && previous.archivePaths.every((path, index) => path === next.archivePaths[index])
    && previous.legacyFileNames.every((fileName, index) => fileName === next.legacyFileNames[index]);
}
