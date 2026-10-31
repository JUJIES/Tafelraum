/** Injected into trusted, manifest-validated local HTML packages. The package
 * owns semantic state; the bridge only transports it across the sandbox. */
export function installInteractiveHtmlStateBridge() {
  const fieldSelector = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
  let api = null;
  let apiKind = null;
  let unsubscribe = null;
  let applying = false;
  let peerRole = "teacher";
  let peerKey = null;
  let peerField = null;
  let peerBadge = null;
  let peerPresence = null;
  let peerActive = false;
  let peerScrollPending = false;
  let peerTextOverlay = null;
  let textMirror = null;
  let focusReportFrame = null;
  let lastFocusReport = null;
  let reportedFieldKey = null;

  const stateFields = () => {
    const occurrences = new Map();
    return [...document.querySelectorAll(fieldSelector)].map((element, index) => {
      const tag = element.tagName.toLowerCase();
      const type = tag === "input" ? (element.getAttribute("type") || "text").toLowerCase() : tag;
      const preferred = element.getAttribute("data-tafelraum-state-key")
        || element.id
        || element.getAttribute("name")
        || element.getAttribute("aria-label")
        || `${tag}-${type}-${index + 1}`;
      const base = `${tag}:${type}:${preferred}`;
      const occurrence = (occurrences.get(base) || 0) + 1;
      occurrences.set(base, occurrence);
      return { element, key: occurrence === 1 ? base : `${base}:${occurrence}` };
    });
  };

  const createFormApi = () => {
    if (stateFields().length === 0) return null;
    return {
      getState() {
        const fields = {};
        for (const { element, key } of stateFields()) {
          if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
            fields[key] = { kind: "checked", value: element.checked };
          } else if (element instanceof HTMLSelectElement && element.multiple) {
            fields[key] = { kind: "selected", value: [...element.selectedOptions].map(option => option.value) };
          } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            fields[key] = { kind: "value", value: element.value };
          } else {
            fields[key] = { kind: "text", value: element.textContent || "" };
          }
        }
        return { version: 1, fields };
      },
      applyState(state) {
        if (!state || state.version !== 1 || !state.fields || typeof state.fields !== "object" || Array.isArray(state.fields)) return;
        for (const { element, key } of stateFields()) {
          const entry = state.fields[key];
          if (!entry || typeof entry !== "object") continue;
          if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
            if (typeof entry.value === "boolean") element.checked = entry.value;
          } else if (element instanceof HTMLSelectElement && element.multiple) {
            const selected = Array.isArray(entry.value) ? new Set(entry.value.filter(value => typeof value === "string")) : new Set();
            for (const option of element.options) option.selected = selected.has(option.value);
          } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            if (typeof entry.value === "string" && element.value !== entry.value) element.value = entry.value;
          } else if (typeof entry.value === "string") {
            if (element.textContent !== entry.value) element.textContent = entry.value;
          }
        }
      },
    };
  };

  const focusedFieldKey = () => {
    const focused = document.activeElement;
    if (!(focused instanceof Element)) return null;
    return stateFields().find(({ element }) => element === focused)?.key ?? null;
  };
  const fieldText = (field) => field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
    ? field.value : field.textContent || "";

  const textPresence = (field, selectionOffsets = null, revealCaret = false) => {
    const control = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement;
    const text = fieldText(field);
    const box = field.getBoundingClientRect();
    if (!box.width || !box.height || text.length > 65_536) return null;
    let range, origin = box, caret, offsets = selectionOffsets;
    if (control || field.isContentEditable && text === "") {
      if (control && (field.type === "password" || field.selectionStart === null)) return null;
      if (!textMirror) {
        textMirror = document.createElement("div");
        textMirror.setAttribute("aria-hidden", "true");
        document.body.append(textMirror);
      }
      // Native inputs expose offsets but no DOM Range. Measure their text in a
      // hidden box with the same typography, padding, alignment and scroll.
      textMirror.style.cssText = "all:initial;position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;display:block;overflow:hidden;margin:0;box-sizing:border-box;";
      const css = getComputedStyle(field);
      for (const property of ["font-family", "font-size", "font-style", "font-weight", "font-stretch", "font-variant",
        "font-feature-settings", "font-variation-settings", "font-kerning", "line-height", "letter-spacing", "word-spacing", "text-align",
        "text-indent", "text-transform", "direction", "tab-size", "padding-top", "padding-right", "padding-bottom",
        "padding-left", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "word-break", "hyphens"]) {
        textMirror.style.setProperty(property, css.getPropertyValue(property));
      }
      Object.assign(textMirror.style, {
        width: `${field.clientWidth + parseFloat(css.borderLeftWidth) + parseFloat(css.borderRightWidth)}px`,
        height: `${field.clientHeight + parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth)}px`,
        borderStyle: "solid", whiteSpace: field instanceof HTMLInputElement ? "pre" : css.whiteSpace,
        overflowWrap: field instanceof HTMLInputElement ? "normal" : css.overflowWrap });
      if (field instanceof HTMLInputElement) textMirror.style.lineHeight = `${Math.max(1,
        field.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom))}px`;
      // Keep the end marker in its own inline formatting box. WebKit can
      // shape a trailing zero-width character together with the last glyph and
      // report the caret halfway through that glyph instead of after it.
      const textNode = document.createTextNode(text);
      const endMarker = document.createElement("span");
      endMarker.style.cssText = "display:inline-block;width:0;";
      endMarker.textContent = "\u200b";
      textMirror.replaceChildren(textNode, endMarker);
      textMirror.scrollLeft = field.scrollLeft;
      textMirror.scrollTop = field.scrollTop;
      origin = textMirror.getBoundingClientRect();
      range = document.createRange();
      const start = offsets?.start ?? (control ? field.selectionStart : 0), end = offsets?.end ?? (control ? field.selectionEnd : 0);
      offsets = { start, end };
      range.setStart(textMirror.firstChild, start);
      range.setEnd(textMirror.firstChild, end);
      caret = range.collapsed;
      if (caret && start === text.length) range.selectNodeContents(endMarker);
      else if (caret && !range.getBoundingClientRect().height) range.setEnd(textNode, start + 1);
    } else {
      if (!field.isContentEditable) return null;
      if (offsets) {
        // Construct a detached Range; never set Room's actual DOM selection.
        const pointAt = (offset) => {
          const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT);
          let node, last = null;
          while ((node = walker.nextNode())) {
            last = node;
            if (offset <= node.textContent.length) return [node, offset];
            offset -= node.textContent.length;
          }
          return last ? [last, last.textContent.length] : [field, 0];
        };
        range = document.createRange();
        range.setStart(...pointAt(offsets.start));
        range.setEnd(...pointAt(offsets.end));
      } else {
        const selection = window.getSelection();
        if (!selection?.rangeCount || !field.contains(selection.anchorNode) || !field.contains(selection.focusNode)) return null;
        range = selection.getRangeAt(0);
        const prefix = document.createRange();
        prefix.selectNodeContents(field);
        prefix.setEnd(range.startContainer, range.startOffset);
        const start = prefix.toString().length;
        prefix.setEnd(range.endContainer, range.endOffset);
        offsets = { start, end: prefix.toString().length };
      }
      caret = range.collapsed;
    }
    const width = control ? field.offsetWidth : origin.width, height = control ? field.offsetHeight : origin.height;
    const left = control ? field.clientLeft : 0, top = control ? field.clientTop : 0;
    const right = control ? left + field.clientWidth : width, bottom = control ? top + field.clientHeight : height;
    if (revealCaret && caret && control && !field.readOnly) {
      const rect = range.getBoundingClientRect(), x = rect.left - origin.left, y = rect.top - origin.top;
      const css = getComputedStyle(field);
      const innerLeft = left + (parseFloat(css.paddingLeft) || 0), innerRight = right - (parseFloat(css.paddingRight) || 0);
      const dx = x < innerLeft ? x - innerLeft : x + 2 > innerRight ? x + 2 - innerRight : 0;
      const dy = y < top ? y - top : y + rect.height > bottom ? y + rect.height - bottom : 0;
      // Only the dormant receiving field is scrolled, never its focus or selection.
      if (dx) { field.scrollLeft += dx; textMirror.scrollLeft = field.scrollLeft; }
      if (dy) { field.scrollTop += dy; textMirror.scrollTop = field.scrollTop; }
    }
    const rects = [];
    if (!(caret && control && field.readOnly)) for (const rect of range.getClientRects()) {
      let x = rect.left - origin.left, y = rect.top - origin.top;
      const rectWidth = caret ? 2 : rect.width;
      if (caret && x >= right - 1 && x <= right + 1) x = right - 2;
      const x2 = Math.min(right, x + rectWidth), y2 = Math.min(bottom, y + rect.height);
      x = Math.max(left, x); y = Math.max(top, y);
      if (x2 > x && y2 > y) rects.push({ x: x / width, y: y / height, width: (x2 - x) / width, height: (y2 - y) / height });
      if (rects.length === 128 || caret && rects.length) break;
    }
    return { text, caret, rects, selection: offsets, scroll: { x: field.scrollLeft, y: field.scrollTop } };
  };
  const reportFocus = (key = focusedFieldKey() ?? (!document.hasFocus() ? reportedFieldKey : null)) => {
    reportedFieldKey = key;
    const field = key ? stateFields().find(({ key: fieldKey }) => fieldKey === key)?.element : null;
    const message = { type: "tafelraum:interactive-focus", key: typeof key === "string" && key.length <= 200 ? key : null,
      active: document.hasFocus(), presence: field ? textPresence(field) : null };
    const signature = JSON.stringify(message);
    if (signature === lastFocusReport) return;
    lastFocusReport = signature;
    window.parent.postMessage(message, "*");
  };
  const scheduleFocusReport = () => {
    if (focusReportFrame !== null) return;
    focusReportFrame = requestAnimationFrame(() => { focusReportFrame = null; reportFocus(); });
  };
  document.addEventListener("focusin", () => { reportFocus(); scheduleFocusReport(); renderPeerText(); }, true);
  document.addEventListener("selectionchange", scheduleFocusReport);
  document.addEventListener("select", scheduleFocusReport, true);
  document.addEventListener("input", () => { scheduleFocusReport(); renderPeerText(); }, true);
  document.addEventListener("keyup", scheduleFocusReport, true);
  document.addEventListener("pointerup", scheduleFocusReport, true);
  window.addEventListener("focus", scheduleFocusReport);
  window.addEventListener("blur", () => { reportFocus(); renderPeerText(); });
  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(fieldSelector)) reportFocus(null);
  }, true);

  const renderPeerText = () => {
    peerTextOverlay?.remove(); peerTextOverlay = null;
    const presence = peerPresence;
    if (!peerField || !peerActive || (!presence?.rects?.length && !presence?.selection) || fieldText(peerField) !== presence.text
      || document.hasFocus() && document.activeElement === peerField) return;
    // Only the dormant field's inner viewport follows its peer. The receiver's
    // document scroll and its own active field remain independent.
    if (peerScrollPending) {
      peerField.scrollLeft = presence.scroll.x;
      peerField.scrollTop = presence.scroll.y;
      peerScrollPending = false;
    }
    // Text offsets are semantic; pixel geometry belongs to the receiving field.
    // Legacy reports without offsets retain their existing rectangle projection.
    const localPresence = presence.selection ? textPresence(peerField, presence.selection, true) : presence;
    if (!localPresence) return;
    const box = peerField.getBoundingClientRect();
    let left = Math.max(0, box.left), top = Math.max(0, box.top), right = Math.min(innerWidth, box.right), bottom = Math.min(innerHeight, box.bottom);
    for (let parent = peerField.parentElement; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent), rect = parent.getBoundingClientRect();
      if (/auto|scroll|hidden|clip/.test(css.overflowX)) { left = Math.max(left, rect.left); right = Math.min(right, rect.right); }
      if (/auto|scroll|hidden|clip/.test(css.overflowY)) { top = Math.max(top, rect.top); bottom = Math.min(bottom, rect.bottom); }
    }
    if (right <= left || bottom <= top) return;
    peerTextOverlay = document.createElement("div");
    peerTextOverlay.id = "tafelraum-peer-text";
    peerTextOverlay.setAttribute("aria-hidden", "true");
    Object.assign(peerTextOverlay.style, { position: "fixed", pointerEvents: "none", zIndex: "2147483646", overflow: "hidden",
      left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`,
      clipPath: `inset(${top - box.top}px ${box.right - right}px ${box.bottom - bottom}px ${left - box.left}px)` });
    for (const rect of localPresence.rects) {
      const mark = document.createElement("div");
      mark.setAttribute(presence.caret ? "data-tafelraum-peer-caret" : "data-tafelraum-peer-selection", "");
      mark.setAttribute(`data-tafelraum-${peerRole}-${presence.caret ? "caret" : "selection"}`, "");
      Object.assign(mark.style, { position: "absolute", left: `${rect.x * 100}%`, top: `${rect.y * 100}%`,
        width: `${rect.width * 100}%`, height: `${rect.height * 100}%`, background: peerRole === "student" ? presence.caret ? "#176eaa" : "#176eaa4d" : presence.caret ? "#a9472c" : "#d765424d" });
      peerTextOverlay.append(mark);
    }
    document.body.append(peerTextOverlay);
  };

  const showPeerFocus = (key, presence = peerPresence, active = peerActive, role = peerRole) => {
    peerScrollPending ||= key !== peerKey || presence !== peerPresence;
    peerKey = typeof key === "string" && key.length <= 200 ? key : null;
    peerPresence = presence; peerActive = active === true; peerRole = role;
    peerField?.removeAttribute("data-tafelraum-peer-focus");
    peerField?.removeAttribute("data-tafelraum-teacher-focus");
    peerField?.removeAttribute("data-tafelraum-student-focus");
    peerField = peerKey ? stateFields().find(({ key: fieldKey }) => fieldKey === peerKey)?.element ?? null : null;
    if (!peerField) { peerBadge?.remove(); peerBadge = null; renderPeerText(); return; }
    if (!document.getElementById("tafelraum-peer-focus-style")) {
      const style = document.createElement("style");
      style.id = "tafelraum-peer-focus-style";
      style.textContent = '[data-tafelraum-peer-focus]{outline:3px solid #d76542 !important;outline-offset:2px !important}'
        + '[data-tafelraum-peer-focus=student]{outline-color:#176eaa!important}'
        + '#tafelraum-peer-focus-badge{position:fixed;z-index:2147483647;pointer-events:none;display:block;'
        + 'padding:3px 7px;border-radius:6px;background:#a9472c;color:#fff;box-shadow:0 2px 8px #0003;'
        + 'font:600 12px/18px system-ui,sans-serif;white-space:nowrap}'
        + '[data-tafelraum-peer-caret]{animation:tafelraum-teacher-blink 1s steps(1,end) infinite}'
        + '@keyframes tafelraum-teacher-blink{50%{opacity:0}}'
        + '@media(prefers-reduced-motion:reduce){[data-tafelraum-peer-caret]{animation:none}}';
      document.head.append(style);
    }
    peerField.setAttribute("data-tafelraum-peer-focus", peerRole);
    peerField.setAttribute(`data-tafelraum-${peerRole}-focus`, "");
    if (!peerBadge) {
      peerBadge = document.createElement("div");
      peerBadge.id = "tafelraum-peer-focus-badge";
      peerBadge.setAttribute("aria-hidden", "true");
      document.body.append(peerBadge);
    }
    peerBadge.textContent = peerRole === "student" ? "Schüler" : "Lehrkraft";
    peerBadge.style.background = peerRole === "student" ? "#176eaa" : "#a9472c";
    const rect = peerField.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) {
      peerBadge.style.display = "none";
      renderPeerText();
      return;
    }
    peerBadge.style.display = "block";
    peerBadge.style.left = `${Math.max(4, Math.min(Math.max(4, innerWidth - 82), rect.right - 78))}px`;
    peerBadge.style.top = `${rect.top >= 28 ? rect.top - 27 : Math.min(innerHeight - 25, rect.bottom + 4)}px`;
    renderPeerText();
  };
  const refreshFocusGeometry = () => { scheduleFocusReport(); if (peerKey) showPeerFocus(peerKey); };
  window.addEventListener("resize", refreshFocusGeometry);
  document.addEventListener("scroll", (event) => { if (event.target !== textMirror) refreshFocusGeometry(); }, true);
  document.fonts?.addEventListener("loadingdone", refreshFocusGeometry);

  const post = (origin="local",applyId=null) => {
    if (!api || applying || origin==="local"&&window.tafelraumPlaybackMirror?.isApplying?.()) return;
    try { window.parent.postMessage({ type: "tafelraum:interactive-state", state: api.getState(), origin, applyId }, "*"); }
    catch { /* Invalid package state is rejected by the parent. */ }
  };

  const onFormChange = (event) => {
    if (apiKind !== "form" || !(event.target instanceof Element) || !event.target.closest(fieldSelector)) return;
    post();
  };
  const onStateChange=()=>post();

  const disconnect = () => {
    unsubscribe?.();
    unsubscribe = null;
    window.removeEventListener("tafelraum:statechange", onStateChange);
    document.removeEventListener("input", onFormChange, true);
    document.removeEventListener("change", onFormChange, true);
  };

  const connect = () => {
    const candidate = window.tafelraumLive;
    if (candidate && typeof candidate.getState === "function" && typeof candidate.applyState === "function") {
      if (api === candidate) { post(); return true; }
      disconnect();
      api = candidate;
      apiKind = "package";
      if (typeof api.subscribe === "function") unsubscribe = api.subscribe(onStateChange);
      window.addEventListener("tafelraum:statechange", onStateChange);
      post();
      return true;
    }
    if (apiKind === "form") return true;
    const formApi = createFormApi();
    if (!formApi) return false;
    disconnect();
    api = formApi;
    apiKind = "form";
    document.addEventListener("input", onFormChange, true);
    document.addEventListener("change", onFormChange, true);
    post();
    return true;
  };
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if(message?.type === "tafelraum:interactive-input-enabled" && typeof message.enabled === "boolean") {
      document.body.inert = !message.enabled;
      if(!message.enabled && document.activeElement instanceof HTMLElement) document.activeElement.blur();
      return;
    }
    if (message?.type === "tafelraum:interactive-teacher-focus") { showPeerFocus(message.key, message.presence, message.active, "teacher"); return; }
    if (message?.type === "tafelraum:interactive-peer-focus" && ["teacher", "student"].includes(message.role)) {
      showPeerFocus(message.key, message.presence, message.active, message.role); return;
    }
    if (message?.type === "tafelraum:interactive-request-state") { connect(); post(); return; }
    if (!message || message.type !== "tafelraum:interactive-apply") return;
    if (!api && !connect()) return;
    const focused=document.activeElement;
    const editable=focused instanceof HTMLInputElement||focused instanceof HTMLTextAreaElement;
    const previousValue=editable?focused.value:null;
    const selection=editable&&focused.selectionStart!==null
      ?{start:focused.selectionStart,end:focused.selectionEnd,direction:focused.selectionDirection}:null;
    applying = true;
    try { api.applyState(message.state); } finally { applying = false; }
    if(message.preserveFocusedValue===true&&document.hasFocus()&&editable&&document.activeElement===focused&&previousValue!==null
      &&focused.value!==previousValue)focused.value=previousValue;
    if(editable&&document.activeElement===focused&&focused.value===previousValue&&selection)
      focused.setSelectionRange(selection.start,selection.end,selection.direction);
    if (peerKey) showPeerFocus(peerKey);
    post("apply",message.applyId);
    scheduleFocusReport();
  });
  connect();
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const connected = connect();
    if ((apiKind === "package" && connected) || attempts >= 100) window.clearInterval(timer);
  }, 50);
}
