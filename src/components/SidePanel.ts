import type { Tool, SelectionInfo, FontStyle } from '../types';
import type { Canvas } from '../canvas';
import { $, $all, show, hide } from '../utils/dom';

export function setupSidePanel(canvas: Canvas) {
  const sidePanel = $<HTMLDivElement>('#side-panel')!;
  const textOptions = $<HTMLDivElement>('#text-options')!;
  const strokeOptions = $<HTMLDivElement>('#stroke-options')!;
  const shapeOptions = $<HTMLDivElement>('#shape-options')!;

  let currentTool: Tool = 'select';
  let currentSelection: SelectionInfo = {
    hasText: false,
    hasPath: false,
    hasShape: false,
    hasArrow: false,
    hasLine : false,
    count: 0,
  };

  function updatePanel() {
    const showTextOptions = currentTool === 'text' || currentSelection.hasText;
    const showStrokeOptions =
      currentTool === 'draw' ||
      currentTool === 'arrow' ||
      currentSelection.hasPath ||
      currentSelection.hasArrow;
    const showShapeOptions = currentTool === 'shape' || currentSelection.hasShape;

    if (showTextOptions || showStrokeOptions || showShapeOptions) {
      show(sidePanel);
      showTextOptions ? show(textOptions) : hide(textOptions);
      showStrokeOptions ? show(strokeOptions) : hide(strokeOptions);
      showShapeOptions ? show(shapeOptions) : hide(shapeOptions);
    } else {
      hide(sidePanel);
      hide(textOptions);
      hide(strokeOptions);
      hide(shapeOptions);
    }
  }

  // Font size buttons
  const sizeButtons = $all<HTMLButtonElement>('.size-btn');
  sizeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const size = parseInt(btn.dataset.size || '24');
      canvas.setTextSize(size);
    });
  });

  // Text style buttons
  const styleButtons = $all<HTMLButtonElement>('.style-btn');
  styleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      styleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.dataset.style || 'normal';
      canvas.setTextStyle(style as FontStyle);
    });
  });

  // Text color buttons
  const colorButtons = $all<HTMLButtonElement>('.color-btn');
  colorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      canvas.setTextColor(color);
    });
  });

  // Stroke width buttons
  const strokeButtons = $all<HTMLButtonElement>('.stroke-btn');
  strokeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      strokeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const width = parseInt(btn.dataset.width || '4');
      canvas.setStrokeWidth(width);
    });
  });

  // Stroke color buttons
  const strokeColorButtons = $all<HTMLButtonElement>('.stroke-color-btn');
  strokeColorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      strokeColorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      canvas.setStrokeColor(color);
    });
  });

  // Shape fill color buttons
  const shapeFillButtons = $all<HTMLButtonElement>('.shape-fill-btn');
  shapeFillButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeFillButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#3b82f6';
      canvas.setShapeFillColor(color);
    });
  });

  // Shape stroke color buttons
  const shapeStrokeButtons = $all<HTMLButtonElement>('.shape-stroke-btn');
  shapeStrokeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeStrokeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      canvas.setShapeStrokeColor(color);
    });
  });

  // Shape stroke width buttons
  const shapeWidthButtons = $all<HTMLButtonElement>('.shape-width-btn');
  shapeWidthButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeWidthButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const width = parseInt(btn.dataset.width || '2');
      canvas.setShapeStrokeWidth(width);
    });
  });

  // Shape border radius buttons
  const shapeRadiusButtons = $all<HTMLButtonElement>('.shape-radius-btn');
  shapeRadiusButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeRadiusButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const radius = parseInt(btn.dataset.radius || '0');
      canvas.setShapeBorderRadius(radius);
    });
  });

  // Subscribe to changes
  canvas.onToolChange((tool: Tool) => {
    currentTool = tool;
    updatePanel();
  });

  canvas.onSelectionChange((info: SelectionInfo) => {
    currentSelection = info;
    updatePanel();
  });

  return { updatePanel };
}
