import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { installInteractiveHtmlStateBridge } from './interactive-html-state-bridge.mjs';

test('Room focus keeps the chosen teacher field while outside clicks clear it permanently', () => {
  const documentListeners = new Map(), windowListeners = new Map(), posted = [], frames = [];
  class Element {
    tagName = 'INPUT';
    id = 'choice';
    closest() {return this;}
    getAttribute(name) { return name === 'type' ? 'checkbox' : name === 'id' ? 'choice' : null; }
    getBoundingClientRect() { return { width: 100, height: 30 }; }
  }
  class Input extends Element { type = 'checkbox'; value = ''; checked = false; selectionStart = null; }
  const field = new Input();
  let hasFocus = true;
  const document = { activeElement: field, hasFocus: () => hasFocus,
    querySelectorAll: () => [field],
    addEventListener: (type, fn) => documentListeners.set(type, fn), removeEventListener() {} };
  const window = { parent: { postMessage: message => posted.push(message) },
    addEventListener: (type, fn) => windowListeners.set(type, fn), removeEventListener() {},
    setInterval: () => 1, clearInterval() {} };
  vm.runInNewContext(`(${installInteractiveHtmlStateBridge.toString()})()`, {
    window, document, Element, HTMLInputElement: Input, HTMLTextAreaElement: class {}, HTMLSelectElement: class {},
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  });
  let mirroring=false;
  window.tafelraumPlaybackMirror={isApplying:()=>mirroring};
  const stateCount=()=>posted.filter(message=>message.type==='tafelraum:interactive-state').length;
  const beforeMirror=stateCount();mirroring=true;
  field.checked=true;documentListeners.get('input')({target:field});
  assert.equal(stateCount(),beforeMirror,'following playback does not create semantic writes');
  mirroring=false;documentListeners.get('input')({target:field});
  assert.equal(stateCount(),beforeMirror+1,'real semantic edits still publish');
  const flush = () => { while (frames.length) frames.shift()(); };
  const focus = () => posted.filter(message => message.type === 'tafelraum:interactive-focus').at(-1);
  documentListeners.get('focusin')(); flush();
  assert.equal(focus().key, 'input:checkbox:choice');
  assert.equal(focus().active, true);

  // A field can lose activeElement when the other window receives input.
  hasFocus = false; document.activeElement = new Element();
  windowListeners.get('blur')(); documentListeners.get('selectionchange')(); flush();
  assert.equal(focus().key, 'input:checkbox:choice');
  assert.equal(focus().active, false);

  documentListeners.get('pointerdown')({ target: null });
  documentListeners.get('selectionchange')(); flush();
  assert.equal(focus().key, null);

  hasFocus = true; document.activeElement = field;
  windowListeners.get('focus')(); flush();
  assert.equal(focus().key, 'input:checkbox:choice');
  assert.equal(focus().active, true);
});

// DOM boundary contract: the actual WebKit glyph regression is also exercised
// in the native fixture documented in 23_ROOM_CANVAS_INPUT_TEST.md.
function measureControlPresence(text, start, end = start, multiline = false) {
  const listeners = new Map(), posted = [], measured = [];
  class Element {
    constructor(tagName = 'DIV') {
      this.tagName = tagName; this.children = []; this.scrollLeft = 0; this.scrollTop = 0;
      this.style = { setProperty() {} };
    }
    setAttribute() {}
    append(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
    get firstChild() { return this.children[0]; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 30 }; }
    getAttribute(name) { return name === 'id' ? 'answer' : null; }
  }
  class Input extends Element {
    constructor() { super('INPUT'); this.type = 'text'; }
  }
  class Textarea extends Element { constructor() { super('TEXTAREA'); } }
  const field = new (multiline ? Textarea : Input)();
  Object.assign(field, { value: text, selectionStart: start, selectionEnd: end,
    clientWidth: 98, clientHeight: 28, clientLeft: 1, clientTop: 1, offsetWidth: 100, offsetHeight: 30 });
  const css = { borderLeftWidth: '1', borderRightWidth: '1', borderTopWidth: '1', borderBottomWidth: '1',
    paddingTop: '3', paddingBottom: '3', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', getPropertyValue() { return ''; } };
  const document = { activeElement: field, hasFocus: () => true, querySelectorAll: () => [field],
    addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener() {},
    body: new Element('BODY'), createElement: tag => new Element(tag.toUpperCase()),
    createTextNode: textContent => ({ textContent }),
    createRange() {
      return { collapsed: true,
        setStart(node, offset) { this.node = node; this.start = offset; },
        setEnd(node, offset) { this.end = offset; this.collapsed = this.start === offset; },
        selectNodeContents(node) { this.node = node; this.marker = true; this.collapsed = false; },
        getBoundingClientRect() { return { left: this.marker ? 4 + text.length * 10 : 4 + this.start * 10, top: 4, width: 0, height: 20 }; },
        getClientRects() { measured.push(this); return [{ ...this.getBoundingClientRect(), width: this.marker ? 0 : (this.end - this.start) * 10 }]; },
      };
    } };
  const window = { parent: { postMessage: message => posted.push(message) }, addEventListener() {}, removeEventListener() {},
    setInterval: () => 1, clearInterval() {} };
  vm.runInNewContext(`(${installInteractiveHtmlStateBridge.toString()})()`, {
    window, document, Element, HTMLInputElement: Input, HTMLTextAreaElement: Textarea, HTMLSelectElement: class {},
    getComputedStyle: () => css, requestAnimationFrame: () => 1,
  });
  listeners.get('focusin')();
  return { presence: posted.findLast(message => message.type === 'tafelraum:interactive-focus').presence,
    mirror: document.body.firstChild, measured: measured.at(-1) };
}

test('native control end caret uses an isolated zero-width marker rather than splitting the last glyph', () => {
  for (const multiline of [false, true]) for (const text of ['', 'sdsdsd', 'word\n']) {
    const { presence, mirror, measured } = measureControlPresence(text, text.length, text.length, multiline);
    assert.equal(mirror.firstChild.textContent, text, 'sentinel must not join the original text node');
    assert.equal(mirror.children[1].tagName, 'SPAN');
    assert.match(mirror.children[1].style.cssText, /inline-block;width:0/);
    assert.equal(measured.node, mirror.children[1]);
    assert.equal(presence.caret, true);
    assert.deepEqual(JSON.parse(JSON.stringify(presence.selection)), { start: text.length, end: text.length });
    assert.equal(presence.rects[0].x, (4 + text.length * 10) / 100);
  }
});

test('native control interior caret and selection keep the original text range', () => {
  for (const [start, end] of [[2, 2], [1, 6]]) {
    const { presence, mirror, measured } = measureControlPresence('sdsdsd', start, end);
    assert.equal(measured.node, mirror.firstChild);
    assert.equal(presence.caret, start === end);
    assert.equal(presence.rects[0].x, (4 + start * 10) / 100);
    assert.equal(presence.rects[0].width, (start === end ? 2 : (end - start) * 10) / 100);
  }
});

test('shared peer marker switches between Schüler and Lehrkraft without stealing local input focus', () => {
  const listeners = new Map(), nodes = [];
  class Element {
    constructor(tag = 'DIV') { this.tagName = tag; this.attributes = new Map(); this.style = {}; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    getAttribute(name) { return name === 'id' ? this.id : name === 'type' ? 'checkbox' : null; }
    getBoundingClientRect() { return { left: 10, top: 40, right: 110, bottom: 70, width: 100, height: 30 }; }
    remove() { const index = nodes.indexOf(this); if (index >= 0) nodes.splice(index, 1); }
    focus() { throw new Error('peer presence must not focus a field'); }
    setSelectionRange() { throw new Error('peer presence must not set the local selection'); }
  }
  class Input extends Element { constructor(id) { super('INPUT'); this.id = id; this.type = 'checkbox'; this.checked = false; this.selectionStart = null; } }
  const local = new Input('local'), peer = new Input('peer');
  const document = { activeElement: local, hasFocus: () => true, querySelectorAll: () => [local, peer],
    createElement: tag => new Element(tag.toUpperCase()), getElementById: id => nodes.find(node => node.id === id),
    body: { append: node => nodes.push(node) }, head: { append: node => nodes.push(node) }, addEventListener() {}, removeEventListener() {} };
  const parent = { postMessage() {} };
  const window = { parent, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener() {}, setInterval: () => 1, clearInterval() {} };
  vm.runInNewContext(`(${installInteractiveHtmlStateBridge.toString()})()`, { window, document, Element,
    HTMLInputElement: Input, HTMLTextAreaElement: class {}, HTMLSelectElement: class {}, innerWidth: 800, innerHeight: 600, requestAnimationFrame: () => 1 });
  const receive = (type, role, key = 'input:checkbox:peer') => listeners.get('message')({ source: parent,
    data: { type, role, key, active: true, presence: null } });
  receive('tafelraum:interactive-peer-focus', 'student');
  assert.equal(peer.attributes.get('data-tafelraum-peer-focus'), 'student');
  assert.equal(nodes.find(node => node.id === 'tafelraum-peer-focus-badge').textContent, 'Schüler');
  assert.equal(document.activeElement, local); assert.equal(local.checked, false); assert.equal(peer.checked, false);
  receive('tafelraum:interactive-teacher-focus');
  assert.equal(peer.attributes.get('data-tafelraum-peer-focus'), 'teacher');
  assert.equal(peer.attributes.has('data-tafelraum-student-focus'), false);
  assert.equal(nodes.find(node => node.id === 'tafelraum-peer-focus-badge').textContent, 'Lehrkraft');
  receive('tafelraum:interactive-peer-focus', 'student', null);
  assert.equal(peer.attributes.has('data-tafelraum-peer-focus'), false);
  assert.equal(nodes.some(node => node.id === 'tafelraum-peer-focus-badge'), false);
});

test('Room input gate trusts only its parent, blocks the document and blurs old focus until enabled',()=>{
 const listeners=new Map();let blurred=0;
 class HtmlElement {blur(){blurred++;}}
 const document={body:{inert:false},activeElement:new HtmlElement(),querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}};
 const parent={postMessage(){}};
 const window={parent,addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener(){},setInterval:()=>1,clearInterval(){}};
 vm.runInNewContext(`(${installInteractiveHtmlStateBridge.toString()})()`,{window,document,Element:HtmlElement,HTMLElement:HtmlElement,HTMLInputElement:class{},HTMLTextAreaElement:class{},HTMLSelectElement:class{},requestAnimationFrame:()=>1});
 const receive=(source,enabled)=>listeners.get('message')({source,data:{type:'tafelraum:interactive-input-enabled',enabled}});
 receive({},false);assert.equal(document.body.inert,false);assert.equal(blurred,0);
 receive(parent,false);assert.equal(document.body.inert,true);assert.equal(blurred,1);
 receive(parent,'true');assert.equal(document.body.inert,true);
 receive(parent,true);assert.equal(document.body.inert,false);assert.equal(blurred,1);
});
