import { isCanvasAnnotationGroupId } from "./image-annotation-selection.ts";

/** Both canvases erase ink only. Marker ribbons use native line geometry. */
export const eraserLockStateKey = "tafelraumEraserLockState";
export const eraserAnnotationGroupIdsKey = "tafelraumEraserImageGroupIds";

type EraserElement = {
  groupIds: readonly string[];
  locked?: boolean;
  customData?: Record<string, unknown> | null;
};

export function getStoredEraserAnnotationGroupIds(element: EraserElement) {
  const groups = element.customData?.[eraserAnnotationGroupIdsKey];
  return Array.isArray(groups)
    ? groups.filter((id): id is string => typeof id === "string" && isCanvasAnnotationGroupId(id))
    : null;
}

/** Read-only canonical view of the engine's temporary eraser adaptation.
 * Keep real locks and exact bindings; never infer either from overlap. */
export function withoutTemporaryEraserState<T extends EraserElement>(elements: readonly T[]): readonly T[] {
  let changed = false;
  const restored = elements.map(element => {
    const groups = getStoredEraserAnnotationGroupIds(element);
    const lock = element.customData?.[eraserLockStateKey];
    if (groups === null && typeof lock !== "boolean") return element;
    const customData = {...element.customData};
    delete customData[eraserAnnotationGroupIdsKey];
    delete customData[eraserLockStateKey];
    changed = true;
    return {...element, customData,
      groupIds: groups === null ? element.groupIds : [...new Set([...element.groupIds,...groups])],
      locked: typeof lock === "boolean" ? lock : element.locked,
    };
  });
  return changed ? restored : elements;
}

/** Engine-only view. Pure so canonical Room edits/history retain their exact
 * native revision when the teacher happens to have the eraser selected. */
export function withTemporaryEraserState<T extends EraserElement & {type:string;isDeleted?:boolean}>(elements:readonly T[]):readonly T[] {
  return elements.map(element=>{
    const groups=element.groupIds.filter(isCanvasAnnotationGroupId);
    const storesGroups=groups.length>0&&getStoredEraserAnnotationGroupIds(element)===null;
    const storesLock=(!isErasableInk(element)||element.customData?.role==='marker-ribbon')
      &&!element.isDeleted&&element.customData?.[eraserLockStateKey]===undefined;
    if(!storesGroups&&!storesLock)return element;
    return {...element,customData:{...element.customData,
      ...(storesGroups?{[eraserAnnotationGroupIdsKey]:groups}:{}),
      ...(storesLock?{[eraserLockStateKey]:Boolean(element.locked)}:{})},
      groupIds:storesGroups?element.groupIds.filter(id=>!isCanvasAnnotationGroupId(id)):element.groupIds,
      locked:storesLock?true:element.locked};
  });
}

export function isErasableInk(element: {
  type: string;
  locked?: boolean;
  isDeleted?: boolean;
  customData?: Record<string, unknown> | null;
}) {
  const originalLock = element.customData?.[eraserLockStateKey];
  return !(typeof originalLock === "boolean" ? originalLock : element.locked) && !element.isDeleted
    && !element.customData?.materialKind && !element.customData?.surfaceKind
    && (element.type === "freedraw"
      || (element.type === "line" && (element.customData?.role === "marker-ribbon"
        || element.customData?.role === "ink-pen")));
}
