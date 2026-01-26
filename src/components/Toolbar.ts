import type { Tool } from '../types';
import type { Canvas } from '../canvas';
import { $all } from '../utils/dom';

export function setupToolbar(canvas: Canvas) {
  const toolButtons = $all<HTMLButtonElement>('.tool-btn');

  toolButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      toolButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const tool = btn.id.replace('tool-', '') as Tool;
      canvas.setTool(tool);
    });
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
