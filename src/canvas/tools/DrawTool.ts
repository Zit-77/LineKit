import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';


export const DrawTool: BaseTool = {
  name: 'draw',
  cursor: 'crosshair',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
    const state = store.getState();

    actions.setIsDrawing(true);
    actions.setCurrentPath({
      points: [point],
      lineWidth: state.strokeWidth,
      color: state.strokeColor,
      opacity: state.strokeOpacity,
      rotation: 0,
      centerX: point.x,
      centerY: point.y,
    });
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isDrawing && state.currentPath) {
      state.currentPath.points.push(point);
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, _context: ToolContext) {
    actions.commitCurrentPath();
  },
};
