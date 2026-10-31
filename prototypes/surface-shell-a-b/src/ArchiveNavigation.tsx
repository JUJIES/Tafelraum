import { t, useUiLocale } from "./i18n";
import { useEffect, useRef, useState, type CSSProperties, type DragEvent as ReactDragEvent, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { Check, ClipboardPaste, Copy, CopyPlus, Folder, FolderOpen, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { ClassPicker } from "./ClassPicker";
import { canPasteArchiveItem, classTrashUnavailableReason, reorderSiblingGroupIds, reorderSiblingIds, type ArchiveClipboardItem, type ArchivePasteTarget, type ArchiveTrashItem, type CatalogDropPosition, type CatalogOrderLevel, type LessonClass, type LessonSeries, type LessonSubject, type TestLesson } from "./lesson-catalog";
import { formatLessonDate, nextPlanningDate, storedLessonTitle } from "./lesson-labels";

// Navigation owns transient interaction state. Catalog writes and lesson changes
// remain with App through the existing callbacks.
export type ArchiveCreateTarget =
  | { kind: "subject"; classId: string }
  | { kind: "series"; classId: string; subjectId: string }
  | { kind: "lesson"; classId: string; subjectId: string; seriesId: string };

type ArchiveDragItem = {
  level: CatalogOrderLevel;
  id: string;
  parentId: string;
  ids?: string[];
};

type ArchiveContextTarget = { kind: "class"; lessonClass: LessonClass }
  | { kind: "subject"; lessonClass: LessonClass; subject: LessonSubject }
  | { kind: "series"; lessonClass: LessonClass; subject: LessonSubject; series: LessonSeries }
  | { kind: "lesson"; lesson: TestLesson };

type ArchiveContextMenu = ArchiveContextTarget & { x: number; y: number };
export type ArchiveMutableTarget = ArchiveContextTarget;
type ArchiveFolderRename = { kind: "subject" | "series"; id: string };
export type ArchiveDuplicatePlacement = {
  target: ArchivePasteTarget;
  level: CatalogOrderLevel;
  parentId: string;
  sourceId: string;
  siblingIds: string[];
};

const folderTones = ["blue", "sand", "sage", "lilac"] as const;

function folderToneForId(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return folderTones[(hash + 1) % folderTones.length];
}

function InlineArchiveCreate({ kind, onCancel, onSubmit }: {
  kind: "subject" | "series";
  onCancel(): void;
  onSubmit(value: string): void;
}) {
  useUiLocale();
  const [value, setValue] = useState("");
  const label = kind === "subject" ? t("Name des Fachs") : t("Name der Reihe");
  const submit = () => {
    const normalizedValue = value.trim();
    if (normalizedValue) onSubmit(normalizedValue);
  };

  return (
    <form
      className={`archive-create-row${kind === "subject" ? " archive-create-root" : ""}`}
      aria-label={kind === "subject" ? t("Fach anlegen") : t("Neue Reihe anlegen")}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        type="text"
        aria-label={t(label)}
        placeholder={t(label)}
        maxLength={80}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
            return;
          }
          if (event.key !== "Escape") return;
          event.preventDefault();
          onCancel();
        }}
      />
      <button type="submit" aria-label={t("Anlegen")} title={t("Anlegen")} disabled={!value.trim()}>
        <Check aria-hidden="true" strokeWidth={2}/>
      </button>
      <button type="button" aria-label={t("Abbrechen")} title={t("Abbrechen")} onClick={onCancel}>
        <X aria-hidden="true" strokeWidth={1.9}/>
      </button>
    </form>
  );
}

function InlineFolderTitle({ initialValue, kind, onCancel, onSubmit }: {
  initialValue: string;
  kind: "subject" | "series";
  onCancel(): void;
  onSubmit(value: string): void;
}) {
  useUiLocale();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = () => {
    const normalizedValue = value.trim();
    if (normalizedValue) onSubmit(normalizedValue);
  };

  useEffect(() => inputRef.current?.select(), []);

  return (
    <span className="archive-folder-edit" onClick={(event) => event.stopPropagation()}>
      <input
        ref={inputRef}
        autoFocus
        className="archive-folder-name-input"
        type="text"
        aria-label={kind === "subject" ? t("Fach umbenennen") : t("Reihe umbenennen")}
        maxLength={80}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onContextMenu={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
            return;
          }
          if (event.key !== "Escape") return;
          event.preventDefault();
          onCancel();
        }}
      />
      <button
        className="archive-folder-edit-action"
        type="button"
        aria-label={t("Übernehmen")}
        title={t("Übernehmen")}
        disabled={!value.trim()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          submit();
        }}
      >
        <Check aria-hidden="true" strokeWidth={2}/>
      </button>
      <button
        className="archive-folder-edit-action"
        type="button"
        aria-label={t("Abbrechen")}
        title={t("Abbrechen")}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }}
      >
        <X aria-hidden="true" strokeWidth={1.9}/>
      </button>
    </span>
  );
}

function InlineLessonTitle({ initialValue = "", scheduledFor, onCancel, onSubmit }: {
  initialValue?: string;
  scheduledFor: string | null;
  onCancel(): void;
  onSubmit(value: string): void;
}) {
  useUiLocale();
  const [value, setValue] = useState(initialValue);
  const cancelled = useRef(false);
  const submitted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) inputRef.current?.select();
  }, [initialValue]);

  const submit = () => {
    if (cancelled.current || submitted.current) return;
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      onCancel();
      return;
    }
    submitted.current = true;
    onSubmit(normalizedValue);
  };

  return (
    <form
      className="lesson-link lesson-link-editor"
      aria-label={initialValue ? t("Unterricht umbenennen") : t("Neuen Unterricht anlegen")}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        ref={inputRef}
        autoFocus
        type="text"
        aria-label={initialValue ? t("Unterricht umbenennen") : t("Titel des Unterrichts")}
        placeholder={t("Titel des Unterrichts")}
        maxLength={80}
        value={value}
        onBlur={submit}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
            return;
          }
          if (event.key !== "Escape") return;
          event.preventDefault();
          cancelled.current = true;
          onCancel();
        }}
      />
      {scheduledFor && (
        <time className="lesson-link-date" dateTime={scheduledFor}>
          {formatLessonDate(scheduledFor)}
        </time>
      )}
    </form>
  );
}

export function ArchiveNavigation({ classesEditable, onEditStudents, onClassSave, activeClassId, activeLessonId, activeLessonTitle, isOpen, lessonClasses, onArchiveItemTrash, onClassSelect, onDuplicateArchiveItem, onLessonCreate, onLessonRename, onLessonSelect, onOrderChange, onPasteArchiveItem, onSeriesCreate, onSeriesRename, onSubjectCreate, onSubjectRename, onTrashRestore, trashItems }: {
  classesEditable: boolean;
  onEditStudents(id: string, anchor: DOMRect): void;
  onClassSave(id: string, label: string, previousLabel?: string): Promise<void>;
  activeClassId: string;
  activeLessonId: string;
  activeLessonTitle: string;
  isOpen: boolean;
  lessonClasses: LessonClass[];
  onArchiveItemTrash(target: ArchiveMutableTarget): void;
  onClassSelect(classId: string): void;
  onDuplicateArchiveItem(item: ArchiveClipboardItem, placement: ArchiveDuplicatePlacement): Promise<void>;
  onLessonCreate(target: Extract<ArchiveCreateTarget, { kind: "lesson" }>, title: string): void;
  onLessonRename(lesson: TestLesson, title: string): void;
  onLessonSelect(lesson: TestLesson): void;
  onOrderChange(level: CatalogOrderLevel, parentId: string, orderedIds: string[]): void;
  onPasteArchiveItem(item: ArchiveClipboardItem, target: ArchivePasteTarget): Promise<void>;
  onSeriesCreate(target: Extract<ArchiveCreateTarget, { kind: "series" }>, label: string): void;
  onSeriesRename(series: LessonSeries, classId: string, subjectId: string, label: string): void;
  onSubjectCreate(target: Extract<ArchiveCreateTarget, { kind: "subject" }>, label: string): void;
  onSubjectRename(subject: LessonSubject, classId: string, label: string): void;
  onTrashRestore(item: ArchiveTrashItem): void;
  trashItems: ArchiveTrashItem[];
}) {
  useUiLocale();
  const [createTarget, setCreateTarget] = useState<ArchiveCreateTarget | null>(null);
  const [renamingLessonId, setRenamingLessonId] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<ArchiveFolderRename | null>(null);
  const [contextMenu, setContextMenu] = useState<ArchiveContextMenu | null>(null);
  const [clipboardItem, setClipboardItem] = useState<ArchiveClipboardItem | null>(null);
  const [copyModeError, setCopyModeError] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<ArchiveDragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<(ArchiveDragItem & { position: CatalogDropPosition }) | null>(null);
  const draggedItemRef = useRef<ArchiveDragItem | null>(null);
  const subjectSelectionAnchorRef = useRef<string | null>(null);
  const openingTimersRef = useRef(new Map<HTMLDetailsElement, number>());
  const activeClass = lessonClasses.find((lessonClass) => lessonClass.id === activeClassId) ?? lessonClasses[0];
  const archiveEditing = Boolean(createTarget || renamingLessonId || renamingFolder);

  useEffect(() => () => {
    openingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    openingTimersRef.current.clear();
  }, []);

  const cueArchiveOpening = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    const branch = event.currentTarget.parentElement;
    if (!(branch instanceof HTMLDetailsElement)) return;
    const previousTimer = openingTimersRef.current.get(branch);
    if (previousTimer !== undefined) window.clearTimeout(previousTimer);
    openingTimersRef.current.delete(branch);
    branch.classList.remove("is-opening");
    if (branch.open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Native <details> remains the source of truth; this class only cues the brief reveal.
    branch.classList.add("is-opening");
    openingTimersRef.current.set(branch, window.setTimeout(() => {
      branch.classList.remove("is-opening");
      openingTimersRef.current.delete(branch);
    }, 360));
  };

  useEffect(() => {
    if (!contextMenu && !clipboardItem && selectedSubjectIds.length === 0) return;
    const closeOnPointer = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".archive-context-menu")) return;
      setContextMenu(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (contextMenu) {
        setContextMenu(null);
        return;
      }
      setSelectedSubjectIds([]);
      subjectSelectionAnchorRef.current = null;
      setClipboardItem(null);
      setCopyModeError(null);
    };
    if (contextMenu) window.addEventListener("pointerdown", closeOnPointer);
    window.addEventListener("keydown", closeOnEscape, true);
    return () => {
      window.removeEventListener("pointerdown", closeOnPointer);
      window.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [clipboardItem, contextMenu, selectedSubjectIds.length]);

  useEffect(() => {
    const visibleSubjectIds = new Set(activeClass.subjects.map((subject) => subject.id));
    setSelectedSubjectIds((currentIds) => {
      const nextIds = currentIds.filter((id) => visibleSubjectIds.has(id));
      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
    if (subjectSelectionAnchorRef.current && !visibleSubjectIds.has(subjectSelectionAnchorRef.current)) {
      subjectSelectionAnchorRef.current = null;
    }
  }, [activeClass.id, activeClass.subjects]);

  const beginCreate = (event: ReactMouseEvent<HTMLButtonElement>, target: ArchiveCreateTarget) => {
    event.preventDefault();
    event.stopPropagation();
    const branch = event.currentTarget.closest("details") as HTMLDetailsElement | null;
    if (branch) branch.open = true;
    setSelectedSubjectIds([]);
    subjectSelectionAnchorRef.current = null;
    setRenamingLessonId(null);
    setRenamingFolder(null);
    setCreateTarget(target);
  };

  const openArchiveMenu = (target: ArchiveContextTarget, x: number, y: number) => {
    setSelectedSubjectIds([]);
    subjectSelectionAnchorRef.current = null;
    setCreateTarget(null);
    setRenamingLessonId(null);
    setRenamingFolder(null);
    setContextMenu({
      ...target,
      x: Math.min(x, window.innerWidth - 180),
      y: Math.max(8, Math.min(y, window.innerHeight - 310)),
    });
  };

  const displayLessonTitle = (lesson: TestLesson) => (
    lesson.id === activeLessonId ? activeLessonTitle.trim() || lesson.title : storedLessonTitle(lesson)
  );

  const lessonForClipboard = (lesson: TestLesson): TestLesson => ({ ...lesson, title: displayLessonTitle(lesson) });
  const seriesForClipboard = (series: LessonSeries): LessonSeries => ({
    ...series,
    lessons: series.lessons.map(lessonForClipboard),
  });
  const subjectForClipboard = (subject: LessonSubject): LessonSubject => ({
    ...subject,
    series: subject.series.map(seriesForClipboard),
  });

  const clipboardItemForContext = (context: ArchiveContextTarget): ArchiveClipboardItem | null => {
    if (context.kind === "subject") return { kind: "subject", subject: subjectForClipboard(context.subject) };
    if (context.kind === "series") return { kind: "series", series: seriesForClipboard(context.series) };
    if (context.kind === "lesson") return { kind: "lesson", lesson: lessonForClipboard(context.lesson) };
    return null;
  };

  const pasteTargetForContext = (context: ArchiveContextTarget): ArchivePasteTarget | null => {
    if (context.kind === "class") return { kind: "class", classId: context.lessonClass.id };
    if (context.kind === "subject") {
      return { kind: "subject", classId: context.lessonClass.id, subjectId: context.subject.id };
    }
    if (context.kind === "series") {
      return {
        kind: "series",
        classId: context.lessonClass.id,
        subjectId: context.subject.id,
        seriesId: context.series.id,
      };
    }
    return null;
  };

  const duplicatePlacementForContext = (context: ArchiveContextTarget): ArchiveDuplicatePlacement | null => {
    if (context.kind === "subject") {
      return {
        target: { kind: "class", classId: context.lessonClass.id },
        level: "subject",
        parentId: context.lessonClass.id,
        sourceId: context.subject.id,
        siblingIds: context.lessonClass.subjects.map((subject) => subject.id),
      };
    }
    if (context.kind === "series") {
      return {
        target: { kind: "subject", classId: context.lessonClass.id, subjectId: context.subject.id },
        level: "series",
        parentId: context.subject.id,
        sourceId: context.series.id,
        siblingIds: context.subject.series.map((series) => series.id),
      };
    }
    if (context.kind === "lesson") {
      const lessonClass = lessonClasses.find((candidate) => candidate.id === context.lesson.classId);
      const subject = lessonClass?.subjects.find((candidate) => candidate.id === context.lesson.subjectId);
      const series = subject?.series.find((candidate) => candidate.id === context.lesson.seriesId);
      if (!lessonClass || !subject || !series) return null;
      return {
        target: {
          kind: "series",
          classId: lessonClass.id,
          subjectId: subject.id,
          seriesId: series.id,
        },
        level: "lesson",
        parentId: series.id,
        sourceId: context.lesson.id,
        siblingIds: series.lessons.map((lesson) => lesson.id),
      };
    }
    return null;
  };

  const copyContextItem = (context: ArchiveContextTarget) => {
    const item = clipboardItemForContext(context);
    if (!item) return;
    setClipboardItem(item);
    setCopyModeError(null);
    setContextMenu(null);
  };

  const pasteContextItem = async (context: ArchiveContextTarget) => {
    const target = pasteTargetForContext(context);
    if (!clipboardItem || !target || !canPasteArchiveItem(clipboardItem, target) || isPasting) return;
    setContextMenu(null);
    setCopyModeError(null);
    setIsPasting(true);
    try {
      await onPasteArchiveItem(clipboardItem, target);
    } catch (error) {
      console.error(t("Archivkopie konnte nicht eingefügt werden."), error);
      setCopyModeError("Einfügen fehlgeschlagen");
    } finally {
      setIsPasting(false);
    }
  };

  const duplicateContextItem = async (context: ArchiveContextTarget) => {
    const item = clipboardItemForContext(context);
    const placement = duplicatePlacementForContext(context);
    if (!item || !placement || isPasting) return;
    setContextMenu(null);
    setCopyModeError(null);
    setIsPasting(true);
    try {
      await onDuplicateArchiveItem(item, placement);
    } catch (error) {
      console.error(t("Archivelement konnte nicht dupliziert werden."), error);
      setCopyModeError("Duplizieren fehlgeschlagen");
    } finally {
      setIsPasting(false);
    }
  };

  const contextLabel = (context: ArchiveContextTarget) => {
    if (context.kind === "class") return context.lessonClass.label;
    if (context.kind === "subject") return context.subject.label;
    if (context.kind === "series") return context.series.label;
    return displayLessonTitle(context.lesson);
  };

  const openContextMenuFromPointer = (event: ReactMouseEvent<HTMLElement>, target: ArchiveContextTarget) => {
    event.preventDefault();
    event.stopPropagation();
    openArchiveMenu(target, event.clientX, event.clientY);
  };

  const openContextMenuFromKeyboard = (event: KeyboardEvent<HTMLElement>, target: ArchiveContextTarget) => {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    openArchiveMenu(target, bounds.right - 8, bounds.top + 8);
  };

  const selectSubjectFromPointer = (event: ReactMouseEvent<HTMLElement>, subjectId: string, siblingIds: string[]) => {
    const additive = event.metaKey || event.ctrlKey;
    if (!additive && !event.shiftKey) {
      setSelectedSubjectIds([]);
      subjectSelectionAnchorRef.current = subjectId;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      const anchorId = subjectSelectionAnchorRef.current ?? subjectId;
      const anchorIndex = siblingIds.indexOf(anchorId);
      const subjectIndex = siblingIds.indexOf(subjectId);
      const rangeStart = Math.min(anchorIndex, subjectIndex);
      const rangeEnd = Math.max(anchorIndex, subjectIndex);
      setSelectedSubjectIds(siblingIds.slice(rangeStart, rangeEnd + 1));
      return;
    }

    setSelectedSubjectIds((currentIds) => currentIds.includes(subjectId)
      ? currentIds.filter((id) => id !== subjectId)
      : [...currentIds, subjectId]);
    subjectSelectionAnchorRef.current = subjectId;
  };

  const beginArchiveDrag = (event: ReactDragEvent<HTMLElement>, item: ArchiveDragItem) => {
    const target = event.target instanceof Element ? event.target : null;
    if (archiveEditing || target?.closest(".archive-add-button, input")) {
      event.preventDefault();
      return;
    }
    const ids = item.level === "subject" && selectedSubjectIds.includes(item.id)
      ? activeClass.subjects.map((subject) => subject.id).filter((id) => selectedSubjectIds.includes(id))
      : [item.id];
    const dragItem = { ...item, ids };
    if (item.level === "subject" && !selectedSubjectIds.includes(item.id)) {
      setSelectedSubjectIds([]);
      subjectSelectionAnchorRef.current = item.id;
    }
    draggedItemRef.current = dragItem;
    setDraggedItem(dragItem);
    setDropTarget(null);
    setContextMenu(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ids.join(","));
  };

  const updateArchiveDropTarget = (event: ReactDragEvent<HTMLElement>, target: ArchiveDragItem) => {
    const source = draggedItemRef.current;
    if (!source || source.ids?.includes(target.id) || source.level !== target.level || source.parentId !== target.parentId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    setDropTarget({ ...target, position });
  };

  const finishArchiveDrop = (event: ReactDragEvent<HTMLElement>, target: ArchiveDragItem, siblingIds: string[]) => {
    const source = draggedItemRef.current;
    if (!source || source.ids?.includes(target.id) || source.level !== target.level || source.parentId !== target.parentId) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    const orderedIds = source.ids && source.ids.length > 1
      ? reorderSiblingGroupIds(siblingIds, source.ids, target.id, position)
      : reorderSiblingIds(siblingIds, source.id, target.id, position);
    if (orderedIds.some((id, index) => id !== siblingIds[index])) onOrderChange(source.level, source.parentId, orderedIds);
    draggedItemRef.current = null;
    setDraggedItem(null);
    setDropTarget(null);
  };

  const endArchiveDrag = () => {
    draggedItemRef.current = null;
    setDraggedItem(null);
    setDropTarget(null);
  };

  const clearDropTarget = (event: ReactDragEvent<HTMLElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setDropTarget(null);
  };

  const dragStateFor = (item: ArchiveDragItem) => ({
    dragging: draggedItem?.level === item.level && draggedItem.parentId === item.parentId && Boolean(draggedItem.ids?.includes(item.id)),
    dropPosition: dropTarget?.level === item.level && dropTarget.id === item.id && dropTarget.parentId === item.parentId
      ? dropTarget.position
      : undefined,
  });
  const contextCopyItem = contextMenu ? clipboardItemForContext(contextMenu) : null;
  const contextDuplicatePlacement = contextMenu ? duplicatePlacementForContext(contextMenu) : null;
  const contextPasteTarget = contextMenu ? pasteTargetForContext(contextMenu) : null;
  const contextCanPaste = Boolean(clipboardItem && contextPasteTarget && canPasteArchiveItem(clipboardItem, contextPasteTarget));
  const isClipboardSource = (kind: ArchiveClipboardItem["kind"], id: string) => {
    if (!clipboardItem || clipboardItem.kind !== kind) return false;
    if (clipboardItem.kind === "subject") return clipboardItem.subject.id === id;
    if (clipboardItem.kind === "series") return clipboardItem.series.id === id;
    return clipboardItem.lesson.id === id;
  };
  const contextIsClipboardSource = Boolean(
    contextCopyItem && (
      (contextCopyItem.kind === "subject" && isClipboardSource("subject", contextCopyItem.subject.id))
      || (contextCopyItem.kind === "series" && isClipboardSource("series", contextCopyItem.series.id))
      || (contextCopyItem.kind === "lesson" && isClipboardSource("lesson", contextCopyItem.lesson.id))
    ),
  );

  return (
    <>
    <aside className="archive-panel" id="archive-navigation" aria-label={t("Unterricht")} aria-hidden={!isOpen} inert={!isOpen}>
      <div className="archive-panel-header">
        <ClassPicker onEditStudents={onEditStudents} classes={lessonClasses} activeId={activeClass.id} enabled={classesEditable} onSave={onClassSave}
          trashUnavailableReason={classTrashUnavailableReason(lessonClasses, activeClass.id, activeLessonId)}
          onTrash={() => onArchiveItemTrash({ kind: "class", lessonClass: activeClass })}
          onSelect={(id) => {
            setCreateTarget(null);
            setRenamingLessonId(null);
            setRenamingFolder(null);
            setSelectedSubjectIds([]);
            subjectSelectionAnchorRef.current = null;
            setContextMenu(null);
            onClassSelect(id);
          }}
          onContextMenu={(event) => {
            if (clipboardItem?.kind === "subject") openContextMenuFromPointer(event, { kind: "class", lessonClass: activeClass });
          }}
          onContextKey={(event) => {
            if (clipboardItem?.kind === "subject") openContextMenuFromKeyboard(event, { kind: "class", lessonClass: activeClass });
          }}
        />
        <span className="archive-panel-toggle-slot" aria-hidden="true"/>
      </div>

      {copyModeError && <p className="archive-copy-error" role="alert">{t(copyModeError)}</p>}

      <div className="archive-tree">
        {activeClass.subjects.map((subject) => {
          const subjectDragItem: ArchiveDragItem = { level: "subject", id: subject.id, parentId: activeClass.id };
          const subjectDragState = dragStateFor(subjectDragItem);
          const subjectIds = activeClass.subjects.map((candidate) => candidate.id);
          const subjectSelected = selectedSubjectIds.includes(subject.id);
          return (
            <details className="archive-branch archive-subject" key={subject.id} open>
              <summary
                className={`archive-sortable${subjectDragState.dragging ? " is-archive-dragging" : ""}${subjectSelected ? " is-archive-selected" : ""}${isClipboardSource("subject", subject.id) ? " is-copy-source" : ""}`}
                draggable={!archiveEditing}
                aria-label={subjectSelected ? t("{0}, ausgewählt", subject.label) : subject.label}
                data-drop-position={subjectDragState.dropPosition}
                data-selected={subjectSelected || undefined}
                onClick={(event) => {
                  selectSubjectFromPointer(event, subject.id, subjectIds);
                  cueArchiveOpening(event);
                }}
                onDragStart={(event) => beginArchiveDrag(event, subjectDragItem)}
                onDragOver={(event) => updateArchiveDropTarget(event, subjectDragItem)}
                onDragLeave={clearDropTarget}
                onDrop={(event) => finishArchiveDrop(event, subjectDragItem, subjectIds)}
                onDragEnd={endArchiveDrag}
                onContextMenu={(event) => openContextMenuFromPointer(event, { kind: "subject", lessonClass: activeClass, subject })}
                onKeyDown={(event) => openContextMenuFromKeyboard(event, { kind: "subject", lessonClass: activeClass, subject })}
              >
                <span className={`archive-folder-icon folder-tone-${folderToneForId(subject.id)}`}>
                  <Folder className="archive-folder-closed" aria-hidden="true" strokeWidth={1.8}/>
                  <FolderOpen className="archive-folder-open" aria-hidden="true" strokeWidth={1.8}/>
                </span>
                {renamingFolder?.kind === "subject" && renamingFolder.id === subject.id ? (
                  <InlineFolderTitle
                    kind="subject"
                    initialValue={subject.label}
                    onCancel={() => setRenamingFolder(null)}
                    onSubmit={(label) => {
                      onSubjectRename(subject, activeClass.id, label);
                      setRenamingFolder(null);
                    }}
                  />
                ) : (
                  <>
                    <span className="archive-branch-label">{subject.label}</span>
                    <button
                      className="archive-add-button"
                      type="button"
                      aria-label={t("Neue Reihe in {0}", subject.label)}
                      title={t("Neue Reihe")}
                      onClick={(event) => beginCreate(event, { kind: "series", classId: activeClass.id, subjectId: subject.id })}
                    >
                      <Plus aria-hidden="true" strokeWidth={1.9}/>
                    </button>
                  </>
                )}
              </summary>
              <div className="archive-branch-content">
                {createTarget?.kind === "series" && createTarget.subjectId === subject.id && (
                  <InlineArchiveCreate
                    kind="series"
                    onCancel={() => setCreateTarget(null)}
                    onSubmit={(label) => {
                      onSeriesCreate(createTarget, label);
                      setCreateTarget(null);
                    }}
                  />
                )}
                {subject.series.map((series, seriesIndex) => {
                  const seriesDragItem: ArchiveDragItem = { level: "series", id: series.id, parentId: subject.id };
                  const seriesDragState = dragStateFor(seriesDragItem);
                  const seriesIds = subject.series.map((candidate) => candidate.id);
                  return (
                    <details className="archive-branch archive-series" key={series.id} open style={{ "--archive-series-step": Math.min(seriesIndex, 4) } as CSSProperties}>
                      <summary
                        className={`archive-sortable${seriesDragState.dragging ? " is-archive-dragging" : ""}${isClipboardSource("series", series.id) ? " is-copy-source" : ""}`}
                        draggable={!archiveEditing}
                        data-drop-position={seriesDragState.dropPosition}
                        onClick={cueArchiveOpening}
                        onDragStart={(event) => beginArchiveDrag(event, seriesDragItem)}
                        onDragOver={(event) => updateArchiveDropTarget(event, seriesDragItem)}
                        onDragLeave={clearDropTarget}
                        onDrop={(event) => finishArchiveDrop(event, seriesDragItem, seriesIds)}
                        onDragEnd={endArchiveDrag}
                        onContextMenu={(event) => openContextMenuFromPointer(event, {
                          kind: "series",
                          lessonClass: activeClass,
                          subject,
                          series,
                        })}
                        onKeyDown={(event) => openContextMenuFromKeyboard(event, {
                          kind: "series",
                          lessonClass: activeClass,
                          subject,
                          series,
                        })}
                      >
                        <span className={`archive-folder-icon folder-tone-${folderToneForId(series.id)}`}>
                          <Folder className="archive-folder-closed" aria-hidden="true" strokeWidth={1.8}/>
                          <FolderOpen className="archive-folder-open" aria-hidden="true" strokeWidth={1.8}/>
                        </span>
                        {renamingFolder?.kind === "series" && renamingFolder.id === series.id ? (
                          <InlineFolderTitle
                            kind="series"
                            initialValue={series.label}
                            onCancel={() => setRenamingFolder(null)}
                            onSubmit={(label) => {
                              onSeriesRename(series, activeClass.id, subject.id, label);
                              setRenamingFolder(null);
                            }}
                          />
                        ) : (
                          <>
                            <span className="archive-branch-label">{series.label}</span>
                            <button
                              className="archive-add-button"
                              type="button"
                              aria-label={t("Neuer Unterricht in {0}", series.label)}
                              title={t("Neuer Unterricht")}
                              onClick={(event) => beginCreate(event, {
                                kind: "lesson",
                                classId: activeClass.id,
                                subjectId: subject.id,
                                seriesId: series.id,
                              })}
                            >
                              <Plus aria-hidden="true" strokeWidth={1.9}/>
                            </button>
                          </>
                        )}
                      </summary>
                      <div className="lesson-list">
                        {createTarget?.kind === "lesson" && createTarget.seriesId === series.id && (
                          <InlineLessonTitle
                            scheduledFor={nextPlanningDate()}
                            onCancel={() => setCreateTarget(null)}
                            onSubmit={(title) => {
                              onLessonCreate(createTarget, title);
                              setCreateTarget(null);
                            }}
                          />
                        )}
                        {series.lessons.map((lesson, lessonIndex) => {
                          const lessonDragItem: ArchiveDragItem = { level: "lesson", id: lesson.id, parentId: series.id };
                          const lessonDragState = dragStateFor(lessonDragItem);
                          const lessonIds = series.lessons.map((candidate) => candidate.id);
                          return renamingLessonId === lesson.id ? (
                            <InlineLessonTitle
                              key={lesson.id}
                              initialValue={lesson.id === activeLessonId ? activeLessonTitle.trim() || lesson.title : storedLessonTitle(lesson)}
                              scheduledFor={lesson.metadata.scheduledFor}
                              onCancel={() => setRenamingLessonId(null)}
                              onSubmit={(title) => {
                                onLessonRename(lesson, title);
                                setRenamingLessonId(null);
                              }}
                            />
                          ) : (
                            <button
                              className={`lesson-link archive-sortable${lessonDragState.dragging ? " is-archive-dragging" : ""}${isClipboardSource("lesson", lesson.id) ? " is-copy-source" : ""}`}
                              type="button"
                              key={lesson.id}
                              draggable={!archiveEditing}
                              data-drop-position={lessonDragState.dropPosition}
                              style={{ "--archive-lesson-step": Math.min(lessonIndex, 4) } as CSSProperties}
                              aria-current={lesson.id === activeLessonId ? "page" : undefined}
                              onClick={() => onLessonSelect(lesson)}
                              onDragStart={(event) => beginArchiveDrag(event, lessonDragItem)}
                              onDragOver={(event) => updateArchiveDropTarget(event, lessonDragItem)}
                              onDragLeave={clearDropTarget}
                              onDrop={(event) => finishArchiveDrop(event, lessonDragItem, lessonIds)}
                              onDragEnd={endArchiveDrag}
                              onContextMenu={(event) => openContextMenuFromPointer(event, { kind: "lesson", lesson })}
                              onKeyDown={(event) => openContextMenuFromKeyboard(event, { kind: "lesson", lesson })}
                            >
                              <span className="lesson-link-title">
                                {lesson.id === activeLessonId ? activeLessonTitle.trim() || lesson.title : storedLessonTitle(lesson)}
                              </span>
                              {lesson.metadata.scheduledFor && (
                                <time className="lesson-link-date" dateTime={lesson.metadata.scheduledFor}>
                                  {formatLessonDate(lesson.metadata.scheduledFor)}
                                </time>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
        {createTarget?.kind === "subject" ? (
          <InlineArchiveCreate
            kind="subject"
            onCancel={() => setCreateTarget(null)}
            onSubmit={(label) => {
              onSubjectCreate(createTarget, label);
              setCreateTarget(null);
            }}
          />
        ) : (
          <button
            className="archive-subject-create"
            type="button"
            aria-label={t("Fach in {0} anlegen", activeClass.label)}
            onClick={(event) => beginCreate(event, { kind: "subject", classId: activeClass.id })}
          >
            <Plus aria-hidden="true" strokeWidth={1.9}/>
            <span>{t("Fach anlegen")}</span>
          </button>
        )}
        {trashItems.length > 0 && (
          <details className="archive-trash">
            <summary>
              <Trash2 aria-hidden="true" strokeWidth={1.8}/>
              <span>{t("Papierkorb")}</span>
            </summary>
            <div className="archive-trash-list">
              {[...trashItems].reverse().map((item) => (
                <div className="archive-trash-item" key={`${item.kind}-${item.id}`}>
                  <span className="archive-trash-copy">
                    <span>{item.label}</span>
                    <small>{item.kind === "class" ? t("Klasse / Kurs") : item.kind === "subject" ? t("Fach") : item.kind === "series" ? t("Reihe") : t("Unterricht")}</small>
                  </span>
                  <button
                    type="button"
                    aria-label={t("{0} wiederherstellen", item.label)}
                    title={t("Wiederherstellen")}
                    onClick={() => onTrashRestore(item)}
                  >
                    <RotateCcw aria-hidden="true" strokeWidth={1.8}/>
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </aside>
    {contextMenu && (
      <div
        className="archive-context-menu"
        role="menu"
        aria-label={t("Aktionen für {0}", contextLabel(contextMenu))}
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {contextCanPaste && (
          <button
            type="button"
            role="menuitem"
            disabled={isPasting}
            onClick={() => void pasteContextItem(contextMenu)}
          >
            <ClipboardPaste aria-hidden="true" strokeWidth={1.8}/>
            <span>{t("Hier einfügen")}</span>
          </button>
        )}
        {contextCopyItem && (
          <button
            type="button"
            role="menuitem"
            disabled={isPasting}
            onClick={() => {
              if (contextIsClipboardSource) {
                setClipboardItem(null);
                setCopyModeError(null);
                setContextMenu(null);
                return;
              }
              copyContextItem(contextMenu);
            }}
          >
            {contextIsClipboardSource
              ? <X aria-hidden="true" strokeWidth={1.8}/>
              : <Copy aria-hidden="true" strokeWidth={1.8}/>
            }
            <span>{contextIsClipboardSource ? t("Kopieren beenden") : t("Kopieren")}</span>
          </button>
        )}
        {contextCopyItem && contextDuplicatePlacement && (
          <button
            type="button"
            role="menuitem"
            disabled={isPasting}
            onClick={() => void duplicateContextItem(contextMenu)}
          >
            <CopyPlus aria-hidden="true" strokeWidth={1.8}/>
            <span>{t("Duplizieren")}</span>
          </button>
        )}
        {contextMenu.kind !== "class" && (
          <>
            <span className="archive-context-menu-divider" role="separator"/>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (contextMenu.kind === "lesson") setRenamingLessonId(contextMenu.lesson.id);
                else setRenamingFolder({ kind: contextMenu.kind, id: contextMenu.kind === "subject" ? contextMenu.subject.id : contextMenu.series.id });
                setContextMenu(null);
              }}
            >
              <Pencil aria-hidden="true" strokeWidth={1.8}/>
              <span>{t("Umbenennen")}</span>
            </button>
            <button
              className="is-destructive"
              type="button"
              role="menuitem"
              onClick={() => {
                const target = contextMenu;
                setContextMenu(null);
                onArchiveItemTrash(target);
              }}
            >
              <Trash2 aria-hidden="true" strokeWidth={1.8}/>
              <span>{t("Löschen")}</span>
            </button>
          </>
        )}
      </div>
    )}
    </>
  );
}

