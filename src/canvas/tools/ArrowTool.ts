import type { BaseTool, ToolContext } from './BaseTool';
import type { Point, Arrow } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';

function drawArrow(ctx: CanvasRenderingContext2D, arrow: Arrow) {
  const { startX, startY, endX, endY, color, opacity, lineWidth, controlX, controlY, style, roughness } = arrow;

  const hasCurve = controlX !== undefined && controlY !== undefined;
  const angle = hasCurve
    ? Math.atan2(endY - controlY!, endX - controlX!)
    : Math.atan2(endY - startY, endX - startX);
  const headLength = Math.max(lineWidth * 5, 20);
  const headAngle = Math.PI / 4;

  ctx.save();
  ctx.globalAlpha = opacity ?? 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Apply line style
  if (style === 'dashed') {
    ctx.setLineDash([lineWidth * 4, lineWidth * 2]);
  } else if (style === 'dotted') {
    ctx.setLineDash([lineWidth, lineWidth * 2]);
  } else {
    ctx.setLineDash([]);
  }

  const lineEndX = endX - headLength * 0.5 * Math.cos(angle);
  const lineEndY = endY - headLength * 0.5 * Math.sin(angle);

  // Apply roughness effect to line
  if (roughness && roughness > 0) {
    const steps = 50;
    const dx = lineEndX - startX;
    const dy = lineEndY - startY;
    const roughnessAmount = roughness * lineWidth * 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const offsetX = (Math.random() - 0.5) * roughnessAmount;
      const offsetY = (Math.random() - 0.5) * roughnessAmount;

      if (hasCurve) {
        // Quadratic curve with roughness
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX! + t * t * lineEndX + offsetX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY! + t * t * lineEndY + offsetY;
        ctx.lineTo(x, y);
      } else {
        // Straight line with roughness
        const x = startX + dx * t + offsetX;
        const y = startY + dy * t + offsetY;
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  } else {
    // Normal rendering without roughness
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (hasCurve) {
      ctx.quadraticCurveTo(controlX!, controlY!, lineEndX, lineEndY);
    } else {
      ctx.lineTo(lineEndX, lineEndY);
    }
    ctx.stroke();
  }

  // Draw arrow head (no dash or roughness on the head)
  ctx.setLineDash([]);
  const point1X = endX - headLength * Math.cos(angle - headAngle);
  const point1Y = endY - headLength * Math.sin(angle - headAngle);
  const point2X = endX - headLength * Math.cos(angle + headAngle);
  const point2Y = endY - headLength * Math.sin(angle + headAngle);

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

registerRenderer('arrow', drawArrow);

export const ArrowTool: BaseTool = {
  name: 'arrow',
  cursor: 'crosshair',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
    const state = store.getState();

    actions.setIsCreatingArrow(true);
    actions.setCurrentArrow({
      startX: point.x,
      startY: point.y,
      endX: point.x,
      endY: point.y,
      color: state.strokeColor,
      opacity: state.strokeOpacity,
      lineWidth: state.strokeWidth,
      style: state.arrowStyle,
      roughness: state.arrowRoughness,
    });
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.isCreatingArrow && state.currentArrow) {
      state.currentArrow.endX = point.x;
      state.currentArrow.endY = point.y;
      context.render();
    }
  },

  onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
    const state = store.getState();
    const countBefore = state.elements.length;
    actions.commitCurrentArrow();
    if (state.elements.length > countBefore) {
      const newElement = state.elements[state.elements.length - 1];
      context.setTool('select');
      actions.selectElement(newElement);
    }
  },
};
