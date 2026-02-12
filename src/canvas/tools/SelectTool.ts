import type { BaseTool, ToolContext } from './BaseTool';
import type { Point, BoundingBox, CanvasElement } from '../../types';
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
import { updateConnectedArrows, findSnapTarget, getClosestBorderPoint, computeAnchor } from '../../utils/connections';
import { generateId } from '../../utils/id';

// Clipboard para copiar/colar elementos
let clipboard: CanvasElement[] = [];
let clipboardCenter: Point = { x: 0, y: 0 };

// Última posição do mouse para colar elementos
let lastMousePosition: Point = { x: 0, y: 0 };

// Get the rotation of a single element, or 0 for multiple/no elements
function getElementRotation(selectedElements: Set<CanvasElement>, selectionRotation: number): number {
  if (selectionRotation !== 0) return selectionRotation;
  if (selectedElements.size !== 1) return 0;

  const el = Array.from(selectedElements)[0];
  if (el.type === 'shape') return el.data.rotation;
  if (el.type === 'text') return el.data.rotation;
  if (el.type === 'path') return el.data.rotation;
  return 0;
}

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

      const rotation = getElementRotation(state.selectedElements, state.selectionRotation);
      const handle = hitTestHandle(point, box, rotation);
      if (handle) {
        actions.setActiveHandle(handle);
        actions.setTransformStart(point);
        actions.setInitialSelectionBox(getSelectionBoundingBox(state.selectedElements, context.ctx));

        if (handle === 'rotate') {
          // Initialize selectionRotation with element's current rotation for single elements
          const elementRotation = getElementRotation(state.selectedElements, 0);
          if (elementRotation !== 0 && state.selectionRotation === 0) {
            actions.setSelectionRotation(elementRotation);
          }

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

    // Atualiza a última posição do mouse para o paste
    lastMousePosition = point;


    // Handle line/arrow endpoint and control point dragging
    if (state.activeHandle && (state.activeHandle === 'start' || state.activeHandle === 'end' || state.activeHandle === 'mid')) {
      const selectedArray = Array.from(state.selectedElements);
      if (selectedArray.length === 1 && (selectedArray[0].type === 'line' || selectedArray[0].type === 'arrow')) {
        const el = selectedArray[0];
        const data = el.data as { startX: number; startY: number; endX: number; endY: number; controlX?: number; controlY?: number; startConnectedTo?: string; endConnectedTo?: string; startAnchorX?: number; startAnchorY?: number; endAnchorX?: number; endAnchorY?: number };

        if (state.activeHandle === 'start') {
          const excludeIds = new Set<string>([el.id]);
          const snapTarget = findSnapTarget(point, state.elements, excludeIds, context.ctx);
          if (snapTarget) {
            const bp = getClosestBorderPoint(snapTarget, point, context.ctx);
            if (bp) {
              data.startX = bp.x;
              data.startY = bp.y;
              data.startConnectedTo = snapTarget.id;
              const anchor = computeAnchor(snapTarget, bp, context.ctx);
              if (anchor) {
                data.startAnchorX = anchor.anchorX;
                data.startAnchorY = anchor.anchorY;
              }
              actions.setSnapTarget(bp);
            }
          } else {
            data.startX = point.x;
            data.startY = point.y;
            data.startConnectedTo = undefined;
            data.startAnchorX = undefined;
            data.startAnchorY = undefined;
            actions.setSnapTarget(null);
          }
        } else if (state.activeHandle === 'end') {
          const excludeIds = new Set<string>([el.id]);
          const snapTarget = findSnapTarget(point, state.elements, excludeIds, context.ctx);
          if (snapTarget) {
            const bp = getClosestBorderPoint(snapTarget, point, context.ctx);
            if (bp) {
              data.endX = bp.x;
              data.endY = bp.y;
              data.endConnectedTo = snapTarget.id;
              const anchor = computeAnchor(snapTarget, bp, context.ctx);
              if (anchor) {
                data.endAnchorX = anchor.anchorX;
                data.endAnchorY = anchor.anchorY;
              }
              actions.setSnapTarget(bp);
            }
          } else {
            data.endX = point.x;
            data.endY = point.y;
            data.endConnectedTo = undefined;
            data.endAnchorX = undefined;
            data.endAnchorY = undefined;
            actions.setSnapTarget(null);
          }
        } else if (state.activeHandle === 'mid') {
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
          rotateElement(el, deltaAngle, state.rotationCenter.x, state.rotationCenter.y, context.ctx);
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
        updateConnectedArrows(el, state.elements, context.ctx);
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

        const rotation = getElementRotation(state.selectedElements, state.selectionRotation);
        const hoverHandle = hitTestHandle(point, box, rotation);
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
      actions.setSnapTarget(null);
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

      // Switch to text tool FIRST (this clears activeTextBlock)
      actions.clearSelection();
      actions.setSelectionRotation(0);
      actions.setTool('text');
      context.canvas.style.cursor = 'text';

      // THEN set the text block for editing (cursor goes to end)
      actions.setActiveTextBlock(hitElement.data);

      context.render();
    }
  },

  onKeyDown(e: KeyboardEvent, context: ToolContext) {
    const state = store.getState();

    // Não processar se o foco está em um input ou textarea
    const activeElement = document.activeElement;
    const isInputFocused = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement;

    if (isInputFocused) return;

    // Ctrl+C - Copiar elementos selecionados
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (state.selectedElements.size > 0) {
        e.preventDefault();
        // Deep clone dos elementos selecionados
        clipboard = Array.from(state.selectedElements).map(el =>
          JSON.parse(JSON.stringify(el)) as CanvasElement
        );

        // Calcular o centro dos elementos copiados
        const box = getSelectionBoundingBox(state.selectedElements, context.ctx);
        if (box) {
          clipboardCenter = {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
          };
        }
      }
      return;
    }

    // Ctrl+V - Colar elementos na posição do mouse
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      if (clipboard.length > 0) {
        e.preventDefault();

        // Calcular offset para posicionar os elementos na posição do mouse
        const offsetX = lastMousePosition.x - clipboardCenter.x;
        const offsetY = lastMousePosition.y - clipboardCenter.y;

        // Limpar seleção atual
        actions.clearSelection();

        // Colar cada elemento com posição ajustada
        store.saveSnapshot();
        const newElements: CanvasElement[] = [];

        for (const el of clipboard) {
          const cloned = JSON.parse(JSON.stringify(el)) as CanvasElement;
          cloned.id = generateId();

          // Clear connections on pasted arrows/lines
          if (cloned.type === 'arrow' || cloned.type === 'line') {
            cloned.data.startConnectedTo = undefined;
            cloned.data.endConnectedTo = undefined;
            cloned.data.startAnchorX = undefined;
            cloned.data.startAnchorY = undefined;
            cloned.data.endAnchorX = undefined;
            cloned.data.endAnchorY = undefined;
          }

          // Ajustar posição baseado no tipo do elemento
          if (cloned.type === 'text') {
            cloned.data.x += offsetX;
            cloned.data.y += offsetY;
          } else if (cloned.type === 'path') {
            for (const point of cloned.data.points) {
              point.x += offsetX;
              point.y += offsetY;
            }
            cloned.data.centerX += offsetX;
            cloned.data.centerY += offsetY;
          } else if (cloned.type === 'shape') {
            cloned.data.x += offsetX;
            cloned.data.y += offsetY;
          } else if (cloned.type === 'arrow') {
            cloned.data.startX += offsetX;
            cloned.data.startY += offsetY;
            cloned.data.endX += offsetX;
            cloned.data.endY += offsetY;
            if (cloned.data.controlX !== undefined) {
              cloned.data.controlX += offsetX;
            }
            if (cloned.data.controlY !== undefined) {
              cloned.data.controlY += offsetY;
            }
          } else if (cloned.type === 'line') {
            cloned.data.startX += offsetX;
            cloned.data.startY += offsetY;
            cloned.data.endX += offsetX;
            cloned.data.endY += offsetY;
            if (cloned.data.controlX !== undefined) {
              cloned.data.controlX += offsetX;
            }
            if (cloned.data.controlY !== undefined) {
              cloned.data.controlY += offsetY;
            }
          }

          state.elements.push(cloned);
          newElements.push(cloned);
        }

        // Selecionar os elementos colados
        for (const el of newElements) {
          state.selectedElements.add(el);
        }

        store.notifySelectionChange();
        store.notify();
        context.render();
      }
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedElements.size > 0) {
        actions.removeSelectedElements();
        context.render();
      }
    }
  },
};
