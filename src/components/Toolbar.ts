import type { Tool } from '../types';
import type { Canvas } from '../canvas';
import { $, $all } from '../utils/dom';
import { store } from '../state';

export function setupToolbar(canvas: Canvas) {
  const toolButtons = $all<HTMLButtonElement>('.tool-btn');
  const resetCanvasBtn = $<HTMLButtonElement>('#reset-canvas')!;

  toolButtons.forEach((btn) => {
    // Skip reset canvas button
    if (btn.id === 'reset-canvas') return;

    btn.addEventListener('click', () => {
      toolButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const tool = btn.id.replace('tool-', '') as Tool;
      canvas.setTool(tool);
    });
  });

  // Reset canvas handler
  resetCanvasBtn.addEventListener('click', () => {
    const confirmed = confirm(
      'Are you sure you want to reset the canvas?\n\nThis will:\n• Delete all elements\n• Clear localStorage\n• This action cannot be undone!'
    );

    if (confirmed) {
      const state = store.getState();

      // Clear elements array
      state.elements = [];

      // Clear selection
      state.selectedElements.clear();
      state.selectionRotation = 0;

      // Clear localStorage
      localStorage.removeItem('g-draw-elements');

      // Clear history
      state.past = [];
      state.future = [];

      // Notify changes
      store.notify();
      store.notifySelectionChange();

      console.log('Canvas reset complete');
    }
  });

  // Subscribe to tool changes from canvas (e.g., Escape key)
  canvas.onToolChange((tool: Tool) => {
    toolButtons.forEach((b) => b.classList.remove('active'));
    const activeBtn = document.querySelector(`#tool-${tool}`);
    activeBtn?.classList.add('active');
  });

  return {
    setActiveTool(tool: Tool) {
      toolButtons.forEach((b) => b.classList.remove('active'));
      const btn = document.querySelector(`#tool-${tool}`);
      btn?.classList.add('active');
    },
  };
}
