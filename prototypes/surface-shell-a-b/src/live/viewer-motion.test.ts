import assert from "node:assert/strict";
import test from "node:test";
import { translationOrigins, interpolateTranslations } from "./viewer-motion.ts";

test("only identical public content translates; changed tiles, scale and paint never interpolate", () => {
  const image: any = {id:"image",type:"image",x:10,y:20,width:100,height:50,fileId:"safe-a",version:1};
  const target = {...image,x:110,y:60,version:2};
  const origins = translationOrigins([image],[target]);
  assert.deepEqual(origins,[{x:10,y:20}]);
  assert.deepEqual(interpolateTranslations([target],origins,.5),[{...target,x:60,y:40}]);
  assert.deepEqual(interpolateTranslations([target],origins,1),[target]);
  for (const patch of [{fileId:"safe-b"},{width:120},{opacity:50},{angle:1}]) {
    assert.deepEqual(translationOrigins([image],[{...target,...patch}]),[null]);
  }
  assert.deepEqual(translationOrigins([], [target]), [null]);
  assert.deepEqual(translationOrigins([image], []), []);
});
