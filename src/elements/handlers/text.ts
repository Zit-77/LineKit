import type { TextBlock, BoundingBox } from '../../types';
import type { ElementHandler } from '../types';

export const textHandler: ElementHandler<TextBlock> = {
  move(data, dx, dy) {
    data.x += dx;
    data.y += dy;
  },

  scale(data, scaleX, scaleY, centerX, centerY) {
    const scale = Math.max(scaleX, scaleY);
    data.fontSize = Math.max(8, data.fontSize * scale);
    data.x = centerX + (data.x - centerX) * scaleX;
    data.y = centerY + (data.y - centerY) * scaleY;
  },

  rotate(data, angle, pivotX, pivotY) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = data.x - pivotX;
    const dy = data.y - pivotY;
    data.x = pivotX + dx * cos - dy * sin;
    data.y = pivotY + dx * sin + dy * cos;
    data.rotation += angle;
  },

  getBoundingBox(data, ctx): BoundingBox | null {
    const lines = data.text.split('\n');
    const lineHeight = data.fontSize * 1.25;
    let maxWidth = 0;

    ctx.font = `${data.fontSize}px sans-serif`;
    for (const line of lines) {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    }

    return {
      x: data.x,
      y: data.y - data.fontSize * 0.75,
      width: maxWidth,
      height: lines.length * lineHeight,
    };
  },
};
