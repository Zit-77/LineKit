import { store } from './store';
import type { BoundingBox, CanvasElement, SelectionInfo } from '../types';

const state = store.getState();

export function getElements() {
  return state.elements;
}

export function getSelectedElements() {
  return state.selectedElements;
}

export function getCurrentTool() {
  return state.currentTool;
}

export function getOffset() {
  return state.offset;
}

export function getScale() {
  return state.scale;
}

export function getSelectionRotation() {
  return state.selectionRotation;
}

export function getActiveTextBlock() {
  return state.activeTextBlock;
}

export function getCurrentPath() {
  return state.currentPath;
}

export function getCurrentShape() {
  return state.currentShape;
}

export function getCurrentArrow() {
  return state.currentArrow;
}

export function getTextSettings() {
  return {
    size: state.textSize,
    style: state.textStyle,
    color: state.textColor,
  };
}

export function getStrokeSettings() {
  return {
    width: state.strokeWidth,
    color: state.strokeColor,
  };
}

export function getShapeSettings() {
  return {
    type: state.shapeType,
    fillColor: state.shapeFillColor,
    strokeColor: state.shapeStrokeColor,
    strokeWidth: state.shapeStrokeWidth,
  };
}

export function getInteractionState() {
  return {
    isDrawing: state.isDrawing,
    isCreatingShape: state.isCreatingShape,
    isCreatingArrow: state.isCreatingArrow,
    isDragging: state.isDragging,
    isPanning: state.isPanning,
    isMarqueeSelecting: state.isMarqueeSelecting,
  };
}

export function getTransformState() {
  return {
    activeHandle: state.activeHandle,
    initialSelectionBox: state.initialSelectionBox,
    transformStart: state.transformStart,
    dragStart: state.dragStart,
    panStart: state.panStart,
    shapeStart: state.shapeStart,
    marqueeStart: state.marqueeStart,
    marqueeEnd: state.marqueeEnd,
    rotationCenter: state.rotationCenter,
    initialRotation: state.initialRotation,
  };
}

export function getSelectionInfo(): SelectionInfo {
  let hasText = false;
  let hasPath = false;
  let hasShape = false;
  let hasArrow = false;
  let hasLine = false;

  for (const el of state.selectedElements) {
    if (el.type === 'text') hasText = true;
    if (el.type === 'path') hasPath = true;
    if (el.type === 'shape') hasShape = true;
    if (el.type === 'arrow') hasArrow = true;
    if (el.type === 'line') hasLine = true;
  }

  return {
    hasText,
    hasPath,
    hasShape,
    hasArrow,
    hasLine,
    count: state.selectedElements.size,
  };
}

export function getMarqueeBox(): BoundingBox {
  return {
    x: Math.min(state.marqueeStart.x, state.marqueeEnd.x),
    y: Math.min(state.marqueeStart.y, state.marqueeEnd.y),
    width: Math.abs(state.marqueeEnd.x - state.marqueeStart.x),
    height: Math.abs(state.marqueeEnd.y - state.marqueeStart.y),
  };
}

export function hasSelection(): boolean {
  return state.selectedElements.size > 0;
}

export function isElementSelected(element: CanvasElement): boolean {
  return state.selectedElements.has(element);
}
