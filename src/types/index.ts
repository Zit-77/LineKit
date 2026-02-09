// Tool types
export type Tool = 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow' | 'line';

export type ShapeType = 'triangle' | 'square' | 'rectangle' | 'circle' | 'ellipse' | 'diamond' | 'cylinder' | 'pyramid';

export type FontStyle = 'normal' | 'bold' | 'italic';

export type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | 'start' | 'end' | 'mid' | null;

// Element data types
export interface TextBlock {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontStyle: FontStyle;
  color: string;
  opacity: number;
  rotation: number;
}

export interface DrawPath {
  points: Point[];
  lineWidth: number;
  color: string;
  opacity: number;
  rotation: number;
  centerX: number;
  centerY: number;
}

export interface Shape {
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  borderRadius: number;
  rotation: number;
}

export interface Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  opacity: number;
  lineWidth: number;
  controlX?: number;
  controlY?: number;
}

export interface Arrow {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  opacity: number;
  lineWidth: number;
  controlX?: number;
  controlY?: number;
}

// Canvas element union type
export type CanvasElement =
  | { type: 'text'; data: TextBlock }
  | { type: 'path'; data: DrawPath }
  | { type: 'shape'; data: Shape }
  | { type: 'arrow'; data: Arrow }
  | { type: 'line'; data: Line };

// Geometry types
export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;

}

// Selection info for UI updates
export interface SelectionInfo {
  hasText: boolean;
  hasPath: boolean;
  hasShape: boolean;
  hasArrow: boolean;
  hasLine: boolean;
  count: number;
}

// Tool settings
export interface TextSettings {
  size: number;
  style: FontStyle;
  color: string;
}

export interface StrokeSettings {
  width: number;
  color: string;
}

export interface ShapeSettings {
  type: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// State types
export interface CanvasState {
  elements: CanvasElement[];
  selectedElements: Set<CanvasElement>;
  currentTool: Tool;
  selectionRotation: number;
  offset: Point;
  scale: number;
}

export interface ToolSettings {
  text: TextSettings;
  stroke: StrokeSettings;
  shape: ShapeSettings;
}
