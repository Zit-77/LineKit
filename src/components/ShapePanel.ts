import type { ShapeType, Tool } from '../types';
import type { Canvas } from '../canvas';
import { $, $all, show, hide } from '../utils/dom';

export function setupShapePanel(canvas: Canvas) {
  const shapePanel = $<HTMLDivElement>('#shape-panel')!;
  const shapeItems = $all<HTMLButtonElement>('.shape-item');

  shapeItems.forEach((item) => {
    item.addEventListener('click', () => {
      shapeItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      const shapeType = item.dataset.shape as ShapeType;
      canvas.setShapeType(shapeType);
    });
  });

  // Subscribe to tool changes to show/hide panel
  canvas.onToolChange((tool: Tool) => {
    if (tool === 'shape') {
      show(shapePanel);
    } else {
      hide(shapePanel);
    }
  });

  return {
    show: () => show(shapePanel),
    hide: () => hide(shapePanel),
  };
}
