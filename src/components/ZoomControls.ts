import type { Canvas } from '../canvas';
import { $ } from '../utils/dom';

export function setupZoomControls(canvas: Canvas) {
  const zoomInBtn = $<HTMLButtonElement>('#zoom-in')!;
  const zoomOutBtn = $<HTMLButtonElement>('#zoom-out')!;

  zoomInBtn.addEventListener('click', () => {
    canvas.zoomIn();
  });

  zoomOutBtn.addEventListener('click', () => {
    canvas.zoomOut();
  });

  return {
    zoomIn: () => canvas.zoomIn(),
    zoomOut: () => canvas.zoomOut(),
    resetZoom: () => canvas.resetZoom(),
  };
}
