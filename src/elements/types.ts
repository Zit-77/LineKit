import type { BoundingBox } from '../types';

/**
 * Interface que define as operações que cada tipo de elemento deve implementar.
 * Isso permite que a lógica específica de cada tipo fique encapsulada em seu handler.
 */
export interface ElementHandler<T> {
  /** Move o elemento por (dx, dy) */
  move(data: T, dx: number, dy: number): void;

  /** Escala o elemento em relação a um ponto central */
  scale(
    data: T,
    scaleX: number,
    scaleY: number,
    centerX: number,
    centerY: number
  ): void;

  /** Rotaciona o elemento em relação a um ponto pivô */
  rotate(data: T, angle: number, pivotX: number, pivotY: number): void;

  /** Calcula o bounding box do elemento */
  getBoundingBox(data: T, ctx: CanvasRenderingContext2D): BoundingBox | null;
}
