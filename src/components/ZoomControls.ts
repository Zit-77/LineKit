import type { Canvas } from '../canvas';
import { $ } from '../utils/dom';
import { store } from '../state/store';
import { getSelectionBoundingBox } from '../utils/geometry';
import { isArrowConnected, disconnectArrow } from '../utils/connections';

export function setupZoomControls(canvas: Canvas) {
  const zoomInBtn = $<HTMLButtonElement>('#zoom-in')!;
  const zoomOutBtn = $<HTMLButtonElement>('#zoom-out')!;
  const zoomLevel = $<HTMLSpanElement>('#zoom-level')!;
  const selectionActions = $<HTMLDivElement>('#selection-actions')!;
  const moreBtn = $<HTMLButtonElement>('#selection-more-btn')!;
  const dropdown = $<HTMLDivElement>('#selection-dropdown')!;
  const exportPngBtn = $<HTMLButtonElement>('#action-export-png')!;
  const unlockArrowBtn = $<HTMLButtonElement>('#action-unlock-arrow')!;
  const canvasEl = $<HTMLCanvasElement>('#canvas')!;
  const ctx = canvasEl.getContext('2d')!;

  function updateZoomDisplay() {
    const state = store.getState();
    const percentage = Math.round(state.scale * 100);
    zoomLevel.textContent = `${percentage}%`;
  }

  function updateSelectionActionsPosition() {
    const state = store.getState();
    if (state.selectedElements.size === 0) {
      selectionActions.classList.add('hidden');
      dropdown.classList.add('hidden');
      return;
    }

    const box = getSelectionBoundingBox(state.selectedElements, ctx);
    if (!box) {
      selectionActions.classList.add('hidden');
      dropdown.classList.add('hidden');
      return;
    }

    // Convert canvas coordinates to screen coordinates
    const screenX = box.x * state.scale + state.offset.x;
    const screenY = (box.y + box.height) * state.scale + state.offset.y;

    // Position below the selection box, centered horizontally
    const screenCenterX = screenX + (box.width * state.scale) / 2;

    selectionActions.style.left = `${screenCenterX}px`;
    selectionActions.style.top = `${screenY + 16}px`;
    selectionActions.classList.remove('hidden');
  }

  zoomInBtn.addEventListener('click', () => {
    canvas.zoomIn();
  });

  zoomOutBtn.addEventListener('click', () => {
    canvas.zoomOut();
  });

  // Toggle dropdown
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!selectionActions.contains(e.target as Node)) {
      dropdown.classList.add('hidden');
    }
  });

  // Export PNG action
  exportPngBtn.addEventListener('click', () => {
    canvas.exportSelection();
    dropdown.classList.add('hidden');
  });

  // Unlock/disconnect arrow action
  unlockArrowBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const state = store.getState();
    for (const el of state.selectedElements) {
      disconnectArrow(el);
    }
    unlockArrowBtn.classList.add('hidden');
    store.notify();
  });

  function updateUnlockButtonVisibility() {
    const state = store.getState();
    const selected = Array.from(state.selectedElements);
    const onlyArrows = selected.length > 0 && selected.every(el => el.type === 'arrow');
    const hasConnected = onlyArrows && selected.some(el => isArrowConnected(el));
    if (hasConnected) {
      unlockArrowBtn.classList.remove('hidden');
    } else {
      unlockArrowBtn.classList.add('hidden');
    }
  }

  // Show/hide actions based on selection
  canvas.onSelectionChange((info) => {
    if (info.count > 0) {
      updateSelectionActionsPosition();
      updateUnlockButtonVisibility();
    } else {
      selectionActions.classList.add('hidden');
      dropdown.classList.add('hidden');
    }
  });

  // Update position on every render (pan, zoom, move, etc.)
  store.subscribe(() => {
    const state = store.getState();
    if (state.selectedElements.size > 0) {
      updateSelectionActionsPosition();
      updateUnlockButtonVisibility();
    } else {
      unlockArrowBtn.classList.add('hidden');
    }
    updateZoomDisplay();
  });

  // Initialize display
  updateZoomDisplay();

  return {
    zoomIn: () => canvas.zoomIn(),
    zoomOut: () => canvas.zoomOut(),
    resetZoom: () => canvas.resetZoom(),
  };
}
