import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';

export const MoveTool: BaseTool = {
  name: 'move',
  cursor: 'grab',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'grab';
  },

  onMouseDown(e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();
    actions.setIsPanning(true);
    actions.setPanStart({ x: e.clientX - state.offset.x, y: e.clientY - state.offset.y });
    context.canvas.style.cursor = 'grabbing';
  },

  onMouseMove(e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isPanning) {
      actions.setOffset({
        x: e.clientX - state.panStart.x,
        y: e.clientY - state.panStart.y,
      });
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isPanning) {
      actions.setIsPanning(false);
      context.canvas.style.cursor = 'grab';
    }
  },
};
