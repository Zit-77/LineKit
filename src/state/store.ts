import type {
  Tool,
  ShapeType,
  FontStyle,
  CanvasElement,
  Point,
  BoundingBox,
  TextBlock,
  DrawPath,
  Shape,
  Arrow,
  SelectionInfo,
  Line,
  HandleType,
} from '../types';
import {
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_OPACITY,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_OPACITY,
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_FILL_OPACITY,
  DEFAULT_SHAPE_STROKE_COLOR,
  DEFAULT_SHAPE_STROKE_OPACITY,
  DEFAULT_SHAPE_STROKE_WIDTH,
  DEFAULT_SHAPE_BORDER_RADIUS,
} from '../constants';

type Listener = () => void;

interface HistoryInfo {
  canUndo: boolean;
  canRedo: boolean;
}

interface State {
  // Elements
  elements: CanvasElement[];

  // History (undo/redo)
  past: string[];   // JSON snapshots dos estados anteriores
  future: string[]; // JSON snapshots para redo

  // Selection
  selectedElements: Set<CanvasElement>;
  selectionRotation: number;

  // Current tool
  currentTool: Tool;

  // View transform
  offset: Point;
  scale: number;

  // Tool settings
  textSize: number;
  textFontFamily: string;
  textStyle: FontStyle;
  textColor: string;
  textOpacity: number;
  strokeWidth: number;
  strokeColor: string;
  strokeOpacity: number;
  shapeType: ShapeType;
  shapeFillColor: string;
  shapeFillOpacity: number;
  shapeStrokeColor: string;
  shapeStrokeOpacity: number;
  shapeStrokeWidth: number;
  shapeBorderRadius: number;

  // Text editing cursor state (transient, not persisted)
  textCursorPos: number;
  textSelectionStart: number | null;

  // Active elements (being created/edited)
  activeTextBlock: TextBlock | null;
  currentPath: DrawPath | null;
  currentShape: Shape | null;
  currentArrow: Arrow | null;
  currentLine: Line | null;

  // Interaction state
  isDrawing: boolean;
  isCreatingShape: boolean;
  isCreatingArrow: boolean;
  isDragging: boolean;
  isPanning: boolean;
  isMarqueeSelecting: boolean;
  isCreatingLine: boolean;

  // Transform state
  activeHandle: HandleType;
  initialSelectionBox: BoundingBox | null;
  transformStart: Point;
  dragStart: Point;
  panStart: Point;
  shapeStart: Point;
  marqueeStart: Point;
  marqueeEnd: Point;
  rotationCenter: Point;
  initialRotation: number;
}

const STORAGE_KEY = 'g-draw-elements';
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit (localStorage typically has 5-10MB)
const WARNING_STORAGE_SIZE = 3 * 1024 * 1024; // 3MB warning threshold

function getStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        // Each character in UTF-16 takes 2 bytes
        total += (key.length + value.length) * 2;
      }
    }
  }
  return total;
}

function getItemSize(data: string): number {
  return (STORAGE_KEY.length + data.length) * 2;
}

function loadElements(): CanvasElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt data
  }
  return [];
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastWarningTime = 0;

function saveElements(elements: CanvasElement[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = JSON.stringify(elements);
      const itemSize = getItemSize(data);
      const currentSize = getStorageSize();
      const projectedSize = currentSize + itemSize;

      // Check if we're exceeding the limit
      if (projectedSize > MAX_STORAGE_SIZE) {
        console.error('Storage limit exceeded. Cannot save elements.');

        // Show warning to user (max once per 10 seconds)
        const now = Date.now();
        if (now - lastWarningTime > 10000) {
          alert('Storage limit exceeded! Your drawing has too much data. Consider removing some elements or exporting your work.');
          lastWarningTime = now;
        }
        return;
      }

      // Warning if approaching limit
      if (projectedSize > WARNING_STORAGE_SIZE && Date.now() - lastWarningTime > 30000) {
        console.warn(`Storage usage: ${(projectedSize / 1024 / 1024).toFixed(2)}MB / ${MAX_STORAGE_SIZE / 1024 / 1024}MB`);
        lastWarningTime = Date.now();
      }

      localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);

      // If quota exceeded, try to warn user
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('Storage quota exceeded! Your drawing is too large to save. Please remove some elements.');
      }
    }
  }, 300);
}

function createStore() {
  const state: State = {
    // Elements
    elements: loadElements(),

    // History
    past: [],
    future: [],

    // Selection
    selectedElements: new Set(),
    selectionRotation: 0,

    // Current tool
    currentTool: 'select',

    // View transform
    offset: { x: 0, y: 0 },
    scale: 1,

    // Tool settings
    textSize: DEFAULT_TEXT_SIZE,
    textFontFamily: DEFAULT_TEXT_FONT_FAMILY,
    textStyle: 'normal',
    textColor: DEFAULT_TEXT_COLOR,
    textOpacity: DEFAULT_TEXT_OPACITY,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    strokeColor: DEFAULT_STROKE_COLOR,
    strokeOpacity: DEFAULT_STROKE_OPACITY,
    shapeType: 'rectangle',
    shapeFillColor: DEFAULT_SHAPE_FILL_COLOR,
    shapeFillOpacity: DEFAULT_SHAPE_FILL_OPACITY,
    shapeStrokeColor: DEFAULT_SHAPE_STROKE_COLOR,
    shapeStrokeOpacity: DEFAULT_SHAPE_STROKE_OPACITY,
    shapeStrokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
    shapeBorderRadius: DEFAULT_SHAPE_BORDER_RADIUS,

    // Text editing cursor
    textCursorPos: 0,
    textSelectionStart: null,

    // Active elements
    activeTextBlock: null,
    currentPath: null,
    currentShape: null,
    currentArrow: null,
    currentLine: null,

    // Interaction state
    isDrawing: false,
    isCreatingShape: false,
    isCreatingArrow: false,
    isDragging: false,
    isPanning: false,
    isMarqueeSelecting: false,
    isCreatingLine: false,

    // Transform state
    activeHandle: null,
    initialSelectionBox: null,
    transformStart: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    shapeStart: { x: 0, y: 0 },
    marqueeStart: { x: 0, y: 0 },
    marqueeEnd: { x: 0, y: 0 },
    rotationCenter: { x: 0, y: 0 },
    initialRotation: 0,
  };

  const listeners: Set<Listener> = new Set();
  const selectionListeners: Set<(info: SelectionInfo) => void> = new Set();
  const toolListeners: Set<(tool: Tool) => void> = new Set();
  const historyListeners: Set<(info: HistoryInfo) => void> = new Set();

  const MAX_HISTORY = 100; // Limite de estados no histórico

  function notify() {
    saveElements(state.elements);
    for (const listener of listeners) {
      listener();
    }
  }

  function notifyHistoryChange() {
    const info: HistoryInfo = {
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    };
    for (const listener of historyListeners) {
      listener(info);
    }
  }

  function saveSnapshot() {
    // Salva o estado atual dos elementos no histórico
    const snapshot = JSON.stringify(state.elements);
    state.past.push(snapshot);
    // Limita o tamanho do histórico
    if (state.past.length > MAX_HISTORY) {
      state.past.shift();
    }
    // Limpa o future quando uma nova ação é feita
    state.future = [];
    notifyHistoryChange();
  }

  function undo() {
    if (state.past.length === 0) return;

    // Salva estado atual no future
    const currentSnapshot = JSON.stringify(state.elements);
    state.future.push(currentSnapshot);

    // Restaura estado anterior
    const previousSnapshot = state.past.pop()!;
    state.elements = JSON.parse(previousSnapshot);

    // Limpa seleção
    state.selectedElements.clear();
    state.selectionRotation = 0;

    notifyHistoryChange();
    notifySelectionChange();
    notify();
  }

  function redo() {
    if (state.future.length === 0) return;

    // Salva estado atual no past
    const currentSnapshot = JSON.stringify(state.elements);
    state.past.push(currentSnapshot);

    // Restaura estado futuro
    const nextSnapshot = state.future.pop()!;
    state.elements = JSON.parse(nextSnapshot);

    // Limpa seleção
    state.selectedElements.clear();
    state.selectionRotation = 0;

    notifyHistoryChange();
    notifySelectionChange();
    notify();
  }

  //Selection itens config select item;
  function notifySelectionChange() {
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

    const info: SelectionInfo = {
      hasText,
      hasPath,
      hasShape,
      hasArrow,
      hasLine,
      count: state.selectedElements.size,
    };

    for (const listener of selectionListeners) {
      listener(info);
    }
  }

  function notifyToolChange() {
    for (const listener of toolListeners) {
      listener(state.currentTool);
    }
  }

  return {
    getState: () => state,

    subscribe: (listener: Listener) => {
      listeners.add(listener); //add render subscription;
      return () => listeners.delete(listener);
    },

    subscribeToSelection: (listener: (info: SelectionInfo) => void) => {
      selectionListeners.add(listener);
      return () => selectionListeners.delete(listener);
    },

    subscribeToTool: (listener: (tool: Tool) => void) => {
      toolListeners.add(listener);
      return () => toolListeners.delete(listener);
    },

    subscribeToHistory: (listener: (info: HistoryInfo) => void) => {
      historyListeners.add(listener);
      // Notifica o estado inicial
      listener({ canUndo: state.past.length > 0, canRedo: state.future.length > 0 });
      return () => historyListeners.delete(listener);
    },

    notify,
    notifySelectionChange,
    notifyToolChange,
    saveSnapshot,
    undo,
    redo,
  };
}

export const store = createStore();
export type Store = ReturnType<typeof createStore>;
