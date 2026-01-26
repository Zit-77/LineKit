import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';

export const TextTool: BaseTool = {
  name: 'text',
  cursor: 'text',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'text';
  },

  onMouseDown(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    // Commit any existing text block
    if (state.activeTextBlock && state.activeTextBlock.text.trim()) {
      actions.addElement({ type: 'text', data: state.activeTextBlock });
    }

    // Create new text block
    actions.setActiveTextBlock({
      text: '',
      x: point.x,
      y: point.y,
      fontSize: state.textSize,
      fontStyle: state.textStyle,
      color: state.textColor,
      rotation: 0,
    });
    context.render();
  },

  onKeyDown(e: KeyboardEvent, context: ToolContext) {
    const state = store.getState();

    if (!state.activeTextBlock) return;

    if (e.key === 'Enter') {
      state.activeTextBlock.text += '\n';
    } else if (e.key === 'Backspace') {
      state.activeTextBlock.text = state.activeTextBlock.text.slice(0, -1);
    } else if (e.key.length === 1) {
      state.activeTextBlock.text += e.key;
    }
    context.render();
  },
};
