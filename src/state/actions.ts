import { store } from './store';
import type {
  Tool,
  ShapeType,
  FontStyle,
  LineStyle,
  CanvasElement,
  Point,
  BoundingBox,
  TextBlock,
  DrawPath,
  Shape,
  Arrow,
  HandleType,
  Line,
} from '../types';
import { MIN_SCALE, MAX_SCALE, ZOOM_FACTOR } from '../constants';
import { generateId } from '../utils/id';

const state = store.getState();

// History actions
export function undo() {
  store.undo();
}

export function redo() {
  store.redo();
}

// Element actions
export function addElement(element: CanvasElement) {
  store.saveSnapshot();
  if (!element.id) element.id = generateId();
  state.elements.push(element);
  store.notify();
}

export function removeElement(element: CanvasElement) {
  const index = state.elements.indexOf(element);
  if (index > -1) {
    store.saveSnapshot();
    state.elements.splice(index, 1);
    store.notify();
  }
}

export function removeSelectedElements() {
  if (state.selectedElements.size === 0) return;
  store.saveSnapshot();

  // Collect IDs of elements being removed
  const removedIds = new Set<string>();
  for (const el of state.selectedElements) {
    removedIds.add(el.id);
  }

  for (const el of state.selectedElements) {
    const index = state.elements.indexOf(el);
    if (index > -1) {
      state.elements.splice(index, 1);
    }
  }

  // Clean up dangling connection references
  for (const el of state.elements) {
    if (el.type === 'arrow' || el.type === 'line') {
      if (el.data.startConnectedTo && removedIds.has(el.data.startConnectedTo)) {
        el.data.startConnectedTo = undefined;
      }
      if (el.data.endConnectedTo && removedIds.has(el.data.endConnectedTo)) {
        el.data.endConnectedTo = undefined;
      }
    }
  }

  state.selectedElements.clear();
  store.notifySelectionChange();
  store.notify();
}

// Selection actions
export function selectElement(element: CanvasElement, addToSelection = false) {
  if (!addToSelection) {
    state.selectedElements.clear();
    state.selectionRotation = 0;
  }
  state.selectedElements.add(element);
  store.notifySelectionChange();
  store.notify();
}

export function deselectElement(element: CanvasElement) {
  state.selectedElements.delete(element);
  if (state.selectedElements.size === 0) {
    state.selectionRotation = 0;
  }
  store.notifySelectionChange();
  store.notify();
}

export function clearSelection() {
  state.selectedElements.clear();
  state.selectionRotation = 0;
  store.notifySelectionChange();
  store.notify();
}

export function setSelectionRotation(rotation: number) {
  state.selectionRotation = rotation;
}

// Tool actions
export function setTool(tool: Tool) {
  // Commit any active text block before switching
  if (state.activeTextBlock && state.activeTextBlock.text.trim()) {
    state.elements.push({ type: 'text', id: generateId(), data: state.activeTextBlock });
  }
  state.activeTextBlock = null;
  state.selectedElements.clear();
  state.selectionRotation = 0;
  state.currentTool = tool;
  store.notifySelectionChange();
  store.notifyToolChange();
  store.notify();
}

// View actions
export function setOffset(offset: Point) {
  state.offset = offset;
  store.notify();
}

export function setScale(scale: number) {
  state.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  store.saveZoom(state.scale);
  store.notify();
}

export function zoomIn(centerX: number, centerY: number) {
  const newScale = Math.min(state.scale * ZOOM_FACTOR, MAX_SCALE);
  state.offset.x = centerX - (centerX - state.offset.x) * (newScale / state.scale);
  state.offset.y = centerY - (centerY - state.offset.y) * (newScale / state.scale);
  state.scale = newScale;
  store.saveZoom(state.scale);
  store.notify();
}

export function zoomOut(centerX: number, centerY: number) {
  const newScale = Math.max(state.scale / ZOOM_FACTOR, MIN_SCALE);
  state.offset.x = centerX - (centerX - state.offset.x) * (newScale / state.scale);
  state.offset.y = centerY - (centerY - state.offset.y) * (newScale / state.scale);
  state.scale = newScale;
  store.saveZoom(state.scale);
  store.notify();
}

export function resetZoom() {
  state.scale = 1;
  state.offset = { x: 0, y: 0 };
  store.saveZoom(state.scale);
  store.notify();
}

// Tool settings actions
export function setTextSize(size: number) {
  state.textSize = size;
  // 
  if (state.activeTextBlock) {
    state.activeTextBlock.fontSize = size;
  }
  // Aplica aos elementos selecionados
  for (const el of state.selectedElements) {
    if (el.type === 'text') {
      el.data.fontSize = size;
    }
  }
  store.notify();
}

export function setTextFontFamily(family: string) {
  state.textFontFamily = family;
  if (state.activeTextBlock) {
    state.activeTextBlock.fontFamily = family;
  }
  for (const el of state.selectedElements) {
    if (el.type === 'text') {
      el.data.fontFamily = family;
    }
  }
  store.notify();
}

export function setTextStyle(style: FontStyle) {
  state.textStyle = style;
  // 
  if (state.activeTextBlock) {
    state.activeTextBlock.fontStyle = style;
  }
  // Aplica aos elementos selecionados
  for (const el of state.selectedElements) {
    if (el.type === 'text') {
      el.data.fontStyle = style;
    }
  }
  store.notify();
}

export function setTextColor(color: string) {
  state.textColor = color;
  //
  if (state.activeTextBlock) {
    state.activeTextBlock.color = color;
  }
  // Aplica aos elementos selecionados
  for (const el of state.selectedElements) {
    if (el.type === 'text') {
      el.data.color = color;
    }
  }
  store.notify();
}

export function setTextOpacity(opacity: number) {
  state.textOpacity = opacity;
  if (state.activeTextBlock) {
    state.activeTextBlock.opacity = opacity;
  }
  for (const el of state.selectedElements) {
    if (el.type === 'text') {
      el.data.opacity = opacity;
    }
  }
  store.notify();
}

export function setStrokeWidth(width: number) {
  state.strokeWidth = width;
  for (const el of state.selectedElements) {
    if (el.type === 'path') {
      el.data.lineWidth = width;
    } else if (el.type === 'arrow') {
      el.data.lineWidth = width;
    } else if (el.type === 'line') {
      el.data.lineWidth = width;
    }
  }
  store.notify();
}

export function setStrokeColor(color: string) {
  state.strokeColor = color;
  for (const el of state.selectedElements) {
    if (el.type === 'path') {
      el.data.color = color;
    } else if (el.type === 'arrow') {
      el.data.color = color;
    } else if (el.type === 'line') {
      el.data.color = color;
    }
  }
  store.notify();
}

export function setStrokeOpacity(opacity: number) {
  state.strokeOpacity = opacity;
  for (const el of state.selectedElements) {
    if (el.type === 'path') {
      el.data.opacity = opacity;
    } else if (el.type === 'arrow') {
      el.data.opacity = opacity;
    } else if (el.type === 'line') {
      el.data.opacity = opacity;
    }
  }
  store.notify();
}

export function setLineWidth(width: number) {
  state.strokeWidth = width;
  for (const el of state.selectedElements) {
    if (el.type === 'line') {
      el.data.lineWidth = width;
    }
  }
  store.notify();
}

export function setLineColor(color: string) {
  state.strokeColor = color;
  for (const el of state.selectedElements) {
    if (el.type === 'line') {
      el.data.color = color;
    }
  }
  store.notify();
}

export function setLineOpacity(opacity: number) {
  state.strokeOpacity = opacity;
  for (const el of state.selectedElements) {
    if (el.type === 'line') {
      el.data.opacity = opacity;
    }
  }
  store.notify();
}

export function setLineStyle(style: LineStyle) {
  state.lineStyle = style;
  for (const el of state.selectedElements) {
    if (el.type === 'line') {
      el.data.style = style;
    }
  }
  store.notify();
}

export function setLineRoughness(roughness: number) {
  state.lineRoughness = roughness;
  for (const el of state.selectedElements) {
    if (el.type === 'line') {
      el.data.roughness = roughness;
    }
  }
  store.notify();
}

export function setArrowWidth(width: number) {
  state.strokeWidth = width;
  for (const el of state.selectedElements) {
    if (el.type === 'arrow') {
      el.data.lineWidth = width;
    }
  }
  store.notify();
}

export function setArrowColor(color: string) {
  state.strokeColor = color;
  for (const el of state.selectedElements) {
    if (el.type === 'arrow') {
      el.data.color = color;
    }
  }
  store.notify();
}

export function setArrowOpacity(opacity: number) {
  state.strokeOpacity = opacity;
  for (const el of state.selectedElements) {
    if (el.type === 'arrow') {
      el.data.opacity = opacity;
    }
  }
  store.notify();
}

export function setArrowStyle(style: LineStyle) {
  state.arrowStyle = style;
  for (const el of state.selectedElements) {
    if (el.type === 'arrow') {
      el.data.style = style;
    }
  }
  store.notify();
}

export function setArrowRoughness(roughness: number) {
  state.arrowRoughness = roughness;
  for (const el of state.selectedElements) {
    if (el.type === 'arrow') {
      el.data.roughness = roughness;
    }
  }
  store.notify();
}

export function setShapeType(shapeType: ShapeType) {
  state.shapeType = shapeType;
}

export function setShapeFillColor(color: string) {
  state.shapeFillColor = color;
  for (const el of state.selectedElements) {
    if (el.type === 'shape') {
      el.data.fillColor = color;
    }
  }
  store.notify();
}

export function setShapeFillOpacity(opacity: number) {
  state.shapeFillOpacity = opacity;
  for (const el of state.selectedElements) {
    if (el.type === 'shape') {
      el.data.fillOpacity = opacity;
    }
  }
  store.notify();
}

export function setShapeStrokeColor(color: string) {
  state.shapeStrokeColor = color;
  for (const el of state.selectedElements) {
    if (el.type === 'shape') {
      el.data.strokeColor = color;
    }
  }
  store.notify();
}

export function setShapeStrokeOpacity(opacity: number) {
  state.shapeStrokeOpacity = opacity;
  for (const el of state.selectedElements) {
    if (el.type === 'shape') {
      el.data.strokeOpacity = opacity;
    }
  }
  store.notify();
}

export function setShapeStrokeWidth(width: number) {
  state.shapeStrokeWidth = width;
  for (const el of state.selectedElements) {
    if (el.type === 'shape') {
      el.data.strokeWidth = width;
    }
  }
  store.notify();
}

export function setShapeBorderRadius(radius: number) {
  state.shapeBorderRadius = radius;
  for (const el of state.selectedElements) {
    if (el.type === 'shape') {
      el.data.borderRadius = radius;
    }
  }
  store.notify();
}

// Text cursor actions
export function setTextCursorPos(pos: number) {
  state.textCursorPos = pos;
}

export function setTextSelectionStart(start: number | null) {
  state.textSelectionStart = start;
}

// Active element actions
export function setActiveTextBlock(block: TextBlock | null) {
  state.activeTextBlock = block;
  if (block) {
    state.textCursorPos = block.text.length;
    state.textSelectionStart = null;
  }
  store.notify();
}

export function setCurrentPath(path: DrawPath | null) {
  state.currentPath = path;
  store.notify();
}

export function setCurrentShape(shape: Shape | null) {
  state.currentShape = shape;
  store.notify();
}

export function setCurrentLine(line: Line | null) {
  state.currentLine = line;
  store.notify();
}

export function setCurrentArrow(arrow: Arrow | null) {
  state.currentArrow = arrow;
  store.notify();
}

// Interaction state actions
export function setIsDrawing(value: boolean) {
  state.isDrawing = value;
}

export function setIsCreatingShape(value: boolean) {
  state.isCreatingShape = value;
}

export function setIsCreatingLine(value: boolean) {
  state.isCreatingLine = value;
}

export function setIsCreatingArrow(value: boolean) {
  state.isCreatingArrow = value;
}

export function setIsDragging(value: boolean) {
  state.isDragging = value;
}

export function setIsPanning(value: boolean) {
  state.isPanning = value;
}

export function setIsMarqueeSelecting(value: boolean) {
  state.isMarqueeSelecting = value;
}

// Transform state actions
export function setActiveHandle(handle: HandleType) {
  state.activeHandle = handle;
}

export function setInitialSelectionBox(box: BoundingBox | null) {
  state.initialSelectionBox = box;
}

export function setTransformStart(point: Point) {
  state.transformStart = point;
}

export function setDragStart(point: Point) {
  state.dragStart = point;
}

export function setPanStart(point: Point) {
  state.panStart = point;
}

export function setShapeStart(point: Point) {
  state.shapeStart = point;
}

export function setMarqueeStart(point: Point) {
  state.marqueeStart = point;
}

export function setMarqueeEnd(point: Point) {
  state.marqueeEnd = point;
}

export function setRotationCenter(point: Point) {
  state.rotationCenter = point;
}

export function setInitialRotation(rotation: number) {
  state.initialRotation = rotation;
}

export function setSnapTarget(point: Point | null, element?: CanvasElement | null) {
  state.snapTarget = point;
  state.snapTargetElement = element ?? null;
}

// Commit active text block to elements
export function commitActiveTextBlock() {
  if (state.activeTextBlock && state.activeTextBlock.text.trim()) {
    store.saveSnapshot();
    state.elements.push({ type: 'text', id: generateId(), data: state.activeTextBlock });
  }
  state.activeTextBlock = null;
  store.notify();
}

// Commit current path to elements
export function commitCurrentPath() {
  if (state.currentPath && state.currentPath.points.length > 1) {
    store.saveSnapshot();
    let sumX = 0;
    let sumY = 0;
    for (const p of state.currentPath.points) {
      sumX += p.x;
      sumY += p.y;
    }
    state.currentPath.centerX = sumX / state.currentPath.points.length;
    state.currentPath.centerY = sumY / state.currentPath.points.length;
    state.elements.push({ type: 'path', id: generateId(), data: state.currentPath });
  }
  state.currentPath = null;
  state.isDrawing = false;
  store.notify();
}

// Commit current shape to elements
export function commitCurrentShape() {
  if (state.currentShape && state.currentShape.width > 5 && state.currentShape.height > 5) {
    store.saveSnapshot();
    state.elements.push({ type: 'shape', id: generateId(), data: state.currentShape });
  }
  state.currentShape = null;
  state.isCreatingShape = false;
  store.notify();
}

export function commitCurrentLine() {
  if (state.currentLine) {
    const dx = state.currentLine.endX - state.currentLine.startX;
    const dy = state.currentLine.endY - state.currentLine.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 10) {
      store.saveSnapshot();
      state.elements.push({ type: 'line', id: generateId(), data: state.currentLine });
    }
  }
  state.currentLine = null;
  state.isCreatingLine = false;
  store.notify();
}

// Commit current arrow to elements
export function commitCurrentArrow() {
  if (state.currentArrow) {
    const dx = state.currentArrow.endX - state.currentArrow.startX;
    const dy = state.currentArrow.endY - state.currentArrow.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 10) {
      store.saveSnapshot();
      state.elements.push({ type: 'arrow', id: generateId(), data: state.currentArrow });
    }
  }
  state.currentArrow = null;
  state.isCreatingArrow = false;
  store.notify();
}
