import type { BoundingBox, CanvasElement, Point, HandleType } from '../types';
import { HANDLE_SIZE, ROTATE_HANDLE_OFFSET, HANDLE_HIT_SIZE, HIT_TEST_PADDING } from '../constants';

export function getBoundingBox(el: CanvasElement, ctx: CanvasRenderingContext2D): BoundingBox | null {
  if (el.type === 'text') {
    const block = el.data;
    const lines = block.text.split('\n');
    const lineHeight = block.fontSize * 1.25;
    let maxWidth = 0;

    ctx.font = `${block.fontSize}px sans-serif`;
    for (const line of lines) {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    }

    return {
      x: block.x,
      y: block.y - block.fontSize * 0.75,
      width: maxWidth,
      height: lines.length * lineHeight,
    };
  } else if (el.type === 'path') {
    const path = el.data;
    if (path.points.length === 0) return null;

    let minX = path.points[0].x;
    let minY = path.points[0].y;
    let maxX = path.points[0].x;
    let maxY = path.points[0].y;

    for (const point of path.points) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else if (el.type === 'shape') {
    const shape = el.data;
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  } else if (el.type === 'arrow') {
    const arrow = el.data;
    const minX = Math.min(arrow.startX, arrow.endX);
    const minY = Math.min(arrow.startY, arrow.endY);
    const maxX = Math.max(arrow.startX, arrow.endX);
    const maxY = Math.max(arrow.startY, arrow.endY);
    return {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10),
    };
  } else if (el.type === 'line') {
    const line = el.data;

    const dx = line.endX - line.startX;
    const dy = line.endY - line.startY;

    const length = Math.sqrt(dx * dx + dy * dy);

    // espessura da área clicável
    const thickness = 6;

    // ângulo da linha
    const angle = Math.atan2(dy, dx);

    return {
      x: line.startX,
      y: line.startY,
      width: length,
      height: thickness,
      rotation: angle
    };
  }
  return null;
}

export function getSelectionBoundingBox(
  selectedElements: Set<CanvasElement>,
  ctx: CanvasRenderingContext2D
): BoundingBox | null {
  if (selectedElements.size === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of selectedElements) {
    const box = getBoundingBox(el, ctx);
    if (!box) continue;

    if (box.x < minX) minX = box.x;
    if (box.y < minY) minY = box.y;
    if (box.x + box.width > maxX) maxX = box.x + box.width;
    if (box.y + box.height > maxY) maxY = box.y + box.height;
  }

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function hitTest(
  point: Point,
  elements: CanvasElement[],
  ctx: CanvasRenderingContext2D
): CanvasElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const box = getBoundingBox(el, ctx);
    if (!box) continue;

    if (
      point.x >= box.x - HIT_TEST_PADDING &&
      point.x <= box.x + box.width + HIT_TEST_PADDING &&
      point.y >= box.y - HIT_TEST_PADDING &&
      point.y <= box.y + box.height + HIT_TEST_PADDING
    ) {
      return el;
    }
  }
  return null;
}

export function hitTestHandle(
  point: Point,
  box: BoundingBox | null,
  selectionRotation: number
): HandleType {
  if (!box) return null;

  const padding = 8;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Transform point to unrotated space
  const cos = Math.cos(-selectionRotation);
  const sin = Math.sin(-selectionRotation);
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const localPoint = {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };

  const x = box.x - padding;
  const y = box.y - padding;
  const width = box.width + padding * 2;
  const height = box.height + padding * 2;

  // Check rotate handle
  const rotateX = x + width / 2;
  const rotateY = y - ROTATE_HANDLE_OFFSET;
  const distToRotate = Math.sqrt((localPoint.x - rotateX) ** 2 + (localPoint.y - rotateY) ** 2);
  if (distToRotate <= HANDLE_SIZE) return 'rotate';

  // Check corner handles
  if (Math.abs(localPoint.x - x) < HANDLE_HIT_SIZE && Math.abs(localPoint.y - y) < HANDLE_HIT_SIZE)
    return 'nw';
  if (
    Math.abs(localPoint.x - (x + width)) < HANDLE_HIT_SIZE &&
    Math.abs(localPoint.y - y) < HANDLE_HIT_SIZE
  )
    return 'ne';
  if (
    Math.abs(localPoint.x - x) < HANDLE_HIT_SIZE &&
    Math.abs(localPoint.y - (y + height)) < HANDLE_HIT_SIZE
  )
    return 'sw';
  if (
    Math.abs(localPoint.x - (x + width)) < HANDLE_HIT_SIZE &&
    Math.abs(localPoint.y - (y + height)) < HANDLE_HIT_SIZE
  )
    return 'se';

  return null;
}

export function getCanvasPoint(
  e: MouseEvent,
  offset: Point,
  scale: number
): Point {
  return {
    x: (e.clientX - offset.x) / scale,
    y: (e.clientY - offset.y) / scale,
  };
}
