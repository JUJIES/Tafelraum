import { t, useUiLocale } from "./i18n";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { Check, CirclePlay, FileAudio, FileVideo2, Link2, Pencil, Plus, RefreshCw, ImageUp, Upload, X } from "lucide-react";
import {
  lessonMaterialDisplayName,
  renameLessonMaterial,
  moveLessonMaterial,
  reorderLessonMaterials,
  lessonMaterialDragMime,
  lessonMaterialArchivePath,
  lessonMaterialFileUrl,
  lessonMaterialsWithUsage,
  loadLessonMaterials,
  type LessonMaterial,
  type LessonMaterialCollection,
  type LessonMaterialUsage,
} from "./lesson-materials";

import { LessonMaterialPreview, LessonMaterialThumbnail } from "./LessonMaterialPreview";

type LessonMaterialPanelProps = {
  lessonId: string;
  open: boolean;
  importing: boolean;
  materialUsage: LessonMaterialUsage;
  focusedMaterialUsage: LessonMaterialUsage;
  refreshRevision: number;
  onAddLink(url: string): Promise<void>;
  onRemove(material: LessonMaterial): Promise<void>;
  onClose(): void;
  onLocate(archivePath: string, legacyFileName?: string): void;
  onInsert(material: LessonMaterial, archiveMaterialPath: string): void;
  onPickDevice(): void;
  onConnectPhone?: () => void;
  style?: CSSProperties;
};

export function LessonMaterialPanel(props: LessonMaterialPanelProps) {
  // List, dialogs and in-flight callbacks belong to one lesson. Recreate them
  // together so old material paths can never be used with a new lesson ID.
  return <LessonMaterialPanelContent key={props.lessonId} {...props}/>;
}

function LessonMaterialPanelContent({ lessonId, open, importing, materialUsage, focusedMaterialUsage, refreshRevision, onAddLink, onRemove, onClose, onLocate, onInsert, onPickDevice, onConnectPhone, style }: LessonMaterialPanelProps) {
  useUiLocale();
  const [collection, setCollection] = useState<LessonMaterialCollection | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSaving, setLinkSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<LessonMaterial | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ material: LessonMaterial; value: string } | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [dropTarget, setDropTarget] = useState<{path: string; position: "before" | "after"} | null>(null);
  const dragSource = useRef<{lessonId: string; path: string; materials: LessonMaterial[]} | null>(null);
  const orderRevision = useRef(0);
  const renameRevision = useRef(0);
  const renameInput = useRef<HTMLInputElement>(null);
  const renameReturnFocus = useRef<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const removeDialog = useRef<HTMLDialogElement>(null);
  const loadRevision = useRef(0);
  const previewTimer = useRef<number | null>(null);

  const clearPreviewTimer = useCallback(() => {
    if (previewTimer.current === null) return;
    window.clearTimeout(previewTimer.current);
    previewTimer.current = null;
  }, []);

  const showPreview = useCallback((path: string, immediate = false) => {
    clearPreviewTimer();
    if (immediate) {
      setPreviewPath(path);
      return;
    }
    previewTimer.current = window.setTimeout(() => {
      previewTimer.current = null;
      setPreviewPath(path);
    }, 180);
  }, [clearPreviewTimer]);

  const hidePreview = useCallback(() => {
    clearPreviewTimer();
    setPreviewPath(null);
  }, [clearPreviewTimer]);

  const refresh = useCallback(async () => {
    const revision = loadRevision.current + 1;
    loadRevision.current = revision;
    setLoading(true);
    setError(null);
    try {
      const nextCollection = await loadLessonMaterials(lessonId);
      if (loadRevision.current !== revision) return;
      setCollection(nextCollection);
    } catch (loadError) {
      if (loadRevision.current !== revision) return;
      setCollection(null);
      setPreviewPath(null);
      setError(loadError instanceof Error ? loadError.message : "Material konnte nicht geladen werden.");
    } finally {
      if (loadRevision.current === revision) setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!open) return;
    setLinkEditorOpen(false);
    setLinkValue("");
    setLinkError(null);
    hidePreview();
    void refresh();
  }, [hidePreview, lessonId, open, refresh, refreshRevision]);

  useEffect(() => () => clearPreviewTimer(), [clearPreviewTimer]);

  useEffect(() => {
    if (!open) return;
    const refreshOnFocus = () => void refresh();
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [open, refresh]);

  const materialsWithUsage = useMemo(() => (
    collection ? lessonMaterialsWithUsage(collection.materials, collection.basis.archivePath, materialUsage) : []
  ), [collection, materialUsage]);
  const focusedPaths = useMemo(() => new Set(collection
    ? lessonMaterialsWithUsage(collection.materials, collection.basis.archivePath, focusedMaterialUsage)
      .filter(item => item.used).map(item => item.material.path) : []), [collection, focusedMaterialUsage]);
  const previewMaterial = materialsWithUsage.find(({ material }) => material.path === previewPath)?.material ?? null;

  useEffect(() => {
    if (previewPath && !previewMaterial) hidePreview();
  }, [hidePreview, previewMaterial, previewPath]);

  useEffect(() => {
    if (removeTarget && open) removeDialog.current?.showModal();
    else removeDialog.current?.close();
  }, [removeTarget, open]);
  useEffect(() => { setRemoveTarget(null); setRemoveError(null); }, [lessonId, open]);
  const confirmRemoval = async () => {
    if (!removeTarget || removing) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await onRemove(removeTarget);
      setRemoveTarget(null);
      hidePreview();
      await refresh();
    } catch (failure) {
      setRemoveError(failure instanceof Error ? failure.message : "Material konnte nicht entfernt werden.");
    } finally { setRemoving(false); }
  };

  const cancelRename = () => {
    renameRevision.current += 1;
    setRenameTarget(null);
    setRenameError(null);
    setRenameSaving(false);
  };
  useEffect(() => {
    renameRevision.current += 1;
    renameReturnFocus.current = null;
    setRenameTarget(null);
    setRenameError(null);
    setRenameSaving(false);
    return () => { renameRevision.current += 1; };
  }, [lessonId, open]);
  useEffect(() => { renameInput.current?.select(); }, [renameTarget?.material.path]);
  useEffect(() => {
    if (renameTarget || !renameReturnFocus.current) return;
    const path = renameReturnFocus.current;
    renameReturnFocus.current = null;
    panelRef.current?.querySelector<HTMLButtonElement>(`[data-material-path="${CSS.escape(path)}"] .lesson-material-rename`)?.focus({ preventScroll: true });
    hidePreview();
  }, [hidePreview, renameTarget]);

  useEffect(() => {
    if (renameError && !renameSaving) renameInput.current?.focus({ preventScroll: true });
  }, [renameError, renameSaving]);

  const saveName = async () => {
    if (!renameTarget || renameSaving || !renameTarget.value.trim()) return;
    const revision = renameRevision.current;
    const target = renameTarget;
    setRenameSaving(true);
    setRenameError(null);
    try {
      const material = await renameLessonMaterial(lessonId, target.material, target.value);
      if (renameRevision.current !== revision) return;
      setCollection(current => current ? { ...current,
        materials: current.materials.map(item => item.path === material.path ? material : item),
      } : current);
      setRenameTarget(null);
    } catch (failure) {
      if (renameRevision.current === revision) setRenameError(failure instanceof Error ? failure.message : "Name konnte nicht gespeichert werden.");
    } finally {
      if (renameRevision.current === revision) setRenameSaving(false);
    }
  };

  const clearSortDrag = () => { dragSource.current = null; setDropTarget(null); };
  useEffect(() => {
    orderRevision.current += 1; clearSortDrag();setOrderSaving(false);setOrderMessage("");
    return () => { orderRevision.current += 1; dragSource.current = null; };
  }, [lessonId, open]);
  const saveOrder = async (source: string, target: string, position: "before" | "after", original: LessonMaterial[]) => {
    if (orderSaving) return;
    const next = moveLessonMaterial(original, source, target, position);
    const previousPaths = original.map(material => material.path);
    if (next.every((material, index) => material.path === previousPaths[index])) return;
    const revision = ++orderRevision.current;
    loadRevision.current += 1;setLoading(false);setOrderSaving(true);setOrderMessage("");hidePreview();
    try {
      const materials = await reorderLessonMaterials(lessonId, next.map(material => material.path), previousPaths);
      if (revision !== orderRevision.current) return;
      setCollection(current => current ? {...current, materials} : current);
      setOrderMessage("Reihenfolge gespeichert");
    } catch (failure) {
      if (revision !== orderRevision.current) return;
      setOrderMessage(failure instanceof Error ? failure.message : "Reihenfolge konnte nicht gespeichert werden.");
      await refresh();
    } finally { if (revision === orderRevision.current) setOrderSaving(false); }
  };

  const startDrag = (event: DragEvent<HTMLDivElement>, material: LessonMaterial) => {
    if (!collection || renameTarget || orderSaving || loading || removing || importing) { event.preventDefault(); return; }
    hidePreview();
    clearSortDrag();dragSource.current = {lessonId, path: material.path, materials: collection.materials};
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData(lessonMaterialDragMime, JSON.stringify({
      archiveMaterialPath: lessonMaterialArchivePath(collection.basis.archivePath, material.path),
      lessonId,
      legacyFileName: collection.materials.filter(item => item.name === material.name).length === 1 ? material.name : undefined,
      material,
    }));
  };

  const submitLink = async () => {
    if (!linkValue.trim() || linkSaving) return;
    setLinkSaving(true);
    setLinkError(null);
    try {
      await onAddLink(linkValue.trim());
      setLinkValue("");
      setLinkEditorOpen(false);
    } catch (linkSaveError) {
      setLinkError(linkSaveError instanceof Error ? linkSaveError.message : "Link konnte nicht hinzugefügt werden.");
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <aside
      className="lesson-material-panel"
      ref={panelRef}
      aria-label={t("Material")}
      aria-hidden={!open}
      data-state={open ? "open" : "closing"}
      inert={!open}
      style={style}
    >
      <header className="lesson-material-header">
        <div>
          <h2>{t("Material")}</h2>
          {collection && (
            <span title={collection.basis.scope === "lesson"
              ? collection.basis.label
              : t("Reihenmaterial · {0}", collection.basis.label)}>
              {collection.basis.scope === "lesson"
                ? collection.basis.label
                : t("Reihenmaterial · {0}", collection.basis.label)}
            </span>
          )}
        </div>
        <div className="lesson-material-header-actions">
          <button type="button" aria-label={t("Material neu laden")} title={t("Material neu laden")} onClick={() => void refresh()}>
            <RefreshCw aria-hidden="true" strokeWidth={1.9}/>
          </button>
          <button type="button" aria-label={t("Material schließen")} title={t("Material schließen")} onClick={onClose}>
            <X aria-hidden="true" strokeWidth={1.9}/>
          </button>
        </div>
      </header>

      {open && previewMaterial && <LessonMaterialPreview key={`${lessonId}:${previewMaterial.path}`}
        lessonId={lessonId} material={previewMaterial}/>}

      <div className="lesson-material-list" role="list" aria-busy={loading || orderSaving}
        onDragLeave={event => {if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);}}
        onDragOver={event => {
          if (!dragSource.current || dragSource.current.lessonId !== lessonId || orderSaving) return;
          event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect = "move";
          const list = event.currentTarget, bounds = list.getBoundingClientRect();
          if (event.clientY < bounds.top + 36) list.scrollTop -= 16;
          else if (event.clientY > bounds.bottom - 36) list.scrollTop += 16;
          if (!(event.target as Element).closest(".lesson-material-item") && collection?.materials.length) {
            setDropTarget({path: collection.materials.at(-1)!.path, position: "after"});
          }
        }}
        onDrop={event => {
          const source = dragSource.current;
          if (!source || source.lessonId !== lessonId) return;
          event.preventDefault();event.stopPropagation();
          // Resolve the actual drop point, not a possibly uncommitted dragover render.
          const row = (event.target as Element).closest<HTMLElement>(".lesson-material-item");
          const target = row?.dataset.materialPath ?? collection?.materials.at(-1)?.path;
          const bounds = row?.getBoundingClientRect();
          const position = bounds && event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
          clearSortDrag();
          if (target) void saveOrder(source.path, target, position, source.materials);
        }}>
        <span className="lesson-material-order-status" role="status" aria-live="polite">{orderSaving ? t("Reihenfolge wird gespeichert") : orderMessage}</span>
        {orderMessage && orderMessage !== "Reihenfolge gespeichert" && <p className="lesson-material-state is-error" role="alert">{t(orderMessage)}</p>}
        {loading && !collection && <p className="lesson-material-state">{t("Material wird geladen")}</p>}
        {error && <p className="lesson-material-state is-error" role="alert">{t(error)}</p>}
        {!loading && !error && collection?.materials.length === 0 && <p className="lesson-material-state">{t("Noch kein Material")}</p>}
        {materialsWithUsage.map(({ material, used }) => (
          <div
            className="lesson-material-item"
            data-material-path={material.path}
            data-drop-position={dropTarget?.path === material.path ? dropTarget.position : undefined}
            data-used={used ? "true" : undefined}
            data-focused={focusedPaths.has(material.path) ? "true" : undefined}
            aria-current={focusedPaths.has(material.path) ? "true" : undefined}
            draggable={!importing && !removing && !renameTarget && !orderSaving && !loading}
            key={material.path}
            role="listitem"
            tabIndex={0}
            title={used ? t("{0} im Canvas anzeigen", lessonMaterialDisplayName(material)) : t("{0} auf die Fläche ziehen", lessonMaterialDisplayName(material))}
            onPointerEnter={() => {
              if (!renameTarget && !dragSource.current && !orderSaving) showPreview(material.path);
            }}
            onPointerLeave={hidePreview}
            onFocusCapture={() => {
              if (!renameTarget && !dragSource.current && !orderSaving) showPreview(material.path, true);
            }}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hidePreview();
            }}
            onDragStart={(event) => startDrag(event, material)}
            onDragEnd={clearSortDrag}
            onDragOver={event => {
              if (!dragSource.current || dragSource.current.lessonId !== lessonId || orderSaving) return;
              event.preventDefault();
              const bounds = event.currentTarget.getBoundingClientRect();
              setDropTarget({path: material.path, position: event.clientY < bounds.top + bounds.height / 2 ? "before" : "after"});
            }}
            aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
            onClick={(event) => {
              if (!used || !collection || importing || (event.target as Element).closest("button, input, form")) return;
              hidePreview();
              onLocate(lessonMaterialArchivePath(collection.basis.archivePath, material.path),
                collection.materials.filter(item => item.name === material.name).length === 1 ? material.name : undefined);
            }}
            onKeyDown={(event) => {
              if (event.target === event.currentTarget && event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();event.stopPropagation();
                if (!collection || importing || removing || orderSaving || loading || renameTarget) return;
                const index = collection.materials.findIndex(item => item.path === material.path);
                const target = collection.materials[index + (event.key === "ArrowUp" ? -1 : 1)];
                if (target) void saveOrder(material.path, target.path, event.key === "ArrowUp" ? "before" : "after", collection.materials);
                return;
              }
              if (event.target !== event.currentTarget || !used || (event.key !== "Enter" && event.key !== " ")) return;
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.click();
            }}
          >
            <span className="lesson-material-thumb">
              {material.kind === "image" ? (
                <img src={lessonMaterialFileUrl(lessonId, material.path)} alt="" loading="lazy"/>
              ) : material.kind === "audio" ? (
                <FileAudio aria-hidden="true" strokeWidth={1.7}/>
              ) : material.kind === "video" ? (
                <FileVideo2 aria-hidden="true" strokeWidth={1.7}/>
              ) : material.kind === "link" ? (
                material.provider === "youtube"
                  ? <CirclePlay aria-hidden="true" strokeWidth={1.7}/>
                  : <Link2 aria-hidden="true" strokeWidth={1.7}/>
              ) : (
                <LessonMaterialThumbnail lessonId={lessonId} material={material}/>
              )}
            </span>
            {renameTarget?.material.path === material.path ? (
              <form className="lesson-material-name-form" aria-label={t("Material umbenennen")}
                onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
                onKeyDown={event => {
                  event.stopPropagation();
                  if (event.key === "Escape") { event.preventDefault(); if (!renameSaving) cancelRename(); }
                }}
                onSubmit={event => { event.preventDefault(); void saveName(); }}>
                <input ref={renameInput} autoFocus aria-label={t("Materialname")} maxLength={160}
                  aria-invalid={Boolean(renameError)} aria-describedby={renameError ? "material-name-error" : undefined}
                  value={renameTarget.value} disabled={renameSaving}
                  onChange={event => { setRenameTarget({ ...renameTarget, value: event.target.value }); setRenameError(null); }}/>
                <button type="submit" aria-label={t("Name speichern")} title={t("Name speichern")}
                  disabled={renameSaving || !renameTarget.value.trim()}><Check aria-hidden="true" strokeWidth={2}/></button>
                <button type="button" aria-label={t("Abbrechen")} title={t("Abbrechen")} disabled={renameSaving}
                  onClick={cancelRename}><X aria-hidden="true" strokeWidth={2}/></button>
                {renameError && <p id="material-name-error" role="alert">{t(renameError)}</p>}
              </form>
            ) : <>
            <span className="lesson-material-item-copy">
              <strong>{lessonMaterialDisplayName(material)}</strong>
              <span className="lesson-material-item-meta">
                {material.kind !== "image" && material.kind !== "interactive" && (
                  <span className="lesson-material-type">{material.folder ?? (material.kind === "pdf" ? "PDF" : material.kind === "audio" ? "Audio" : material.kind === "video" ? "Video" : material.provider === "youtube" ? "YouTube" : "Weblink")}</span>
                )}
                {used && (
                  <span className="lesson-material-used">{t("Im Canvas")} <Check aria-hidden="true" strokeWidth={2}/></span>
                )}
              </span>
            </span>
            <button
              className="lesson-material-insert"
              type="button"
              draggable={false}
              disabled={importing || removing || orderSaving}
              aria-label={importing ? t("Wird importiert") : t("{0} {1}auf die Fläche", lessonMaterialDisplayName(material), used ? t("noch einmal ") : "")}
              title={importing ? t("Wird importiert") : used ? t("Noch einmal auf Fläche") : t("Auf Fläche")}
              onClick={() => collection && onInsert(
                material,
                lessonMaterialArchivePath(collection.basis.archivePath, material.path),
              )}
            >
              <Plus aria-hidden="true" strokeWidth={2}/>
            </button>
            <button className="lesson-material-rename" type="button" draggable={false}
              disabled={importing || removing || renameSaving || orderSaving}
              aria-label={t("{0} umbenennen", lessonMaterialDisplayName(material))} title={t("Material umbenennen")}
              onPointerDown={event => event.stopPropagation()}
              onClick={() => {
                hidePreview(); renameRevision.current += 1; renameReturnFocus.current = material.path; setRenameError(null);
                setRenameTarget({ material, value: lessonMaterialDisplayName(material) });
              }}>
              <Pencil aria-hidden="true" strokeWidth={1.9}/>
            </button>
            <button className="lesson-material-remove" type="button" draggable={false}
              disabled={importing || removing || orderSaving}
              aria-label={t("{0} aus dem Materialarchiv entfernen", lessonMaterialDisplayName(material))} title={t("Aus Materialarchiv entfernen")}
              onPointerDown={event => event.stopPropagation()}
              onClick={() => { hidePreview(); setRemoveError(null); setRemoveTarget(material); }}>
              <X aria-hidden="true" strokeWidth={2}/>
            </button>
            </>}
          </div>
        ))}
      </div>

      <dialog ref={removeDialog} className="interactive-reset-dialog lesson-material-remove-dialog"
        aria-labelledby="material-remove-title" aria-describedby="material-remove-description"
        onCancel={event => { if (removing) event.preventDefault(); else setRemoveTarget(null); }}
        onKeyDown={event => event.stopPropagation()}>
        <div className="interactive-reset-dialog__copy">
          <h2 id="material-remove-title">{t("Material aus dem Archiv entfernen?")}</h2>
          <p id="material-remove-description">„{removeTarget ? lessonMaterialDisplayName(removeTarget) : ""}{t("“ wird auch von allen Unterrichtsflächen entfernt, die dieses Material verwenden – einschließlich zugehöriger Annotationen und Materialclips.")}
            {collection?.basis.scope === "series" && t(" Dieses Reihenmaterial steht anschließend auch in den anderen Stunden nicht mehr zur Verfügung.")}</p>
          {removeError && <p className="is-error" role="alert">{t(removeError)}</p>}
        </div>
        <div className="interactive-reset-dialog__actions">
          <button type="button" autoFocus disabled={removing} onClick={() => setRemoveTarget(null)}>{t("Abbrechen")}</button>
          <button type="button" className="is-danger" disabled={removing} onClick={() => void confirmRemoval()}>
            {removing ? t("Wird entfernt…") : t("Entfernen")}
          </button>
        </div>
      </dialog>
      <footer className="lesson-material-footer">
        {linkEditorOpen && (
          <form
            className="lesson-material-link-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitLink();
            }}
          >
            <div>
              <Link2 aria-hidden="true" strokeWidth={1.8}/>
              <input
                autoFocus
                type="url"
                inputMode="url"
                aria-label={t("Link einfügen")}
                placeholder={t("Link einfügen")}
                value={linkValue}
                disabled={linkSaving}
                onChange={(event) => setLinkValue(event.target.value)}
              />
              <button type="submit" disabled={!linkValue.trim() || linkSaving}>{t("Hinzufügen")}</button>
              <button
                className="lesson-material-link-close"
                type="button"
                aria-label={t("Linkeingabe schließen")}
                title={t("Linkeingabe schließen")}
                onClick={() => {
                  setLinkEditorOpen(false);
                  setLinkError(null);
                }}
              >
                <X aria-hidden="true" strokeWidth={1.9}/>
              </button>
            </div>
            {linkError && <p role="alert">{t(linkError)}</p>}
          </form>
        )}
        <div className="lesson-material-source-actions">
          <button className="lesson-material-device" type="button" onClick={onPickDevice}>
            <Upload aria-hidden="true" strokeWidth={1.8}/>
            <span>{t("Vom Gerät")}</span>
          </button>
          <button
            className="lesson-material-device"
            type="button"
            aria-expanded={linkEditorOpen}
            onClick={() => {
              setLinkEditorOpen((current) => !current);
              setLinkError(null);
            }}
          >
            <Link2 aria-hidden="true" strokeWidth={1.8}/>
            <span>{t("Link hinzufügen")}</span>
          </button>
        </div>
        {onConnectPhone && <button className="lesson-material-device lesson-material-phone" type="button" onClick={onConnectPhone}>
          <ImageUp aria-hidden="true" strokeWidth={1.8}/><span>{t("Bild übertragen")}</span>
        </button>}
      </footer>
    </aside>
  );
}
