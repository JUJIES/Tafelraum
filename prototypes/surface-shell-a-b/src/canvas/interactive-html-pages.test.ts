import assert from 'node:assert/strict';
import test from 'node:test';
import {resizeHtmlPageGeometry,htmlPageSize,htmlPagePlacement,htmlPageProjection,readHtmlPageOrientation} from './interactive-html-pages.ts';
import {parseInteractiveMaterialManifest} from '../../interactive-material.mjs';
import {getInteractiveHtmlAnnotationScrollTranslation} from './interactive-html-embed.ts';

test('shared A4 pages preserve physical proportions and layout at every canvas/object size',()=>{
  for(const orientation of ['portrait','landscape'] as const){
    const page=htmlPageSize(orientation),placement=htmlPagePlacement(orientation);
    for(const canvasZoom of [.1,.5,1,1.6,3])for(const objectScale of [.2,1,2.5]){
      const width=placement.width*objectScale*canvasZoom,height=placement.height*objectScale*canvasZoom;
      const projection=htmlPageProjection(width,height,orientation);
      assert.ok(Math.abs(projection.surfaceWidth-page.width)<1e-9);
      assert.ok(Math.abs(projection.surfaceHeight-page.height)<1e-9);
      assert.ok(Math.abs(projection.scale*projection.surfaceWidth-width)<1e-9);
    }
  }
});
test('page scroll anchors follow physical scale even below the legacy content zoom minimum',()=>{
  const offset=getInteractiveHtmlAnnotationScrollTranslation({x:0,y:1123},{x:0,y:0},1,.2);
  assert.deepEqual(offset,{x:0,y:224.60000000000002});
});
test('paper orientation is an explicit capability, never inferred from material content',()=>{
  assert.equal(readHtmlPageOrientation('portrait'),'portrait');
  assert.equal(readHtmlPageOrientation('landscape'),'landscape');
  assert.equal(readHtmlPageOrientation('A4'),null);
});
const manifest={format:'tafelraum-interactive-html',schemaVersion:1,id:'pages',title:'Pages',entry:'pages.html',
 print:{entry:'pages.html',page:'A4',orientation:'portrait',mode:'template',layout:'shared-pages'}};
test('shared-page manifest retains the capability and requires a common entry',()=>{
  assert.equal(parseInteractiveMaterialManifest(manifest,'pages').print.layout,'shared-pages');
  assert.throws(()=>parseInteractiveMaterialManifest({...manifest,print:{...manifest.print,entry:'print.html'}},'pages'),/denselben/);
  assert.throws(()=>parseInteractiveMaterialManifest({...manifest,print:{...manifest.print,layout:'guess'}},'pages'),/Seitenlayout/);
});

test('paper resizing pins the opposite corner and shares identical teacher/Room geometry',()=>{
  for(const angle of [0,Math.PI/4,Math.PI/2]){
    const original={x:30,y:70,width:210,height:297,angle};
    const next=resizeHtmlPageGeometry(original,100,120);
    const corner=(e:typeof original)=>({x:e.x+e.width/2-e.width/2*Math.cos(e.angle)+e.height/2*Math.sin(e.angle),
      y:e.y+e.height/2-e.width/2*Math.sin(e.angle)-e.height/2*Math.cos(e.angle)});
    const before=corner(original),after=corner(next);
    assert.ok(Math.abs(after.x-before.x)<1e-9&&Math.abs(after.y-before.y)<1e-9);
    assert.ok(Math.abs(next.width/next.height-210/297)<1e-9);
  }
});
