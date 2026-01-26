import type { CanvasElement } from '../types';

export function moveElement(el: CanvasElement, dx: number, dy: number) {
  if (el.type === 'text') {
    el.data.x += dx;
    el.data.y += dy;
  } else if (el.type === 'path') {
    for (const point of el.data.points) {
      point.x += dx;
      point.y += dy;
    }
    el.data.centerX += dx;
    el.data.centerY += dy;
  } else if (el.type === 'shape') {
    el.data.x += dx;
    el.data.y += dy;
  } else if (el.type === 'arrow') {
    el.data.startX += dx;
    el.data.startY += dy;
    el.data.endX += dx;
    el.data.endY += dy;
  } else if (el.type === 'line') {
    el.data.startX += dx;
    el.data.startY += dy;
    el.data.endX += dx;
    el.data.endY += dy;
  }
}

export function scaleElement(
  el: CanvasElement,
  scaleX: number,
  scaleY: number,
  centerX: number,
  centerY: number
) {
  if (el.type === 'text') {
    // Scale font size
    const scale = Math.max(scaleX, scaleY);
    el.data.fontSize = Math.max(8, el.data.fontSize * scale);

    // Scale position relative to center
    el.data.x = centerX + (el.data.x - centerX) * scaleX;
    el.data.y = centerY + (el.data.y - centerY) * scaleY;
  } else if (el.type === 'path') {
    // Scale line width
    const scale = Math.max(scaleX, scaleY);
    el.data.lineWidth = Math.max(1, el.data.lineWidth * scale);

    // Scale all points relative to center
    for (const point of el.data.points) {
      point.x = centerX + (point.x - centerX) * scaleX;
      point.y = centerY + (point.y - centerY) * scaleY;
    }

    // Update center
    el.data.centerX = centerX + (el.data.centerX - centerX) * scaleX;
    el.data.centerY = centerY + (el.data.centerY - centerY) * scaleY;
  } else if (el.type === 'shape') {
    const shape = el.data;
    const shapeCenterX = shape.x + shape.width / 2;
    const shapeCenterY = shape.y + shape.height / 2;

    // Scale position relative to selection center
    const newCenterX = centerX + (shapeCenterX - centerX) * scaleX;
    const newCenterY = centerY + (shapeCenterY - centerY) * scaleY;

    // Scale dimensions
    shape.width = Math.max(10, shape.width * scaleX);
    shape.height = Math.max(10, shape.height * scaleY);

    // Update position to keep new center
    shape.x = newCenterX - shape.width / 2;
    shape.y = newCenterY - shape.height / 2;
  } else if (el.type === 'arrow') {
    const arrow = el.data;
    arrow.startX = centerX + (arrow.startX - centerX) * scaleX;
    arrow.startY = centerY + (arrow.startY - centerY) * scaleY;
    arrow.endX = centerX + (arrow.endX - centerX) * scaleX;
    arrow.endY = centerY + (arrow.endY - centerY) * scaleY;
  } else if (el.type === 'line') {
    const line = el.data;
    line.startX = centerX + (line.startX - centerX) * scaleX;
    line.startY = centerY + (line.startY - centerY) * scaleY;
    line.endX = centerX + (line.endX - centerX) * scaleX;
    line.endY = centerY + (line.endY - centerY) * scaleY;
  }
}

export function rotateElement(
  el: CanvasElement,
  angle: number,
  pivotX: number,
  pivotY: number
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  if (el.type === 'text') {
    // Rotate position around pivot
    const dx = el.data.x - pivotX;
    const dy = el.data.y - pivotY;
    el.data.x = pivotX + dx * cos - dy * sin;
    el.data.y = pivotY + dx * sin + dy * cos;
    // Also rotate the element itself
    el.data.rotation += angle;
  } else if (el.type === 'path') {
    // Rotate all points around pivot
    for (const point of el.data.points) {
      const dx = point.x - pivotX;
      const dy = point.y - pivotY;
      point.x = pivotX + dx * cos - dy * sin;
      point.y = pivotY + dx * sin + dy * cos;
    }
    // Update center
    const cdx = el.data.centerX - pivotX;
    const cdy = el.data.centerY - pivotY;
    el.data.centerX = pivotX + cdx * cos - cdy * sin;
    el.data.centerY = pivotY + cdx * sin + cdy * cos;
  } else if (el.type === 'shape') {
    const shape = el.data;
    const shapeCenterX = shape.x + shape.width / 2;
    const shapeCenterY = shape.y + shape.height / 2;

    // Rotate center around pivot
    const dx = shapeCenterX - pivotX;
    const dy = shapeCenterY - pivotY;
    const newCenterX = pivotX + dx * cos - dy * sin;
    const newCenterY = pivotY + dx * sin + dy * cos;

    shape.x = newCenterX - shape.width / 2;
    shape.y = newCenterY - shape.height / 2;
    shape.rotation += angle;
  } else if (el.type === 'arrow') {
    const arrow = el.data;

    // Rotate start point
    const dx1 = arrow.startX - pivotX;
    const dy1 = arrow.startY - pivotY;
    arrow.startX = pivotX + dx1 * cos - dy1 * sin;
    arrow.startY = pivotY + dx1 * sin + dy1 * cos;

    // Rotate end point
    const dx2 = arrow.endX - pivotX;
    const dy2 = arrow.endY - pivotY;
    arrow.endX = pivotX + dx2 * cos - dy2 * sin;
    arrow.endY = pivotY + dx2 * sin + dy2 * cos;
  } else if (el.type === 'line') {
    const line = el.data;

    // Rotate start point
    const dx1 = line.startX - pivotX;
    const dy1 = line.startY - pivotY;
    line.startX = pivotX + dx1 * cos - dy1 * sin;
    line.startY = pivotY + dx1 * sin + dy1 * cos;

    // Rotate end point
    const dx2 = line.endX - pivotX;
    const dy2 = line.endY - pivotY;
    line.endX = pivotX + dx2 * cos - dy2 * sin;
    line.endY = pivotY + dx2 * sin + dy2 * cos;
  }
}
