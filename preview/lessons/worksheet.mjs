import {illustration} from './illustrations.mjs';

export const sheetManifest={format:'tafelraum-interactive-html',schemaVersion:1,id:'trail-sheet',title:'Trail field sheet',entry:'index.html',defaultViewport:{width:794,height:1123},print:{entry:'index.html',page:'A4',orientation:'portrait',mode:'template',layout:'shared-pages'}};

function assignment(number, title, direction) {
  return `<header class="assignment"><span class="number">${number}</span><div><h2>${title}</h2><p>${direction}</p></div></header>`;
}

function measureRow(name, slug, edgeId, distanceId) {
  return `<tr><th scope="row"><span class="trail ${slug}"></span> ${name}</th>
    <td><input id="${edgeId}" aria-label="${name} edges" inputmode="numeric"></td>
    <td><input id="${distanceId}" aria-label="${name} kilometres" inputmode="decimal"></td></tr>`;
}

export const worksheet = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Trail field sheet</title>
<style>
:root{font:16px/1.45 Arial,"Segoe UI",sans-serif;color:#213c40;background:#e7edeb;--ink:#193744;--accent:#b75235;--teal:#176b68;--rule:#bccdc9}
*{box-sizing:border-box}body{margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.sheet{max-width:794px;min-height:100vh;margin:auto;padding:30px 36px 18px;background:#fffefa;display:flex;flex-direction:column}
.topline,footer{display:flex;align-items:center;justify-content:space-between;gap:1em;font-weight:bold}
.topline{border-bottom:2px solid var(--ink);padding-bottom:9px;text-transform:uppercase;font-size:12px;letter-spacing:.09em} .topline span:last-child{color:var(--teal)}
h1{font:700 clamp(32px,6vw,49px)/1.04 Georgia,serif;letter-spacing:-.035em;margin:17px 0 5px;color:var(--ink)}
.lead{margin:0 0 13px;font-size:17px}.map{margin:0 0 14px}.map svg{display:block;width:100%;max-height:205px;border-radius:4px;background:#cfe3cf}
figcaption{display:flex;gap:12px 20px;flex-wrap:wrap;padding:5px 0;font-size:12px;color:#365352}.trail{width:24px;display:inline-block;vertical-align:middle;border-top:3px solid #ac4829}.river{border-top:3px dashed #307197}
.assignment{display:flex;gap:12px;background:#fbede5;border-left:4px solid var(--accent);padding:9px 12px;margin:13px 0 8px;break-inside:avoid}
.number{flex:none;background:var(--accent);color:white;border-radius:50%;width:27px;height:27px;display:grid;place-items:center;font-weight:bold}
h2{margin:0;color:var(--ink);font-size:17px}.assignment p{margin:2px 0 0;font-size:14px}
table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid var(--rule);padding:5px 10px;text-align:left}
thead th{background:#e8f1ed;font-size:13px}tbody th{font-size:14px}input,textarea{width:100%;min-width:0;font:inherit;border:1px solid #b3c5be;border-radius:3px;background:#fff;color:var(--ink);padding:6px}textarea{display:block;resize:vertical;min-height:58px}
input:focus,textarea:focus{outline:2px solid var(--teal);outline-offset:1px}details{font-size:13px;margin:6px 0;color:var(--teal)}summary{cursor:pointer}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cell{display:block;padding:8px 10px;border:1px solid var(--rule);border-radius:3px;font-size:14px;font-weight:bold;color:var(--teal)}.cell textarea{margin-top:5px;font-weight:normal}
.decision{margin-top:7px}footer{margin-top:auto;padding-top:7px;border-top:1px solid var(--rule);font-size:11px;color:#536865}.last{margin-bottom:14px}
@media screen and (min-width:541px){.sheet{padding:22px 32px 15px}.map svg{max-height:166px}.assignment{margin-top:10px}.cell textarea{min-height:44px;height:44px}.lead{margin-bottom:8px}}
@media screen and (max-width:540px){.sheet{padding:16px}.pair{grid-template-columns:1fr}.topline{font-size:10px}th,td{padding:5px}.map svg{max-height:none}.lead{font-size:15px}}
@page{size:A4 portrait;margin:0}
@media print{
  body{background:white;font-size:10pt}.sheet{width:210mm;height:297mm;min-height:0;padding:11mm 14mm 9mm;background:white}
  .topline{font-size:8pt;padding-bottom:2mm}h1{font-size:28pt;margin:4mm 0 1mm}.lead{font-size:11pt;margin-bottom:3mm}
  .map{margin-bottom:1mm}.map svg{height:47mm;max-height:none}figcaption{font-size:8pt}
  .assignment{margin:3mm 0 2mm;padding:2mm 3mm}.assignment p{font-size:9pt}h2{font-size:12pt}
  th,td{height:8mm}.cell{font-size:9pt}.pair{gap:3mm}.cell:after{content:"";display:block;height:15mm;margin-top:1mm;background:repeating-linear-gradient(to bottom,transparent 0 6.8mm,#b9c9c4 6.8mm 7mm)}
  .decision:after{height:8mm}.last .cell:after{height:21mm}details,input,textarea{display:none}
  footer{font-size:8pt}
}
</style></head><body>
<main class="sheet" data-tafelraum-page="1">
<div class="topline"><span>Mathematics · The map room</span><span>Field notes / Scale</span></div>
<h1>Trail field sheet</h1><p class="lead">Your team has 25 minutes to reach the lookout. Which trail should it take?</p>
<figure class="map">${illustration('map-room',0)}<figcaption>
<span><i class="trail"></i> Ridge trail</span><span><i class="trail river"></i> River trail</span><strong>1 grid edge = 250 m</strong></figcaption></figure>
<section>${assignment(1,'Measure the two trails','Trace each route from Camp to Lookout. Count edges, then convert the distances to kilometres.')}
<table><thead><tr><th>Trail</th><th>Grid edges</th><th>Distance (km)</th></tr></thead><tbody>
${measureRow('Ridge','ridge','re','rk')}${measureRow('River','river','ve','vk')}</tbody></table>
<details><summary>Compare your measurements</summary><p>Ridge: 6 edges = 1.5 km. River: 8 edges = 2 km. Trace again if a distance differs.</p></details></section>
<section>${assignment(2,'Make the call','Allow 15 minutes per kilometre. Work out each time, then defend your choice to a partner.')}
<div class="pair"><label class="cell">Ridge · walking time<textarea id="ridge-time"></textarea></label><label class="cell">River · walking time<textarea id="river-time"></textarea></label></div>
<label class="cell decision">Which trail fits 25 minutes? Use both times in your answer.<textarea id="decision"></textarea></label></section>
<section class="last">${assignment(3,'Change the scale','Now one grid edge represents 500 m. The route still follows the same six edges.')}
<label class="cell">How far is the ridge trail now? Explain what changes and what stays the same.<textarea id="scale"></textarea></label></section>
<footer><span>Tafelraum · Field investigations</span><span>1 / 1</span></footer>
</main></body></html>`;
