const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function makeDraggable(panel: HTMLElement): void {
  const handleEl = panel.querySelector<HTMLElement>('.panel-drag-handle');
  if (!handleEl) return;
  const handle = handleEl;

  const storageKey = `panel-pos-${panel.id}`;
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function clampPosition(left: number, top: number): { left: number; top: number } {
    const rect = panel.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;
    return {
      left: Math.max(0, Math.min(left, maxLeft)),
      top: Math.max(0, Math.min(top, maxTop)),
    };
  }

  function applyPosition(left: number, top: number) {
    const clamped = clampPosition(left, top);
    panel.style.left = `${clamped.left}px`;
    panel.style.top = `${clamped.top}px`;
    panel.style.right = 'auto';
    panel.classList.add('dragged');
  }

  function clearDraggedPosition() {
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
    panel.classList.remove('dragged');
  }

  function savePosition() {
    const left = parseFloat(panel.style.left) || 0;
    const top = parseFloat(panel.style.top) || 0;
    localStorage.setItem(storageKey, JSON.stringify({ left, top }));
  }

  function restorePosition() {
    if (isMobile()) return;
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const { left, top } = JSON.parse(saved);
      applyPosition(left, top);
    } catch {
      // ignore invalid data
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (isMobile()) return;
    if (e.button !== 0) return;
    e.preventDefault();

    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    isDragging = true;

    handle.setPointerCapture(e.pointerId);
    handle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    e.preventDefault();
    applyPosition(e.clientX - offsetX, e.clientY - offsetY);
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    handle.releasePointerCapture(e.pointerId);
    handle.style.cursor = '';
    document.body.style.userSelect = '';
    savePosition();
  }

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);

  // On resize: if crossing to mobile, remove dragged styles; if crossing to desktop, restore
  window.addEventListener('resize', () => {
    if (isMobile()) {
      clearDraggedPosition();
    } else if (panel.classList.contains('dragged')) {
      const left = parseFloat(panel.style.left) || 0;
      const top = parseFloat(panel.style.top) || 0;
      applyPosition(left, top);
      savePosition();
    } else {
      restorePosition();
    }
  });

  // Restore saved position on init (desktop only)
  restorePosition();
}
