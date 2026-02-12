import type { CanvasElement, Point } from '../types';
import { getBoundingBox } from './geometry';
import { SNAP_RADIUS } from '../constants';

export function getElementCenter(el: CanvasElement, ctx: CanvasRenderingContext2D): Point | null {
  const box = getBoundingBox(el, ctx);
  if (!box) return null;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Ponto mais próximo no perímetro do segmento de reta ao ponto p.
 */
function closestPointOnSegment(p: Point, ax: number, ay: number, bx: number, by: number): Point {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: ax, y: ay };
  const t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / lenSq));
  return { x: ax + t * dx, y: ay + t * dy };
}

/**
 * Ponto mais próximo no perímetro do elemento ao ponto dado.
 * O usuário pode conectar em qualquer lugar da borda.
 */
export function getClosestBorderPoint(
  el: CanvasElement,
  point: Point,
  ctx: CanvasRenderingContext2D
): Point | null {
  const box = getBoundingBox(el, ctx);
  if (!box) return null;

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hw = box.width / 2;
  const hh = box.height / 2;

  // Círculo/Elipse
  if (el.type === 'shape' && (el.data.shapeType === 'circle' || el.data.shapeType === 'ellipse')) {
    let dx = point.x - cx;
    let dy = point.y - cy;
    if (dx === 0 && dy === 0) dx = 1;
    const denom = (dx * dx) / (hw * hw) + (dy * dy) / (hh * hh);
    const t = 1 / Math.sqrt(denom);
    return { x: cx + t * dx, y: cy + t * dy };
  }

  // Diamond: 4 arestas diagonais
  if (el.type === 'shape' && el.data.shapeType === 'diamond') {
    const top: Point = { x: cx, y: cy - hh };
    const right: Point = { x: cx + hw, y: cy };
    const bottom: Point = { x: cx, y: cy + hh };
    const left: Point = { x: cx - hw, y: cy };
    const edges: [Point, Point][] = [[top, right], [right, bottom], [bottom, left], [left, top]];

    let best: Point = top;
    let bestDist = Infinity;
    for (const [a, b] of edges) {
      const cp = closestPointOnSegment(point, a.x, a.y, b.x, b.y);
      const d = (point.x - cp.x) ** 2 + (point.y - cp.y) ** 2;
      if (d < bestDist) { bestDist = d; best = cp; }
    }
    return best;
  }

  // Retângulo e outros: 4 lados do bounding box
  const l = box.x;
  const r = box.x + box.width;
  const t = box.y;
  const b = box.y + box.height;

  const edges: [number, number, number, number][] = [
    [l, t, r, t], // top
    [r, t, r, b], // right
    [r, b, l, b], // bottom
    [l, b, l, t], // left
  ];

  let best: Point = { x: l, y: t };
  let bestDist = Infinity;
  for (const [ax, ay, bx, by] of edges) {
    const cp = closestPointOnSegment(point, ax, ay, bx, by);
    const d = (point.x - cp.x) ** 2 + (point.y - cp.y) ** 2;
    if (d < bestDist) { bestDist = d; best = cp; }
  }
  return best;
}

// ---- Anchor: posição relativa (0-1) no bounding box ----

/**
 * Converte ponto absoluto → anchor relativo ao bounding box do elemento.
 * anchorX/anchorY vão de 0 a 1.
 */
export function computeAnchor(
  el: CanvasElement,
  point: Point,
  ctx: CanvasRenderingContext2D
): { anchorX: number; anchorY: number } | null {
  const box = getBoundingBox(el, ctx);
  if (!box || box.width === 0 || box.height === 0) return null;
  return {
    anchorX: (point.x - box.x) / box.width,
    anchorY: (point.y - box.y) / box.height,
  };
}

/**
 * Converte anchor relativo → ponto absoluto no bounding box atual do elemento.
 */
export function anchorToPoint(
  el: CanvasElement,
  anchorX: number,
  anchorY: number,
  ctx: CanvasRenderingContext2D
): Point | null {
  const box = getBoundingBox(el, ctx);
  if (!box) return null;
  return {
    x: box.x + anchorX * box.width,
    y: box.y + anchorY * box.height,
  };
}

// ---- Snap detection ----

function distToBorder(point: Point, el: CanvasElement, ctx: CanvasRenderingContext2D): number {
  const box = getBoundingBox(el, ctx);
  if (!box) return Infinity;

  const left = box.x;
  const right = box.x + box.width;
  const top = box.y;
  const bottom = box.y + box.height;

  const clampedX = Math.max(left, Math.min(right, point.x));
  const clampedY = Math.max(top, Math.min(bottom, point.y));

  const isInside = point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  if (isInside) return 0;

  return Math.sqrt((point.x - clampedX) ** 2 + (point.y - clampedY) ** 2);
}

export function findSnapTarget(
  point: Point,
  elements: CanvasElement[],
  excludeIds: Set<string>,
  ctx: CanvasRenderingContext2D
): CanvasElement | null {
  let closest: CanvasElement | null = null;
  let closestDist = SNAP_RADIUS;

  for (const el of elements) {
    if (excludeIds.has(el.id)) continue;
    if (el.type === 'arrow' || el.type === 'line') continue;

    const dist = distToBorder(point, el, ctx);
    if (dist < closestDist) {
      closestDist = dist;
      closest = el;
    }
  }

  return closest;
}

// ---- Update connected arrows on element move ----

export function updateConnectedArrows(
  movedElement: CanvasElement,
  elements: CanvasElement[],
  ctx: CanvasRenderingContext2D
): void {
  for (const el of elements) {
    if (el.type !== 'arrow' && el.type !== 'line') continue;
    const data = el.data;

    if (data.startConnectedTo === movedElement.id) {
      // Se tem anchor salvo, usar para recalcular posição
      if (data.startAnchorX !== undefined && data.startAnchorY !== undefined) {
        const pt = anchorToPoint(movedElement, data.startAnchorX, data.startAnchorY, ctx);
        if (pt) {
          data.startX = pt.x;
          data.startY = pt.y;
        }
      }
    }

    if (data.endConnectedTo === movedElement.id) {
      if (data.endAnchorX !== undefined && data.endAnchorY !== undefined) {
        const pt = anchorToPoint(movedElement, data.endAnchorX, data.endAnchorY, ctx);
        if (pt) {
          data.endX = pt.x;
          data.endY = pt.y;
        }
      }
    }
  }
}
