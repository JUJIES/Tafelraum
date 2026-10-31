import { t, useUiLocale } from "./i18n";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2, Users } from "lucide-react";
import type { ArchiveClassDefinition } from "./lesson-catalog";

type Props = {
  classes: ArchiveClassDefinition[];
  activeId: string;
  enabled: boolean;
  onSelect(id: string): void;
  onTrash(id: string): void;
  trashUnavailableReason?: string;
  onEditStudents(id: string, anchor: DOMRect): void;
  onSave(id: string, label: string, previousLabel?: string): Promise<void>;
  onContextMenu(event: MouseEvent<HTMLButtonElement>): void;
  onContextKey(event: KeyboardEvent<HTMLButtonElement>): void;
};

export function ClassPicker({ classes, activeId, enabled, onSelect, onTrash, trashUnavailableReason, onEditStudents, onSave, onContextMenu, onContextKey }: Props) {
  useUiLocale();
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<{ id: string; previousLabel?: string } | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const active = classes.find((entry) => entry.id === activeId) ?? classes[0];

  function close(restoreFocus = false) {
    if (saving) return;
    setOpen(false);
    setEditor(null);
    setError("");
    if (restoreFocus) trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, saving]);

  useEffect(() => {
    if (editor) {
      input.current?.focus();
      input.current?.select();
    } else if (open) {
      root.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
    }
  }, [editor, open]);

  useEffect(() => {
    if (error && !saving) input.current?.focus();
  }, [error, saving]);

  function beginRename() {
    setName(active.label);
    setError("");
    setEditor({ id: active.id, previousLabel: active.label });
  }

  return (
    <div className="class-picker" ref={root} onKeyDown={(event) => {
      // Keep editor keys away from canvas shortcuts.
      if (event.key === "Escape") {
        event.stopPropagation();
        if (editor && !saving) { setEditor(null); setError(""); }
        else close(true);
      }
      if (!editor && open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>(".class-picker-popover button:not(:disabled)") ?? []);
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
          : (current + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
        buttons[index]?.focus();
      }
    }} onBlur={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close();
    }}>
      <button ref={trigger} type="button" className="class-picker-trigger"
        aria-label={t("Klassen & Kurse: {0}", active.label)} aria-expanded={open} aria-controls="class-picker-popover"
        title={active.label}
        onClick={() => open ? close() : setOpen(true)}
        onContextMenu={onContextMenu}
        onKeyDown={(event) => {
          onContextKey(event);
          if (!event.defaultPrevented && event.key === "ArrowDown" && !open) { event.preventDefault(); setOpen(true); }
        }}>
        <span>{active.label}</span><ChevronDown aria-hidden="true" size={17} />
      </button>
      {open && <div className="class-picker-popover" id="class-picker-popover" role="group" aria-label={t("Klassen & Kurse")}>
        {editor ? <form className="class-picker-editor" onSubmit={async (event) => {
          event.preventDefault();
          if (saving || !name.trim()) return;
          setSaving(true); setError("");
          try {
            await onSave(editor.id, name.trim(), editor.previousLabel);
            setOpen(false); setEditor(null); trigger.current?.focus();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen.");
          } finally { setSaving(false); }
        }}>
          <label htmlFor="class-picker-name">{editor.previousLabel === undefined ? t("Klasse oder Kurs anlegen") : t("Umbenennen")}</label>
          <input ref={input} id="class-picker-name" aria-label={t("Name")} placeholder={t("Name")} value={name}
            maxLength={100} disabled={saving} autoComplete="off"
            onChange={(event) => { setName(event.target.value); setError(""); }}
            aria-invalid={Boolean(error)} aria-describedby={error ? "class-picker-error" : undefined} />
          {error && <p id="class-picker-error" role="alert">{t(error)}</p>}
          <div className="class-picker-editor-actions">
            <button type="button" disabled={saving} onClick={() => { setEditor(null); setError(""); }}>{t("Abbrechen")}</button>
            <button type="submit" disabled={saving || !name.trim()}>{saving ? t("Speichern…") : editor.previousLabel === undefined ? t("Anlegen") : t("Speichern")}</button>
          </div>
        </form> : <>
          <div className="class-picker-heading">{t("Klassen & Kurse")}</div>
          <div className="class-picker-list">
            {classes.map((entry) => <button type="button" className="class-picker-option" key={entry.id}
              aria-current={entry.id === active.id ? "true" : undefined}
              onClick={() => { onSelect(entry.id); close(true); }}>
              <span>{entry.label}</span><Check size={17} aria-hidden="true" style={{ visibility: entry.id === active.id ? "visible" : "hidden" }} />
            </button>)}
          </div>
          <div className="class-picker-actions">
            <button type="button" disabled={!enabled} onClick={() => { const anchor = trigger.current?.getBoundingClientRect(); close(); if (anchor) onEditStudents(active.id, anchor); }}><Users size={17} aria-hidden="true"/><span>{t("Schüler:innen bearbeiten")}</span></button>
            <button type="button" disabled={!enabled} onClick={() => {
              setName(""); setError(""); setEditor({ id: `class-${crypto.randomUUID()}` });
            }}><Plus size={18} aria-hidden="true" /><span>{t("Klasse oder Kurs anlegen")}</span></button>
            <button type="button" disabled={!enabled} onClick={beginRename}><Pencil size={17} aria-hidden="true" /><span>{t("Umbenennen")}</span></button>
            <button type="button" className="is-destructive" disabled={!enabled || Boolean(trashUnavailableReason)} title={trashUnavailableReason ? t(trashUnavailableReason) : undefined}
              onClick={() => { close(true); onTrash(active.id); }}><Trash2 size={17} aria-hidden="true" /><span>{t("Löschen")}</span></button>
          </div>
        </>}
      </div>}
    </div>
  );
}
