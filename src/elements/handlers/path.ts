import type { DrawPath, BoundingBox } from '../../types';
import type { ElementHandler } from '../types';

export const pathHandler: ElementHandler<DrawPath> = {
  move(data, dx, dy) {
    for (const point of data.points) {
      point.x += dx;
      point.y += dy;
    }
    data.centerX += dx;
    data.centerY += dy;
  },

  scale(data, scaleX, scaleY, centerX, centerY) {
    const scale = Math.max(scaleX, scaleY);
    data.lineWidth = Math.max(1, data.lineWidth * scale);

    for (const point of data.points) {
      point.x = centerX + (point.x - centerX) * scaleX;
      point.y = centerY + (point.y - centerY) * scaleY;
    }

    data.centerX = centerX + (data.centerX - centerX) * scaleX;
    data.centerY = centerY + (data.centerY - centerY) * scaleY;
  },

  rotate(data, angle, pivotX, pivotY) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const point of data.points) {
      const dx = point.x - pivotX;
      const dy = point.y - pivotY;
      point.x = pivotX + dx * cos - dy * sin;
      point.y = pivotY + dx * sin + dy * cos;
    }

    const cdx = data.centerX - pivotX;
    const cdy = data.centerY - pivotY;
    data.centerX = pivotX + cdx * cos - cdy * sin;
    data.centerY = pivotY + cdx * sin + cdy * cos;
  },

  getBoundingBox(data): BoundingBox | null {
    if (data.points.length === 0) return null;

    let minX = data.points[0].x;
    let minY = data.points[0].y;
    let maxX = data.points[0].x;
    let maxY = data.points[0].y;

    for (const point of data.points) {
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
  },
};
