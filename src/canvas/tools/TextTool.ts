import type { BaseTool, ToolContext } from './BaseTool';
import type { Point, TextBlock } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';
import { registerRenderer } from '../elementRenderers';

// ── Helpers ──────────────────────────────────────────────────────────

function getLineAndColumn(text: string, cursorPos: number): { line: number; col: number } {
  let line = 0;
  let col = 0;
  for (let i = 0; i < cursorPos && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
  }
  return { line, col };
}

function getCursorPosFromLineCol(text: string, line: number, col: number): number {
  const lines = text.split('\n');
  let pos = 0;
  for (let i = 0; i < line && i < lines.length; i++) {
    pos += lines[i].length + 1; // +1 for \n
  }
  const targetLine = lines[Math.min(line, lines.length - 1)];
  pos += Math.min(col, targetLine.length);
  return pos;
}

function getLineStart(text: string, cursorPos: number): number {
  const lastNewline = text.lastIndexOf('\n', cursorPos - 1);
  return lastNewline + 1;
}

function getLineEnd(text: string, cursorPos: number): number {
  const nextNewline = text.indexOf('\n', cursorPos);
  return nextNewline === -1 ? text.length : nextNewline;
}

function setupFont(ctx: CanvasRenderingContext2D, block: TextBlock) {
  const fontWeight = block.fontStyle === 'bold' ? 'bold' : 'normal';
  const fontStyleCss = block.fontStyle === 'italic' ? 'italic' : 'normal';
  ctx.font = `${fontStyleCss} ${fontWeight} ${block.fontSize}px ${block.fontFamily || 'sans-serif'}`;
}

function getCursorPosFromClick(
  ctx: CanvasRenderingContext2D,
  block: TextBlock,
  clickX: number,
  clickY: number,
): number {
  setupFont(ctx, block);
  const lines = block.text.split('\n');
  const lineHeight = block.fontSize * 1.25;

  // Determine which line was clicked
  let lineIndex = Math.floor((clickY - (block.y - block.fontSize * 0.75)) / lineHeight);
  lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));

  // Determine column within that line
  const line = lines[lineIndex];
  let bestCol = line.length;
  const relX = clickX - block.x;

  if (relX <= 0) {
    bestCol = 0;
  } else {
    for (let c = 0; c <= line.length; c++) {
      const w = ctx.measureText(line.substring(0, c)).width;
      if (w >= relX) {
        // Check if closer to c-1 or c
        const prevW = c > 0 ? ctx.measureText(line.substring(0, c - 1)).width : 0;
        bestCol = (relX - prevW < w - relX) ? c - 1 : c;
        break;
      }
    }
  }

  // Convert line+col to absolute position
  let pos = 0;
  for (let i = 0; i < lineIndex; i++) {
    pos += lines[i].length + 1;
  }
  pos += bestCol;
  return pos;
}

function getSelectionRange(state: { textCursorPos: number; textSelectionStart: number | null }): { start: number; end: number } | null {
  if (state.textSelectionStart === null) return null;
  const a = state.textSelectionStart;
  const b = state.textCursorPos;
  if (a === b) return null;
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

function deleteSelection(text: string, sel: { start: number; end: number }): { text: string; cursor: number } {
  return {
    text: text.substring(0, sel.start) + text.substring(sel.end),
    cursor: sel.start,
  };
}

// ── drawText ──────────────────────────────────────────────────────────

export function drawText(
  ctx: CanvasRenderingContext2D,
  block: TextBlock,
  showCursor = false,
  cursorPos = -1,
  selectionStart: number | null = null,
) {
  const fontSize = block.fontSize;

  ctx.save();

  setupFont(ctx, block);
  const lines = block.text.split('\n');
  const lineHeight = fontSize * 1.25;

  if (block.rotation !== 0) {
    // Calculate bounding box dimensions to rotate around its center
    let maxWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) maxWidth = w;
    }
    const totalHeight = lines.length * lineHeight;
    const centerX = block.x + maxWidth / 2;
    const centerY = block.y - fontSize * 0.75 + totalHeight / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(block.rotation);
    ctx.translate(-centerX, -centerY);
  }

  ctx.globalAlpha = block.opacity ?? 1;
  ctx.fillStyle = block.color;

  // Draw selection highlight
  if (showCursor && selectionStart !== null && selectionStart !== cursorPos) {
    const selStart = Math.min(selectionStart, cursorPos);
    const selEnd = Math.max(selectionStart, cursorPos);

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#3390ff';

    let charIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = charIndex;
      const lineEnd = charIndex + line.length;
      const y = block.y + i * lineHeight;

      if (selStart < lineEnd + 1 && selEnd > lineStart) {
        const highlightStart = Math.max(selStart, lineStart) - lineStart;
        const highlightEnd = Math.min(selEnd, lineEnd) - lineStart;

        const xStart = block.x + ctx.measureText(line.substring(0, highlightStart)).width;
        const xEnd = block.x + ctx.measureText(line.substring(0, highlightEnd)).width;

        ctx.fillRect(xStart, y - fontSize * 0.75, xEnd - xStart, fontSize * 0.9);
      }

      charIndex = lineEnd + 1; // +1 for \n
    }

    ctx.restore();
    ctx.fillStyle = block.color;
  }

  // Draw text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = block.y + i * lineHeight;
    ctx.fillText(line, block.x, y);
  }

  // Draw cursor
  if (showCursor && cursorPos >= 0) {
    const { line: cursorLine, col: cursorCol } = getLineAndColumn(block.text, cursorPos);
    const lineText = lines[cursorLine] || '';
    const cursorX = block.x + ctx.measureText(lineText.substring(0, cursorCol)).width;
    const cursorY = block.y + cursorLine * lineHeight;

    // Blinking effect via time
    const now = Date.now();
    if (Math.floor(now / 530) % 2 === 0) {
      ctx.fillStyle = block.color;
      ctx.fillRect(cursorX, cursorY - fontSize * 0.75, 2, fontSize * 0.9);
    }
  }

  ctx.restore();
}

registerRenderer('text', (ctx, data) => drawText(ctx, data));

// ── Tool ──────────────────────────────────────────────────────────

let isDraggingText = false;

export const TextTool: BaseTool = {
  name: 'text',
  cursor: 'text',

  onActivate(context: ToolContext) {
    context.canvas.style.cursor = 'text';
  },

  onMouseDown(_e: MouseEvent, point: Point, context: ToolContext) {
    const state = store.getState();

    if (state.activeTextBlock) {
      // Check if click is within the text area — if so, reposition cursor
      const block = state.activeTextBlock;
      const lines = block.text.split('\n');
      const lineHeight = block.fontSize * 1.25;
      const totalHeight = lines.length * lineHeight;

      setupFont(context.ctx, block);
      let maxWidth = 0;
      for (const line of lines) {
        const w = context.ctx.measureText(line).width;
        if (w > maxWidth) maxWidth = w;
      }

      const margin = 10;
      const inBounds =
        point.x >= block.x - margin &&
        point.x <= block.x + maxWidth + margin &&
        point.y >= block.y - block.fontSize * 0.75 - margin &&
        point.y <= block.y - block.fontSize * 0.75 + totalHeight + margin;

      if (inBounds) {
        const pos = getCursorPosFromClick(context.ctx, block, point.x, point.y);
        if (_e.shiftKey) {
          if (state.textSelectionStart === null) {
            actions.setTextSelectionStart(state.textCursorPos);
          }
        } else {
          actions.setTextSelectionStart(pos);
        }
        actions.setTextCursorPos(pos);
        isDraggingText = true;
        context.render();
        return;
      }

      // Click outside — commit current text and create new
      if (block.text.trim()) {
        actions.addElement({ type: 'text', id: '', data: block });
      }
    }

    // Create new text block
    actions.setActiveTextBlock({
      text: '',
      x: point.x,
      y: point.y,
      fontSize: state.textSize,
      fontFamily: state.textFontFamily,
      fontStyle: state.textStyle,
      color: state.textColor,
      opacity: state.textOpacity,
      rotation: 0,
    });
    context.render();
  },

  onMouseMove(_e: MouseEvent, point: Point, context: ToolContext) {
    if (!isDraggingText) return;
    const state = store.getState();
    if (!state.activeTextBlock) return;

    const pos = getCursorPosFromClick(context.ctx, state.activeTextBlock, point.x, point.y);
    actions.setTextCursorPos(pos);
    context.render();
  },

  onMouseUp(_e: MouseEvent, _point: Point, _context: ToolContext) {
    if (isDraggingText) {
      isDraggingText = false;
      // Se selectionStart === cursorPos, não há seleção real
      const state = store.getState();
      if (state.textSelectionStart === state.textCursorPos) {
        actions.setTextSelectionStart(null);
      }
    }
  },

  onKeyDown(e: KeyboardEvent, context: ToolContext) {
    const state = store.getState();
    if (!state.activeTextBlock) return;

    const block = state.activeTextBlock;
    const text = block.text;
    let cursor = state.textCursorPos;
    const sel = getSelectionRange(state);
    const ctrlKey = e.ctrlKey || e.metaKey;

    // ── Ctrl shortcuts ──
    if (ctrlKey) {
      if (e.key === 'a') {
        e.preventDefault();
        actions.setTextSelectionStart(0);
        actions.setTextCursorPos(text.length);
        context.render();
        return;
      }
      if (e.key === 'c') {
        e.preventDefault();
        if (sel) {
          navigator.clipboard.writeText(text.substring(sel.start, sel.end));
        }
        return;
      }
      if (e.key === 'x') {
        e.preventDefault();
        if (sel) {
          navigator.clipboard.writeText(text.substring(sel.start, sel.end));
          const result = deleteSelection(text, sel);
          block.text = result.text;
          actions.setTextCursorPos(result.cursor);
          actions.setTextSelectionStart(null);
          context.render();
        }
        return;
      }
      if (e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then((clipText) => {
          let newText = text;
          let newCursor = cursor;
          if (sel) {
            const result = deleteSelection(newText, sel);
            newText = result.text;
            newCursor = result.cursor;
          }
          newText = newText.substring(0, newCursor) + clipText + newText.substring(newCursor);
          newCursor += clipText.length;
          block.text = newText;
          actions.setTextCursorPos(newCursor);
          actions.setTextSelectionStart(null);
          context.render();
        });
        return;
      }
    }

    // ── Navigation keys ──
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey) {
        if (state.textSelectionStart === null) actions.setTextSelectionStart(cursor);
        actions.setTextCursorPos(Math.max(0, cursor - 1));
      } else {
        if (sel) {
          actions.setTextCursorPos(sel.start);
        } else {
          actions.setTextCursorPos(Math.max(0, cursor - 1));
        }
        actions.setTextSelectionStart(null);
      }
      context.render();
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey) {
        if (state.textSelectionStart === null) actions.setTextSelectionStart(cursor);
        actions.setTextCursorPos(Math.min(text.length, cursor + 1));
      } else {
        if (sel) {
          actions.setTextCursorPos(sel.end);
        } else {
          actions.setTextCursorPos(Math.min(text.length, cursor + 1));
        }
        actions.setTextSelectionStart(null);
      }
      context.render();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const { line, col } = getLineAndColumn(text, cursor);
      if (line > 0) {
        const newPos = getCursorPosFromLineCol(text, line - 1, col);
        if (e.shiftKey) {
          if (state.textSelectionStart === null) actions.setTextSelectionStart(cursor);
        } else {
          actions.setTextSelectionStart(null);
        }
        actions.setTextCursorPos(newPos);
      }
      context.render();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const { line, col } = getLineAndColumn(text, cursor);
      const lines = text.split('\n');
      if (line < lines.length - 1) {
        const newPos = getCursorPosFromLineCol(text, line + 1, col);
        if (e.shiftKey) {
          if (state.textSelectionStart === null) actions.setTextSelectionStart(cursor);
        } else {
          actions.setTextSelectionStart(null);
        }
        actions.setTextCursorPos(newPos);
      }
      context.render();
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      const lineStart = getLineStart(text, cursor);
      if (e.shiftKey) {
        if (state.textSelectionStart === null) actions.setTextSelectionStart(cursor);
      } else {
        actions.setTextSelectionStart(null);
      }
      actions.setTextCursorPos(lineStart);
      context.render();
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      const lineEnd = getLineEnd(text, cursor);
      if (e.shiftKey) {
        if (state.textSelectionStart === null) actions.setTextSelectionStart(cursor);
      } else {
        actions.setTextSelectionStart(null);
      }
      actions.setTextCursorPos(lineEnd);
      context.render();
      return;
    }

    // ── Editing keys ──
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (sel) {
        const result = deleteSelection(text, sel);
        block.text = result.text;
        actions.setTextCursorPos(result.cursor);
      } else if (cursor > 0) {
        block.text = text.substring(0, cursor - 1) + text.substring(cursor);
        actions.setTextCursorPos(cursor - 1);
      }
      actions.setTextSelectionStart(null);
      context.render();
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (sel) {
        const result = deleteSelection(text, sel);
        block.text = result.text;
        actions.setTextCursorPos(result.cursor);
      } else if (cursor < text.length) {
        block.text = text.substring(0, cursor) + text.substring(cursor + 1);
      }
      actions.setTextSelectionStart(null);
      context.render();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      let newText = text;
      let newCursor = cursor;
      if (sel) {
        const result = deleteSelection(newText, sel);
        newText = result.text;
        newCursor = result.cursor;
      }
      block.text = newText.substring(0, newCursor) + '\n' + newText.substring(newCursor);
      actions.setTextCursorPos(newCursor + 1);
      actions.setTextSelectionStart(null);
      context.render();
      return;
    }

    // ── Character input ──
    if (e.key.length === 1 && !ctrlKey) {
      e.preventDefault();
      let newText = text;
      let newCursor = cursor;
      if (sel) {
        const result = deleteSelection(newText, sel);
        newText = result.text;
        newCursor = result.cursor;
      }
      block.text = newText.substring(0, newCursor) + e.key + newText.substring(newCursor);
      actions.setTextCursorPos(newCursor + 1);
      actions.setTextSelectionStart(null);
      context.render();
    }
  },
};
