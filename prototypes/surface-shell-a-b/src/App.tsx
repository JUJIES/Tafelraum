import { NativeUiLanguage } from "./NativeUiLanguage";
import { LanguageSettings } from "./LanguageSettings";
import { t, useUiLocale } from "./i18n";
import {AgentConnectionSettings} from './AgentConnectionSettings';
import { DistributionSettings } from "./DistributionSettings";
import { ArchiveNavigation, type ArchiveCreateTarget, type ArchiveMutableTarget, type ArchiveDuplicatePlacement } from "./ArchiveNavigation";
import { formatLessonDate, nextPlanningDate, lessonTitleStorageKey, storedLessonTitle, storedLessonTitleOverride } from "./lesson-labels";
import { requiresLiveSourceChangeConfirmation } from "./live/live-host";
import { useTeachingAgent } from "./teaching-agent-client";
import { teachingCatalog } from "../teaching-agent-protocol.mjs";
import { useCanvasAgent } from "./canvas-agent-client";
import { isTauri } from "@tauri-apps/api/core";
import { DesktopPersistenceGuard } from "./DesktopPersistenceGuard";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ShortcutHelp } from "./ShortcutHelp";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type CSSProperties, type DragEvent as ReactDragEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  AlertTriangle,
  Blend,
  CalendarDays,
  Check,
  Circle,
  CircleCheck,
  ChevronDown,
  CloudOff,
  Diamond,
  Download,
  FilePlus2,
  Focus,
  GripVertical,
  Link2,
  LoaderCircle,
  Maximize,
  Minus,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  RectangleHorizontal,
  Settings,
  Timer,
  Square,
  SquareSlash,
  Sun,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";
import { CanvasSurface } from "./canvas/CanvasSurface";
import { ToolInkOptions, markerColors, penColors, type ToolColor, type ToolColorId, type ToolColorAnchor } from "./ToolInkOptions";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { LiveCanvasControls, LiveClipTool, useLiveCanvas } from "./live/LiveCanvasControls";
import { useLaserTool, LaserToolButton } from "./live/LaserTool";
import { useHostPointer } from "./live/useHostPointer";
import { clearCanvasFiles, clearCanvasSnapshot, copyCanvasLessonState } from "./canvas/canvas-persistence";
import type { BasicShape, CanvasImageAsset, CanvasPort, CanvasTool, CanvasToolContext, ShapeFillMode } from "./canvas/canvas-port";
import {
  defaultToolStrokeSizeId,
  toolStrokeWidth,
  type InkTool,
  type ToolStrokeSizeId,
} from "./canvas/tool-stroke-widths";
import { emptyCanvasMaterialUsage, type CanvasMaterialUsage } from "./canvas/material-usage";
import { shapeColorOptions, type ShapeColorId, type ShapeColorOption } from "./canvas/shape-colors";
import { hasCanvasClipboardData, imageFilesFromClipboard, webLinkFromClipboard, youtubeLinkFromClipboard } from "./clipboard-import";
import { internalSceneForPastedImage } from "./canvas/internal-image-clipboard";
import { LessonMaterialPanel } from "./LessonMaterialPanel";
import { MobileCaptureControls, useMobileCapture } from "./MobileCaptureControls";
import { CourseStudentsEditor, StudentNotes, type NotesAnchor } from "./StudentNotes";
import { flushNotes, notesStatus, subscribeNotes } from "./student-notes";
import { DesktopUpdateMenu, useDesktopUpdate } from "./DesktopUpdateMenu";
import {
  buildLessonClasses,
  copyArchiveItem,
  defaultLesson,
  findLesson,
  loadLocalLessonCatalog,
  mergeLocalLessonCatalog,
  moveArchiveItemToTrash,
  classTrashUnavailableReason,
  reorderSiblingIds,
  reconcileFileAndBrowserCatalog,
  restoreArchiveItem,
  saveLocalLessonCatalog,
  withCatalogOrder,
  type ArchiveClipboardItem,
  type ArchiveClassDefinition,
  type ArchivePasteTarget,
  type ArchiveTrashItem,
  type CatalogOrderLevel,
  type LessonClass,
  type LessonSeries,
  type LessonSubject,
  type LocalLessonCatalog,
  type TestLesson,
} from "./lesson-catalog";
import {
  loadFileArchiveProfile,
  saveFileArchiveClass,
  saveFileArchiveCatalog,
  subscribeArchiveFileState,
  flushArchiveWrites,
  type ArchiveFileState,
} from "./archive-file-persistence";
import {
  loadMaterialRemovals,
  removeLessonMaterial,
  lessonMaterialDisplayName,
  lessonMaterialDragMime,
  lessonMaterialToFile,
  parseLessonMaterialDragPayload,
  saveLessonMaterialLink,
  uploadLessonMaterial,
  type LessonMaterial,
} from "./lesson-materials";
import { materialFilesToCanvasImages } from "./material-import";
import { nearestDock, type ToolbarPosition } from "./toolbar-docking";
import { toolbarOverflowState, toolbarScrollDistance, type ToolbarOverflowState } from "./toolbar-overflow";
import { desktopClipShortcutDecision, desktopFullscreenShortcutDecision, desktopSelectionRotationShortcutDecision, desktopToolbarShortcutDecision, desktopToolShortcutDecision, desktopToolShortcuts } from "./tool-shortcuts";
import { planWorkspaceChromeLayout, type WorkspaceChromeLayout } from "./workspace-chrome-layout";
import { ColoredPencilIcon } from "./icons/ColoredPencilIcon";
import {
  FluentHighlighterIcon,
  FluentShapeIcon,
  FluentToolbarIcon,
  type FluentToolbarIconName,
} from "./icons/FluentToolbarIcon";
import type { TimerRuntime } from "./widgets/timer";
import { embeddedApps } from "./embedded-apps";
import {
  canvasBackgrounds,
  isTheme,
  readThemeVariants,
  themeVariantOptions,
  themeVariantStorageKey,
  type Theme,
  type ThemeVariant,
  type ThemeVariants,
} from "./theme-preferences";

type ToolId = CanvasTool;
type DragPoint = { x: number; y: number; pointerId: number; dock: ToolbarPosition };
type InsertMenuAnchor = { x: number; y: number };
type ShapeToolAppearance = { color: string; fillMode: ShapeFillMode; shape: BasicShape };
type PendingCanvasLink = {
  anchor: { x: number; y: number };
  label: string;
  point: { clientX: number; clientY: number };
  url: string;
};

type IconName =
  | "undo"
  | "redo"
  | "material"
  | "fit"
  | "fullscreen"
  | BasicShape
  | "sun"
  | "moon"
  | "archiveOpen"
  | "archiveClose"
  | "calendar"
  | "settings";

type ArchiveSaveFeedback = Exclude<ArchiveFileState, "saved"> | "recovered";

const tools: Array<{ id: ToolId; label: string }> = [
  { id: "hand", label: "Hand" },
  { id: "selection", label: "Auswahl" },
  { id: "pen", label: "Stift" },
  { id: "marker", label: "Marker" },
  { id: "eraser", label: "Radierer" },
  { id: "text", label: "Text" },
  { id: "shape", label: "Form" },
];

function isToolShortcutTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], dialog[open], .student-notes-popup"));
}

const icons: Record<IconName, LucideIcon> = {
  undo: Undo2,
  redo: Redo2,
  material: FilePlus2,
  fit: Focus,
  fullscreen: Maximize,
  rectangle: RectangleHorizontal,
  ellipse: Circle,
  diamond: Diamond,
  sun: Sun,
  moon: Moon,
  archiveOpen: PanelLeftOpen,
  archiveClose: PanelLeftClose,
  calendar: CalendarDays,
  settings: Settings,
};

const validToolbar = (value: string | null): value is ToolbarPosition => value === "top" || value === "right" || value === "bottom" || value === "left";

function initialTheme(): Theme {
  const queryValue = new URLSearchParams(window.location.search).get("theme");
  if (isTheme(queryValue)) return queryValue;

  const storedValue = window.localStorage.getItem("surface-lab-theme");
  if (isTheme(storedValue)) return storedValue;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialToolbar(): ToolbarPosition {
  const queryValue = new URLSearchParams(window.location.search).get("toolbar");
  if (validToolbar(queryValue)) return queryValue;

  const storedValue = window.localStorage.getItem("surface-lab-toolbar");
  return validToolbar(storedValue) ? storedValue : "bottom";
}

const activeLessonStorageKey = "surface-lab-active-lesson";
const archiveStateStorageKey = "surface-lab-archive-state";
const archiveDirtyStorageKey = "surface-lab-local-archive-dirty-v1";
function applyStoredLessonTitleOverlays(catalog: LocalLessonCatalog, classes: ArchiveClassDefinition[]) {
  const visibleClasses = buildLessonClasses(catalog, classes);
  const titleOverlayCatalog: LocalLessonCatalog = {
    version: 1,
    subjects: [],
    series: [],
    lessons: visibleClasses.flatMap((lessonClass) => lessonClass.subjects.flatMap((subject) => subject.series.flatMap((series) => (
      series.lessons.flatMap((lesson) => {
        const title = storedLessonTitleOverride(lesson);
        return title ? [{ ...lesson, title }] : [];
      })
    )))),
    hiddenLessonIds: [],
    trash: [],
    subjectOrderByClassId: {},
    seriesOrderBySubjectId: {},
    lessonOrderBySeriesId: {},
  };
  return mergeLocalLessonCatalog(catalog, titleOverlayCatalog);
}

const archiveSaveFeedbackCopy: Record<ArchiveSaveFeedback, string> = {
  checking: "Archiv wird geprüft …",
  saving: "Wird gespeichert …",
  "browser-only": "Nur im Browser gespeichert",
  error: "Änderungen nicht gespeichert",
  recovered: "Wieder gespeichert",
};

const archiveSaveFeedbackIcon: Record<ArchiveSaveFeedback, LucideIcon> = {
  checking: LoaderCircle,
  saving: LoaderCircle,
  "browser-only": CloudOff,
  error: AlertTriangle,
  recovered: CircleCheck,
};

function initialActiveLesson(classes: LessonClass[]) {
  const storedId = window.localStorage.getItem(activeLessonStorageKey);
  return storedId ? findLesson(storedId, classes) : defaultLesson;
}

function initialArchiveOpen() {
  return window.localStorage.getItem(archiveStateStorageKey) !== "closed";
}

function Icon({ name }: { name: IconName }) {
  const LucideIcon = icons[name];
  return <LucideIcon aria-hidden="true" strokeWidth={1.8} />;
}

function ToolInkIcon({ name }: { name: InkTool }) {
  if (name === "pen") {
    return (
      <span className="tool-ink-icon is-pen" aria-hidden="true">
        <ColoredPencilIcon/>
      </span>
    );
  }

  return (
    <span className={`tool-ink-icon is-${name}`} aria-hidden="true">
      <FluentHighlighterIcon/>
    </span>
  );
}

function ShapeToolIcon({ color, fillMode, shape }: ShapeToolAppearance) {
  return <FluentShapeIcon color={color} fillMode={fillMode} shape={shape}/>;
}

function ToolbarToolIcon({ id }: { id: Exclude<ToolId, InkTool | "shape"> }) {
  return <FluentToolbarIcon name={id}/>;
}

function ToolButton({ id, label, active, color, optionsOpen, shapeAppearance, onSelect }: { id: ToolId; label: string; active: boolean; color?: string; optionsOpen?: boolean; shapeAppearance?: ShapeToolAppearance; onSelect: (id: ToolId, trigger: HTMLButtonElement) => void }) {
  useUiLocale();
  const style = color ? { "--tool-color": color } as CSSProperties : undefined;
  const shortcut = desktopToolShortcuts[id];
  return (
    <button
      className={`tool-button${color ? " has-tool-color" : ""}`}
      type="button"
      aria-expanded={color ? optionsOpen : undefined}
      aria-haspopup={color ? "dialog" : undefined}
      aria-keyshortcuts={shortcut?.aria}
      aria-label={t(label)}
      aria-pressed={active}
      data-color-tool={color ? id : undefined}
      data-tool-color={color === "#111111" ? "black" : undefined}
      style={style}
      title={shortcut ? `${t(label)} (${shortcut.display})` : t(label)}
      onClick={(event) => onSelect(id, event.currentTarget)}
    >
      {color && (id === "pen" || id === "marker")
        ? <ToolInkIcon name={id}/>
        : shapeAppearance
          ? <ShapeToolIcon {...shapeAppearance}/>
          : <ToolbarToolIcon id={id as Exclude<ToolId, InkTool | "shape">}/>
      }
      <span className="tool-button-label">{t(label)}</span>
    </button>
  );
}

function ActionButton({ icon, fluentIcon, label, shortLabel, shortcut, iconOnly = false, disabled = false, expanded, onClick }: { icon: IconName; fluentIcon?: FluentToolbarIconName; label: string; shortLabel?: string; shortcut?: { aria: string; display: string }; iconOnly?: boolean; disabled?: boolean; expanded?: boolean; onClick?: () => void }) {
  useUiLocale();
  return (
    <button className={`action-button${iconOnly ? " icon-only" : ""}`} type="button" aria-expanded={expanded} aria-keyshortcuts={shortcut?.aria} aria-label={t(label)} title={`${t(label)}${shortcut ? ` (${shortcut.display})` : ""}`} disabled={disabled} onClick={onClick}>
      {fluentIcon ? <FluentToolbarIcon name={fluentIcon}/> : <Icon name={icon}/>} 
      {!iconOnly && <span>{t(shortLabel ?? label)}</span>}
    </button>
  );
}

function SettingsMenu({ onTheme, onThemeVariant, theme, themeVariant, presenting }: {
  presenting: boolean;
  onTheme(theme: Theme): void;
  onThemeVariant(variant: ThemeVariant): void;
  theme: Theme;
  themeVariant: ThemeVariant;
}) {
  useUiLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const update = useDesktopUpdate(presenting);
  const availableUpdate = update.updatesEnabled ? update.overview.availableVersion : null;
  useEffect(() => { if (update.open) setOpen(false); }, [update.open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !rootRef.current?.querySelector("dialog[open]")) setOpen(false);
    };
    window.addEventListener("pointerdown", closeOutside, true);
    window.addEventListener("keydown", closeWithEscape, true);
    return () => {
      window.removeEventListener("pointerdown", closeOutside, true);
      window.removeEventListener("keydown", closeWithEscape, true);
    };
  }, [open]);

  return (
    <div className="settings-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        className="action-button icon-only settings-trigger"
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("Einstellungen")}
        title={availableUpdate ? `${t("Einstellungen")} · ${t("Update {0} verfügbar", availableUpdate)}` : t("Einstellungen")}
        aria-description={availableUpdate ? t("Update {0} verfügbar", availableUpdate) : undefined}
        onClick={() => { update.close(); setOpen((current) => !current); }}
      >
        <Icon name="settings" />
        {availableUpdate && <span className="settings-update-dot" aria-hidden="true"/>}
      </button>
      {open && (
        <div className="settings-popover" role="group" aria-label={t("Einstellungen")}>
          <section className="settings-section" aria-labelledby="settings-appearance-title">
            <h2 id="settings-appearance-title">{t("Darstellung")}</h2>
            <ThemeSwitch theme={theme} onTheme={onTheme}/>
            <label className="settings-select-row settings-theme-variant">
              <span>{t("Design")}</span>
              <span className="settings-select-control">
                <select
                  aria-label={t(theme === "light" ? "Helles Design" : "Dunkles Design")}
                  value={themeVariant}
                  onChange={(event) => onThemeVariant(event.target.value as ThemeVariant)}
                >
                  {themeVariantOptions[theme].map((option) => (
                    <option key={option.value} value={option.value}>{t(option.label)}</option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true"/>
              </span>
            </label>
            <LanguageSettings/>
          </section>
          <section className="settings-section" aria-labelledby="settings-connections-title">
            <h2 id="settings-connections-title">{t("Verbindungen")}</h2>
            <AgentConnectionSettings/>
            <DistributionSettings/>
          </section>
          <div className="settings-section">
            <ShortcutHelp/>
            <button className="settings-option settings-version" type="button" aria-haspopup="dialog"
              onClick={() => { setOpen(false); update.show(); }}>
              <span>{t(update.updatesEnabled ? "Version und Updates" : "Version")}</span>
              {availableUpdate && <Download size={18} aria-hidden="true"/>}
            </button>
          </div>
        </div>
      )}
      <DesktopUpdateMenu update={update} returnFocusRef={triggerRef}/>
    </div>
  );
}

function ShapeOptions({ activeShape, color, fillMode, onColorSelect, onFillSelect, onSelect }: {
  activeShape: BasicShape;
  color: ShapeColorId;
  fillMode: ShapeFillMode;
  onColorSelect: (color: ShapeColorOption) => void;
  onFillSelect: (fillMode: ShapeFillMode) => void;
  onSelect: (shape: BasicShape) => void;
}) {
  useUiLocale();
  const shapes: Array<{ id: BasicShape; label: string }> = [
    { id: "rectangle", label: t("Rechteck") },
    { id: "ellipse", label: t("Ellipse") },
    { id: "diamond", label: t("Raute") },
  ];

  return (
    <div className="shape-options" role="group" aria-label={t("Grundformen")}>
      {shapes.map((shape) => (
        <button
          className="shape-option"
          type="button"
          key={shape.id}
          aria-label={t(shape.label)}
          aria-pressed={activeShape === shape.id}
          title={t(shape.label)}
          onClick={() => onSelect(shape.id)}
        >
          <Icon name={shape.id}/>
        </button>
      ))}
      <span className="shape-options-divider" aria-hidden="true"/>
      <button
        className="shape-option"
        type="button"
        aria-label={t("Form ohne Füllung")}
        aria-pressed={fillMode === "empty"}
        title={t("Ohne Füllung")}
        onClick={() => onFillSelect("empty")}
      >
        <SquareSlash aria-hidden="true" strokeWidth={1.9}/>
      </button>
      <button
        className="shape-option is-translucent"
        type="button"
        aria-label={t("Form transparent gefüllt")}
        aria-pressed={fillMode === "translucent"}
        title={t("Transparent")}
        onClick={() => onFillSelect("translucent")}
      >
        <Blend aria-hidden="true" strokeWidth={1.9}/>
      </button>
      <button
        className="shape-option is-solid"
        type="button"
        aria-label={t("Form deckend gefüllt")}
        aria-pressed={fillMode === "solid"}
        title={t("Deckend")}
        onClick={() => onFillSelect("solid")}
      >
        <Square aria-hidden="true" strokeWidth={1.9}/>
      </button>
      <span className="shape-options-divider" aria-hidden="true"/>
      <div className="shape-color-options" role="radiogroup" aria-label={t("Formfarbe")}>
        {shapeColorOptions.map((option) => (
          <button
            className="tool-color-option"
            type="button"
            key={option.id}
            role="radio"
            aria-label={t("Formfarbe: {0}", t(option.label))}
            aria-checked={color === option.id}
            title={t(option.label)}
            style={{ "--swatch-color": option.value } as CSSProperties}
            onClick={() => onColorSelect(option)}
          >
            {color === option.id && <Check aria-hidden="true" strokeWidth={2.6}/>} 
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemeSwitch({ theme, onTheme }: { theme: Theme; onTheme: (theme: Theme) => void }) {
  useUiLocale();
  const isDark = theme === "dark";
  const switchLabel = isDark ? t("Helles Design aktivieren") : t("Dunkles Design aktivieren");

  return (
    <button
      className="settings-option theme-switch"
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t(switchLabel)}
      title={t(switchLabel)}
      onClick={() => onTheme(isDark ? "light" : "dark")}
    >
      <span>{t("Hell / Dunkel")}</span>
      <span className="theme-switch-control" aria-hidden="true">
        <span className="theme-switch-icon theme-switch-sun"><Icon name="sun"/></span>
        <span className="theme-switch-icon theme-switch-moon"><Icon name="moon"/></span>
        <span className="theme-switch-thumb"/>
      </span>
    </button>
  );
}

export function App() {
  useUiLocale();
  // Remember the requested lesson until file-defined classes have loaded.
  const initialStoredLessonId = useRef(window.localStorage.getItem(activeLessonStorageKey));
  const [localLessonCatalog, setLocalLessonCatalog] = useState<LocalLessonCatalog>(loadLocalLessonCatalog);
  const localLessonCatalogRef = useRef(localLessonCatalog);
  const [archiveClassDefinitions, setArchiveClassDefinitions] = useState<ArchiveClassDefinition[] | null>(null);
  const lessonClasses = useMemo(
    () => buildLessonClasses(localLessonCatalog, archiveClassDefinitions ?? undefined),
    [archiveClassDefinitions, localLessonCatalog],
  );
  const [activeLesson, setActiveLesson] = useState(() => initialActiveLesson(lessonClasses));
  const [activeClassId, setActiveClassId] = useState(activeLesson.classId);
  const [archiveOpen, setArchiveOpen] = useState(initialArchiveOpen);
  const archiveToggleButtonRef = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [themeVariants, setThemeVariants] = useState<ThemeVariants>(() => (
    readThemeVariants(window.localStorage.getItem(themeVariantStorageKey))
  ));
  const [toolbar, setToolbar] = useState<ToolbarPosition>(initialToolbar);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [toolbarHasToggled, setToolbarHasToggled] = useState(false);
  const [lessonTitle, setLessonTitle] = useState(() => storedLessonTitle(activeLesson));
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const dragPointRef = useRef<DragPoint | null>(null);

  const toggleArchive = () => setArchiveOpen((isOpen) => !isOpen);
  const [activeTool, setActiveTool] = useState<ToolId>("hand");
  const [temporaryHandActive, setTemporaryHandActive] = useState(false);
  const [activeShape, setActiveShape] = useState<BasicShape>("rectangle");
  const [shapeFill, setShapeFill] = useState<ShapeFillMode>("empty");
  const [shapeColorId, setShapeColorId] = useState<ShapeColorId>("blue");
  const [penColorId, setPenColorId] = useState<ToolColorId>("neutral");
  const [markerColorId, setMarkerColorId] = useState<ToolColorId>("yellow");
  const [penStrokeSizeId, setPenStrokeSizeId] = useState<ToolStrokeSizeId>(defaultToolStrokeSizeId);
  const [markerStrokeSizeId, setMarkerStrokeSizeId] = useState<ToolStrokeSizeId>(defaultToolStrokeSizeId);
  const [openColorTool, setOpenColorTool] = useState<InkTool | null>(null);
  const [toolColorAnchor, setToolColorAnchor] = useState<ToolColorAnchor | null>(null);
  const [canvasPort, setCanvasPort] = useState<CanvasPort | null>(null);
  useCanvasAgent(canvasPort, activeLesson.id, activeLesson.title);
  const [liveApi, setLiveApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const liveCanvas = useLiveCanvas(liveApi, activeLesson.id);
  const onTimerRuntimeReady = useCallback((runtime: TimerRuntime | null) => { liveCanvas.room.attachTimers(runtime); liveCanvas.host.attachTimers(runtime); }, [liveCanvas.room, liveCanvas.host]);
  const onPresentationInkPreviewChange=useCallback((elementId:string|null)=>{
    liveCanvas.host.setInkPreview(elementId);
    liveCanvas.room.setInkPreview(elementId);
  },[liveCanvas.host,liveCanvas.room]);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isImportingMaterial, setIsImportingMaterial] = useState(false);
  const [isConvertingWord, setIsConvertingWord] = useState(false);
  const [isMaterialDragActive, setIsMaterialDragActive] = useState(false);
  const [materialPanelOpen, setMaterialPanelOpen] = useState(false);
  const [notesAnchor, setNotesAnchor] = useState<NotesAnchor | null>(null);
  const [studentsEditor, setStudentsEditor] = useState<{ classId: string; anchor: NotesAnchor } | null>(null);
  const [privateNotesStatus, setPrivateNotesStatus] = useState(notesStatus);
  useEffect(() => subscribeNotes(() => setPrivateNotesStatus(notesStatus())), []);
  useEffect(() => { setNotesAnchor(null); setStudentsEditor(null); }, [activeLesson.id]);
  const [insertMenu, setInsertMenu] = useState<"apps" | "widgets" | null>(null);
  const [insertMenuAnchor, setInsertMenuAnchor] = useState<InsertMenuAnchor | null>(null);
  const [toolbarOverflow, setToolbarOverflow] = useState<ToolbarOverflowState>({ backward: false, forward: false });
  const [materialPanelPresent, setMaterialPanelPresent] = useState(false);
  const [materialRefreshRevision, setMaterialRefreshRevision] = useState(0);
  const mobileCapture = useMobileCapture();
  const [mobileCaptureOpen, setMobileCaptureOpen] = useState(false);
  useEffect(() => {
    if (mobileCapture.state.revision > 0 && mobileCapture.state.lastReceivedLessonId === activeLesson.id) {
      setMaterialRefreshRevision(revision => revision + 1);
    }
  }, [mobileCapture.state.revision, mobileCapture.state.lastReceivedLessonId, activeLesson.id]);
  const [focusedMaterialUsage, setFocusedMaterialUsage] = useState<CanvasMaterialUsage>(emptyCanvasMaterialUsage);
  const [canvasMaterialUsage, setCanvasMaterialUsage] = useState<CanvasMaterialUsage>(emptyCanvasMaterialUsage);
  const [materialImportError, setMaterialImportError] = useState<string | null>(null);
  const [pendingMaterialDuplicate, setPendingMaterialDuplicate] = useState<{
    lessonId: string; sourceLessonId: string; material: LessonMaterial; archiveMaterialPath: string;
    point: { clientX: number; clientY: number };
  } | null>(null);
  const duplicateDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { setPendingMaterialDuplicate(null); }, [activeLesson.id]);
  useEffect(() => {
    if (pendingMaterialDuplicate) duplicateDialog.current?.showModal();
    else duplicateDialog.current?.close();
  }, [pendingMaterialDuplicate]);
  const [pendingCanvasLink, setPendingCanvasLink] = useState<PendingCanvasLink | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [archiveFileState, setArchiveFileState] = useState<ArchiveFileState>("checking");
  const [archiveSaveFeedback, setArchiveSaveFeedback] = useState<ArchiveSaveFeedback | null>(null);
  const archiveSaveFailurePendingRef = useRef(false);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);
  const toolbarDragHandleRef = useRef<HTMLButtonElement>(null);
  const toolbarRecallRef = useRef<HTMLButtonElement>(null);
  const toolbarItemsRef = useRef<HTMLDivElement>(null);
  const appsMenuRef = useRef<HTMLDivElement>(null);
  const widgetsMenuRef = useRef<HTMLDivElement>(null);
  const insertPopoverRef = useRef<HTMLDivElement>(null);
  const historyActionsRef = useRef<HTMLDivElement>(null);
  const workspaceChromeMotionRef = useRef({ archiveOpen, toolbar, wasDragging: false });
  const [workspaceChromeLayout, setWorkspaceChromeLayout] = useState<WorkspaceChromeLayout | null>(null);
  const lastCanvasPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const materialDragDepth = useRef(0);
  const showDevControls = useMemo(() => new URLSearchParams(window.location.search).get("dev") === "1", []);
  const currentPenColors = penColors[theme];
  const themeVariant = themeVariants[theme];
  const canvasBackgroundColor = canvasBackgrounds[theme][themeVariant];
  const penColor = currentPenColors.find((color) => color.id === penColorId) ?? currentPenColors[0];
  const markerColor = markerColors.find((color) => color.id === markerColorId) ?? markerColors[0];
  const shapeColor = shapeColorOptions.find((color) => color.id === shapeColorId) ?? shapeColorOptions[0];
  const laser = useLaserTool(liveApi, liveCanvas.creatingClip, temporaryHandActive);
  useEffect(()=>liveCanvas.room.attachPointer(laser.channel),[liveCanvas.room,laser.channel]);
  useHostPointer(liveCanvas.host, liveApi, laser.active, "laser", "#08a9da", laser.style, laser.channel);
  const toolContext = useMemo<CanvasToolContext>(() => ({
    markerColor: markerColor.value,
    markerStrokeWidth: toolStrokeWidth("marker", markerStrokeSizeId),
    penColor: penColor.value,
    penStrokeWidth: toolStrokeWidth("pen", penStrokeSizeId),
    shape: activeShape,
    shapeColor: shapeColor.value,
    shapeFill,
    theme,
  }), [activeShape, markerColor.value, markerStrokeSizeId, penColor.value, penStrokeSizeId, shapeColor.value, shapeFill, theme]);

  const isToolbarDragging = dragPoint !== null;

  useEffect(() => {
    if (!insertMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node
        && !appsMenuRef.current?.contains(event.target)
        && !widgetsMenuRef.current?.contains(event.target)
        && !insertPopoverRef.current?.contains(event.target)
      ) setInsertMenu(null);
    };
    const closeWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setInsertMenu(null);
    };
    window.addEventListener("pointerdown", closeOutside, true);
    window.addEventListener("keydown", closeWithEscape, true);
    return () => {
      window.removeEventListener("pointerdown", closeOutside, true);
      window.removeEventListener("keydown", closeWithEscape, true);
    };
  }, [insertMenu]);

  const updateToolbarOverflow = useCallback(() => {
    const node = toolbarItemsRef.current;
    if (!node) return;
    const vertical = toolbar === "left" || toolbar === "right";
    const next = toolbarOverflowState({
      clientSize: vertical ? node.clientHeight : node.clientWidth,
      scrollOffset: vertical ? node.scrollTop : node.scrollLeft,
      scrollSize: vertical ? node.scrollHeight : node.scrollWidth,
    });
    setToolbarOverflow((current) => (
      current.backward === next.backward && current.forward === next.forward ? current : next
    ));
  }, [toolbar]);

  useLayoutEffect(() => {
    const node = toolbarItemsRef.current;
    const toolbarNode = toolbarRef.current;
    if (!node || !toolbarNode) return;
    node.scrollTo({ left: 0, top: 0 });
    let frame = window.requestAnimationFrame(updateToolbarOverflow);
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateToolbarOverflow);
    });
    observer.observe(node);
    observer.observe(toolbarNode);
    const handleScroll = () => {
      setInsertMenu(null);
      updateToolbarOverflow();
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateToolbarOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateToolbarOverflow);
    };
  }, [toolbar, updateToolbarOverflow]);

  useEffect(() => {
    if (materialPanelOpen) {
      setMaterialPanelPresent(true);
      return;
    }
    if (!materialPanelPresent) return;
    const exitDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    const timer = window.setTimeout(() => setMaterialPanelPresent(false), exitDelay);
    return () => window.clearTimeout(timer);
  }, [materialPanelOpen, materialPanelPresent]);

  useLayoutEffect(() => {
    const previousMotion = workspaceChromeMotionRef.current;
    if (isToolbarDragging) {
      previousMotion.wasDragging = true;
      return;
    }

    const workspace = workspaceRef.current;
    const toolbarNode = toolbarRef.current;
    const historyNode = historyActionsRef.current;
    if (!workspace || !toolbarNode || !historyNode) return;
    let waitsForSettledToolbar = previousMotion.wasDragging
      || previousMotion.toolbar !== toolbar
      || previousMotion.archiveOpen !== archiveOpen;
    workspaceChromeMotionRef.current = { archiveOpen, toolbar, wasDragging: false };

    const updateChromeLayout = (force = false) => {
      if (waitsForSettledToolbar && !force) return;
      const workspaceRect = workspace.getBoundingClientRect();
      const toolbarRect = toolbarNode.getBoundingClientRect();
      const historyRect = historyNode.getBoundingClientRect();
      const materialPanel = workspace.querySelector<HTMLElement>(".lesson-material-panel");
      const nextLayout = planWorkspaceChromeLayout({
        historyHeight: historyRect.height,
        historyWidth: historyRect.width,
        materialOpen: materialPanelPresent,
        materialWidth: materialPanel?.getBoundingClientRect().width ?? 324,
        toolbarRect: toolbarVisible ? {
          x: toolbarRect.left - workspaceRect.left,
          y: toolbarRect.top - workspaceRect.top,
          width: toolbarRect.width,
          height: toolbarRect.height,
        } : { x: 0, y: 0, width: 0, height: 0 },
        toolbarSide: toolbar,
        workspaceHeight: workspaceRect.height,
        workspaceWidth: workspaceRect.width,
      });
      setWorkspaceChromeLayout((current) => (
        current
        && current.historyLeft === nextLayout.historyLeft
        && current.historyTop === nextLayout.historyTop
        && current.materialHeight === nextLayout.materialHeight
        && current.materialRight === nextLayout.materialRight
        && current.materialTop === nextLayout.materialTop
          ? current
          : nextLayout
      ));
    };

    const finishToolbarSettlement = () => {
      if (!waitsForSettledToolbar) return;
      waitsForSettledToolbar = false;
      updateChromeLayout(true);
    };
    const handleToolbarTransitionEnd = (event: TransitionEvent) => {
      if (
        event.target !== toolbarNode
        || !["top", "right", "bottom", "left", "width", "height"].includes(event.propertyName)
      ) return;
      finishToolbarSettlement();
    };

    let frame = 0;
    let settlementFallback = 0;
    if (waitsForSettledToolbar) {
      settlementFallback = window.setTimeout(finishToolbarSettlement, 240);
    } else {
      updateChromeLayout();
      frame = window.requestAnimationFrame(() => updateChromeLayout());
    }
    const handleChromeResize = () => updateChromeLayout();
    const resizeObserver = new ResizeObserver(handleChromeResize);
    resizeObserver.observe(workspace);
    resizeObserver.observe(toolbarNode);
    resizeObserver.observe(historyNode);
    toolbarNode.addEventListener("transitionend", handleToolbarTransitionEnd);
    window.addEventListener("resize", handleChromeResize);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (settlementFallback) window.clearTimeout(settlementFallback);
      resizeObserver.disconnect();
      toolbarNode.removeEventListener("transitionend", handleToolbarTransitionEnd);
      window.removeEventListener("resize", handleChromeResize);
    };
  }, [archiveOpen, isToolbarDragging, materialPanelPresent, toolbar, toolbarVisible]);

  const toggleToolbarVisibility = () => {
    const focusIsInToolbar = toolbarRef.current?.contains(document.activeElement);
    const focusIsOnRecall = document.activeElement === toolbarRecallRef.current;
    setToolbarVisible((current) => !current);
    setToolbarHasToggled(true);
    setInsertMenu(null);
    setOpenColorTool(null);
    if (focusIsInToolbar) window.requestAnimationFrame(() => toolbarRecallRef.current?.focus());
    if (focusIsOnRecall) window.requestAnimationFrame(() => toolbarDragHandleRef.current?.focus());
  };

  const toggleFullscreen = () => {
    if (isTauri()) {
      const window = getCurrentWindow();
      void window.isFullscreen().then(value => window.setFullscreen(!value)).then(() => window.isFullscreen()).then(setIsFullscreen)
        .catch(error => console.error(t("Vollbildmodus konnte nicht umgeschaltet werden."), error));
      return;
    }
    const fullscreenChange = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    void fullscreenChange.catch((error: unknown) => {
      console.error(t("Vollbildmodus konnte nicht umgeschaltet werden."), error);
    });
  };

  useEffect(() => {
    const handleDesktopShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat
        && /^[1-9]$/.test(event.key) && !isToolShortcutTextTarget(event.target)
        && !isToolShortcutTextTarget(document.activeElement) && !document.querySelector("dialog[open]")
        && liveCanvas.clipControls.addSelected.current?.(Number(event.key))) {
        event.preventDefault(); event.stopImmediatePropagation(); return;
      }
      if (
        event.altKey
        || event.ctrlKey
        || event.metaKey
        || isToolShortcutTextTarget(event.target)
        || isToolShortcutTextTarget(document.activeElement)
      ) return;

      const toolbarShortcut = desktopToolbarShortcutDecision({
        code: event.code,
        key: event.key,
        repeat: event.repeat,
      });
      if (toolbarShortcut.suppress && !document.querySelector("dialog[open]") && !isToolbarDragging) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (toolbarShortcut.toggle) toggleToolbarVisibility();
        return;
      }

      if (!event.shiftKey && !event.repeat && /^[1-9]$/.test(event.key)
        && !document.querySelector("dialog[open]") && liveCanvas.clipControls.shortcut.current?.(Number(event.key))) {
        event.preventDefault(); event.stopImmediatePropagation(); return;
      }
      const clipShortcut = desktopClipShortcutDecision({
        code: event.code,
        repeat: event.repeat,
        shiftKey: event.shiftKey,
      });
      if (clipShortcut.suppress && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (clipShortcut.select && liveCanvas.ready) {
          laser.cancel();
          setOpenColorTool(null);
          liveCanvas.setCreatingClip(true);
        }
        return;
      }
      const fullscreenShortcut = desktopFullscreenShortcutDecision({
        code: event.code,
        repeat: event.repeat,
        shiftKey: event.shiftKey,
      });
      if (fullscreenShortcut.suppress) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (fullscreenShortcut.toggle) toggleFullscreen();
        return;
      }

      const rotationShortcut = desktopSelectionRotationShortcutDecision({
        code: event.code,
        shiftKey: event.shiftKey,
      });
      if (rotationShortcut.suppress) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (rotationShortcut.direction) canvasPort?.rotateSelection(rotationShortcut.direction);
        return;
      }

      const shortcut = desktopToolShortcutDecision({
        code: event.code,
        repeat: event.repeat,
        shiftKey: event.shiftKey,
      });
      if (!shortcut.suppress) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (!shortcut.tool) return;

      laser.cancel();
      liveCanvas.setCreatingClip(false);
      setActiveTool(shortcut.tool);
      setOpenColorTool(null);
      canvasPort?.selectTool(shortcut.tool, toolContext);
    };

    window.addEventListener("keydown", handleDesktopShortcut, true);
    return () => window.removeEventListener("keydown", handleDesktopShortcut, true);
  }, [canvasPort, toolContext, isToolbarDragging, toolbarVisible]);

  const persistLessonCatalog = (nextCatalog: LocalLessonCatalog) => {
    const dirtyRevision = crypto.randomUUID();
    localLessonCatalogRef.current = nextCatalog;
    saveLocalLessonCatalog(nextCatalog);
    window.localStorage.setItem(archiveDirtyStorageKey, dirtyRevision);
    setLocalLessonCatalog(nextCatalog);
    void saveFileArchiveCatalog(nextCatalog)
      .then((savedCatalog) => {
        if (savedCatalog && window.localStorage.getItem(archiveDirtyStorageKey) === dirtyRevision) {
          window.localStorage.removeItem(archiveDirtyStorageKey);
        }
      })
      .catch((error: unknown) => {
        console.error(t("Unterrichtsarchiv konnte nicht gespeichert werden."), error);
      });
  };

  const persistLessonTitle = (lesson: TestLesson, title: string) => {
    const replacement: TestLesson = { ...lesson, title, metadata: { ...lesson.metadata }, seed: { ...lesson.seed } };
    const exists = localLessonCatalogRef.current.lessons.some((candidate) => candidate.id === lesson.id);
    const nextCatalog: LocalLessonCatalog = {
      ...localLessonCatalogRef.current,
      lessons: exists
        ? localLessonCatalogRef.current.lessons.map((candidate) => candidate.id === lesson.id ? replacement : candidate)
        : [...localLessonCatalogRef.current.lessons, replacement],
    };
    window.localStorage.setItem(lessonTitleStorageKey(lesson.id), title);
    persistLessonCatalog(nextCatalog);
    if (lesson.id === activeLesson.id) {
      setActiveLesson(replacement);
      setLessonTitle(title);
    }
  };

  useEffect(() => subscribeArchiveFileState(setArchiveFileState), []);

  useEffect(() => {
    let timer: number | undefined;
    if (archiveFileState === "error" || archiveFileState === "browser-only") {
      archiveSaveFailurePendingRef.current = true;
      setArchiveSaveFeedback(archiveFileState);
    } else if (archiveFileState === "saved") {
      if (archiveSaveFailurePendingRef.current) {
        archiveSaveFailurePendingRef.current = false;
        setArchiveSaveFeedback("recovered");
        timer = window.setTimeout(() => setArchiveSaveFeedback(null), 2400);
      } else {
        setArchiveSaveFeedback(null);
      }
    } else if (!archiveSaveFailurePendingRef.current) {
      // Fast archive checks and writes are the normal case and stay silent.
      timer = window.setTimeout(() => setArchiveSaveFeedback(archiveFileState), 1000);
    }
    // While retrying after a failure, retain the warning until a write is
    // actually confirmed instead of implying safety during the attempt.
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [archiveFileState]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fileProfile = await loadFileArchiveProfile();
      if (cancelled || !fileProfile) return;
      const fileCatalog = fileProfile.catalog;
      const dirtyRevision = window.localStorage.getItem(archiveDirtyStorageKey);
      const browserCatalog = localLessonCatalogRef.current;
      const baseCatalog = reconcileFileAndBrowserCatalog(fileCatalog, browserCatalog, Boolean(dirtyRevision));
      const mergedCatalog = applyStoredLessonTitleOverlays(baseCatalog, fileProfile.classes);
      localLessonCatalogRef.current = mergedCatalog;
      saveLocalLessonCatalog(mergedCatalog);
      setLocalLessonCatalog(mergedCatalog);
      setArchiveClassDefinitions(fileProfile.classes);
      const activeClasses = buildLessonClasses(mergedCatalog, fileProfile.classes);
      const activeMatch = activeClasses
        .flatMap((lessonClass) => lessonClass.subjects.flatMap((subject) => subject.series.flatMap((series) => series.lessons)))
        .find((lesson) => lesson.id === (initialStoredLessonId.current ?? activeLesson.id))
        ?? activeClasses.flatMap((lessonClass) => lessonClass.subjects.flatMap((subject) => subject.series.flatMap((series) => series.lessons)))[0];
      if (activeMatch) {
        setActiveLesson(activeMatch);
        setActiveClassId(activeMatch.classId);
        setLessonTitle(storedLessonTitle(activeMatch));
      }
      const storedClassId = window.localStorage.getItem("tafelraum-active-class");
      if (storedClassId && activeClasses.some((entry) => entry.id === storedClassId)) setActiveClassId(storedClassId);
      const savedCatalog = await saveFileArchiveCatalog(mergedCatalog);
      if (savedCatalog && dirtyRevision && window.localStorage.getItem(archiveDirtyStorageKey) === dirtyRevision) {
        window.localStorage.removeItem(archiveDirtyStorageKey);
      }
    })().catch((error: unknown) => {
      console.error(t("Browserbestand konnte nicht mit dem Unterrichtsarchiv zusammengeführt werden."), error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themeVariant = themeVariant;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", canvasBackgroundColor);
    window.localStorage.setItem("surface-lab-theme", theme);
    window.localStorage.setItem(themeVariantStorageKey, JSON.stringify(themeVariants));
  }, [canvasBackgroundColor, theme, themeVariant, themeVariants]);

  useEffect(() => {
    document.documentElement.dataset.toolbar = toolbar;
    window.localStorage.setItem("surface-lab-toolbar", toolbar);
  }, [toolbar]);

  useEffect(() => {
    document.documentElement.dataset.archive = archiveOpen ? "open" : "closed";
    window.localStorage.setItem(archiveStateStorageKey, archiveOpen ? "open" : "closed");
  }, [archiveOpen]);

  useEffect(() => {
    window.localStorage.setItem(activeLessonStorageKey, activeLesson.id);
  }, [activeLesson.id]);

  useEffect(() => {
    if (isTauri()) {
      const window = getCurrentWindow();
      let disposed = false;
      let unlisten = () => {};
      const refresh = () => { void window.isFullscreen().then(value => { if (!disposed) setIsFullscreen(value); }); };
      refresh();
      void window.onResized(refresh).then(stop => { if (disposed) stop(); else unlisten = stop; });
      return () => { disposed = true; unlisten(); };
    }
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  useEffect(() => {
    if (!materialImportError) return;
    const timer = window.setTimeout(() => setMaterialImportError(null), 7000);
    return () => window.clearTimeout(timer);
  }, [materialImportError]);

  useEffect(() => {
    if (!openColorTool) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".tool-ink-options")) return;
      if (event.target instanceof Element && event.target.closest(".tool-button[data-color-tool]")) return;
      setOpenColorTool(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpenColorTool(null);
    };
    window.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape, true);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [openColorTool]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const currentDrag = dragPointRef.current;
      if (currentDrag?.pointerId !== event.pointerId) return;
      const workspaceBounds = workspaceRef.current?.getBoundingClientRect();
      const nextPoint = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        dock: workspaceBounds
          ? nearestDock(event.clientX, event.clientY, workspaceBounds)
          : currentDrag.dock,
      };
      dragPointRef.current = nextPoint;
      setDragPoint(nextPoint);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const currentDrag = dragPointRef.current;
      if (currentDrag?.pointerId !== event.pointerId) return;
      const workspaceBounds = workspaceRef.current?.getBoundingClientRect();
      setToolbar(workspaceBounds
        ? nearestDock(event.clientX, event.clientY, workspaceBounds)
        : currentDrag.dock);
      dragPointRef.current = null;
      setDragPoint(null);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (dragPointRef.current?.pointerId !== event.pointerId) return;
      dragPointRef.current = null;
      setDragPoint(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  const startToolbarDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    setOpenColorTool(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    const workspaceBounds = workspaceRef.current?.getBoundingClientRect();
    const nextPoint = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      dock: workspaceBounds
        ? nearestDock(event.clientX, event.clientY, workspaceBounds)
        : toolbar,
    };
    dragPointRef.current = nextPoint;
    setDragPoint(nextPoint);
  };

  const dockToolbarWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const dockByKey: Partial<Record<string, ToolbarPosition>> = {
      ArrowUp: "top",
      ArrowRight: "right",
      ArrowDown: "bottom",
      ArrowLeft: "left",
    };
    const nextDock = dockByKey[event.key];
    if (!nextDock) return;
    event.preventDefault();
    setToolbar(nextDock);
  };

  const toolbarStyle: CSSProperties | undefined = dragPoint ? {
    top: dragPoint.y,
    right: "auto",
    bottom: "auto",
    left: dragPoint.x,
    transform: "translate(-50%, -50%)",
  } : undefined;
  const isVerticalToolbar = toolbar === "left" || toolbar === "right";
  const pendingDock = dragPoint?.dock ?? null;

  const scrollToolbar = (direction: -1 | 1) => {
    const node = toolbarItemsRef.current;
    if (!node) return;
    setInsertMenu(null);
    const clientSize = isVerticalToolbar ? node.clientHeight : node.clientWidth;
    const distance = toolbarScrollDistance(clientSize) * direction;
    node.scrollBy({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      left: isVerticalToolbar ? 0 : distance,
      top: isVerticalToolbar ? distance : 0,
    });
  };

  const toggleInsertMenu = (kind: "apps" | "widgets") => {
    const menuBounds = (kind === "apps" ? appsMenuRef : widgetsMenuRef).current?.getBoundingClientRect();
    const toolbarBounds = toolbarRef.current?.getBoundingClientRect();
    if (menuBounds && toolbarBounds) {
      setInsertMenuAnchor({
        x: menuBounds.left - toolbarBounds.left + menuBounds.width / 2,
        y: menuBounds.top - toolbarBounds.top + menuBounds.height / 2,
      });
    }
    setInsertMenu(current => current === kind ? null : kind);
  };

  const insertMenuStyle = insertMenuAnchor ? {
    "--embedded-app-anchor-x": `${insertMenuAnchor.x}px`,
    "--embedded-app-anchor-y": `${insertMenuAnchor.y}px`,
  } as CSSProperties : undefined;

  const selectTool = (tool: ToolId, trigger: HTMLButtonElement) => {
    setActiveTool(tool);
    if (tool === "pen" || tool === "marker") {
      const toolbarBounds = trigger.closest<HTMLElement>(".toolbar")?.getBoundingClientRect();
      const triggerBounds = trigger.getBoundingClientRect();
      if (toolbarBounds) {
        setToolColorAnchor({
          x: triggerBounds.left - toolbarBounds.left + triggerBounds.width / 2,
          y: triggerBounds.top - toolbarBounds.top + triggerBounds.height / 2,
        });
      }
      setOpenColorTool(tool);
    } else {
      setOpenColorTool(null);
    }
    canvasPort?.selectTool(tool, toolContext);
  };

  const syncToolFromCanvas = (tool: ToolId) => {
    setActiveTool(tool);
    setOpenColorTool(null);
  };

  const selectToolColor = (tool: InkTool, color: ToolColor) => {
    if (tool === "pen") setPenColorId(color.id);
    else setMarkerColorId(color.id);
    setActiveTool(tool);
    setOpenColorTool(null);
    canvasPort?.selectTool(tool, {
      ...toolContext,
      [tool === "marker" ? "markerColor" : "penColor"]: color.value,
    });
  };

  const selectToolStrokeSize = (tool: InkTool, sizeId: ToolStrokeSizeId) => {
    if (tool === "pen") setPenStrokeSizeId(sizeId);
    else setMarkerStrokeSizeId(sizeId);
    setActiveTool(tool);
    setOpenColorTool(null);
    canvasPort?.selectTool(tool, {
      ...toolContext,
      [tool === "marker" ? "markerStrokeWidth" : "penStrokeWidth"]: toolStrokeWidth(tool, sizeId),
    });
  };

  const selectShape = (shape: BasicShape) => {
    setActiveShape(shape);
    setActiveTool("shape");
    setOpenColorTool(null);
    canvasPort?.selectTool("shape", { ...toolContext, shape });
  };

  const selectShapeFill = (fillMode: ShapeFillMode) => {
    setShapeFill(fillMode);
    setActiveTool("shape");
    setOpenColorTool(null);
    canvasPort?.selectTool("shape", {
      ...toolContext,
      shapeFill: fillMode,
    });
  };

  const selectShapeColor = (color: ShapeColorOption) => {
    setShapeColorId(color.id);
    setActiveTool("shape");
    setOpenColorTool(null);
    canvasPort?.selectTool("shape", {
      ...toolContext,
      shapeColor: color.value,
    });
  };

  const createSeries = (target: Extract<ArchiveCreateTarget, { kind: "series" }>, label: string) => {
    const nextCatalog: LocalLessonCatalog = {
      ...localLessonCatalog,
      series: [...localLessonCatalog.series, {
        id: `series-${crypto.randomUUID()}`,
        classId: target.classId,
        subjectId: target.subjectId,
        label,
      }],
    };
    persistLessonCatalog(nextCatalog);
  };

  const createSubject = (target: Extract<ArchiveCreateTarget, { kind: "subject" }>, label: string) => {
    const nextCatalog: LocalLessonCatalog = {
      ...localLessonCatalog,
      subjects: [...localLessonCatalog.subjects, {
        id: `subject-${crypto.randomUUID()}`,
        classId: target.classId,
        label,
      }],
    };
    persistLessonCatalog(nextCatalog);
  };

  const createLesson = (target: Extract<ArchiveCreateTarget, { kind: "lesson" }>, title: string) => {
    const lesson: TestLesson = {
      id: `lesson-${crypto.randomUUID()}`,
      classId: target.classId,
      subjectId: target.subjectId,
      seriesId: target.seriesId,
      title,
      metadata: { scheduledFor: nextPlanningDate() },
      seed: { prompt: "", showTransportImage: false },
    };
    const nextCatalog: LocalLessonCatalog = {
      ...localLessonCatalog,
      lessons: [...localLessonCatalog.lessons, lesson],
    };
    persistLessonCatalog(nextCatalog);
    openLesson(lesson);
  };

  const changeArchiveOrder = (level: CatalogOrderLevel, parentId: string, orderedIds: string[]) => {
    const nextCatalog = withCatalogOrder(localLessonCatalog, level, parentId, orderedIds);
    persistLessonCatalog(nextCatalog);
  };

  const copyArchiveItemWithState = async (item: ArchiveClipboardItem, target: ArchivePasteTarget) => {
    const sourceLessons = item.kind === "subject"
      ? item.subject.series.flatMap((series) => series.lessons)
      : item.kind === "series"
        ? item.series.lessons
        : [item.lesson];
    if (sourceLessons.some((lesson) => lesson.id === activeLesson.id)) await canvasPort?.flushPersistence();

    const classesWithDisplayTitles = lessonClasses.map((lessonClass) => ({
      ...lessonClass,
      subjects: lessonClass.subjects.map((subject) => ({
        ...subject,
        series: subject.series.map((series) => ({
          ...series,
          lessons: series.lessons.map((lesson) => ({
            ...lesson,
            title: lesson.id === activeLesson.id ? lessonTitle.trim() || lesson.title : storedLessonTitle(lesson),
          })),
        })),
      })),
    }));
    const result = copyArchiveItem(
      localLessonCatalog,
      classesWithDisplayTitles,
      item,
      target,
      (prefix) => `${prefix}-${crypto.randomUUID()}`,
    );

    try {
      for (const copy of result.lessonCopies) {
        await copyCanvasLessonState(copy.sourceLessonId, copy.targetLessonId);
      }
    } catch (error) {
      await Promise.all(result.lessonCopies.flatMap((copy) => [
        clearCanvasSnapshot(copy.targetLessonId),
        clearCanvasFiles(copy.targetLessonId),
      ]));
      throw error;
    }

    return result;
  };

  const pasteArchiveItem = async (item: ArchiveClipboardItem, target: ArchivePasteTarget) => {
    const result = await copyArchiveItemWithState(item, target);
    persistLessonCatalog(result.catalog);
    setActiveClassId(target.classId);
  };

  const duplicateArchiveItem = async (item: ArchiveClipboardItem, placement: ArchiveDuplicatePlacement) => {
    const result = await copyArchiveItemWithState(item, placement.target);
    const orderedIds = reorderSiblingIds(
      [...placement.siblingIds, result.rootCopyId],
      result.rootCopyId,
      placement.sourceId,
      "after",
    );
    const nextCatalog = withCatalogOrder(result.catalog, placement.level, placement.parentId, orderedIds);
    persistLessonCatalog(nextCatalog);
    setActiveClassId(placement.target.classId);
  };

  const renameLesson = (lesson: TestLesson, title: string) => {
    persistLessonTitle(lesson, title);
  };

  const renameSubject = (subject: LessonSubject, classId: string, label: string) => {
    const replacement = { id: subject.id, classId, label };
    const exists = localLessonCatalog.subjects.some((candidate) => candidate.id === subject.id);
    const nextCatalog: LocalLessonCatalog = {
      ...localLessonCatalog,
      subjects: exists
        ? localLessonCatalog.subjects.map((candidate) => candidate.id === subject.id ? replacement : candidate)
        : [...localLessonCatalog.subjects, replacement],
    };
    persistLessonCatalog(nextCatalog);
  };

  const renameSeries = (series: LessonSeries, classId: string, subjectId: string, label: string) => {
    const exists = localLessonCatalog.series.some((candidate) => candidate.id === series.id);
    const nextCatalog: LocalLessonCatalog = {
      ...localLessonCatalog,
      series: exists
        ? localLessonCatalog.series.map((candidate) => candidate.id === series.id
          ? { ...candidate, classId, subjectId, label }
          : candidate)
        : [...localLessonCatalog.series, {
            id: series.id,
            classId,
            subjectId,
            label,
            ...(series.materialBasis ? { materialBasis: { ...series.materialBasis } } : {}),
          }],
    };
    persistLessonCatalog(nextCatalog);
  };

  const trashArchiveItem = async (target: ArchiveMutableTarget) => {
    if (target.kind === "class" && classTrashUnavailableReason(lessonClasses, target.lessonClass.id, activeLesson.id)) return;
    const deletedAt = new Date().toISOString();
    const trashItem: ArchiveTrashItem = target.kind === "class"
      ? { kind: "class", id: target.lessonClass.id, classId: target.lessonClass.id, label: target.lessonClass.label, deletedAt }
      : target.kind === "subject"
      ? {
          kind: "subject",
          id: target.subject.id,
          label: target.subject.label,
          classId: target.lessonClass.id,
          deletedAt,
        }
      : target.kind === "series"
        ? {
            kind: "series",
            id: target.series.id,
            label: target.series.label,
            classId: target.lessonClass.id,
            subjectId: target.subject.id,
            deletedAt,
          }
        : {
            kind: "lesson",
            id: target.lesson.id,
            label: target.lesson.id === activeLesson.id ? lessonTitle.trim() || target.lesson.title : storedLessonTitle(target.lesson),
            classId: target.lesson.classId,
            subjectId: target.lesson.subjectId,
            seriesId: target.lesson.seriesId,
            deletedAt,
          };
    const typeLabel = trashItem.kind === "class" ? t("Klasse / Kurs") : trashItem.kind === "subject" ? t("Fach") : trashItem.kind === "series" ? t("Reihe") : t("Unterricht");
    const consequence = trashItem.kind === "class" ? t("\n\nAlle zugehörigen Fächer, Reihen und Stunden werden ausgeblendet. Du kannst sie zusammen im Papierkorb wiederherstellen.") : "";
    if (!window.confirm(t("{0} „{1}“ in den Papierkorb verschieben?{2}", typeLabel, trashItem.label, consequence))) return;

    const nextCatalog = moveArchiveItemToTrash(localLessonCatalog, trashItem);
    const nextClasses = buildLessonClasses(nextCatalog, archiveClassDefinitions ?? undefined);
    const remainingLessons = nextClasses.flatMap((lessonClass) => lessonClass.subjects.flatMap((subject) => subject.series.flatMap((series) => series.lessons)));
    if (!remainingLessons.some((candidate) => candidate.id === activeLesson.id) && remainingLessons.length > 0) {
      const sameSeriesLesson = remainingLessons.find((candidate) => candidate.seriesId === activeLesson.seriesId);
      if (!await openLesson(sameSeriesLesson ?? remainingLessons[0])) return;
    }
    persistLessonCatalog(moveArchiveItemToTrash(localLessonCatalogRef.current, trashItem));
    if (target.kind === "class" && activeClassId === trashItem.classId) {
      const nextClassId = remainingLessons.find(lesson => lesson.classId !== trashItem.classId)?.classId ?? nextClasses[0].id;
      setActiveClassId(nextClassId);
      window.localStorage.setItem("tafelraum-active-class", nextClassId);
    }
  };

  const restoreTrashItem = (item: ArchiveTrashItem) => {
    const nextCatalog = restoreArchiveItem(localLessonCatalog, item.kind, item.id);
    persistLessonCatalog(nextCatalog);
    setActiveClassId(item.classId);
    window.localStorage.setItem("tafelraum-active-class", item.classId);
  };

  const openLesson = async (lesson: TestLesson, guard?: () => void) => {
    guard?.();
    if (lesson.id === activeLesson.id) return true;
    if (!await liveCanvas.confirmSourceChange(storedLessonTitle(lesson))) return false;
    const unsavedInteractiveHtmlCount = canvasPort?.getUnsavedInteractiveHtmlChangeCount() ?? 0;
    if (unsavedInteractiveHtmlCount > 0) {
      const materialLabel = unsavedInteractiveHtmlCount === 1
        ? t("einem interaktiven Material")
        : t("{0} interaktiven Materialien", unsavedInteractiveHtmlCount);
      if (!window.confirm(
        t("Ungespeicherte Inhalte in {0}\n\nBeim Stundenwechsel gehen dort Eingaben oder Spielstände verloren, weil das Speichern ausgeschaltet ist. Trotzdem wechseln?", materialLabel),
      )) return false;
    }
    guard?.();
    try { await flushNotes(); await canvasPort?.flushPersistence(); }
    catch { setMaterialImportError("Die aktuelle Stunde konnte nicht gespeichert werden. Bitte erneut versuchen."); return false; }
    guard?.();
    liveCanvas.host.prepareSource(lesson.id);
    setLiveApi(null);
    setCanvasPort(null);
    setCanvasMaterialUsage(emptyCanvasMaterialUsage);
    setOpenColorTool(null);
    setActiveTool("hand");
    setActiveClassId(lesson.classId);
    setActiveLesson(lesson);
    setLessonTitle(storedLessonTitle(lesson));
    return true;
  };

  // Read current app state after every asynchronous step; another user action wins.
  const teachingStateRef = useRef({lessonId:activeLesson.id,port:canvasPort,presenting:liveCanvas.presenting || requiresLiveSourceChangeConfirmation(liveCanvas.host.state),importing:isImportingMaterial});
  teachingStateRef.current = {lessonId:activeLesson.id,port:canvasPort,presenting:liveCanvas.presenting || requiresLiveSourceChangeConfirmation(liveCanvas.host.state),importing:isImportingMaterial};
  useTeachingAgent(archiveClassDefinitions !== null, async (command, expiresAt) => {
    const context = () => {
      const state = teachingStateRef.current;
      const canvas = state.port?.inspectAgentCanvas();
      return {lessonId:state.lessonId,revision:canvas?.revision ?? null,ready:Boolean(canvas),busy:canvas?.busy ?? true,
        presenting:state.presenting,persistence:canvas?.persistence ?? null};
    };
    if (command.type === 'context') return {ok:true,context:context()};
    const initialCatalog = localLessonCatalogRef.current;
    const guardCatalog = () => {
      if (Date.now() > expiresAt) throw new Error(t("Organisationsauftrag abgelaufen."));
      if (window.localStorage.getItem(archiveDirtyStorageKey) || localLessonCatalogRef.current !== initialCatalog)
        throw new Error(t("Archivnavigation wird gerade geändert oder ist noch nicht gespeichert. Erneut prüfen."));
    };
    guardCatalog();
    const profile = await loadFileArchiveProfile();
    if (!profile) throw new Error(t("Aktives Archiv ist nicht erreichbar."));
    guardCatalog();
    if (command.type === 'openLesson') {
      const target = teachingCatalog(profile).lessons.find(item => item.id === command.lessonId);
      if (!target) throw new Error(t("Zielstunde fehlt oder liegt im Papierkorb."));
      const lesson = profile.catalog.lessons.find(item => item.id === target.id)!;
      const guard = () => {
        guardCatalog();
        const state = teachingStateRef.current, current = state.port?.inspectAgentCanvas();
        if (state.lessonId !== command.expectedLessonId || current?.revision !== command.expectedRevision || current.busy || state.importing)
          throw new Error(t("Lehreransicht wurde verändert oder wird gerade bedient. Kontext erneut lesen."));
        if (state.lessonId !== target.id && (state.presenting || state.port?.getUnsavedInteractiveHtmlChangeCount()))
          throw new Error(t("Stundenwechsel benötigt eine Entscheidung in der App: laufende Präsentation oder ungespeicherte HTML-Eingaben."));
      };
      guard();
      if (!await openLesson(lesson,guard)) throw new Error(t("Stundenwechsel wurde nicht ausgeführt."));
      // No catalog rewrite: server catalog remains the source of truth.
      localLessonCatalogRef.current = profile.catalog;
      saveLocalLessonCatalog(profile.catalog);
      setLocalLessonCatalog(profile.catalog);
      setArchiveClassDefinitions(profile.classes);
      setMaterialRefreshRevision(revision => revision + 1);
      return {ok:true,opened:true,lesson:target};
    }
    localLessonCatalogRef.current = profile.catalog;
    saveLocalLessonCatalog(profile.catalog);
    setLocalLessonCatalog(profile.catalog);
    setArchiveClassDefinitions(profile.classes);
    setMaterialRefreshRevision(revision => revision + 1);
    return {ok:true,refreshed:true,context:context()};
  });

  const importMaterialFiles = async (files: readonly File[], point?: { clientX: number; clientY: number }) => {
    if (!canvasPort || isImportingMaterial || files.length === 0) return;
    setIsImportingMaterial(true);
    setMaterialImportError(null);
    try {
      const visualAssets: CanvasImageAsset[] = [];
      let mediaIndex = 0;
      for (const file of files) {
        const word = /\.docx$/i.test(file.name);
        setIsConvertingWord(word);
        const uploaded = await uploadLessonMaterial(activeLesson.id, file);
        await canvasPort.applyArchiveMaterialRemovals(await loadMaterialRemovals());
        if (uploaded.material.kind === "audio") {
          canvasPort.placeAudio({
            archiveMaterialPath: uploaded.archiveMaterialPath,
            fileName: uploaded.material.name,
            lessonId: activeLesson.id,
            materialPath: uploaded.material.path,
            mimeType: uploaded.material.mimeType,
          }, point ? { clientX: point.clientX + mediaIndex * 28, clientY: point.clientY + mediaIndex * 28 } : undefined);
          mediaIndex += 1;
          continue;
        }
        if (uploaded.material.kind === "video") {
          canvasPort.placeVideo({
            archiveMaterialPath: uploaded.archiveMaterialPath,
            fileName: uploaded.material.name,
            lessonId: activeLesson.id,
            materialPath: uploaded.material.path,
            mimeType: uploaded.material.mimeType,
          }, point ? { clientX: point.clientX + mediaIndex * 28, clientY: point.clientY + mediaIndex * 28 } : undefined);
          mediaIndex += 1;
          continue;
        }
        if (uploaded.material.kind !== "image" && uploaded.material.kind !== "pdf") {
          throw new Error(t("Die Datei wurde nicht als unterstütztes Material erkannt."));
        }
        // A Word upload returns a PDF rendition; never relabel DOCX bytes as PDF.
        const archivedFile = word ? await lessonMaterialToFile(activeLesson.id, uploaded.material) : new File([file], uploaded.material.name, {
          type: uploaded.material.mimeType,
          lastModified: file.lastModified,
        });
        const assets = await materialFilesToCanvasImages([archivedFile]);
        visualAssets.push(...assets.map((asset) => ({
          ...asset,
          source: {
            ...asset.source,
            archiveMaterialPath: uploaded.archiveMaterialPath,
            fileName: uploaded.material.name,
          },
        })));
      }
      if (visualAssets.length > 0) await canvasPort.placeImages(visualAssets, point);
      setMaterialRefreshRevision((revision) => revision + 1);
    } catch (error) {
      console.error(t("Material konnte nicht importiert werden."), error);
      setMaterialImportError(error instanceof Error
        ? error.message
        : "Das Material konnte nicht in die Stunde übernommen werden.");
    } finally {
      setIsImportingMaterial(false);
      setIsConvertingWord(false);
    }
  };

  const importLessonMaterial = async (
    sourceLessonId: string,
    material: LessonMaterial,
    point?: { clientX: number; clientY: number },
    archiveMaterialPath?: string,
  ) => {
    if (!canvasPort || isImportingMaterial) return;
    setIsImportingMaterial(true);
    setMaterialImportError(null);
    try {
      await canvasPort.applyArchiveMaterialRemovals(await loadMaterialRemovals());
      if (material.kind === "audio") {
        if (!archiveMaterialPath) throw new Error(t("Dem Audiomaterial fehlt der Archivpfad."));
        canvasPort.placeAudio({
          archiveMaterialPath,
          fileName: material.name,
          lessonId: sourceLessonId,
          materialPath: material.path,
          mimeType: material.mimeType,
        }, point);
        return;
      }
      if (material.kind === "video") {
        if (!archiveMaterialPath) throw new Error(t("Dem Videomaterial fehlt der Archivpfad."));
        canvasPort.placeVideo({
          archiveMaterialPath,
          fileName: material.name,
          lessonId: sourceLessonId,
          materialPath: material.path,
          mimeType: material.mimeType,
        }, point);
        return;
      }
      if (material.kind === "interactive") {
        if (!archiveMaterialPath) throw new Error(t("Dem interaktiven Material fehlt der Archivpfad."));
        canvasPort.placeInteractiveHtml({
          archiveMaterialPath,
          id: material.id,
          title: material.name,
          lessonId: sourceLessonId,
          entry: material.entry,
          print: material.print,
          defaultViewport: material.defaultViewport,
        }, point);
        return;
      }
      if (material.kind === "link") {
        if (!archiveMaterialPath) throw new Error(t("Dem Link fehlt der Archivpfad."));
        if (material.provider === "youtube") {
          canvasPort.placeYouTube({
            archiveMaterialPath,
            title: material.name,
            url: material.url,
            videoId: material.videoId,
          }, point);
        } else {
          canvasPort.placeLink({
            archiveMaterialPath,
            label: material.name,
            url: material.url,
          }, point);
        }
        return;
      }
      const file = await lessonMaterialToFile(sourceLessonId, material);
      const assets = await materialFilesToCanvasImages([file]);
      await canvasPort.placeImages(assets.map((asset) => ({
        ...asset,
        source: {
          ...asset.source,
          ...(archiveMaterialPath ? { archiveMaterialPath } : {}),
        },
      })), point);
    } catch (error) {
      console.error(t("Archivmaterial konnte nicht geöffnet werden."), error);
      setMaterialImportError(error instanceof Error
        ? error.message
        : "Das Archivmaterial konnte nicht geöffnet werden.");
    } finally {
      setIsImportingMaterial(false);
    }
  };

  const addLessonMaterialLink = async (
    url: string,
    point?: { clientX: number; clientY: number },
    label?: string,
  ) => {
    if (!canvasPort || isImportingMaterial) throw new Error(t("Die Fläche ist noch nicht bereit."));
    setIsImportingMaterial(true);
    setMaterialImportError(null);
    try {
      const saved = await saveLessonMaterialLink(activeLesson.id, url);
      await canvasPort.applyArchiveMaterialRemovals(await loadMaterialRemovals());
      if (saved.material.provider === "youtube") {
        canvasPort.placeYouTube({
          archiveMaterialPath: saved.archiveMaterialPath,
          title: saved.material.name,
          url: saved.material.url,
          videoId: saved.material.videoId,
        }, point);
      } else {
        canvasPort.placeLink({
          archiveMaterialPath: saved.archiveMaterialPath,
          label: label?.trim() || saved.material.name,
          url: saved.material.url,
        }, point);
      }
      setMaterialRefreshRevision((revision) => revision + 1);
    } catch (error) {
      console.error(t("Link konnte nicht hinzugefügt werden."), error);
      const materialError = error instanceof Error ? error : new Error(t("Link konnte nicht hinzugefügt werden."));
      setMaterialImportError(materialError.message);
      throw materialError;
    } finally {
      setIsImportingMaterial(false);
    }
  };

  const isSupportedMaterialTransfer = (event: ReactDragEvent<HTMLElement>) => (
    event.dataTransfer.types.includes("Files") || event.dataTransfer.types.includes(lessonMaterialDragMime)
  );

  const handleMaterialDragEnter = (event: ReactDragEvent<HTMLElement>) => {
    if (!isSupportedMaterialTransfer(event)) return;
    if (event.target instanceof Element && event.target.closest(".lesson-material-panel")) return;
    event.preventDefault();
    event.stopPropagation();
    materialDragDepth.current += 1;
    setIsMaterialDragActive(true);
  };

  const handleMaterialDragLeave = (event: ReactDragEvent<HTMLElement>) => {
    if (!isSupportedMaterialTransfer(event)) return;
    event.preventDefault();
    event.stopPropagation();
    materialDragDepth.current = Math.max(0, materialDragDepth.current - 1);
    if (materialDragDepth.current === 0) setIsMaterialDragActive(false);
  };

  const handleMaterialDrop = (event: ReactDragEvent<HTMLElement>) => {
    if (!isSupportedMaterialTransfer(event)) return;
    if (event.target instanceof Element && event.target.closest(".lesson-material-panel")) return;
    event.preventDefault();
    event.stopPropagation();
    materialDragDepth.current = 0;
    setIsMaterialDragActive(false);
    const point = { clientX: event.clientX, clientY: event.clientY };
    const materialPayload = parseLessonMaterialDragPayload(event.dataTransfer.getData(lessonMaterialDragMime));
    if (materialPayload) {
      if (materialPayload.archiveMaterialPath && canvasPort?.hasArchiveMaterial(materialPayload.archiveMaterialPath, materialPayload.legacyFileName)) {
        setPendingMaterialDuplicate({ lessonId: activeLesson.id, sourceLessonId: materialPayload.lessonId,
          material: materialPayload.material, archiveMaterialPath: materialPayload.archiveMaterialPath, point });
        return;
      }
      void importLessonMaterial(
        materialPayload.lessonId,
        materialPayload.material,
        point,
        materialPayload.archiveMaterialPath,
      );
      return;
    }
    void importMaterialFiles(Array.from(event.dataTransfer.files), point);
  };

  const handleMaterialPaste = (event: ReactClipboardEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("input, textarea, [contenteditable='true']")) return;
    // Accept legacy dual-format canvas clipboards from 0.1.10.
    if (hasCanvasClipboardData(event.clipboardData.getData("text/plain"))) {
      if (event.clipboardData.files.length > 0 && target?.closest(".canvas-engine")) {
        // Excalidraw prioritizes image files even when editable scene data exists.
        // Forward only its own representation through the normal engine paste path.
        event.preventDefault();
        event.stopPropagation();
        const data = new DataTransfer();
        data.setData("text/plain", event.clipboardData.getData("text/plain"));
        target.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
      }
      return;
    }
    const files = imageFilesFromClipboard(event.clipboardData);
    if (files.length > 0) {
      // Capture external images before Excalidraw's document-level paste handler;
      // its image tool stays hidden while Tafelraum owns asset persistence.
      event.preventDefault();
      event.stopPropagation();
      const canvasTarget = target?.closest(".canvas-engine") ? target : null;
      void (async () => {
        if (files.length === 1 && canvasTarget) {
          const sceneText = await internalSceneForPastedImage(files[0]);
          if (sceneText) {
            const data = new DataTransfer();
            data.setData("text/plain", sceneText);
            canvasTarget.dispatchEvent(new ClipboardEvent("paste", {
              bubbles: true,
              cancelable: true,
              clipboardData: data,
            }));
            return;
          }
        }
        await importMaterialFiles(files);
      })();
      return;
    }

    if (!target?.closest(".canvas-engine")) return;
    const webUrl = webLinkFromClipboard(event.clipboardData);
    if (!webUrl) return;
    event.preventDefault();
    event.stopPropagation();
    const point = lastCanvasPointerRef.current ?? {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    };
    if (youtubeLinkFromClipboard(event.clipboardData)) {
      void addLessonMaterialLink(webUrl, point).catch(() => undefined);
      return;
    }
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    const editorWidth = 340;
    const editorHeight = 58;
    const margin = 16;
    const localX = workspaceRect ? point.clientX - workspaceRect.left : point.clientX;
    const localY = workspaceRect ? point.clientY - workspaceRect.top : point.clientY;
    const availableWidth = workspaceRect?.width ?? window.innerWidth;
    const availableHeight = workspaceRect?.height ?? window.innerHeight;
    const preferredY = localY + 14;
    setPendingCanvasLink({
      anchor: {
        x: Math.min(Math.max(localX, margin), Math.max(margin, availableWidth - editorWidth - margin)),
        y: Math.min(
          Math.max(preferredY + editorHeight > availableHeight - margin ? localY - editorHeight - 14 : preferredY, margin),
          Math.max(margin, availableHeight - editorHeight - margin),
        ),
      },
      label: "",
      point,
      url: webUrl,
    });
  };

  // Fast Refresh can retain the pre-metadata lesson object while replacing the catalog module.
  const activeLessonDate = activeLesson.metadata
    ? activeLesson.metadata.scheduledFor
    : findLesson(activeLesson.id, lessonClasses).metadata.scheduledFor;
  const combinedSaveFeedback = privateNotesStatus === 'error' ? 'error'
    : privateNotesStatus === 'saving' && !['error', 'browser-only'].includes(archiveSaveFeedback ?? '') ? 'saving' : archiveSaveFeedback;
  const ArchiveFeedbackIcon = combinedSaveFeedback ? archiveSaveFeedbackIcon[combinedSaveFeedback] : null;

  return (
    <main className="app-shell">
      <DesktopPersistenceGuard flush={async () => {
        if (!canvasPort || isImportingMaterial || canvasPort.inspectAgentCanvas().busy) {
          throw new Error(t("Eine Canvasaktion läuft noch. Bitte danach erneut beenden."));
        }
        if (canvasPort.getUnsavedInteractiveHtmlChangeCount() > 0 && !window.confirm(t("Nicht gespeicherte Eingaben in interaktiven Materialien verwerfen und beenden?"))) {
          throw new Error(t("Beenden abgebrochen."));
        }
        liveCanvas.room.stop();
        await flushNotes();
        await canvasPort.flushPersistence();
        await flushArchiveWrites();
        if (window.localStorage.getItem(archiveDirtyStorageKey)) throw new Error(t("Die Unterrichtsorganisation ist noch nicht gespeichert."));
      }}/>
      <NativeUiLanguage/>
      <header className="topbar">
        <div className="topbar-leading">
          {activeLessonDate && (
            <time
              className="lesson-date-meta"
              dateTime={activeLessonDate}
              aria-label={t("Unterrichtsdatum {0}", formatLessonDate(activeLessonDate))}
            >
              <Icon name="calendar"/>
              <span>{formatLessonDate(activeLessonDate)}</span>
            </time>
          )}
        </div>
        <h1 className="topbar-lesson-title" title={lessonTitle}>
          {lessonTitle}
        </h1>
        <div className="topbar-actions">
          <div className="presentation-actions" role="group" aria-label={t("Präsentationswerkzeuge")}>
            <LaserToolButton laser={laser} disabled={!liveApi} header/>
            <LiveClipTool live={liveCanvas} header/>
            <LiveCanvasControls live={liveCanvas}/>
          </div>
          {combinedSaveFeedback && ArchiveFeedbackIcon && <div
              className="save-status"
              data-state={combinedSaveFeedback}
              role={combinedSaveFeedback === "error" ? "alert" : "status"}
              aria-label={combinedSaveFeedback === "browser-only"
                ? t("Änderungen konnten nicht in das Unterrichtsarchiv geschrieben werden.")
                : undefined}
            >
              <ArchiveFeedbackIcon aria-hidden="true"/>
              <span>{t(archiveSaveFeedbackCopy[combinedSaveFeedback])}</span>
            </div>}
          <span className="topbar-utility-divider" aria-hidden="true"/>
          <div className="topbar-utility-group">
            <SettingsMenu
              presenting={liveCanvas.presenting}
              onTheme={setTheme}
              onThemeVariant={(variant) => setThemeVariants((current) => ({ ...current, [theme]: variant }))}
              theme={theme}
              themeVariant={themeVariant}
            />
            <ActionButton icon="fullscreen" label={isFullscreen ? t("Vollbild verlassen") : t("Vollbild")} shortcut={{ aria: "V", display: "V" }} iconOnly onClick={toggleFullscreen}/>
          </div>
        </div>
      </header>

      {studentsEditor && <CourseStudentsEditor key={studentsEditor.classId} classId={studentsEditor.classId} anchor={studentsEditor.anchor}
        onClose={() => setStudentsEditor(null)}/>}
      {notesAnchor && <StudentNotes key={activeLesson.id} lessonId={activeLesson.id} anchor={notesAnchor}
        onClose={() => setNotesAnchor(null)} onEditStudents={classId => {
          setStudentsEditor({ classId, anchor: notesAnchor }); setNotesAnchor(null);
        }}/>}
      <ArchiveNavigation
        onEditStudents={(classId, anchor) => { setNotesAnchor(null); setMaterialPanelOpen(false); setStudentsEditor({ classId, anchor }); }}
        classesEditable={archiveClassDefinitions !== null}
        onClassSave={async (id, label, previousLabel) => {
          const classes = await saveFileArchiveClass(id, label, previousLabel);
          setArchiveClassDefinitions(classes);
          setActiveClassId(id);
          window.localStorage.setItem("tafelraum-active-class", id);
        }}
        activeClassId={activeClassId}
        activeLessonId={activeLesson.id}
        activeLessonTitle={lessonTitle}
        isOpen={archiveOpen}
        lessonClasses={lessonClasses}
        onArchiveItemTrash={trashArchiveItem}
        onClassSelect={(id) => { setActiveClassId(id); window.localStorage.setItem("tafelraum-active-class", id); }}
        onDuplicateArchiveItem={duplicateArchiveItem}
        onLessonCreate={createLesson}
        onLessonRename={renameLesson}
        onLessonSelect={openLesson}
        onOrderChange={changeArchiveOrder}
        onPasteArchiveItem={pasteArchiveItem}
        onSeriesCreate={createSeries}
        onSeriesRename={renameSeries}
        onSubjectCreate={createSubject}
        onSubjectRename={renameSubject}
        onTrashRestore={restoreTrashItem}
        trashItems={localLessonCatalog.trash}
      />

      <button
        ref={archiveToggleButtonRef}
        className="archive-toggle"
        type="button"
        aria-controls="archive-navigation"
        aria-expanded={archiveOpen}
        aria-label={archiveOpen ? t("Unterricht schließen") : t("Unterricht öffnen")}
        title={archiveOpen ? t("Unterricht schließen") : t("Unterricht öffnen")}
        onClick={toggleArchive}
      >
        <span className="archive-toggle-icon archive-toggle-icon-close" aria-hidden="true">
          <Icon name="archiveClose"/>
        </span>
        <span className="archive-toggle-icon archive-toggle-icon-open" aria-hidden="true">
          <Icon name="archiveOpen"/>
        </span>
      </button>

      <section
        ref={workspaceRef}
        className={`workspace${isMaterialDragActive ? " is-material-dragging" : ""}${materialPanelOpen ? " is-material-panel-open" : ""}`}
        aria-label={t("Arbeitsfläche")}
        onDragEnterCapture={handleMaterialDragEnter}
        onDragLeaveCapture={handleMaterialDragLeave}
        onDragOverCapture={(event) => {
          if (!isSupportedMaterialTransfer(event)) return;
          if (event.target instanceof Element && event.target.closest(".lesson-material-panel")) return;
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDropCapture={handleMaterialDrop}
        onPasteCapture={handleMaterialPaste}
        onPointerMoveCapture={(event) => {
          if (!(event.target instanceof Element) || !event.target.closest(".canvas-engine")) return;
          lastCanvasPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
        }}
      >
        <CanvasSurface
          key={activeLesson.id}
          activeShape={activeShape}
          activeTool={activeTool}
          canvasBackgroundColor={canvasBackgroundColor}
          lessonId={activeLesson.id}
          lessonSeed={activeLesson.seed}
          markerColor={markerColor.value}
          markerStrokeWidth={toolContext.markerStrokeWidth}
          materialShadows={true}
          getFocusViewport={() => {
            const bounds = workspaceRef.current?.getBoundingClientRect();
            const panel = workspaceRef.current?.querySelector('.lesson-material-panel[data-state="open"]')?.getBoundingClientRect();
            return bounds ? { left: bounds.left, top: bounds.top, height: bounds.height,
              width: Math.max(1, (panel?.left ?? bounds.right) - bounds.left) } : undefined;
          }}
          onMaterialFocusChange={setFocusedMaterialUsage}
          onMaterialUsageChange={setCanvasMaterialUsage}
          onPortReady={setCanvasPort}
          onLiveApiReady={setLiveApi}
          onTimerRuntimeReady={onTimerRuntimeReady}
          onLiveInkPreviewChange={onPresentationInkPreviewChange}
          clipControls={liveCanvas.clipControls}
          interactiveLiveControls={liveCanvas.interactiveControls}
          materialControls={liveCanvas.materialControls}
          laserControls={laser}
          onShapeColorChange={(color) => {
            const option = shapeColorOptions.find((candidate) => candidate.value.toLowerCase() === color.toLowerCase());
            if (option) setShapeColorId(option.id);
          }}
          onTemporaryPanChange={setTemporaryHandActive}
          onToolChange={syncToolFromCanvas}
          onZoomChange={setZoomPercent}
          penColor={penColor.value}
          penStrokeWidth={toolContext.penStrokeWidth}
          shapeColor={shapeColor.value}
          shapeFill={shapeFill}
          theme={theme}
          onShapeFillChange={setShapeFill}
        />
        {pendingCanvasLink && (
          <form
            className="canvas-link-label-editor"
            style={{ left: pendingCanvasLink.anchor.x, top: pendingCanvasLink.anchor.y }}
            onPointerDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const pending = pendingCanvasLink;
              const label = pending.label.trim();
              if (!label || isImportingMaterial) return;
              void addLessonMaterialLink(pending.url, pending.point, label)
                .then(() => setPendingCanvasLink(null))
                .catch(() => undefined);
            }}
          >
            <Link2 aria-hidden="true" strokeWidth={1.8}/>
            <input
              autoFocus
              aria-label={t("Linktext")}
              maxLength={160}
              placeholder={t("Was soll angezeigt werden?")}
              title={pendingCanvasLink.url}
              value={pendingCanvasLink.label}
              disabled={isImportingMaterial}
              onChange={(event) => setPendingCanvasLink((current) => current ? {
                ...current,
                label: event.target.value,
              } : null)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setPendingCanvasLink(null);
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              aria-label={t("Link platzieren")}
              title={t("Link platzieren")}
              disabled={!pendingCanvasLink.label.trim() || isImportingMaterial}
            >
              <Check aria-hidden="true" strokeWidth={2}/>
            </button>
            <button
              type="button"
              aria-label={t("Link verwerfen")}
              title={t("Link verwerfen")}
              disabled={isImportingMaterial}
              onClick={() => setPendingCanvasLink(null)}
            >
              <X aria-hidden="true" strokeWidth={1.9}/>
            </button>
          </form>
        )}
        <dialog ref={duplicateDialog} className="interactive-reset-dialog lesson-material-remove-dialog"
          aria-labelledby="material-duplicate-title"
          onCancel={() => setPendingMaterialDuplicate(null)}
          onKeyDown={event => event.stopPropagation()}>
          <div className="interactive-reset-dialog__copy">
            <h2 id="material-duplicate-title">{t("Material")} {pendingMaterialDuplicate ? lessonMaterialDisplayName(pendingMaterialDuplicate.material) : ""} {t("ist bereits im Canvas. Nochmal hinzufügen?")}</h2>
          </div>
          <div className="interactive-reset-dialog__actions">
            <button type="button" autoFocus onClick={() => setPendingMaterialDuplicate(null)}>{t("Abbrechen")}</button>
            <button type="button" onClick={() => {
              const pending = pendingMaterialDuplicate;
              setPendingMaterialDuplicate(null);
              if (pending && pending.lessonId === activeLesson.id) void importLessonMaterial(
                pending.sourceLessonId, pending.material, pending.point, pending.archiveMaterialPath);
            }}>{t("Nochmal hinzufügen")}</button>
          </div>
        </dialog>
        {materialPanelPresent && (
          <LessonMaterialPanel
            lessonId={activeLesson.id}
            open={materialPanelOpen}
            importing={isImportingMaterial}
            onRemove={async material => {
              if (!canvasPort) throw new Error(t("Die Fläche ist noch nicht bereit."));
              await canvasPort.flushPersistence();
              const removals = await removeLessonMaterial(activeLesson.id, material.path);
              await canvasPort.applyArchiveMaterialRemovals(removals);
              setMaterialRefreshRevision(revision => revision + 1);
            }}
            onLocate={(path, legacyFileName) => { canvasPort?.focusArchiveMaterial(path, legacyFileName); }}
            focusedMaterialUsage={focusedMaterialUsage}
            materialUsage={canvasMaterialUsage}
            refreshRevision={materialRefreshRevision}
            onAddLink={addLessonMaterialLink}
            onClose={() => setMaterialPanelOpen(false)}
            onInsert={(material, archiveMaterialPath) => void importLessonMaterial(
              activeLesson.id,
              material,
              undefined,
              archiveMaterialPath,
            )}
            onPickDevice={() => materialInputRef.current?.click()}
            onConnectPhone={mobileCapture.state.configured ? () => {
              setMobileCaptureOpen(true);
              if (!mobileCapture.state.session) void mobileCapture.change(activeLesson.id);
            } : undefined}
            style={workspaceChromeLayout ? {
              top: workspaceChromeLayout.materialTop,
              right: workspaceChromeLayout.materialRight,
              bottom: "auto",
              height: workspaceChromeLayout.materialHeight,
            } : undefined}
          />
        )}
        <MobileCaptureControls capture={mobileCapture} open={mobileCaptureOpen} onClose={() => setMobileCaptureOpen(false)}
          lessonId={activeLesson.id} lessonTitle={activeLesson.title}/>
        <div
          ref={historyActionsRef}
          className="canvas-history-actions"
          role="group"
          aria-label={t("Canvasaktionen")}
          style={workspaceChromeLayout ? {
            top: workspaceChromeLayout.historyTop,
            right: "auto",
            left: workspaceChromeLayout.historyLeft,
          } : undefined}
        >
          <ActionButton icon="fit" label={t("Inhalt finden")} disabled={!canvasPort} onClick={() => canvasPort?.fitToContent()} />
          <span className="canvas-history-divider" aria-hidden="true"/>
          <button type="button" className="student-notes-trigger" aria-label={t("Stundennotizen")} title={t("Stundennotizen")} aria-expanded={Boolean(notesAnchor)}
            onClick={event => {
              const anchor = event.currentTarget.getBoundingClientRect();
              setMaterialPanelOpen(false);
              setStudentsEditor(null);
              setNotesAnchor(current => current ? null : anchor);
            }}><NotebookPen size={20} strokeWidth={1.8} aria-hidden="true"/></button>
          <span className="canvas-history-divider" aria-hidden="true"/>
          <ActionButton icon="undo" label={t("Rückgängig")} iconOnly disabled={!canvasPort} onClick={() => canvasPort?.undo()} />
          <ActionButton icon="redo" label={t("Wiederholen")} iconOnly disabled={!canvasPort} onClick={() => canvasPort?.redo()} />
        </div>
        {showDevControls && (
          <div className="canvas-zoom-controls" role="group" aria-label={t("Canvas-Zoom")}>
            <button
              className="canvas-zoom-button"
              type="button"
              aria-label={t("Verkleinern")}
              title={t("Verkleinern")}
              disabled={!canvasPort || zoomPercent <= 10}
              onClick={() => canvasPort?.zoomOut()}
            >
              <Minus aria-hidden="true" strokeWidth={2}/>
            </button>
            <button
              className="canvas-zoom-value"
              type="button"
              aria-label={t("Zoom auf 100 Prozent zurücksetzen, aktuell {0} Prozent", zoomPercent)}
              title={t("Auf 100 % zurücksetzen")}
              disabled={!canvasPort}
              onClick={() => canvasPort?.resetZoom()}
            >
              {zoomPercent} %
            </button>
            <button
              className="canvas-zoom-button"
              type="button"
              aria-label={t("Vergrößern")}
              title={t("Vergrößern")}
              disabled={!canvasPort || zoomPercent >= 300}
              onClick={() => canvasPort?.zoomIn()}
            >
              <Plus aria-hidden="true" strokeWidth={2}/>
            </button>
          </div>
        )}
        {materialImportError && (
          <div className="material-import-error" role="alert">
            {t(materialImportError)}
          </div>
        )}
        {pendingDock && <div className="dock-preview" data-side={pendingDock} aria-hidden="true"/>}
      </section>

      <nav
        ref={toolbarRef}
        className={`toolbar${dragPoint ? " is-dragging" : ""}${!toolbarVisible ? " is-concealed" : ""}${toolbarHasToggled ? " has-summon-motion" : ""}${!dragPoint && (openColorTool || activeTool === "shape" || insertMenu) ? " has-context-options" : ""}`}
        aria-label={t("Werkzeuge")}
        aria-hidden={!toolbarVisible}
        inert={!toolbarVisible}
        style={toolbarStyle}
      >
        <button
          ref={toolbarDragHandleRef}
          className="drag-handle"
          type="button"
          aria-label={t("Werkzeugleiste verschieben")}
          title={t("Werkzeugleiste verschieben")}
          onPointerDown={startToolbarDrag}
          onKeyDown={dockToolbarWithKeyboard}
        >
          <GripVertical aria-hidden="true" strokeWidth={2}/>
        </button>
        {!dragPoint && toolbarOverflow.backward && (
          <button
            className="toolbar-overflow-button"
            type="button"
            aria-label={t("Vorherige Werkzeuge")}
            title={t("Vorherige Werkzeuge")}
            onClick={() => scrollToolbar(-1)}
          >
            <FluentToolbarIcon name={isVerticalToolbar ? "chevronUp" : "chevronLeft"}/>
          </button>
        )}
        <div className="toolbar-items" ref={toolbarItemsRef}>
          <div className="tool-group">
            {tools.map((tool) => (
              <ToolButton
                key={tool.id}
                {...tool}
                active={!laser.active && !liveCanvas.creatingClip && (temporaryHandActive ? "hand" : activeTool) === tool.id}
                color={tool.id === "pen" ? penColor.value : tool.id === "marker" ? markerColor.value : undefined}
                optionsOpen={openColorTool === tool.id}
                shapeAppearance={tool.id === "shape"
                  ? { color: shapeColor.value, fillMode: shapeFill, shape: activeShape }
                  : undefined}
                onSelect={(tool, trigger) => {laser.cancel(); liveCanvas.setCreatingClip(false); selectTool(tool, trigger);}}
              />
            ))}
          </div>
          <div className="toolbar-divider" aria-hidden="true"/>
          <div className="action-group">
            <ActionButton
              icon="material"
              fluentIcon="material"
              label={isConvertingWord ? t("Word wird umgewandelt …") : isImportingMaterial ? t("Wird importiert") : t("Material hinzufügen")}
              shortLabel={isImportingMaterial ? t("Importiert …") : t("Material")}
              iconOnly={isVerticalToolbar}
              disabled={!canvasPort || isImportingMaterial}
              expanded={materialPanelOpen}
              onClick={() => { setNotesAnchor(null); setMaterialPanelOpen((current) => !current); }}
            />
            {embeddedApps.length > 0 && <div className="embedded-app-menu" ref={appsMenuRef}>
              <ActionButton
                icon="material"
                fluentIcon="apps"
                label="Apps"
                iconOnly={isVerticalToolbar}
                disabled={!canvasPort}
                expanded={insertMenu === "apps"}
                onClick={() => toggleInsertMenu("apps")}
              />
            </div>}
            <div className="embedded-app-menu" ref={widgetsMenuRef}>
              <ActionButton icon="material" fluentIcon="widgets" label="Widgets" iconOnly={isVerticalToolbar}
                disabled={!canvasPort} expanded={insertMenu === "widgets"} onClick={() => toggleInsertMenu("widgets")}/>
            </div>
          </div>
        </div>
        {!dragPoint && toolbarOverflow.forward && (
          <button
            className="toolbar-overflow-button"
            type="button"
            aria-label={t("Weitere Werkzeuge")}
            title={t("Weitere Werkzeuge")}
            onClick={() => scrollToolbar(1)}
          >
            <FluentToolbarIcon name={isVerticalToolbar ? "chevronDown" : "chevronRight"}/>
          </button>
        )}
        <button
          className="toolbar-visibility-button"
          type="button"
          aria-label={t("Werkzeugleiste ausblenden")}
          aria-keyshortcuts="^"
          title={t("Werkzeugleiste ausblenden (^)")}
          onClick={toggleToolbarVisibility}
        >
          <FluentToolbarIcon name={toolbar === "top" ? "chevronUp" : toolbar === "left" ? "chevronLeft" : toolbar === "right" ? "chevronRight" : "chevronDown"}/>
        </button>
        {insertMenu && (
          <div
            ref={insertPopoverRef}
            className={`embedded-app-popover${insertMenu === "widgets" ? " widgets-popover" : ""}`}
            role="menu"
            aria-label={insertMenu === "apps" ? t("Apps auswählen") : t("Widgets auswählen")}
            style={insertMenuStyle}
          >
            {insertMenu === "widgets" ? <button type="button" role="menuitem" aria-label={t("Timer einfügen")} onClick={() => {
              canvasPort?.placeTimer(); setInsertMenu(null);
            }}><Timer aria-hidden="true"/><span>Timer</span></button> : embeddedApps.map((app) => (
              <button
                type="button"
                role="menuitem"
                aria-label={t("{0} auf der Fläche öffnen", app.name)}
                key={app.id}
                onClick={() => {
                  canvasPort?.placeEmbeddedApp(app.id);
                  setInsertMenu(null);
                }}
              >
                <img src={app.iconUrl} alt=""/>
                <span>{app.name}</span>
              </button>
            ))}
          </div>
        )}
        {activeTool === "shape" && !dragPoint && (
          <ShapeOptions
            activeShape={activeShape}
            color={shapeColor.id}
            fillMode={shapeFill}
            onColorSelect={selectShapeColor}
            onFillSelect={selectShapeFill}
            onSelect={selectShape}
          />
        )} 
        {openColorTool && toolColorAnchor && !dragPoint && (
          <ToolInkOptions
            anchor={toolColorAnchor}
            tool={openColorTool}
            colors={openColorTool === "pen" ? currentPenColors : markerColors}
            selectedColor={openColorTool === "pen" ? penColor.id : markerColor.id}
            selectedStrokeSize={openColorTool === "pen" ? penStrokeSizeId : markerStrokeSizeId}
            onColorSelect={(color) => selectToolColor(openColorTool, color)}
            onStrokeSizeSelect={(sizeId) => selectToolStrokeSize(openColorTool, sizeId)}
          />
        )}
      </nav>

      {!toolbarVisible && <button
        ref={toolbarRecallRef}
        className="toolbar-recall"
        type="button"
        aria-label={t("Werkzeugleiste einblenden")}
        aria-keyshortcuts="^"
        title={t("Werkzeugleiste einblenden (^)")}
        onClick={toggleToolbarVisibility}
      ><FluentToolbarIcon name="toolbarToggle"/></button>}

      <input
        ref={materialInputRef}
        className="material-file-input"
        type="file"
        aria-label={t("Material auswählen")}
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf,image/png,image/jpeg,image/webp,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.webm,.flac,audio/*,.mp4,video/mp4"
        multiple
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          void importMaterialFiles(files);
        }}
      />

    </main>
  );
}
