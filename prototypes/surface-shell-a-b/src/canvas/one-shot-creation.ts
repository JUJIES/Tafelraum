export type OneShotCreationTool = "shape" | "text";

export type PendingOneShotCreation = {
  elementId: string;
  tool: OneShotCreationTool;
};

type CreationElement = {
  id: string;
  isDeleted?: boolean;
  text?: string;
  type: string;
};

type OneShotCreationUpdate = {
  completed: PendingOneShotCreation | null;
  pending: PendingOneShotCreation | null;
};

const shapeElementTypes = new Set(["rectangle", "ellipse", "diamond"]);

function matchesTool(element: CreationElement, tool: OneShotCreationTool) {
  return tool === "text" ? element.type === "text" : shapeElementTypes.has(element.type);
}

function isUsableResult(element: CreationElement, tool: OneShotCreationTool) {
  if (element.isDeleted || !matchesTool(element, tool)) return false;
  return tool !== "text" || Boolean(element.text?.trim());
}

export function updateOneShotCreation({
  activeCreationElements,
  activeTool,
  elements,
  knownElementIds,
  pending,
}: {
  activeCreationElements: readonly CreationElement[];
  activeTool: string;
  elements: readonly CreationElement[];
  knownElementIds: ReadonlySet<string>;
  pending: PendingOneShotCreation | null;
}): OneShotCreationUpdate {
  if (activeTool !== "shape" && activeTool !== "text") {
    return { completed: null, pending: null };
  }

  let nextPending = pending?.tool === activeTool ? pending : null;
  if (!nextPending) {
    const startedElement = activeCreationElements.find((element) => (
      matchesTool(element, activeTool) && !knownElementIds.has(element.id)
    ));
    if (startedElement) nextPending = { elementId: startedElement.id, tool: activeTool };
  }

  if (!nextPending) return { completed: null, pending: null };
  if (activeCreationElements.some((element) => element.id === nextPending.elementId)) {
    return { completed: null, pending: nextPending };
  }

  const result = elements.find((element) => element.id === nextPending.elementId);
  return isUsableResult(result ?? { id: nextPending.elementId, type: "missing" }, nextPending.tool)
    ? { completed: nextPending, pending: null }
    : { completed: null, pending: null };
}
