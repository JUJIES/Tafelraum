/** Versioned, engine-independent local preparation commands. Shared by host and broker. */
export const canvasAgentProtocol = 'tafelraum-canvas-agent-v1';
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const finite = (v, min = -100000, max = 100000) => Number.isFinite(v) && v >= min && v <= max;
const color = v => v === undefined || /^#[a-f0-9]{6}$/i.test(v);
const object = v => v && typeof v === 'object' && !Array.isArray(v);
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function geometry(v) {
  requireValue(object(v) && finite(v.x) && finite(v.y) && finite(v.width, 1, 20000) && finite(v.height, 1, 20000), 'Ungültige Canvasgeometrie.');
  return {x:v.x,y:v.y,width:v.width,height:v.height};
}
export function readCanvasAgentCommand(value) {
  requireValue(object(value), 'Ungültiger Agent-Befehl.');
  if (value.type === 'inspect') return {type:'inspect'};
  requireValue(typeof value.expectedRevision === 'string' && value.expectedRevision.length <= 200, 'Aktuelle Canvasrevision erforderlich.');
  const base = {expectedRevision:value.expectedRevision};
  if (value.type === 'clip') {
    requireValue(Number.isInteger(value.number) && value.number >= 1 && value.number <= 99, 'Ungültige Clipnummer.');
    requireValue(value.elementId === undefined || id(value.elementId), 'Ungültiges Clipziel.');
    requireValue(value.replace === undefined || typeof value.replace === 'boolean', 'Ungültige Clipoption.');
    return {...base,type:'clip',number:value.number,replace:value.replace === true,...(value.elementId ? {elementId:value.elementId} : {rect:geometry(value.rect)})};
  }
  requireValue(value.type === 'apply' && Array.isArray(value.operations) && value.operations.length <= 100, 'Maximal 100 Canvasoperationen je Auftrag.');
  const keys = new Set();
  const operations = value.operations.map(op => {
    requireValue(object(op), 'Ungültige Canvasoperation.');
    if (op.type === 'transform') {
      requireValue(id(op.elementId) && (op.angle === undefined || finite(op.angle, -Math.PI*20, Math.PI*20)), 'Ungültiges Transformationsziel.');
      return {type:op.type,elementId:op.elementId,...geometry(op),...(op.angle === undefined ? {} : {angle:op.angle})};
    }
    if (op.type === 'setText') {
      requireValue(id(op.elementId) && typeof op.text === 'string' && op.text.trim().length > 0 && op.text.length <= 10000, 'Ungültiger Text.');
      return {type:op.type,elementId:op.elementId,text:op.text};
    }
    requireValue(id(op.key) && !keys.has(op.key) && finite(op.x) && finite(op.y), 'Eindeutiger Objektschlüssel und gültige Position erforderlich.'); keys.add(op.key);
    const position = {key:op.key,x:op.x,y:op.y};
    if (op.type === 'text') {
      requireValue(typeof op.text === 'string' && op.text.trim().length > 0 && op.text.length <= 10000 && (op.fontSize === undefined || finite(op.fontSize,12,200)) && color(op.color), 'Ungültiger Text oder Schriftstil.');
      return {...position,type:'text',text:op.text,fontSize:op.fontSize ?? 28,...(op.color ? {color:op.color} : {})};
    }
    if (op.type === 'shape') {
      requireValue(['rectangle','ellipse','diamond'].includes(op.shape ?? 'rectangle') && color(op.color) && (op.fill === undefined || op.fill === 'transparent' || color(op.fill)), 'Ungültige Form oder Farbe.');
      return {...position,...geometry(op),type:'shape',shape:op.shape ?? 'rectangle',...(op.color ? {color:op.color} : {}),fill:op.fill ?? 'transparent'};
    }
    requireValue(op.type === 'material' && typeof op.path === 'string' && op.path.length <= 1000 && op.path.length > 0 && !op.path.split('/').includes('..'), 'Unbekannte Operation oder ungültiger Materialpfad.');
    return {...position,type:'material',path:op.path};
  });
  let viewport;
  if (value.viewport !== undefined) {
    const v = value.viewport;
    requireValue(object(v) && finite(v.scrollX) && finite(v.scrollY) && finite(v.zoom, .1, 3), 'Ungültige Startansicht.');
    viewport = {scrollX:v.scrollX,scrollY:v.scrollY,zoom:v.zoom};
  }
  requireValue(operations.length > 0 || viewport, 'Leerer Änderungsauftrag.');
  return {...base,type:'apply',operations,...(viewport ? {viewport} : {})};
}
