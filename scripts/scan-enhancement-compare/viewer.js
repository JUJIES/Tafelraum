const original = document.querySelector('#original');
const variant = document.querySelector('#variant');
const panes = [...document.querySelectorAll('.viewport')];
const status = document.querySelector('#status');
let data;
let selection = 0;
async function show(id) {
  const revision = ++selection;
  const item = data.variants.find(candidate => candidate.id === id);
  const position = {left: panes[0].scrollLeft, top: panes[0].scrollTop};
  variant.src = item.image;
  variant.alt = item.label;
  document.querySelector('#variant-title').textContent = item.label;
  for (const button of document.querySelectorAll('[data-variant]')) button.setAttribute('aria-pressed', String(button.dataset.variant === id));
  try {
    await variant.decode();
    if (revision !== selection) return;
    for (const pane of panes) pane.scrollTo(position.left, position.top);
    status.textContent = `${data.width} × ${data.height} Pixel · gleiche Größe in allen Varianten`;
  } catch {if (revision === selection) status.textContent = 'Bild konnte nicht geladen werden. Bitte die Vergleichsseite neu öffnen.';}
}
function zoom(actual) {
  for (const pane of panes) pane.classList.toggle('actual', actual);
  document.querySelector('#fit').setAttribute('aria-pressed', String(!actual));
  document.querySelector('#actual').setAttribute('aria-pressed', String(actual));
  for (const pane of panes) pane.scrollTo(0, 0);
}
for (const pane of panes) pane.addEventListener('scroll', () => {
  if (!pane.classList.contains('actual')) return;
  const other = panes.find(candidate => candidate !== pane);
  if (other.scrollLeft !== pane.scrollLeft || other.scrollTop !== pane.scrollTop) other.scrollTo(pane.scrollLeft, pane.scrollTop);
}, {passive:true});
document.querySelector('#fit').addEventListener('click', () => zoom(false));
document.querySelector('#actual').addEventListener('click', () => zoom(true));
try {
  const response = await fetch('comparison.json');
  if (!response.ok) throw new Error('Missing manifest.');
  data = await response.json();
  for (const item of data.variants) {
    const button = document.createElement('button');
    button.dataset.variant = item.id;
    button.textContent = item.label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => void show(item.id));
    document.querySelector('#variants').append(button);
  }
  document.querySelector('#source-label').textContent = data.label;
  if (data.sourceUrl && new URL(data.sourceUrl).protocol === 'https:') {
    const link = document.querySelector('#source-link');
    link.href = data.sourceUrl;
    link.textContent = data.sourceCredit || 'Bildquelle';
    link.hidden = false;
  }
  document.documentElement.style.setProperty('--image-width', `${data.width}px`);
  original.src = data.original;
  await original.decode();
  await show(data.initialVariant || 'a');
} catch {status.textContent = 'Vergleich konnte nicht geladen werden. Bitte die lokale Vergleichsadresse neu öffnen.';}
