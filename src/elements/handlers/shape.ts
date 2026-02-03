import type { Shape, BoundingBox } from '../../types';
import type { ElementHandler } from '../types';

export const shapeHandler: ElementHandler<Shape> = {
  move(data, dx, dy) {
    data.x += dx;
    data.y += dy;
  },

  scale(data, scaleX, scaleY, centerX, centerY) {
    const shapeCenterX = data.x + data.width / 2;
    const shapeCenterY = data.y + data.height / 2;

    const newCenterX = centerX + (shapeCenterX - centerX) * scaleX;
    const newCenterY = centerY + (shapeCenterY - centerY) * scaleY;

    data.width = Math.max(10, data.width * scaleX);
    data.height = Math.max(10, data.height * scaleY);

    data.x = newCenterX - data.width / 2;
    data.y = newCenterY - data.height / 2;
  },

  rotate(data, angle, pivotX, pivotY) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const shapeCenterX = data.x + data.width / 2;
    const shapeCenterY = data.y + data.height / 2;

    const dx = shapeCenterX - pivotX;
    const dy = shapeCenterY - pivotY;
    const newCenterX = pivotX + dx * cos - dy * sin;
    const newCenterY = pivotY + dx * sin + dy * cos;

    data.x = newCenterX - data.width / 2;
    data.y = newCenterY - data.height / 2;
    data.rotation += angle;
  },

  getBoundingBox(data): BoundingBox {
    return {
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    };
  },
};
