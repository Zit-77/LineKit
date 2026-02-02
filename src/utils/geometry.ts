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

    if (arrow.controlX !== undefined && arrow.controlY !== undefined) {
      // Curved arrow: use AABB that includes control point
      const padding = Math.max(arrow.lineWidth * 2, 10);
      const minX = Math.min(arrow.startX, arrow.endX, arrow.controlX) - padding;
      const minY = Math.min(arrow.startY, arrow.endY, arrow.controlY) - padding;
      const maxX = Math.max(arrow.startX, arrow.endX, arrow.controlX) + padding;
      const maxY = Math.max(arrow.startY, arrow.endY, arrow.controlY) + padding;
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // Straight arrow: OBB
    const dx = arrow.endX - arrow.startX;
    const dy = arrow.endY - arrow.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (arrow.startX + arrow.endX) / 2;
    const centerY = (arrow.startY + arrow.endY) / 2;
    const headLength = Math.max(arrow.lineWidth * 5, 20);
    const padding = Math.max(arrow.lineWidth * 2, headLength * 0.8);

    return {
      x: centerX - length / 2,
      y: centerY - padding / 2,
      width: length,
      height: padding,
      rotation: angle,
    };
  } else if (el.type === 'line') {
    const line = el.data;

    if (line.controlX !== undefined && line.controlY !== undefined) {
      // Curved line: use AABB that includes control point
      const padding = Math.max(line.lineWidth * 2, 6);
      const minX = Math.min(line.startX, line.endX, line.controlX) - padding;
      const minY = Math.min(line.startY, line.endY, line.controlY) - padding;
      const maxX = Math.max(line.startX, line.endX, line.controlX) + padding;
      const maxY = Math.max(line.startY, line.endY, line.controlY) + padding;
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // Straight line: OBB
    const dx = line.endX - line.startX;
    const dy = line.endY - line.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (line.startX + line.endX) / 2;
    const centerY = (line.startY + line.endY) / 2;
    const padding = Math.max(line.lineWidth * 2, 6);

    return {
      x: centerX - length / 2,
      y: centerY - padding / 2,
      width: length,
      height: padding,
      rotation: angle,
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

    // If box has rotation, calculate rotated corners and find AABB
    if (box.rotation !== undefined && box.rotation !== 0) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const cos = Math.cos(box.rotation);
      const sin = Math.sin(box.rotation);

      // Calculate all 4 corners of the rotated box
      const corners = [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y },
        { x: box.x, y: box.y + box.height },
        { x: box.x + box.width, y: box.y + box.height },
      ];

      for (const corner of corners) {
        const dx = corner.x - centerX;
        const dy = corner.y - centerY;
        const rotatedX = centerX + dx * cos - dy * sin;
        const rotatedY = centerY + dx * sin + dy * cos;

        if (rotatedX < minX) minX = rotatedX;
        if (rotatedY < minY) minY = rotatedY;
        if (rotatedX > maxX) maxX = rotatedX;
        if (rotatedY > maxY) maxY = rotatedY;
      }
    } else {
      // Standard AABB
      if (box.x < minX) minX = box.x;
      if (box.y < minY) minY = box.y;
      if (box.x + box.width > maxX) maxX = box.x + box.width;
      if (box.y + box.height > maxY) maxY = box.y + box.height;
    }
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
  // If neither box has rotation, use simple AABB test
  if ((!a.rotation || a.rotation === 0) && (!b.rotation || b.rotation === 0)) {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  // If box 'b' has rotation (typically the element), test if any corner is inside 'a' (typically marquee)
  if (b.rotation && b.rotation !== 0) {
    const centerX = b.x + b.width / 2;
    const centerY = b.y + b.height / 2;
    const cos = Math.cos(b.rotation);
    const sin = Math.sin(b.rotation);

    // Test all 4 corners of box 'b' (rotated)
    const corners = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x, y: b.y + b.height },
      { x: b.x + b.width, y: b.y + b.height },
    ];

    for (const corner of corners) {
      // Rotate corner point
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      const rotatedX = centerX + dx * cos - dy * sin;
      const rotatedY = centerY + dx * sin + dy * cos;

      // Test if rotated corner is inside box 'a'
      if (
        rotatedX >= a.x &&
        rotatedX <= a.x + a.width &&
        rotatedY >= a.y &&
        rotatedY <= a.y + a.height
      ) {
        return true;
      }
    }

    // Also test if any corner of 'a' is inside rotated 'b'
    const aCorners = [
      { x: a.x, y: a.y },
      { x: a.x + a.width, y: a.y },
      { x: a.x, y: a.y + a.height },
      { x: a.x + a.width, y: a.y + a.height },
    ];

    for (const corner of aCorners) {
      // Transform to local space of 'b'
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      const localX = centerX + dx * Math.cos(-b.rotation) - dy * Math.sin(-b.rotation);
      const localY = centerY + dx * Math.sin(-b.rotation) + dy * Math.cos(-b.rotation);

      if (
        localX >= b.x &&
        localX <= b.x + b.width &&
        localY >= b.y &&
        localY <= b.y + b.height
      ) {
        return true;
      }
    }

    return false;
  }

  // If only 'a' has rotation (shouldn't happen in marquee selection, but handle it)
  return boxesIntersect(b, a);
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

    // If box has rotation, transform point to local space
    if (box.rotation !== undefined && box.rotation !== 0) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Rotate point to box's local space
      const cos = Math.cos(-box.rotation);
      const sin = Math.sin(-box.rotation);
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      const localX = centerX + dx * cos - dy * sin;
      const localY = centerY + dx * sin + dy * cos;

      // Test against AABB in local space
      if (
        localX >= box.x - HIT_TEST_PADDING &&
        localX <= box.x + box.width + HIT_TEST_PADDING &&
        localY >= box.y - HIT_TEST_PADDING &&
        localY <= box.y + box.height + HIT_TEST_PADDING
      ) {
        return el;
      }
    } else {
      // Standard AABB test
      if (
        point.x >= box.x - HIT_TEST_PADDING &&
        point.x <= box.x + box.width + HIT_TEST_PADDING &&
        point.y >= box.y - HIT_TEST_PADDING &&
        point.y <= box.y + box.height + HIT_TEST_PADDING
      ) {
        return el;
      }
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

  // Check corner handles (priority over side handles)
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

  // Check side handles
  if (Math.abs(localPoint.x - (x + width / 2)) < HANDLE_HIT_SIZE && Math.abs(localPoint.y - y) < HANDLE_HIT_SIZE)
    return 'n';
  if (Math.abs(localPoint.x - (x + width / 2)) < HANDLE_HIT_SIZE && Math.abs(localPoint.y - (y + height)) < HANDLE_HIT_SIZE)
    return 's';
  if (Math.abs(localPoint.x - x) < HANDLE_HIT_SIZE && Math.abs(localPoint.y - (y + height / 2)) < HANDLE_HIT_SIZE)
    return 'w';
  if (Math.abs(localPoint.x - (x + width)) < HANDLE_HIT_SIZE && Math.abs(localPoint.y - (y + height / 2)) < HANDLE_HIT_SIZE)
    return 'e';

  return null;
}

export function hitTestLineHandle(
  point: Point,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  controlX?: number,
  controlY?: number
): HandleType {
  const handleRadius = 10;

  // Check start handle
  const distToStart = Math.sqrt((point.x - startX) ** 2 + (point.y - startY) ** 2);
  if (distToStart <= handleRadius) return 'start';

  // Check end handle
  const distToEnd = Math.sqrt((point.x - endX) ** 2 + (point.y - endY) ** 2);
  if (distToEnd <= handleRadius) return 'end';

  // Check mid handle - positioned ON the curve at t=0.5
  let curveX: number;
  let curveY: number;
  if (controlX !== undefined && controlY !== undefined) {
    curveX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
    curveY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;
  } else {
    curveX = (startX + endX) / 2;
    curveY = (startY + endY) / 2;
  }
  const distToMid = Math.sqrt((point.x - curveX) ** 2 + (point.y - curveY) ** 2);
  if (distToMid <= handleRadius) return 'mid';

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
