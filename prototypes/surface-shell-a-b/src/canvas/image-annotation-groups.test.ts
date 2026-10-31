import assert from "node:assert/strict";
import test from "node:test";
import { isErasableInk, withoutTemporaryEraserState } from "./eraser-policy.ts";

test("eraser preserves text, shapes and material but removes pen and marker ink", () => {
  for (const type of ["text", "rectangle", "ellipse", "diamond", "arrow", "line", "image", "frame"])
    assert.equal(isErasableInk({ type }), false, type);
  assert.equal(isErasableInk({ type: "freedraw" }), true);
  for (const role of ["ink-pen", "marker-ribbon"])
    assert.equal(isErasableInk({ type: "line", customData: { role } }), true);
  assert.equal(isErasableInk({ type: "freedraw", locked: true }), false);
  assert.equal(isErasableInk({ type: "freedraw", isDeleted: true }), false);
  assert.equal(isErasableInk({ type: "freedraw", customData: { materialKind: "html" } }), false);
  assert.equal(isErasableInk({ type: "line", locked: true,
    customData: { role: "marker-ribbon", tafelraumEraserLockState: false } }), true);
  assert.equal(isErasableInk({ type: "line", locked: false,
    customData: { role: "marker-ribbon", tafelraumEraserLockState: true } }), false);
});
import {
  imageGroupIdsAfterIndependentShapeDetach,
  imageAnnotationGroupId,
  getCanvasAnnotationSelectionIntent,
  getCanvasAnnotationEditingGroupId,
  independentShapeIds,
  shapeAnnotationGroupId,
  preservesIndependentImageAnnotationMultiSelection,
} from "./image-annotation-selection.ts";
import { getMaterialBundleElements, translateMaterialBundleElements } from "./material-bundle-drag.ts";
import { findTopmostCanvasAnnotationTargetAtPoint, findTopmostMaterialAnnotationTargetAtPoint } from "./material-annotation-targets.ts";
import { projectInteractiveHtmlAnnotations, createInteractiveHtmlAnnotationScene } from "./interactive-html-annotations.ts";
import { getInteractiveHtmlAnnotationScrollTranslation } from "./interactive-html-embed.ts";

const materialGroupId = "tafelraum-image-annotations:image-1";

test("selects a marked shape as a bundle and its ink independently", () => {
  const groupId = shapeAnnotationGroupId("shape-1");
  assert.deepEqual(getCanvasAnnotationSelectionIntent({ id: "shape-1", groupIds: [groupId], type: "rectangle" }), {
    groupId, mode: "bundle",
  });
  assert.deepEqual(getCanvasAnnotationSelectionIntent({ id: "ink-1", groupIds: [groupId], type: "freedraw" }), {
    groupId, mode: "annotation",
  });
  assert.deepEqual(getCanvasAnnotationSelectionIntent({ id: "text-1", containerId: "shape-1", groupIds: [groupId], type: "text" }), {
    groupId, mode: "bundle",
  });
});

test("ink on a shape targets its actual contour over a material beneath", () => {
  const image = { angle: 0, height: 200, id: "image-1", type: "image", width: 200, x: 0, y: 0 };
  const ellipse = { ...image, id: "shape-1", type: "ellipse" };
  assert.equal(findTopmostCanvasAnnotationTargetAtPoint([image, ellipse], { x: 100, y: 100 })?.id, "shape-1");
  assert.equal(findTopmostCanvasAnnotationTargetAtPoint([image, ellipse], { x: 10, y: 10 })?.id, "image-1");
  assert.equal(findTopmostCanvasAnnotationTargetAtPoint([image, ellipse], { x: 250, y: 250 }), null);
});

test("selects an annotation inside a material group individually", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    groupIds: [materialGroupId],
    type: "freedraw",
  }), {
    groupId: materialGroupId,
    mode: "annotation",
  });
});

test("keeps image selection on the complete material bundle", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    groupIds: [materialGroupId],
    type: "image",
  }), {
    groupId: materialGroupId,
    mode: "bundle",
  });
});

test("keeps an image-bound cover on the complete material bundle", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    customData: { role: "image-cover", imageId: "image-1" },
    groupIds: [materialGroupId],
    type: "rectangle",
  }), {
    groupId: materialGroupId,
    mode: "bundle",
  });
});

test("keeps a covered YouTube material on the complete material bundle", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    customData: { materialKind: "youtube" },
    groupIds: [materialGroupId],
    type: "rectangle",
  }), {
    groupId: materialGroupId,
    mode: "bundle",
  });
});

test("keeps a covered local video on the complete material bundle", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    customData: { materialKind: "video" },
    groupIds: [materialGroupId],
    type: "rectangle",
  }), {
    groupId: materialGroupId,
    mode: "bundle",
  });
});

test("keeps a covered interactive material on the complete material bundle", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    customData: { materialKind: "interactive-html" },
    groupIds: [materialGroupId],
    type: "rectangle",
  }), {
    groupId: materialGroupId,
    mode: "bundle",
  });
});

test("keeps a registered app on the complete annotation bundle", () => {
  assert.deepEqual(getCanvasAnnotationSelectionIntent({
    customData: { surfaceKind: "embedded-app", embeddedAppId: "lerndeck" },
    groupIds: [materialGroupId],
    type: "rectangle",
  }), {
    groupId: materialGroupId,
    mode: "bundle",
  });
});

test("does not override selection for unrelated canvas elements", () => {
  assert.equal(getCanvasAnnotationSelectionIntent({
    groupIds: ["ordinary-group"],
    type: "rectangle",
  }), null);
});

test("detaches a form and its bound text from an image while preserving ordinary groups", () => {
  const ordinaryGroupId = "ordinary-group";
  const elements = [{
    boundElements: [{ id: "text-1", type: "text" }],
    customData: undefined,
    groupIds: [ordinaryGroupId, materialGroupId],
    id: "shape-1",
    isDeleted: false,
    type: "rectangle",
  }, {
    containerId: "shape-1",
    customData: undefined,
    groupIds: [materialGroupId],
    id: "text-1",
    isDeleted: false,
    type: "text",
  }, {
    customData: undefined,
    groupIds: [imageAnnotationGroupId("image-1")],
    id: "stroke-1",
    isDeleted: false,
    type: "freedraw",
  }];
  const shapeIds = independentShapeIds(elements);

  assert.deepEqual(imageGroupIdsAfterIndependentShapeDetach(elements[0], shapeIds), [ordinaryGroupId]);
  assert.deepEqual(imageGroupIdsAfterIndependentShapeDetach(elements[1], shapeIds), []);
  assert.deepEqual(imageGroupIdsAfterIndependentShapeDetach(elements[2], shapeIds), [materialGroupId]);
});

test("keeps technical material rectangles attached to their material bundle", () => {
  const cover = {
    customData: { role: "image-cover", imageId: "image-1" },
    groupIds: [materialGroupId],
    id: "cover-1",
    isDeleted: false,
    type: "rectangle",
  };
  const shapeIds = independentShapeIds([cover]);

  assert.equal(shapeIds.size, 0);
  assert.strictEqual(imageGroupIdsAfterIndependentShapeDetach(cover, shapeIds), cover.groupIds);
});

test("preserves a multi-selection when dragging one of its material elements", () => {
  assert.equal(preservesIndependentImageAnnotationMultiSelection(
    "image-1",
    materialGroupId,
    null,
    {
    "image-1": true,
    "shape-1": true,
    },
    {},
  ), true);
});

test("keeps the dedicated flow for an unselected or native grouped material element", () => {
  assert.equal(preservesIndependentImageAnnotationMultiSelection(
    "image-1",
    materialGroupId,
    null,
    { "shape-1": true },
    {},
  ), false);
  assert.equal(preservesIndependentImageAnnotationMultiSelection(
    "image-1",
    materialGroupId,
    null,
    { "image-1": true, "annotation-1": true },
    { [materialGroupId]: true },
  ), false);
});

test("moves a completely covered material bundle atomically during drag", () => {
  const image = { id: "image-1", x: 100, y: 200 };
  const cover = { id: "cover-1", x: 100, y: 200 };
  const annotation = { id: "annotation-1", x: 140, y: 250 };
  const unrelated = { id: "other-1", x: 500, y: 600 };
  const elements = [image, cover, annotation, unrelated] as never[];

  const moved = translateMaterialBundleElements(
    elements,
    elements.slice(0, 3),
    35,
    -20,
    (element, x, y) => ({ ...element, x, y }),
  );

  assert.deepEqual(moved.slice(0, 3).map((element) => ({ x: element.x, y: element.y })), [
    { x: 135, y: 180 },
    { x: 135, y: 180 },
    { x: 175, y: 230 },
  ]);
  assert.equal(moved[0].x - moved[1].x, 0);
  assert.strictEqual(moved[3], unrelated);
});

test("collects an interactive material and all of its annotations for titlebar movement", () => {
  const groupId = imageAnnotationGroupId("interactive-1");
  const material = { groupIds: [groupId], id: "interactive-1", isDeleted: false };
  const annotation = { groupIds: [groupId], id: "annotation-1", isDeleted: false };
  const cover = { groupIds: [groupId], id: "cover-1", isDeleted: false };
  const unrelated = { groupIds: [], id: "other-1", isDeleted: false };

  assert.deepEqual(
    getMaterialBundleElements([material, annotation, cover, unrelated], material.id, groupId),
    [material, annotation, cover],
  );
});

test("finds interactive HTML as the material target beneath a new annotation", () => {
  const image = {
    angle: 0,
    height: 300,
    id: "image-1",
    type: "image",
    width: 500,
    x: 100,
    y: 100,
  };
  const interactiveHtml = {
    ...image,
    customData: { materialKind: "interactive-html" },
    id: "interactive-1",
    type: "rectangle",
  };

  assert.equal(
    findTopmostMaterialAnnotationTargetAtPoint([image, interactiveHtml], { x: 260, y: 230 })?.id,
    "interactive-1",
  );
  assert.equal(
    findTopmostMaterialAnnotationTargetAtPoint([image, interactiveHtml], { x: 40, y: 40 }),
    null,
  );
});

test("projects a bound stroke into the interactive material viewport", () => {
  const groupId = imageAnnotationGroupId("interactive-1");
  const projection = projectInteractiveHtmlAnnotations({
    angle: 0,
    height: 500,
    id: "interactive-1",
    width: 1000,
    x: 0,
    y: 0,
  }, [{
    angle: 0,
    groupIds: [groupId],
    height: 50,
    id: "stroke-1",
    opacity: 52,
    points: [[0, 0], [200, 50]],
    strokeColor: "#f0b800",
    strokeWidth: 12,
    type: "freedraw",
    version: 3,
    width: 200,
    x: 100,
    y: 120,
  }], groupId, { "stroke-1": true });

  assert.deepEqual(projection, {
    annotations: [{
      angle: 0,
      height: 50,
      id: "stroke-1",
      kind: "stroke",
      opacity: 0.52,
      points: [{ x: 100, y: 120 }, { x: 300, y: 170 }],
      selected: true,
      strokeColor: "#f0b800",
      strokeWidth: 12,
      width: 200,
      x: 200,
      y: 145,
    }],
    key: "stroke-1:3:1",
  });
});

test("keeps a live stroke at the pointer while a material is scrolled", () => {
  const groupId = imageAnnotationGroupId("interactive-1");
  const projection = projectInteractiveHtmlAnnotations({
    angle: 0,
    height: 500,
    id: "interactive-1",
    width: 1000,
    x: 0,
    y: 0,
  }, [{
    angle: 0,
    groupIds: [],
    height: 20,
    id: "live-stroke",
    opacity: 100,
    points: [[0, 0], [100, 20]],
    strokeColor: "#1f2933",
    strokeWidth: 4,
    type: "freedraw",
    version: 2,
    width: 100,
    x: 200,
    y: 180,
  }], groupId, {}, new Set(["live-stroke"]), { x: 15, y: 240 });

  const annotation = projection.annotations[0];
  assert.ok(annotation);
  assert.deepEqual(annotation.scrollAnchor, { x: 15, y: 240 });
  assert.deepEqual(
    getInteractiveHtmlAnnotationScrollTranslation(annotation.scrollAnchor, { x: 15, y: 240 }, 1.4),
    { x: 0, y: 0 },
  );
});


test("dragged text projects at the first overlapping edge before any drop binding", () => {
 const material={id:'paper',x:100,y:100,width:200,height:300,angle:0};
 const moving={id:'moving',type:'text',x:70,y:120,width:40,height:25,angle:0,
   version:1,opacity:100,strokeColor:'#123',strokeWidth:1,text:'Text',groupIds:[]};
 const group=imageAnnotationGroupId(material.id);
 const project=(element= moving,dragId:string|undefined='moving')=>projectInteractiveHtmlAnnotations(
   material,[element],group,{},new Set(),{x:0,y:240},dragId);
 const first=project();
 assert.equal(first.annotations.length,1); // center still lies outside the sheet
 assert.equal(first.annotations[0].x,-10);
 assert.deepEqual(first.annotations[0].scrollAnchor,{x:0,y:240});
 const next=project({...moving,x:80,version:2});
 assert.equal(next.annotations[0].x,0);
 assert.notEqual(next.key,first.key);
 assert.deepEqual(moving.groupIds,[]); // preview never creates a binding
 const ended=projectInteractiveHtmlAnnotations(material,[moving],group,{},new Set(),{x:0,y:240});
 assert.equal(ended.annotations.length,0); // cancel/end removes transient ownership
 const settled={...moving,groupIds:[group]};
 assert.equal(projectInteractiveHtmlAnnotations(material,[settled],group,{}).annotations.length,1);
});


test("selects independent material annotations without entering the sheet's group frame",()=>{
 const standalone={id:'text',type:'text',groupIds:[materialGroupId]};
 assert.equal(getCanvasAnnotationEditingGroupId(standalone),null);
 assert.deepEqual(standalone.groupIds,[materialGroupId]);
 assert.equal(getCanvasAnnotationSelectionIntent(standalone)?.mode,'annotation');
 assert.equal(getCanvasAnnotationEditingGroupId({...standalone,type:'freedraw'}),null);
 assert.equal(getCanvasAnnotationEditingGroupId({...standalone,containerId:'shape'}),materialGroupId);
 assert.equal(getCanvasAnnotationEditingGroupId({...standalone,groupIds:[]}),null);
});


test("temporary eraser locks and detached bindings cannot enter the persisted scene",()=>{
 const group=imageAnnotationGroupId('paper');
 const engine={id:'marker',type:'line',groupIds:['ordinary'],locked:true,isDeleted:false,
   customData:{role:'marker-ribbon',tafelraumEraserLockState:false,tafelraumEraserImageGroupIds:[group],
     interactiveHtmlScrollAnchor:{materialId:'paper',x:0,y:120}}};
 const native=[engine];const canonical=withoutTemporaryEraserState(native);
 assert.notEqual(canonical,native);
 assert.equal(canonical[0].locked,false);assert.deepEqual(canonical[0].groupIds,['ordinary',group]);
 assert.equal(isErasableInk(canonical[0]),true);
 assert.deepEqual(canonical[0].customData.interactiveHtmlScrollAnchor,{materialId:'paper',x:0,y:120});
 assert.equal(JSON.stringify(canonical).includes('tafelraumEraser'),false);
 assert.equal(engine.locked,true);assert.deepEqual(engine.groupIds,['ordinary']);
 assert.equal(withoutTemporaryEraserState(canonical),canonical);
});

test("canonical eraser view preserves intentional locks and never guesses missing bindings",()=>{
 const intentional={type:'line',locked:true,groupIds:[],customData:{role:'marker-ribbon',interactiveHtmlScrollAnchor:{materialId:'paper',x:0,y:0}}};
 const scene=[intentional];assert.equal(withoutTemporaryEraserState(scene),scene);
 const adapted={...intentional,customData:{...intentional.customData,tafelraumEraserLockState:true}};
 const canonical=withoutTemporaryEraserState([adapted]);assert.equal(canonical[0].locked,true);
 assert.deepEqual(canonical[0].groupIds,[]);
});

test("HTML keeps its existing ink projection while native erasing temporarily detaches it",()=>{
 const group=imageAnnotationGroupId('paper');const material={id:'paper',x:0,y:0,width:200,height:300,angle:0};
 const ink={id:'marker',type:'line',x:20,y:40,width:60,height:12,angle:0,version:3,opacity:32,
   points:[[0,0],[60,0],[60,12],[0,0]] as [number,number][],strokeColor:'transparent',strokeWidth:0,
   backgroundColor:'#ffb400',locked:true,groupIds:[],customData:{role:'marker-ribbon',
     tafelraumEraserImageGroupIds:[group],tafelraumEraserLockState:false,
     interactiveHtmlScrollAnchor:{materialId:'paper',x:0,y:120}}};
 const canonical=withoutTemporaryEraserState([ink]);
 const projected=projectInteractiveHtmlAnnotations(material,canonical,group,{});
 assert.equal(projected.annotations.length,1);assert.equal(projected.annotations[0].kind,'stroke');
 assert.deepEqual(projected.annotations[0].scrollAnchor,{x:0,y:120});
 assert.equal(projected.annotations[0].x,50);
});

test("canonicalization keeps erasures, unrelated groups and existing metadata",()=>{
 const group=imageAnnotationGroupId('paper');
 const element={type:'freedraw',groupIds:['ordinary',group],locked:false,isDeleted:true,
  customData:{role:'ink-pen',other:7,tafelraumEraserImageGroupIds:[group,'untrusted'],tafelraumEraserLockState:false}};
 const canonical=withoutTemporaryEraserState([element])[0];
 assert.equal(canonical.isDeleted,true);assert.deepEqual(canonical.groupIds,['ordinary',group]);
 assert.deepEqual(canonical.customData,{role:'ink-pen',other:7});
});

test('moving pen and marker project immediately over another HTML surface without creating a binding',()=>{
 const material={id:'sheet',x:0,y:0,width:100,height:200,angle:0};
 for(const [type,role] of [['freedraw','ink-pen'],['line','marker-ribbon']]){
  const ink={id:'ink',type,x:90,y:40,width:30,height:10,angle:0,version:1,groupIds:[],points:[[0,0],[30,10]],
   strokeColor:'#ff0',strokeWidth:3,opacity:100,customData:{role}};
  const moving=projectInteractiveHtmlAnnotations(material,[ink],'sheet-group',{},new Set(),{x:0,y:50},'ink');
  assert.equal(moving.annotations.length,1);assert.deepEqual(moving.annotations[0].scrollAnchor,{x:0,y:50});
  assert.equal(projectInteractiveHtmlAnnotations(material,[ink],'sheet-group',{}).annotations.length,0);
  assert.deepEqual(ink.groupIds,[]);
 }
});

test("projects a text-owned cover above HTML in native paint order with the text scroll anchor", () => {
  const material = { id: "paper", x: 100, y: 200, width: 600, height: 800, angle: 0 };
  const groupId = imageAnnotationGroupId(material.id);
  const text = { id: "text", type: "text", x: 120, y: 230, width: 200, height: 40, angle: 0,
    opacity: 100, strokeColor: "#111111", strokeWidth: 1, version: 2, groupIds: [groupId], text: "Answer",
    customData: { interactiveHtmlScrollAnchor: { materialId: "paper", x: 0, y: 120 } } };
  const cover = { ...text, id: "cover", type: "rectangle", backgroundColor: "#3e4854", strokeColor: "#3e4854",
    groupIds: ["tafelraum-canvas-cover:text"],
    customData: { role: "image-cover", imageId: "text" } };
  const project = (elements: Parameters<typeof projectInteractiveHtmlAnnotations>[1] = [text, cover]) => {
    const expected = projectInteractiveHtmlAnnotations(material, elements, groupId, {});
    const scene = createInteractiveHtmlAnnotationScene(elements);
    assert.deepEqual(projectInteractiveHtmlAnnotations(material, elements, groupId, {}, new Set(), undefined, undefined, scene), expected);
    assert.deepEqual(projectInteractiveHtmlAnnotations(material, elements, groupId, {}, new Set(['text']), {x:0,y:12}, 'text', scene),
      projectInteractiveHtmlAnnotations(material, elements, groupId, {}, new Set(['text']), {x:0,y:12}, 'text'));
    return expected;
  };
  const projection = project();
  assert.deepEqual(projection.annotations.map(annotation => annotation.id), ["text", "cover"]);
  const projectedCover = projection.annotations[1];
  assert.equal(projectedCover.kind, "stroke");
  if (projectedCover.kind !== "stroke") throw new Error("Expected filled cover polygon");
  assert.equal(projectedCover.fillColor, "#3e4854");
  assert.deepEqual(projectedCover.points, [{ x: 20, y: 30 }, { x: 220, y: 30 },
    { x: 220, y: 70 }, { x: 20, y: 70 }, { x: 20, y: 30 }]);
  assert.deepEqual(projectedCover.scrollAnchor, { x: 0, y: 120 });
  assert.deepEqual(project(JSON.parse(JSON.stringify([text, cover]))), projection, "reload derives the same cover");
  assert.deepEqual(project([text, { ...cover, isDeleted: true }]).annotations.map(a => a.id), ["text"]);
  assert.equal(project([{ ...text, isDeleted: true }, cover]).annotations.length, 0);
  assert.equal(project([{ ...text, groupIds: [] }, cover]).annotations.length, 0, "other materials and free text stay outside this projection");
  assert.notEqual(project([{ ...text, version: 3 }, cover]).key, projection.key);
});

test('composed annotation transforms preserve rotated material/ink geometry', () => {
  const material={id:'sheet',x:120,y:-55,width:700,height:900,angle:.73};
  for (const angle of [0,.4,-1.2,Math.PI]) {
    const ink={id:'ink',type:'freedraw',x:250,y:180,width:130,height:80,angle,groupIds:['group'],opacity:100,version:1,
      strokeWidth:2,strokeColor:'#111',points:[[0,0],[70,30],[130,80]] as [number,number][]};
    const result=projectInteractiveHtmlAnnotations(material,[ink],'group',{}).annotations[0];
    if(result.kind!=='stroke')throw Error('Expected stroke');
    const rotate=(x:number,y:number,cx:number,cy:number,a:number)=>[cx+(x-cx)*Math.cos(a)-(y-cy)*Math.sin(a),cy+(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a)];
    ink.points.forEach(([x,y],index)=>{
      const [sx,sy]=rotate(ink.x+x,ink.y+y,ink.x+ink.width/2,ink.y+ink.height/2,angle);
      const [lx,ly]=rotate(sx,sy,material.x+material.width/2,material.y+material.height/2,-material.angle);
      assert.ok(Math.abs(result.points[index].x-(lx-material.x))<1e-9);
      assert.ok(Math.abs(result.points[index].y-(ly-material.y))<1e-9);
    });
  }
});
