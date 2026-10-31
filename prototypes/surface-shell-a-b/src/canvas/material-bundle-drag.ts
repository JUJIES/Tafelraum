export function getMaterialBundleElements<Element extends {
  groupIds: readonly string[];
  id: string;
  isDeleted?: boolean;
}>(
  elements: readonly Element[],
  materialId: string,
  groupId: string,
) {
  return elements.filter((element) => (
    !element.isDeleted
    && (element.id === materialId || element.groupIds.includes(groupId))
  ));
}

export function translateMaterialBundleElements<Element extends { id: string; x: number; y: number }>(
  elements: readonly Element[],
  startElements: readonly Element[],
  deltaX: number,
  deltaY: number,
  translate: (startElement: Element, x: number, y: number) => Element,
) {
  const startElementsById = new Map(startElements.map((element) => [element.id, element]));
  return elements.map((element) => {
    const startElement = startElementsById.get(element.id);
    return startElement
      ? translate(startElement, startElement.x + deltaX, startElement.y + deltaY)
      : element;
  });
}
