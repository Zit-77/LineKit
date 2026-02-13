import { store } from "../../state";
import type { Point, Line } from "../../types";
import type { BaseTool, ToolContext } from "./BaseTool";
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';

function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
  const { startX, startY, endX, endY, color, opacity, lineWidth, controlX, controlY, style, roughness } = line;

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

  // Apply roughness effect
  if (roughness && roughness > 0) {
    const steps = 50;
    const dx = endX - startX;
    const dy = endY - startY;
    const roughnessAmount = roughness * lineWidth * 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const offsetX = (Math.random() - 0.5) * roughnessAmount;
      const offsetY = (Math.random() - 0.5) * roughnessAmount;

      if (controlX !== undefined && controlY !== undefined) {
        // Quadratic curve with roughness
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX + offsetX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY + offsetY;
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
    if (controlX !== undefined && controlY !== undefined) {
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    } else {
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();
  }

  ctx.restore();
}

registerRenderer('line', drawLine);

export const LineTool: BaseTool = {
    name: "line",
    cursor: "crosshair",


    onActivate(context: ToolContext) {
        context.canvas.style.cursor = 'crosshair';
    },

    onMouseDown(_e: MouseEvent, point: Point, _context: ToolContext) {
        const state = store.getState();

        actions.setIsCreatingLine(true);
        actions.setCurrentLine({
            startX: point.x,
            startY: point.y,
            endX: point.x,
            endY: point.y,
            color: state.strokeColor,
            opacity: state.strokeOpacity,
            lineWidth: state.strokeWidth,
            style: state.lineStyle,
            roughness: state.lineRoughness,
        });
    },

    onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
        const state = store.getState();

        if (state.isCreatingLine && state.currentLine) {
            state.currentLine.endX = point.x;
            state.currentLine.endY = point.y;
            context.render();
        }
    },

    onMouseUp(_e: MouseEvent, point: Point, context: ToolContext) {
        const state = store.getState();

        if (state.currentLine) {
            state.currentLine.endX = point.x;
            state.currentLine.endY = point.y;
        }

        actions.setSnapTarget(null);
        const countBefore = state.elements.length;
        actions.commitCurrentLine();
        if (state.elements.length > countBefore) {
            const newElement = state.elements[state.elements.length - 1];
            context.setTool('select');
            actions.selectElement(newElement);
        }
    },

}
