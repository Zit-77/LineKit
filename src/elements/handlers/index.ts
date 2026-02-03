import type { CanvasElement, BoundingBox } from '../../types';
import type { ElementHandler } from '../types';
import { textHandler } from './text';
import { pathHandler } from './path';
import { shapeHandler } from './shape';
import { arrowHandler } from './arrow';
import { lineHandler } from './line';

/**
 * Dispatch map que mapeia cada tipo de elemento para seu handler.
 * Isso elimina a necessidade de if/else ou switch em todo o código.
 */
export const elementHandlers = {
  text: textHandler,
  path: pathHandler,
  shape: shapeHandler,
  arrow: arrowHandler,
  line: lineHandler,
} as const;

// Funções de conveniência que encapsulam o dispatch

export function moveElement(el: CanvasElement, dx: number, dy: number): void {
  const handler = elementHandlers[el.type] as ElementHandler<typeof el.data>;
  handler.move(el.data, dx, dy);
}

export function scaleElement(
  el: CanvasElement,
  scaleX: number,
  scaleY: number,
  centerX: number,
  centerY: number
): void {
  const handler = elementHandlers[el.type] as ElementHandler<typeof el.data>;
  handler.scale(el.data, scaleX, scaleY, centerX, centerY);
}

export function rotateElement(
  el: CanvasElement,
  angle: number,
  pivotX: number,
  pivotY: number
): void {
  const handler = elementHandlers[el.type] as ElementHandler<typeof el.data>;
  handler.rotate(el.data, angle, pivotX, pivotY);
}

export function getBoundingBox(
  el: CanvasElement,
  ctx: CanvasRenderingContext2D
): BoundingBox | null {
  const handler = elementHandlers[el.type] as ElementHandler<typeof el.data>;
  return handler.getBoundingBox(el.data, ctx);
}
