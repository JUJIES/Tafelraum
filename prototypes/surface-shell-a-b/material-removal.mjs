/** Archive removal is stronger than canvas undo. Used by server and canvas port. */
export function pruneRemovedMaterials(snapshot, removals, lessonId) {
  if (!Array.isArray(snapshot?.elements) || !removals.length) return snapshot;
  const paths = new Set(removals.map(record => record.archiveMaterialPath));
  const legacyNames = new Set(removals.filter(record => (record.lessonIds ?? [record.lessonId]).includes(lessonId)).map(record => record.fileName));
  const removedIds = new Set([...removals.flatMap(record => record.elementIdsByLesson?.[lessonId] ?? []), ...snapshot.elements.filter(element => {
    const data = element.customData;
    const material = element.type === 'image' && data?.role !== 'rich-text-rendition-v1'
      || ['audio', 'video', 'interactive-html', 'youtube', 'link'].includes(data?.materialKind);
    return material && (paths.has(data?.archiveMaterialPath)
      || !data?.archiveMaterialPath && legacyNames.has(data?.sourceFileName));
  }).map(element => element.id)]);
  const clipTargetId = clip => clip.kind === 'material' ? clip.elementId : (clip.htmlAnchor ?? clip.pdfAnchor)?.elementId;
  if (!removedIds.size || !snapshot.elements.some(element => removedIds.has(element.id))
    && !snapshot.clips?.some(clip => removedIds.has(clipTargetId(clip)))
    && !Object.keys(snapshot.interactiveHtmlStates ?? {}).some(id => removedIds.has(id))) return snapshot;
  // Only owner-specific annotation/cover groups, never arbitrary user groups.
  let changed = true;
  while (changed) {
    changed = false;
    for (const element of snapshot.elements) {
      if (removedIds.has(element.id)) continue;
      const data = element.customData;
      if (removedIds.has(element.containerId) || removedIds.has(data?.imageId)
        || removedIds.has(data?.richTextSourceId)
        || (element.groupIds ?? []).some(group => [...removedIds].some(id =>
          group === `tafelraum-image-annotations:${id}` || group === `tafelraum-canvas-cover:${id}`))) {
        removedIds.add(element.id);
        changed = true;
      }
    }
  }
  return {
    ...snapshot,
    elements: snapshot.elements.filter(element => !removedIds.has(element.id)).map(element => {
      const boundElements = element.boundElements?.filter(binding => !removedIds.has(binding.id));
      const startBinding = removedIds.has(element.startBinding?.elementId) ? null : element.startBinding;
      const endBinding = removedIds.has(element.endBinding?.elementId) ? null : element.endBinding;
      return boundElements?.length !== element.boundElements?.length || startBinding !== element.startBinding || endBinding !== element.endBinding
        ? {...element, boundElements, startBinding, endBinding} : element;
    }),
    clips: snapshot.clips?.filter(clip => !removedIds.has(clipTargetId(clip))),
    interactiveHtmlStates: snapshot.interactiveHtmlStates && Object.fromEntries(
      Object.entries(snapshot.interactiveHtmlStates).filter(([id]) => !removedIds.has(id))),
  };
}
