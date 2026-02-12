import { store } from "../../state";
import type { Point, Line } from "../../types";
import type { BaseTool, ToolContext } from "./BaseTool";
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';
import { findSnapTarget, getClosestBorderPoint, computeAnchor } from '../../utils/connections';

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

    onMouseDown(_e: MouseEvent, point: Point, context: ToolContext) {
        const state = store.getState();

        let startX = point.x;
        let startY = point.y;
        let startConnectedTo: string | undefined;

        const snapTarget = findSnapTarget(point, state.elements, new Set(), context.ctx);
        if (snapTarget) {
            const bp = getClosestBorderPoint(snapTarget, point, context.ctx);
            if (bp) {
                startX = bp.x;
                startY = bp.y;
                startConnectedTo = snapTarget.id;
            }
        }

        actions.setIsCreatingLine(true);
        actions.setCurrentLine({
            startX,
            startY,
            endX: startX,
            endY: startY,
            color: state.strokeColor,
            opacity: state.strokeOpacity,
            lineWidth: state.strokeWidth,
            style: state.lineStyle,
            roughness: state.lineRoughness,
            startConnectedTo,
        });
    },

    onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
        const state = store.getState();

        if (state.isCreatingLine && state.currentLine) {
            const excludeIds = new Set<string>();
            if (state.currentLine.startConnectedTo) excludeIds.add(state.currentLine.startConnectedTo);

            // Recalcular start na borda: ponto mais perto do mouse
            if (state.currentLine.startConnectedTo) {
                const startEl = state.elements.find(e => e.id === state.currentLine!.startConnectedTo);
                if (startEl) {
                    const startBp = getClosestBorderPoint(startEl, point, context.ctx);
                    if (startBp) {
                        state.currentLine.startX = startBp.x;
                        state.currentLine.startY = startBp.y;
                    }
                }
            }

            const snapTarget = findSnapTarget(point, state.elements, excludeIds, context.ctx);
            if (snapTarget) {
                const bp = getClosestBorderPoint(snapTarget, point, context.ctx);
                if (bp) {
                    state.currentLine.endX = bp.x;
                    state.currentLine.endY = bp.y;
                    actions.setSnapTarget(bp);
                    context.render();
                    return;
                }
            }

            state.currentLine.endX = point.x;
            state.currentLine.endY = point.y;
            actions.setSnapTarget(null);
            context.render();
        }
    },

    onMouseUp(_e: MouseEvent, point: Point, context: ToolContext) {
        const state = store.getState();

        if (state.currentLine) {
            const excludeIds = new Set<string>();
            if (state.currentLine.startConnectedTo) excludeIds.add(state.currentLine.startConnectedTo);

            const snapTarget = findSnapTarget(point, state.elements, excludeIds, context.ctx);
            if (snapTarget) {
                const bp = getClosestBorderPoint(snapTarget, point, context.ctx);
                if (bp) {
                    state.currentLine.endX = bp.x;
                    state.currentLine.endY = bp.y;
                    state.currentLine.endConnectedTo = snapTarget.id;
                    const anchor = computeAnchor(snapTarget, bp, context.ctx);
                    if (anchor) {
                        state.currentLine.endAnchorX = anchor.anchorX;
                        state.currentLine.endAnchorY = anchor.anchorY;
                    }
                }
            }

            // Salvar anchor do start
            if (state.currentLine.startConnectedTo) {
                const startEl = state.elements.find(e => e.id === state.currentLine!.startConnectedTo);
                if (startEl) {
                    const anchor = computeAnchor(startEl, { x: state.currentLine.startX, y: state.currentLine.startY }, context.ctx);
                    if (anchor) {
                        state.currentLine.startAnchorX = anchor.anchorX;
                        state.currentLine.startAnchorY = anchor.anchorY;
                    }
                }
            }
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