import type { Point } from '../../types';

export interface ToolContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  render: () => void;
}

export interface BaseTool {
  name: string;
  cursor: string;

  onActivate?(context: ToolContext): void;
  onDeactivate?(context: ToolContext): void;

  onMouseDown?(e: MouseEvent, point: Point, context: ToolContext): void;
  onMouseMove?(e: MouseEvent, point: Point, context: ToolContext): void;
  onMouseUp?(e: MouseEvent, point: Point, context: ToolContext): void;
  onDoubleClick?(e: MouseEvent, point: Point, context: ToolContext): void;
  onKeyDown?(e: KeyboardEvent, context: ToolContext): void;
}
