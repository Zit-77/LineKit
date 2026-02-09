import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';

export const ArrowTool: BaseTool = {
  name: 'arrow',
  cursor: 'crosshair',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
    const state = store.getState();

    actions.setIsCreatingArrow(true);
    actions.setCurrentArrow({
      startX: point.x,
      startY: point.y,
      endX: point.x,
      endY: point.y,
      color: state.strokeColor,
      opacity: state.strokeOpacity,
      lineWidth: state.strokeWidth,
    });
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isCreatingArrow && state.currentArrow) {
      state.currentArrow.endX = point.x;
      state.currentArrow.endY = point.y;
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();
    const countBefore = state.elements.length;
    actions.commitCurrentArrow();
    if (state.elements.length > countBefore) {
      const newElement = state.elements[state.elements.length - 1];
      context.setTool('select');
      actions.selectElement(newElement);
    }
  },
};
