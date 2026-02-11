import { $ } from '../utils/dom';
import type { Canvas } from '../canvas';

const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function setupMobileDrawers(canvas: Canvas) {
  const overlay = $<HTMLDivElement>('#mobile-overlay')!;
  const sidePanel = $<HTMLDivElement>('#side-panel')!;
  const panelToggle = $<HTMLDivElement>('#mobile-panel-toggle')!;

  let sidePanelVisible = false;
  let hasPanelContent = false;

  function closePanels() {
    sidePanel.classList.remove('mobile-open');
    overlay.classList.remove('active');
    sidePanelVisible = false;
  }

  function toggleSidePanel() {
    if (!isMobile()) return;

    if (sidePanelVisible) {
      closePanels();
    } else {
      sidePanel.classList.add('mobile-open');
      overlay.classList.add('active');
      sidePanelVisible = true;
    }
  }

  // Toggle bar expands/collapses side panel
  panelToggle.addEventListener('click', () => {
    if (hasPanelContent) {
      toggleSidePanel();
    }
  });

  // Close when clicking overlay
  overlay.addEventListener('click', () => {
    closePanels();
  });

  // Prevent clicks inside panel from closing
  sidePanel.addEventListener('click', (e) => e.stopPropagation());

  // Show/hide toggle based on tool
  canvas.onToolChange((tool) => {
    if (!isMobile()) return;

    hasPanelContent = ['text', 'draw', 'line', 'arrow', 'shape'].includes(tool);

    if (hasPanelContent) {
      panelToggle.classList.remove('hidden');
    } else {
      panelToggle.classList.add('hidden');
      closePanels();
    }
  });

  // Show toggle when selection has elements
  canvas.onSelectionChange((info) => {
    if (!isMobile()) return;

    if (info.count > 0) {
      hasPanelContent = true;
      panelToggle.classList.remove('hidden');
    }
  });

  // Close on escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidePanelVisible) {
      closePanels();
    }
  });

  // Clean up on resize to desktop
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      sidePanel.classList.remove('mobile-open');
      overlay.classList.remove('active');
      panelToggle.classList.add('hidden');
      sidePanelVisible = false;
    }
  });

  return { closePanels };
}
