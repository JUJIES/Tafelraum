// Only the native video is the fullscreen target. No additional player controls.
(() => {
  const presentation=window.tafelraumPresentation;
  if(!presentation)return; // Standalone/local player stays unchanged.
  document.body.classList.add('room-video-player');
  window.tafelraumPlayback.getFullscreenTarget=()=>document.querySelector('.slide:not([hidden]) video');
})();
