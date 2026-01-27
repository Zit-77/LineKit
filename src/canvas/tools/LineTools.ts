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

    onMouseUp(_e: MouseEvent, _point: Point, _context: ToolContext) {
        actions.commitCurrentLine();
    },

}