import type { BoundingBox } from '../../types';

/**
 * Interface para dados de elementos lineares (line e arrow).
 * Ambos compartilham a mesma estrutura de pontos.
 */
export interface LinearElementData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  lineWidth: number;
  controlX?: number;
  controlY?: number;
}

/** Move um elemento linear por (dx, dy) */
export function moveLinear(data: LinearElementData, dx: number, dy: number) {
  data.startX += dx;
  data.startY += dy;
  data.endX += dx;
  data.endY += dy;
  if (data.controlX !== undefined) data.controlX += dx;
  if (data.controlY !== undefined) data.controlY += dy;
}

/** Escala um elemento linear em relação a um ponto central */
export function scaleLinear(
  data: LinearElementData,
  scaleX: number,
  scaleY: number,
  centerX: number,
  centerY: number
) {
  data.startX = centerX + (data.startX - centerX) * scaleX;
  data.startY = centerY + (data.startY - centerY) * scaleY;
  data.endX = centerX + (data.endX - centerX) * scaleX;
  data.endY = centerY + (data.endY - centerY) * scaleY;
  if (data.controlX !== undefined) {
    data.controlX = centerX + (data.controlX - centerX) * scaleX;
  }
  if (data.controlY !== undefined) {
    data.controlY = centerY + (data.controlY - centerY) * scaleY;
  }
}

/** Rotaciona um elemento linear em relação a um ponto pivô */
export function rotateLinear(
  data: LinearElementData,
  angle: number,
  pivotX: number,
  pivotY: number
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Rotate start point
  const dx1 = data.startX - pivotX;
  const dy1 = data.startY - pivotY;
  data.startX = pivotX + dx1 * cos - dy1 * sin;
  data.startY = pivotY + dx1 * sin + dy1 * cos;

  // Rotate end point
  const dx2 = data.endX - pivotX;
  const dy2 = data.endY - pivotY;
  data.endX = pivotX + dx2 * cos - dy2 * sin;
  data.endY = pivotY + dx2 * sin + dy2 * cos;

  // Rotate control point
  if (data.controlX !== undefined && data.controlY !== undefined) {
    const dx3 = data.controlX - pivotX;
    const dy3 = data.controlY - pivotY;
    data.controlX = pivotX + dx3 * cos - dy3 * sin;
    data.controlY = pivotY + dx3 * sin + dy3 * cos;
  }
}

/** Calcula o bounding box de um elemento linear */
export function getLinearBoundingBox(
  data: LinearElementData,
  extraPadding: number = 0
): BoundingBox {
  const padding = Math.max(data.lineWidth * 2, 6) + extraPadding;

  if (data.controlX !== undefined && data.controlY !== undefined) {
    // Curved: use AABB that includes control point
    const minX = Math.min(data.startX, data.endX, data.controlX) - padding;
    const minY = Math.min(data.startY, data.endY, data.controlY) - padding;
    const maxX = Math.max(data.startX, data.endX, data.controlX) + padding;
    const maxY = Math.max(data.startY, data.endY, data.controlY) + padding;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // Straight: OBB (oriented bounding box)
  const dx = data.endX - data.startX;
  const dy = data.endY - data.startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const centerX = (data.startX + data.endX) / 2;
  const centerY = (data.startY + data.endY) / 2;

  return {
    x: centerX - length / 2,
    y: centerY - padding / 2,
    width: length,
    height: padding,
    rotation: angle,
  };
}
