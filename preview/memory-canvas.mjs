// Preview build only. Scenes and drawings are isolated to this document and reset on reload.
const boards = new Map();
const images = new Map();
export async function loadCanvasSnapshot(id) {
  if (!boards.has(id)) {
    const response = await fetch('/api/archive/lessons/'+encodeURIComponent(id)+'/board');
    if (!response.ok) return null;
    boards.set(id, await response.json());
  }
  return structuredClone(boards.get(id));
}
export async function saveCanvasSnapshot(id,scene) { boards.set(id,structuredClone(scene)); }
export async function clearCanvasSnapshot(id) { boards.set(id,null); }
export async function loadCanvasFiles(id,ids) { return Object.fromEntries(ids.filter(key=>images.get(id)?.has(key)).map(key=>[key,images.get(id).get(key)])); }
export async function saveCanvasFiles(id,files) { if(!images.has(id))images.set(id,new Map());for(const file of files)images.get(id).set(file.id,file); }
export async function clearCanvasFiles(id) { images.delete(id); }
export async function syncLocalCanvasStateToFileArchive(){return {savedSnapshots:0,savedAssets:0}}
export async function copyCanvasLessonState(source,target){await saveCanvasSnapshot(target,await loadCanvasSnapshot(source));images.set(target,new Map(images.get(source)));}
