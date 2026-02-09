import { store } from "../../state";
import type { Point } from "../../types";
import type { BaseTool, ToolContext } from "./BaseTool";
import * as actions from '../../state/actions';


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

    onMouseUp(_e: MouseEvent, _point: Point, context: ToolContext) {
        const state = store.getState();
        const countBefore = state.elements.length;
        actions.commitCurrentLine();
        if (state.elements.length > countBefore) {
            const newElement = state.elements[state.elements.length - 1];
            context.setTool('select');
            actions.selectElement(newElement);
        }
    },

}