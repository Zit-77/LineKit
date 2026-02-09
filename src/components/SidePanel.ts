import type { Tool, SelectionInfo, FontStyle } from '../types';
import type { Canvas } from '../canvas';
import { $, $all, show, hide } from '../utils/dom';
import * as actions from '../state/actions';

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
    hasLine: false,
    count: 0,
  };

  function updatePanel() {
    const showTextOptions = currentTool === 'text' || currentSelection.hasText;
    const showStrokeOptions =
      currentTool === 'draw' ||
      currentTool === 'arrow' ||
      currentTool === 'line' ||
      currentSelection.hasPath ||
      currentSelection.hasArrow ||
      currentSelection.hasLine;

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
      actions.setTextSize(size);
    });
  });

  // Text style buttons
  const styleButtons = $all<HTMLButtonElement>('.style-btn');
  styleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      styleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.dataset.style || 'normal';
      actions.setTextStyle(style as FontStyle);
    });
  });

  // Text color buttons
  const colorButtons = $all<HTMLButtonElement>('.color-btn');
  const textColorPicker = $<HTMLInputElement>('.text-color-picker');

  colorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      actions.setTextColor(color);
      if (textColorPicker) textColorPicker.value = color;
    });
  });

  // Text color picker
  if (textColorPicker) {
    textColorPicker.addEventListener('input', () => {
      colorButtons.forEach((b) => b.classList.remove('active'));
      actions.setTextColor(textColorPicker.value);
    });
  }

  // Text opacity slider
  const textOpacitySlider = $<HTMLInputElement>('.text-opacity-slider');
  const textOpacityValue = $<HTMLSpanElement>('.text-opacity-value');

  if (textOpacitySlider && textOpacityValue) {
    textOpacitySlider.addEventListener('input', () => {
      const value = parseInt(textOpacitySlider.value);
      textOpacityValue.textContent = `${value}%`;
      actions.setTextOpacity(value / 100);
    });
  }

  // Stroke width buttons
  const strokeButtons = $all<HTMLButtonElement>('.stroke-btn');
  strokeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      strokeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const width = parseInt(btn.dataset.width || '4');
      actions.setStrokeWidth(width);
    });
  });

  // Stroke color buttons
  const strokeColorButtons = $all<HTMLButtonElement>('.stroke-color-btn');
  const strokeColorPicker = $<HTMLInputElement>('.stroke-color-picker');

  strokeColorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      strokeColorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      actions.setStrokeColor(color);
      if (strokeColorPicker) strokeColorPicker.value = color;
    });
  });

  // Stroke color picker
  if (strokeColorPicker) {
    strokeColorPicker.addEventListener('input', () => {
      strokeColorButtons.forEach((b) => b.classList.remove('active'));
      actions.setStrokeColor(strokeColorPicker.value);
    });
  }

  // Stroke opacity slider
  const strokeOpacitySlider = $<HTMLInputElement>('.stroke-opacity-slider');
  const strokeOpacityValue = $<HTMLSpanElement>('.stroke-opacity-value');

  if (strokeOpacitySlider && strokeOpacityValue) {
    strokeOpacitySlider.addEventListener('input', () => {
      const value = parseInt(strokeOpacitySlider.value);
      strokeOpacityValue.textContent = `${value}%`;
      actions.setStrokeOpacity(value / 100);
    });
  }

  // Shape fill color buttons
  const shapeFillButtons = $all<HTMLButtonElement>('.shape-fill-btn');
  const shapeFillPicker = $<HTMLInputElement>('.shape-fill-picker');

  shapeFillButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeFillButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#3b82f6';
      actions.setShapeFillColor(color);
      if (shapeFillPicker && color !== 'transparent') shapeFillPicker.value = color;
    });
  });

  // Shape fill color picker
  if (shapeFillPicker) {
    shapeFillPicker.addEventListener('input', () => {
      shapeFillButtons.forEach((b) => b.classList.remove('active'));
      actions.setShapeFillColor(shapeFillPicker.value);
    });
  }

  // Shape fill opacity slider
  const shapeFillOpacitySlider = $<HTMLInputElement>('.shape-fill-opacity-slider');
  const shapeFillOpacityValue = $<HTMLSpanElement>('.shape-fill-opacity-value');

  if (shapeFillOpacitySlider && shapeFillOpacityValue) {
    shapeFillOpacitySlider.addEventListener('input', () => {
      const value = parseInt(shapeFillOpacitySlider.value);
      shapeFillOpacityValue.textContent = `${value}%`;
      actions.setShapeFillOpacity(value / 100);
    });
  }

  // Shape stroke color buttons
  const shapeStrokeButtons = $all<HTMLButtonElement>('.shape-stroke-btn');
  const shapeStrokePicker = $<HTMLInputElement>('.shape-stroke-picker');

  shapeStrokeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeStrokeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      actions.setShapeStrokeColor(color);
      if (shapeStrokePicker && color !== 'transparent') shapeStrokePicker.value = color;
    });
  });

  // Shape stroke color picker
  if (shapeStrokePicker) {
    shapeStrokePicker.addEventListener('input', () => {
      shapeStrokeButtons.forEach((b) => b.classList.remove('active'));
      actions.setShapeStrokeColor(shapeStrokePicker.value);
    });
  }

  // Shape stroke opacity slider
  const shapeStrokeOpacitySlider = $<HTMLInputElement>('.shape-stroke-opacity-slider');
  const shapeStrokeOpacityValue = $<HTMLSpanElement>('.shape-stroke-opacity-value');

  if (shapeStrokeOpacitySlider && shapeStrokeOpacityValue) {
    shapeStrokeOpacitySlider.addEventListener('input', () => {
      const value = parseInt(shapeStrokeOpacitySlider.value);
      shapeStrokeOpacityValue.textContent = `${value}%`;
      actions.setShapeStrokeOpacity(value / 100);
    });
  }

  // Shape stroke width buttons
  const shapeWidthButtons = $all<HTMLButtonElement>('.shape-width-btn');
  shapeWidthButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeWidthButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const width = parseInt(btn.dataset.width || '2');
      actions.setShapeStrokeWidth(width);
    });
  });

  // Shape border radius buttons
  const shapeRadiusButtons = $all<HTMLButtonElement>('.shape-radius-btn');
  shapeRadiusButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      shapeRadiusButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const radius = parseInt(btn.dataset.radius || '0');
      actions.setShapeBorderRadius(radius);
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
