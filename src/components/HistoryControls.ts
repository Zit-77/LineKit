import type { Canvas } from '../canvas';
import { $ } from '../utils/dom';

export function setupHistoryControls(canvas: Canvas) {
  const undoBtn = $<HTMLButtonElement>('#undo-btn')!;
  const redoBtn = $<HTMLButtonElement>('#redo-btn')!;

  undoBtn.addEventListener('click', () => {
    canvas.undo();
  });

  redoBtn.addEventListener('click', () => {
    canvas.redo();
  });

  // Atualiza estado dos botões baseado no histórico
  canvas.onHistoryChange(({ canUndo, canRedo }) => {
    undoBtn.disabled = !canUndo;
    redoBtn.disabled = !canRedo;

    undoBtn.classList.toggle('disabled', !canUndo);
    redoBtn.classList.toggle('disabled', !canRedo);
  });

  return {
    undo: () => canvas.undo(),
    redo: () => canvas.redo(),
  };
}
