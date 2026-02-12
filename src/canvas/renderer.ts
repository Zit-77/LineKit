import type { BoundingBox } from '../types';
import { HANDLE_SIZE, ROTATE_HANDLE_OFFSET, SELECTION_COLOR, MARQUEE_FILL_COLOR } from '../constants';

export function drawElementBoundingBox(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox
) {
  const padding = 4;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const rotation = box.rotation ?? 0;

  ctx.save();

  if (rotation !== 0) {
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
  }

  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(
    box.x - padding,
    box.y - padding,
    box.width + padding * 2,
    box.height + padding * 2
  );

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

  // N handle (top center)
  ctx.fillRect(x + width / 2 - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x + width / 2 - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // S handle (bottom center)
  ctx.fillRect(x + width / 2 - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x + width / 2 - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // W handle (left center)
  ctx.fillRect(x - HANDLE_SIZE / 2, y + height / 2 - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x - HANDLE_SIZE / 2, y + height / 2 - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

  // E handle (right center)
  ctx.fillRect(x + width - HANDLE_SIZE / 2, y + height / 2 - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x + width - HANDLE_SIZE / 2, y + height / 2 - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

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
  endY: number,
  controlX?: number,
  controlY?: number
) {
  const handleRadius = 6;

  // The visible handle sits ON the curve at t=0.5
  // For quadratic bezier: B(0.5) = 0.25*P0 + 0.5*CP + 0.25*P2
  let curveX: number;
  let curveY: number;
  if (controlX !== undefined && controlY !== undefined) {
    curveX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
    curveY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;
  } else {
    curveX = (startX + endX) / 2;
    curveY = (startY + endY) / 2;
  }

  ctx.save();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 2;

  // Draw start handle
  ctx.beginPath();
  ctx.arc(startX, startY, handleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw end handle
  ctx.beginPath();
  ctx.arc(endX, endY, handleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw mid handle (on the curve)
  ctx.beginPath();
  ctx.arc(curveX, curveY, handleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawSnapIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = SELECTION_COLOR;
  ctx.globalAlpha = 0.15;
  ctx.fill();

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
