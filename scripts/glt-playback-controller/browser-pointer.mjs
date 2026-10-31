import assert from 'node:assert/strict';

// Chromium reports unscaled inner-frame quads for CSS-scaled Canvas iframes.
// Project the visible point and verify native hover hit-testing before clicking.
// No force/DOM dispatch or application-state shortcut.
export async function projectedFramePoint(frame,control,fraction=.5){
    const point=await control.evaluate(async element=>{
      const animations=[];for(let node=element;node;node=node.parentElement)animations.push(...node.getAnimations());
      await Promise.all(animations.map(animation=>animation.finished.catch(()=>{})));
      const b=element.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,width:innerWidth,height:innerHeight};
    });
    const bounds=await (await frame.frameElement()).boundingBox();assert.ok(bounds);
    const rect=await control.evaluate(element=>{const b=element.getBoundingClientRect();return {x:b.x,w:b.width};});
    return {x:bounds.x+(rect.x+rect.w*fraction)*bounds.width/point.width,y:bounds.y+point.y*bounds.height/point.height};
}
export async function projectedFrameClick(frame,page,control){
  await control.waitFor({state:'visible'});
  for(let attempt=0;attempt<8;attempt++){
    const {x,y}=await projectedFramePoint(frame,control);
    await page.mouse.move(x,y);
    if(await control.evaluate(element=>element.matches(':hover'))){await page.mouse.click(x,y);return;}
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  }
  assert.fail('Projected HTML control is not hit-testable at its visible position');
}
