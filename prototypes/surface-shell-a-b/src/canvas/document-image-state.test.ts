import test from 'node:test';
import assert from 'node:assert/strict';
import type { ExcalidrawImageElement, ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { centeredDocumentCrop, documentImageCropAllowed, documentImageTargetUnchanged } from './document-image-state.ts';
import { referencedImageFileIds, docResEnhancementKind } from './scan-enhancement.ts';

const image = { id:'photo',type:'image',x:100,y:200,width:800,height:600,angle:Math.PI/4,scale:[1,1],groupIds:[],boundElements:null,
  crop:null,fileId:'original',version:3,versionNonce:4,isDeleted:false } as unknown as ExcalidrawImageElement;
test('crop retains source pixels, angle and canvas center, and allows later native recropping', () => {
  const crop=centeredDocumentCrop(image,{x:.1,y:.2,width:.8,height:.6},{width:1600,height:1200});
  assert.equal(crop.x!+crop.width!/2,image.x+image.width/2);
  assert.equal(crop.y!+crop.height!/2,image.y+image.height/2);
  assert.deepEqual(crop.crop,{x:160,y:240,width:1280,height:720,naturalWidth:1600,naturalHeight:1200});
  assert.deepEqual(centeredDocumentCrop(image,{x:0,y:0,width:1,height:1},{width:1600,height:1200}),{});
});
test('existing crops, mirroring, groups, annotations and covers protect geometry', () => {
  assert.equal(documentImageCropAllowed(image,[image]),true);
  assert.equal(documentImageCropAllowed({...image,groupIds:['tafelraum-image-annotations:photo']},[image]),true);
  for(const patch of [{crop:{x:0}}, {scale:[-1,1]}, {groupIds:['group']}, {boundElements:[{id:'text',type:'text'}]}]) {
    assert.equal(documentImageCropAllowed({...image,...patch} as ExcalidrawImageElement,[]),false);
  }
  assert.equal(documentImageCropAllowed(image,[{id:'cover',isDeleted:false,groupIds:[],customData:{imageId:'photo'}} as unknown as ExcalidrawElement]),false);
});
test('late model results cannot revive deleted, edited or replaced targets', () => {
  assert.equal(documentImageTargetUnchanged(image,{...image}),true);
  for(const patch of [{isDeleted:true},{version:4},{versionNonce:7},{fileId:'other'},{id:'other'}]) {
    assert.equal(documentImageTargetUnchanged(image,{...image,...patch} as ExcalidrawImageElement),false);
  }
  assert.equal(documentImageTargetUnchanged(image,undefined),false);
  assert.deepEqual(referencedImageFileIds({...image,fileId:'enhanced',customData:{scanEnhancement:{kind:docResEnhancementKind,originalFileId:'original',originalAssetId:'original'}}} as ExcalidrawImageElement),['enhanced','original']);
});
