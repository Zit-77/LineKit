import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';

export const ShapeTool: BaseTool = {
  name: 'shape',
  cursor: 'crosshair',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
    const state = store.getState();

    actions.setIsCreatingShape(true);
    actions.setShapeStart(point);
    actions.setCurrentShape({
      shapeType: state.shapeType,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      fillColor: state.shapeFillColor,
      strokeColor: state.shapeStrokeColor,
      strokeWidth: state.shapeStrokeWidth,
      borderRadius: state.shapeBorderRadius,
      rotation: 0,
    });
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isCreatingShape && state.currentShape) {
      const minX = Math.min(state.shapeStart.x, point.x);
      const minY = Math.min(state.shapeStart.y, point.y);
      let width = Math.abs(point.x - state.shapeStart.x);
      let height = Math.abs(point.y - state.shapeStart.y);

      // For square and circle, make dimensions equal
      if (state.currentShape.shapeType === 'square' || state.currentShape.shapeType === 'circle') {
        const size = Math.max(width, height);
        width = size;
        height = size;
      }

      state.currentShape.x = minX;
      state.currentShape.y = minY;
      state.currentShape.width = width;
      state.currentShape.height = height;
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();
    const countBefore = state.elements.length;
    actions.commitCurrentShape();
    if (state.elements.length > countBefore) {
      const newElement = state.elements[state.elements.length - 1];
      context.setTool('select');
      actions.selectElement(newElement);
    }
  },
};
