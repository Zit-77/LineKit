import type { Tool, SelectionInfo } from '../types';
import { store } from '../state/store';
import * as actions from '../state/actions';
import { getCanvasPoint, getSelectionBoundingBox, getBoundingBox, boxesIntersect } from '../utils/geometry';
import { drawPath, drawText, drawShape, drawArrow, drawSelectionUI, drawLineSelectionUI, drawMarquee, drawLine, drawElementBoundingBox } from './renderer';
import { tools } from './tools';
import type { ToolContext } from './tools';

export function createCanvas(element: HTMLCanvasElement) {
  const ctx = element.getContext('2d')!;
  const state = store.getState();

  const context: ToolContext = {
    canvas: element,
    ctx,
    render,
    setTool,
  };

  function resize() {
    element.width = window.innerWidth;
    element.height = window.innerHeight;
    render();
  }

  function render() {
    ctx.clearRect(0, 0, element.width, element.height);
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    // Draw all elements
    for (const el of state.elements) {
      if (el.type === 'path') {
        drawPath(ctx, el.data);
      } else if (el.type === 'text') {
        drawText(ctx, el.data);
      } else if (el.type === 'shape') {
        drawShape(ctx, el.data);
      } else if (el.type === 'arrow') {
        drawArrow(ctx, el.data);
      } else if (el.type === 'line') {
        drawLine(ctx, el.data);
      }
    }

    // Draw current path being drawn
    if (state.currentPath) {
      drawPath(ctx, state.currentPath);
    }

    // Draw current shape being created
    if (state.currentShape) {
      drawShape(ctx, state.currentShape);
    }

    // Draw current arrow being created
    if (state.currentArrow) {
      drawArrow(ctx, state.currentArrow);
    }

    // Draw active text block
    if (state.activeTextBlock) {
      drawText(ctx, state.activeTextBlock, true);
    }

    // Draw current line being created;
    if (state.currentLine) {
      drawLine(ctx, state.currentLine);
    }

    // Draw selection UI
    if (state.selectedElements.size > 0 && !state.isMarqueeSelecting) {
      const selectedArray = Array.from(state.selectedElements);

      // Draw individual bounding boxes when multiple elements are selected
      if (selectedArray.length > 1) {
        for (const el of selectedArray) {
          const elBox = getBoundingBox(el, ctx);
          if (elBox) {
            drawElementBoundingBox(ctx, elBox);
          }
        }
      }

      // Check if single line or arrow is selected
      if (selectedArray.length === 1 && (selectedArray[0].type === 'line' || selectedArray[0].type === 'arrow')) {
        const el = selectedArray[0];
        if (el.type === 'line') {
          drawLineSelectionUI(ctx, el.data.startX, el.data.startY, el.data.endX, el.data.endY, el.data.controlX, el.data.controlY);
        } else if (el.type === 'arrow') {
          drawLineSelectionUI(ctx, el.data.startX, el.data.startY, el.data.endX, el.data.endY, el.data.controlX, el.data.controlY);
        }
      } else {
        const box =
          state.selectionRotation !== 0 && state.initialSelectionBox
            ? state.initialSelectionBox
            : getSelectionBoundingBox(state.selectedElements, ctx);
        if (box) {
          // For single element, use element's rotation; for multiple or during rotation, use selectionRotation
          let rotation = state.selectionRotation;
          if (selectedArray.length === 1 && state.selectionRotation === 0) {
            const el = selectedArray[0];
            if (el.type === 'shape') {
              rotation = el.data.rotation;
            } else if (el.type === 'text') {
              rotation = el.data.rotation;
            } else if (el.type === 'path') {
              rotation = el.data.rotation;
            }
          }
          drawSelectionUI(ctx, box, rotation);
        }
      }
    }

    // Draw marquee selection box
    if (state.isMarqueeSelecting) {
      drawMarquee(ctx, state.marqueeStart.x, state.marqueeStart.y, state.marqueeEnd.x, state.marqueeEnd.y);

      // Show individual bounding boxes for elements intersecting the marquee
      const marqueeBox = {
        x: Math.min(state.marqueeStart.x, state.marqueeEnd.x),
        y: Math.min(state.marqueeStart.y, state.marqueeEnd.y),
        width: Math.abs(state.marqueeEnd.x - state.marqueeStart.x),
        height: Math.abs(state.marqueeEnd.y - state.marqueeStart.y),
      };
      if (marqueeBox.width > 2 || marqueeBox.height > 2) {
        for (const el of state.elements) {
          const elBox = getBoundingBox(el, ctx);
          if (elBox && boxesIntersect(marqueeBox, elBox)) {
            drawElementBoundingBox(ctx, elBox);
          }
        }
      }
    }

    ctx.restore();
  }

  function handleMouseDown(e: MouseEvent) {
    const point = getCanvasPoint(e, state.offset, state.scale);
    const tool = tools[state.currentTool];
    tool.onMouseDown?.(e, point, context);
  }

  function handleMouseMove(e: MouseEvent) {
    const point = getCanvasPoint(e, state.offset, state.scale);
    const tool = tools[state.currentTool];
    tool.onMouseMove?.(e, point, context);
  }

  function handleMouseUp(e: MouseEvent) {
    const point = getCanvasPoint(e, state.offset, state.scale);
    const tool = tools[state.currentTool];
    tool.onMouseUp?.(e, point, context);
  }

  function handleDoubleClick(e: MouseEvent) {
    const point = getCanvasPoint(e, state.offset, state.scale);
    const tool = tools[state.currentTool];
    tool.onDoubleClick?.(e, point, context);
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ctrl+Z = Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      actions.undo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z = Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      actions.redo();
      return;
    }

    // Escape switches to select tool
    if (e.key === 'Escape') {
      if (state.currentTool === 'text' && state.activeTextBlock) {
        actions.commitActiveTextBlock();
      }
      setTool('select');
      render();
      return;
    }

    const tool = tools[state.currentTool];
    tool.onKeyDown?.(e, context);
  }

  function setTool(tool: Tool) {
    actions.setTool(tool);
    const newTool = tools[tool];
    newTool.onActivate?.(context);
    element.style.cursor = newTool.cursor;
    render();
  }

  // Event listeners
  element.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseup', handleMouseUp);
  element.addEventListener('mouseleave', handleMouseUp);
  element.addEventListener('dblclick', handleDoubleClick);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resize);

  // Subscribe to state changes
  store.subscribe(render);

  // Initialize
  resize();
  setTool('select');

  return {
    setTool,
    zoomIn: () => actions.zoomIn(element.width / 2, element.height / 2),
    zoomOut: () => actions.zoomOut(element.width / 2, element.height / 2),
    resetZoom: actions.resetZoom,
    undo: actions.undo,
    redo: actions.redo,
    onSelectionChange: (callback: (info: SelectionInfo) => void) => store.subscribeToSelection(callback),
    onToolChange: (callback: (tool: Tool) => void) => store.subscribeToTool(callback),
    onHistoryChange: (callback: (info: { canUndo: boolean; canRedo: boolean }) => void) => store.subscribeToHistory(callback),
  };
}

export type Canvas = ReturnType<typeof createCanvas>;
