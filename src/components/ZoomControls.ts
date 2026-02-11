import type { Canvas } from '../canvas';
import { $ } from '../utils/dom';
import { store } from '../state/store';

export function setupZoomControls(canvas: Canvas) {
  const zoomInBtn = $<HTMLButtonElement>('#zoom-in')!;
  const zoomOutBtn = $<HTMLButtonElement>('#zoom-out')!;
  const zoomLevel = $<HTMLSpanElement>('#zoom-level')!;

  function updateZoomDisplay() {
    const state = store.getState();
    const percentage = Math.round(state.scale * 100);
    zoomLevel.textContent = `${percentage}%`;
  }

  zoomInBtn.addEventListener('click', () => {
    canvas.zoomIn();
  });

  zoomOutBtn.addEventListener('click', () => {
    canvas.zoomOut();
  });

  // Update zoom display when state changes
  store.subscribe(updateZoomDisplay);

  // Initialize display
  updateZoomDisplay();

  return {
    zoomIn: () => canvas.zoomIn(),
    zoomOut: () => canvas.zoomOut(),
    resetZoom: () => canvas.resetZoom(),
  };
}
