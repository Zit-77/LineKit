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
} from '../types';
import {
  DEFAULT_TEXT_SIZE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STROKE_COLOR,
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
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
  textStyle: FontStyle;
  textColor: string;
  strokeWidth: number;
  strokeColor: string;
  shapeType: ShapeType;
  shapeFillColor: string;
  shapeStrokeColor: string;
  shapeStrokeWidth: number;
  shapeBorderRadius: number;

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
  activeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'rotate' | 'start' | 'end' | null;
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

function createStore() {
  const state: State = {
    // Elements
    elements: [],

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
    textStyle: 'normal',
    textColor: DEFAULT_TEXT_COLOR,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    strokeColor: DEFAULT_STROKE_COLOR,
    shapeType: 'rectangle',
    shapeFillColor: DEFAULT_SHAPE_FILL_COLOR,
    shapeStrokeColor: DEFAULT_SHAPE_STROKE_COLOR,
    shapeStrokeWidth: DEFAULT_SHAPE_STROKE_WIDTH,
    shapeBorderRadius: DEFAULT_SHAPE_BORDER_RADIUS,

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
      listeners.add(listener);
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
