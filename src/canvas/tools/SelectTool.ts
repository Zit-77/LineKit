import type { BaseTool, ToolContext } from './BaseTool';
import type { Point, BoundingBox } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';
import {
  hitTest,
  hitTestHandle,
  hitTestLineHandle,
  getBoundingBox,
  getSelectionBoundingBox,
  boxesIntersect,
} from '../../utils/geometry';
import { moveElement, rotateElement, scaleElement } from '../../elements';


export const SelectTool: BaseTool = {
  name: 'select',
  cursor: 'default',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'default';
  },

  onMouseDown(e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();


    // First check if clicking on a handle
    if (state.selectedElements.size > 0) {
      // Check for line/arrow handles first (single selection)
      const selectedArray = Array.from(state.selectedElements);
      if (selectedArray.length === 1 && (selectedArray[0].type === 'line' || selectedArray[0].type === 'arrow')) {
        const el = selectedArray[0];
        const data = el.data as { startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number };
        const lineHandle = hitTestLineHandle(point, data.startX, data.startY, data.endX, data.endY, data.controlX, data.controlY);
        if (lineHandle) {
          actions.setActiveHandle(lineHandle);
          actions.setTransformStart(point);
          return;
        }
      }

      // Check standard handles for other elements
      const box =
        state.selectionRotation !== 0 && state.initialSelectionBox
          ? state.initialSelectionBox
          : getSelectionBoundingBox(state.selectedElements, context.ctx);

      const handle = hitTestHandle(point, box, state.selectionRotation);
      if (handle) {
        actions.setActiveHandle(handle);
        actions.setTransformStart(point);
        actions.setInitialSelectionBox(getSelectionBoundingBox(state.selectedElements, context.ctx));

        if (handle === 'rotate') {
          const selBox = state.initialSelectionBox!;
          actions.setRotationCenter({
            x: selBox.x + selBox.width / 2,
            y: selBox.y + selBox.height / 2,
          });
          const rotCenter = store.getState().rotationCenter;
          actions.setInitialRotation(Math.atan2(point.y - rotCenter.y, point.x - rotCenter.x));
        }
        return;
      }
    }

    const hitElement = hitTest(point, state.elements, context.ctx);

    if (hitElement) {
      if (e.shiftKey) {
        if (state.selectedElements.has(hitElement)) {
          actions.deselectElement(hitElement);
        } else {
          actions.selectElement(hitElement, true);
        }
        actions.setSelectionRotation(0);
      } else {
        if (!state.selectedElements.has(hitElement)) {
          actions.clearSelection();
          actions.selectElement(hitElement);
          actions.setSelectionRotation(0);
        }
      }

      actions.setIsDragging(true);
      actions.setDragStart(point);
    } else {
      if (!e.shiftKey) {
        actions.clearSelection();
        actions.setSelectionRotation(0);
      }
      actions.setIsMarqueeSelecting(true);
      actions.setMarqueeStart(point);
      actions.setMarqueeEnd(point);
    }
    context.render();
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    // Handle line/arrow endpoint and control point dragging
    if (state.activeHandle && (state.activeHandle === 'start' || state.activeHandle === 'end' || state.activeHandle === 'mid')) {
      const selectedArray = Array.from(state.selectedElements);
      if (selectedArray.length === 1 && (selectedArray[0].type === 'line' || selectedArray[0].type === 'arrow')) {
        const el = selectedArray[0];
        const data = el.data as { startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number };

        if (state.activeHandle === 'start') {
          data.startX = point.x;
          data.startY = point.y;
        } else if (state.activeHandle === 'end') {
          data.endX = point.x;
          data.endY = point.y;
        } else if (state.activeHandle === 'mid') {
          // The user drags a point ON the curve (t=0.5).
          // Convert to the actual bezier control point:
          // curvePoint = 0.25*start + 0.5*control + 0.25*end
          // control = 2*curvePoint - 0.5*start - 0.5*end
          data.controlX = 2 * point.x - 0.5 * data.startX - 0.5 * data.endX;
          data.controlY = 2 * point.y - 0.5 * data.startY - 0.5 * data.endY;
        }

        store.notify();
        context.render();
        return;
      }
    }

    const handle = state.activeHandle;
    if (handle && state.initialSelectionBox) {
      const box = state.initialSelectionBox;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      if (handle === 'rotate') {
        const currentAngle = Math.atan2(
          point.y - state.rotationCenter.y,
          point.x - state.rotationCenter.x
        );
        const deltaAngle = currentAngle - state.initialRotation;

        for (const el of state.selectedElements) {
          rotateElement(el, deltaAngle, state.rotationCenter.x, state.rotationCenter.y);
        }
        actions.setSelectionRotation(state.selectionRotation + deltaAngle);
        actions.setInitialRotation(currentAngle);
      } else {
        // Resize handles
        let scaleX = 1;
        let scaleY = 1;
        let pivotX = centerX;
        let pivotY = centerY;

        const dx = point.x - state.transformStart.x;
        const dy = point.y - state.transformStart.y;

        if (handle === 'se') {
          scaleX = (box.width + dx) / box.width;
          scaleY = (box.height + dy) / box.height;
        } else if (handle === 'nw') {
          scaleX = (box.width - dx) / box.width;
          scaleY = (box.height - dy) / box.height;
        } else if (handle === 'ne') {
          scaleX = (box.width + dx) / box.width;
          scaleY = (box.height - dy) / box.height;
        } else if (handle === 'sw') {
          scaleX = (box.width - dx) / box.width;
          scaleY = (box.height + dy) / box.height;
        } else if (handle === 'n') {
          scaleY = (box.height - dy) / box.height;
          pivotY = box.y + box.height;
        } else if (handle === 's') {
          scaleY = (box.height + dy) / box.height;
          pivotY = box.y;
        } else if (handle === 'w') {
          scaleX = (box.width - dx) / box.width;
          pivotX = box.x + box.width;
        } else if (handle === 'e') {
          scaleX = (box.width + dx) / box.width;
          pivotX = box.x;
        }

        scaleX = Math.max(0.1, scaleX);
        scaleY = Math.max(0.1, scaleY);

        for (const el of state.selectedElements) {
          scaleElement(el, scaleX, scaleY, pivotX, pivotY);
        }

        actions.setTransformStart(point);
        actions.setInitialSelectionBox(getSelectionBoundingBox(state.selectedElements, context.ctx));
      }

      store.notify();
      context.render();
    } else if (state.isMarqueeSelecting) {
      actions.setMarqueeEnd(point);
      context.render();
    } else if (state.isDragging && state.selectedElements.size > 0) {
      const dx = point.x - state.dragStart.x;
      const dy = point.y - state.dragStart.y;

      for (const el of state.selectedElements) {
        moveElement(el, dx, dy);
      }

      actions.setDragStart(point);
      store.notify();
      context.render();
    } else {
      // Update cursor based on what's under the mouse
      if (state.selectedElements.size > 0) {
        // Check for line/arrow handles first (single selection)
        const selectedArray = Array.from(state.selectedElements);
        if (selectedArray.length === 1 && (selectedArray[0].type === 'line' || selectedArray[0].type === 'arrow')) {
          const el = selectedArray[0];
          const data = el.data as { startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number };
          const lineHandle = hitTestLineHandle(point, data.startX, data.startY, data.endX, data.endY, data.controlX, data.controlY);
          if (lineHandle) {
            context.canvas.style.cursor = lineHandle === 'mid' ? 'grab' : 'crosshair';
            return;
          }
        }

        const box =
          state.selectionRotation !== 0 && state.initialSelectionBox
            ? state.initialSelectionBox
            : getSelectionBoundingBox(state.selectedElements, context.ctx);

        const hoverHandle = hitTestHandle(point, box, state.selectionRotation);
        if (hoverHandle === 'rotate') {
          context.canvas.style.cursor = 'grab';
        } else if (hoverHandle === 'n' || hoverHandle === 's') {
          context.canvas.style.cursor = 'ns-resize';
        } else if (hoverHandle === 'e' || hoverHandle === 'w') {
          context.canvas.style.cursor = 'ew-resize';
        } else if (hoverHandle) {
          context.canvas.style.cursor =
            hoverHandle === 'nw' || hoverHandle === 'se' ? 'nwse-resize' : 'nesw-resize';
        } else {
          const hitElement = hitTest(point, state.elements, context.ctx);
          context.canvas.style.cursor = hitElement ? 'move' : 'crosshair';
        }
      } else {
        const hitElement = hitTest(point, state.elements, context.ctx);
        context.canvas.style.cursor = hitElement ? 'move' : 'crosshair';
      }
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.activeHandle) {
      if (state.activeHandle === 'rotate') {
        actions.setSelectionRotation(0);
      }
      // Line handles don't need special cleanup
      actions.setActiveHandle(null);
      actions.setInitialSelectionBox(null);
      context.render();
    } else if (state.isMarqueeSelecting) {
      const marqueeBox: BoundingBox = {
        x: Math.min(state.marqueeStart.x, state.marqueeEnd.x),
        y: Math.min(state.marqueeStart.y, state.marqueeEnd.y),
        width: Math.abs(state.marqueeEnd.x - state.marqueeStart.x),
        height: Math.abs(state.marqueeEnd.y - state.marqueeStart.y),
      };

      if (marqueeBox.width > 5 || marqueeBox.height > 5) {
        const hadSelection = state.selectedElements.size > 0;
        for (const el of state.elements) {
          const elBox = getBoundingBox(el, context.ctx);
          if (elBox && boxesIntersect(marqueeBox, elBox)) {
            state.selectedElements.add(el);
          }
        }
        if (!hadSelection) {
          actions.setSelectionRotation(0);
        }
        store.notifySelectionChange();
      }

      actions.setIsMarqueeSelecting(false);
      context.render();
    }
    actions.setIsDragging(false);
  },

  onDoubleClick(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();
    const hitElement = hitTest(point, state.elements, context.ctx);

    if (hitElement && hitElement.type === 'text') {
      // Remove from elements array
      const index = state.elements.indexOf(hitElement);
      if (index > -1) {
        state.elements.splice(index, 1);
      }

      // Make it the active text block for editing
      actions.setActiveTextBlock(hitElement.data);
      actions.clearSelection();
      actions.setSelectionRotation(0);

      // Switch to text tool
      actions.setTool('text');
      context.canvas.style.cursor = 'text';

      context.render();
    }
  },

  onKeyDown(e: KeyboardEvent, context: ToolContext) {
    const state = store.getState();

    // Não deletar se o foco está em um input ou textarea
    const activeElement = document.activeElement;
    const isInputFocused = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement;

    

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedElements.size > 0 && !isInputFocused) {
        actions.removeSelectedElements();
        context.render();
      }
    }
  },
};
