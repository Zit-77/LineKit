import type { TextBlock, DrawPath, Shape, Arrow, BoundingBox, Line } from '../types';
import { HANDLE_SIZE, ROTATE_HANDLE_OFFSET, SELECTION_COLOR, MARQUEE_FILL_COLOR } from '../constants';

export function drawPath(ctx: CanvasRenderingContext2D, path: DrawPath) {
  if (path.points.length < 2) return;

  ctx.save();

  if (path.rotation !== 0) {
    ctx.translate(path.centerX, path.centerY);
    ctx.rotate(path.rotation);
    ctx.translate(-path.centerX, -path.centerY);
  }

  ctx.strokeStyle = path.color;
  ctx.lineWidth = path.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path.points[0].x, path.points[0].y);
  for (let i = 1; i < path.points.length; i++) {
    ctx.lineTo(path.points[i].x, path.points[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

export function drawText(ctx: CanvasRenderingContext2D, block: TextBlock, showCursor = false) {
  const fontSize = block.fontSize;

  ctx.save();

  if (block.rotation !== 0) {
    ctx.translate(block.x, block.y);
    ctx.rotate(block.rotation);
    ctx.translate(-block.x, -block.y);
  }

  const fontWeight = block.fontStyle === 'bold' ? 'bold' : 'normal';
  const fontStyleCss = block.fontStyle === 'italic' ? 'italic' : 'normal';
  ctx.font = `${fontStyleCss} ${fontWeight} ${fontSize}px sans-serif`;
  ctx.fillStyle = block.color;
  const lines = block.text.split('\n');
  const lineHeight = fontSize * 1.25;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = block.y + i * lineHeight;
    ctx.fillText(line, block.x, y);
    if (showCursor && i === lines.length - 1) {
      const textWidth = ctx.measureText(line).width;
      ctx.fillRect(block.x + textWidth + 2, y - fontSize * 0.75, 2, fontSize * 0.9);
    }
  }

  ctx.restore();
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  const { x, y, width, height, shapeType, fillColor, strokeColor, strokeWidth, borderRadius, rotation } = shape;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const hasFill = fillColor !== 'transparent';

  ctx.save();

  if (rotation !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
  }

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  switch (shapeType) {
    case 'rectangle':
    case 'square': {
      // Limita o borderRadius ao máximo possível (metade do menor lado)
      const maxRadius = Math.min(width, height) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      ctx.beginPath();
      if (radius > 0) {
        ctx.roundRect(x, y, width, height, radius);
      } else {
        ctx.rect(x, y, width, height);
      }
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();
      break;
    }

    case 'circle':
    case 'ellipse': {
      const radiusX = width / 2;
      const radiusY = height / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();
      break;
    }

    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.closePath();
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();
      break;
    }

    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(x + width, centerY);
      ctx.lineTo(centerX, y + height);
      ctx.lineTo(x, centerY);
      ctx.closePath();
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();
      break;
    }

    case 'cylinder': {
      const ellipseHeight = height * 0.15;
      const bodyHeight = height - ellipseHeight;

      // Draw side
      ctx.beginPath();
      ctx.moveTo(x, y + ellipseHeight / 2);
      ctx.lineTo(x, y + bodyHeight);
      ctx.ellipse(centerX, y + bodyHeight, width / 2, ellipseHeight / 2, 0, Math.PI, 0, true);
      ctx.lineTo(x + width, y + ellipseHeight / 2);
      ctx.ellipse(centerX, y + ellipseHeight / 2, width / 2, ellipseHeight / 2, 0, 0, Math.PI, true);
      ctx.closePath();
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();

      // Draw top ellipse
      ctx.beginPath();
      ctx.ellipse(centerX, y + ellipseHeight / 2, width / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();
      break;
    }

    case 'pyramid': {
      const baseY = y + height * 0.7;
      const baseHeight = height * 0.3;
      const apex = { x: centerX, y: y };

      // Front left face
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(x, baseY + baseHeight / 2);
      ctx.lineTo(centerX, baseY + baseHeight);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();

      // Front right face
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(centerX, baseY + baseHeight);
      ctx.lineTo(x + width, baseY + baseHeight / 2);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      if (hasFill) ctx.fill();
      if (strokeWidth > 0) ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(x + width, baseY + baseHeight / 2);
      ctx.lineTo(centerX, baseY);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      if (hasFill) {
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (strokeWidth > 0) ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
  const { startX, startY, endX, endY, color, lineWidth } = line;

  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = Math.max(lineWidth * 5, 20);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw line (para um pouco antes da ponta)
  const lineEndX = endX - headLength * 0.5 * Math.cos(angle);
  const lineEndY = endY - headLength * 0.5 * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();

  ctx.restore();

}



export function drawArrow(ctx: CanvasRenderingContext2D, arrow: Arrow) {
  const { startX, startY, endX, endY, color, lineWidth } = arrow;

  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = Math.max(lineWidth * 5, 20);
  const headAngle = Math.PI / 4; // 45 graus - mais aberto

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw line (para um pouco antes da ponta)
  const lineEndX = endX - headLength * 0.5 * Math.cos(angle);
  const lineEndY = endY - headLength * 0.5 * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();

  // Draw arrowhead - formato ">" maior
  const point1X = endX - headLength * Math.cos(angle - headAngle);
  const point1Y = endY - headLength * Math.sin(angle - headAngle);
  const point2X = endX - headLength * Math.cos(angle + headAngle);
  const point2Y = endY - headLength * Math.sin(angle + headAngle);

  // Ponto de recuo (para dar forma de seta)
  const backX = endX - headLength * 0.4 * Math.cos(angle);
  const backY = endY - headLength * 0.4 * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(point1X, point1Y);
  ctx.lineTo(backX, backY);
  ctx.lineTo(point2X, point2Y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawSelectionUI(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  selectionRotation: number
) {
  const padding = 8;
  const width = box.width + padding * 2;
  const height = box.height + padding * 2;

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(selectionRotation);
  ctx.translate(-centerX, -centerY);

  const x = box.x - padding;
  const y = box.y - padding;

  // Draw selection rectangle
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(x, y, width, height);

  // Draw corner handles
  ctx.fillStyle = 'white';
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 1;

  // NW handle
  ctx.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // NE handle
  ctx.fillRect(x + width - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x + width - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // SW handle
  ctx.fillRect(x - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // SE handle
  ctx.fillRect(x + width - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x + width - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // Rotate handle (top center)
  const rotateX = x + width / 2;
  const rotateY = y - ROTATE_HANDLE_OFFSET;

  // Line connecting to rotate handle
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(rotateX, rotateY);
  ctx.stroke();

  // Rotate circle
  ctx.beginPath();
  ctx.arc(rotateX, rotateY, HANDLE_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawLineSelectionUI(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const handleRadius = 6;

  ctx.save();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 2;

  // Draw start handle (circle)
  ctx.beginPath();
  ctx.arc(startX, startY, handleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw end handle (circle)
  ctx.beginPath();
  ctx.arc(endX, endY, handleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  ctx.fillStyle = MARQUEE_FILL_COLOR;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(x, y, width, height);
}
