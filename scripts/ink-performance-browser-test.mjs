import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.argv[2]);
const hostOrigin = `http://127.0.0.1:${Number(process.env.TAFELRAUM_INK_PERF_PORT ?? 5178)}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const cdp = await page.context().newCDPSession(page);
page.setDefaultTimeout(20_000);
const output = 'output/ink-performance';
await mkdir(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const requestedTools = process.argv.slice(3).length ? process.argv.slice(3) : ['Stift','Marker'];
const steps = Number(process.env.INK_PERF_STEPS ?? 360);
const delay = Number(process.env.INK_PERF_DELAY_MS ?? 12);
const angleStep = Number(process.env.INK_PERF_ANGLE ?? .015);

async function measure(tool) {
  await page.getByRole('button', { name: tool, exact: true }).click();
  await page.evaluate(() => window.clipFixture.api.updateScene({ elements: [] }));
  await page.evaluate(() => {
    const api = window.clipFixture.api;
    window.inkMeasure = { active: true, frames: [], updates: [], started: performance.now(), longTasks: [] };
    const original = api.updateScene.bind(api);
    window.inkMeasure.restore = () => { api.updateScene = original; };
    api.updateScene = (...args) => {
      const started = performance.now(), result = original(...args), duration = performance.now() - started;
      const element = args[0]?.elements?.at(-1);
      window.inkMeasure.updates.push({ at: performance.now(), duration, points: element?.points?.length ?? 0 });
      return result;
    };
    const tick = (now) => {
      if (!window.inkMeasure.active) return;
      window.inkMeasure.frames.push(now);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.inkMeasure.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.inkMeasure.longTasks.push({ at: entry.startTime, duration: entry.duration });
    });
    window.inkMeasure.observer.observe({ type: 'longtask', buffered: false });
  });
  const bounds = await page.locator('.canvas-engine').boundingBox();
  const samples = [];
  const start = { x: bounds.x + bounds.width * .5, y: bounds.y + bounds.height * .5 };
  await page.mouse.move(start.x, start.y);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval',{interval:100});
  await cdp.send('Profiler.start');
  await page.mouse.down();
  for (let index = 1; index <= steps; index++) {
    const angle = index * angleStep, radiusX = bounds.width * (.22 + .12 * Math.sin(index * .013));
    const radiusY = bounds.height * (.2 + .1 * Math.cos(index * .017));
    await page.mouse.move(start.x + Math.cos(angle) * radiusX, start.y + Math.sin(angle * 1.17) * radiusY);
    await sleep(delay);
    if (index % Math.max(1,Math.floor(steps/5)) === 0) samples.push(await page.evaluate(() => {
      const element = window.clipFixture.api.getSceneElements().at(-1);
      return { at: performance.now() - window.inkMeasure.started, points: element?.points?.length ?? 0 };
    }));
  }
  await page.mouse.up();
  const {profile}=await cdp.send('Profiler.stop');
  await sleep(300);
  const raw = await page.evaluate(() => {
    window.inkMeasure.active = false;
    window.inkMeasure.observer.disconnect();
    window.inkMeasure.restore();
    const element = window.clipFixture.api.getSceneElements().at(-1);
    return { frames: window.inkMeasure.frames, updates: window.inkMeasure.updates, longTasks: window.inkMeasure.longTasks,
      total: performance.now() - window.inkMeasure.started, finalPoints: element?.points?.length ?? 0 };
  });
  const frameDeltas = raw.frames.slice(1).map((value, index) => value - raw.frames[index]);
  const quantile = (values, fraction) => [...values].sort((a,b) => a-b)[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0;
  const secondFrames = Array.from({ length: 5 }, (_, second) => frameDeltas.filter((_value,index) => {
    const at = raw.frames[index] - raw.frames[0]; return at >= second * 1000 && at < (second + 1) * 1000;
  }));
  const nodes=new Map(profile.nodes.map(node=>[node.id,node.callFrame]));
  const profileSamples=new Map();
  for(const id of profile.samples??[]){const frame=nodes.get(id);if(!frame)continue;const key=`${frame.functionName||'(anonymous)'} · ${frame.url.split('/').at(-1)||frame.url}:${frame.lineNumber+1}`;profileSamples.set(key,(profileSamples.get(key)??0)+1);}
  const profileTop=[...profileSamples].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([frame,count])=>({frame,samples:count}));
  return { tool, totalMs: raw.total, finalPoints: raw.finalPoints, samples,
    frames: frameDeltas.length, frameP50: quantile(frameDeltas,.5), frameP95: quantile(frameDeltas,.95), frameMax: Math.max(0,...frameDeltas),
    frameP95BySecond: secondFrames.map(values => quantile(values,.95)),
    updateP50: quantile(raw.updates.map(item=>item.duration),.5), updateP95: quantile(raw.updates.map(item=>item.duration),.95),
    updateMax: Math.max(0,...raw.updates.map(item=>item.duration)), updates: raw.updates.length,
    longTasks: raw.longTasks.length, longTaskMs: raw.longTasks.reduce((sum,item)=>sum+item.duration,0), profileTop };
}

try {
  await page.goto(`${hostOrigin}/src/live/clip.browser.html`);
  await page.waitForFunction(() => window.clipFixture?.api && !window.clipFixture.api.getAppState().isLoading);
  const results = [];
  for (const tool of requestedTools) results.push(await measure(tool));
  await page.screenshot({ path: `${output}/after-marker.png` });
  await writeFile(`${output}/${requestedTools.join('-').toLowerCase()}-${steps}-${String(angleStep).replace('.','_')}.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
