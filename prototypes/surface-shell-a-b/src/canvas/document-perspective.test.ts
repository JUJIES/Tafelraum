import assert from 'node:assert/strict';
import test from 'node:test';
import {documentPreviewGeometry,documentQuadFromRect,wholeDocumentQuad,moveDocumentCorner,validDocumentQuad} from './document-perspective.ts';
import {centeredDocumentPerspective} from './document-image-state.ts';
import {docResPerspectiveKind,isScanEnhancementActive,referencedImageFileIds,readScanEnhancement} from './scan-enhancement.ts';
import type {ExcalidrawImageElement} from '@excalidraw/excalidraw/element/types';

test('each corner moves independently and crossing/collapsed proposals are refused',()=>{
  const moved=moveDocumentCorner(wholeDocumentQuad,0,{x:.2,y:.1});
  assert.deepEqual(moved[0],{x:.2,y:.1});
  assert.deepEqual(moved.slice(1),wholeDocumentQuad.slice(1));
  assert.equal(validDocumentQuad(moved),true);
  assert.equal(moveDocumentCorner(moved,0,{x:1,y:1}),moved);
  assert.equal(validDocumentQuad([{x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1}]),false);
  assert.equal(validDocumentQuad([{x:NaN,y:0},...moved.slice(1)]),false);
  assert.equal(validDocumentQuad(documentQuadFromRect({x:.1,y:.2,width:.8,height:.6})),true);
});
test('perspective geometry fits the old box without moving its center or stretching the new page',()=>{
  const image={x:100,y:200,width:800,height:600} as ExcalidrawImageElement;
  const result=centeredDocumentPerspective(image,{width:400,height:800});
  assert.equal(result.width/result.height,.5);
  assert.equal(result.x+result.width/2,500);
  assert.equal(result.y+result.height/2,500);
  assert.equal(result.height,600);
  assert.equal(result.crop,null);
});
test('original/enhanced perspective display keeps all three assets reachable in either state',()=>{
  const image={type:'image',fileId:'enhanced',isDeleted:false,customData:{scanEnhancement:{kind:docResPerspectiveKind,
    originalFileId:'rectified-original',originalAssetId:'rectified-original',sourceOriginalFileId:'camera-original',enhancedFileId:'enhanced'}}} as unknown as ExcalidrawImageElement;
  assert.equal(isScanEnhancementActive(image),true);
  assert.deepEqual(referencedImageFileIds(image),['enhanced','rectified-original','camera-original']);
  const original={...image,fileId:'rectified-original'} as ExcalidrawImageElement;
  assert.equal(isScanEnhancementActive(original),false);
  assert.deepEqual(new Set(referencedImageFileIds(original)),new Set(['enhanced','rectified-original','camera-original']));
  assert.equal(readScanEnhancement({...image,customData:{scanEnhancement:{kind:docResPerspectiveKind,originalFileId:'x',originalAssetId:'x'}}}),null);
});

// All four points must stay reachable, with drag/keys interpreted in screen axes.

test('rotated preview bounds contain every corner and invert screen gestures at any angle',()=>{
  const area={x:35,y:80,width:1200,height:800};
  for(const angle of [0,Math.PI/2,-Math.PI/2,Math.PI/12,Math.PI*1.37]){
    const geometry=documentPreviewGeometry(area,angle);
    for(const p of [{x:35,y:80},{x:1235,y:80},{x:1235,y:880},{x:35,y:880}]){
      const display=geometry.toDisplay(p),source=geometry.toSource(display);
      assert.ok(Math.abs(source.x-p.x)<1e-9 && Math.abs(source.y-p.y)<1e-9);
      assert.ok(display.x>=geometry.bounds.x-1e-9 && display.x<=geometry.bounds.x+geometry.bounds.width+1e-9);
      assert.ok(display.y>=geometry.bounds.y-1e-9 && display.y<=geometry.bounds.y+geometry.bounds.height+1e-9);
      const moved=geometry.toDisplay(geometry.toSource({x:display.x+10,y:display.y}));
      assert.ok(Math.abs(moved.x-display.x-10)<1e-9 && Math.abs(moved.y-display.y)<1e-9);
    }
  }
  const upright=documentPreviewGeometry(area,Math.PI/2).bounds;
  assert.ok(Math.abs(upright.width-area.height)<1e-9 && Math.abs(upright.height-area.width)<1e-9);
});
