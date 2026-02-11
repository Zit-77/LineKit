import type { Tool, SelectionInfo, FontStyle } from '../types';
import type { Canvas } from '../canvas';
import { $, $all, show, hide } from '../utils/dom';
import * as actions from '../state/actions';

export function setupSidePanel(canvas: Canvas) {
  const sidePanel = $<HTMLDivElement>('#side-panel')!;
  const textOptions = $<HTMLDivElement>('#text-options')!;
  const strokeOptions = $<HTMLDivElement>('#stroke-options')!;
  const lineOptions = $<HTMLDivElement>('#line-options')!;
  const arrowOptions = $<HTMLDivElement>('#arrow-options')!;
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
    const showStrokeOptions = currentTool === 'draw' || currentSelection.hasPath;
    const showLineOptions = currentTool === 'line' || currentSelection.hasLine;
    const showArrowOptions = currentTool === 'arrow' || currentSelection.hasArrow;
    const showShapeOptions = currentTool === 'shape' || currentSelection.hasShape;

    if (showTextOptions || showStrokeOptions || showLineOptions || showArrowOptions || showShapeOptions) {
      show(sidePanel);
      showTextOptions ? show(textOptions) : hide(textOptions);
      showStrokeOptions ? show(strokeOptions) : hide(strokeOptions);
      showLineOptions ? show(lineOptions) : hide(lineOptions);
      showArrowOptions ? show(arrowOptions) : hide(arrowOptions);
      showShapeOptions ? show(shapeOptions) : hide(shapeOptions);
    } else {
      hide(sidePanel);
      hide(textOptions);
      hide(strokeOptions);
      hide(lineOptions);
      hide(arrowOptions);
      hide(shapeOptions);
    }
  }

  // Font family dropdown
  const fontTrigger = $<HTMLButtonElement>('#font-trigger')!;
  const fontDropdown = $<HTMLDivElement>('#font-dropdown')!;
  const fontOptions = $all<HTMLButtonElement>('.font-option');

  function toggleFontDropdown() {
    fontDropdown.classList.toggle('hidden');
  }

  function closeFontDropdown() {
    fontDropdown.classList.add('hidden');
  }

  fontTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFontDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!fontDropdown.contains(e.target as Node) && e.target !== fontTrigger) {
      closeFontDropdown();
    }
  });

  fontOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      fontOptions.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const family = btn.dataset.font || 'Inter, sans-serif';
      const label = btn.dataset.label || 'Inter';
      actions.setTextFontFamily(family);
      fontTrigger.style.fontFamily = family;
      fontTrigger.childNodes[0].textContent = label + '\n';
      closeFontDropdown();
    });
  });

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

  // Line width buttons
  const lineWidthButtons = $all<HTMLButtonElement>('.line-width-btn');
  lineWidthButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      lineWidthButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const width = parseInt(btn.dataset.width || '4');
      actions.setLineWidth(width);
    });
  });

  // Line style buttons
  const lineStyleButtons = $all<HTMLButtonElement>('.line-style-btn');
  lineStyleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      lineStyleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.dataset.style || 'solid';
      actions.setLineStyle(style as 'solid' | 'dashed' | 'dotted');
    });
  });

  // Line roughness slider
  const lineRoughnessSlider = $<HTMLInputElement>('.line-roughness-slider');
  const lineRoughnessValue = $<HTMLSpanElement>('.line-roughness-value');

  if (lineRoughnessSlider && lineRoughnessValue) {
    lineRoughnessSlider.addEventListener('input', () => {
      const value = parseInt(lineRoughnessSlider.value);
      lineRoughnessValue.textContent = `${value}%`;
      actions.setLineRoughness(value / 100);
    });
  }

  // Line color buttons
  const lineColorButtons = $all<HTMLButtonElement>('.line-color-btn');
  const lineColorPicker = $<HTMLInputElement>('.line-color-picker');

  lineColorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      lineColorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      actions.setLineColor(color);
      if (lineColorPicker) lineColorPicker.value = color;
    });
  });

  // Line color picker
  if (lineColorPicker) {
    lineColorPicker.addEventListener('input', () => {
      lineColorButtons.forEach((b) => b.classList.remove('active'));
      actions.setLineColor(lineColorPicker.value);
    });
  }

  // Line opacity slider
  const lineOpacitySlider = $<HTMLInputElement>('.line-opacity-slider');
  const lineOpacityValue = $<HTMLSpanElement>('.line-opacity-value');

  if (lineOpacitySlider && lineOpacityValue) {
    lineOpacitySlider.addEventListener('input', () => {
      const value = parseInt(lineOpacitySlider.value);
      lineOpacityValue.textContent = `${value}%`;
      actions.setLineOpacity(value / 100);
    });
  }

  // Arrow width buttons
  const arrowWidthButtons = $all<HTMLButtonElement>('.arrow-width-btn');
  arrowWidthButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      arrowWidthButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const width = parseInt(btn.dataset.width || '4');
      actions.setArrowWidth(width);
    });
  });

  // Arrow style buttons
  const arrowStyleButtons = $all<HTMLButtonElement>('.arrow-style-btn');
  arrowStyleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      arrowStyleButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.dataset.style || 'solid';
      actions.setArrowStyle(style as 'solid' | 'dashed' | 'dotted');
    });
  });

  // Arrow roughness slider
  const arrowRoughnessSlider = $<HTMLInputElement>('.arrow-roughness-slider');
  const arrowRoughnessValue = $<HTMLSpanElement>('.arrow-roughness-value');

  if (arrowRoughnessSlider && arrowRoughnessValue) {
    arrowRoughnessSlider.addEventListener('input', () => {
      const value = parseInt(arrowRoughnessSlider.value);
      arrowRoughnessValue.textContent = `${value}%`;
      actions.setArrowRoughness(value / 100);
    });
  }

  // Arrow color buttons
  const arrowColorButtons = $all<HTMLButtonElement>('.arrow-color-btn');
  const arrowColorPicker = $<HTMLInputElement>('.arrow-color-picker');

  arrowColorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      arrowColorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color || '#ffffff';
      actions.setArrowColor(color);
      if (arrowColorPicker) arrowColorPicker.value = color;
    });
  });

  // Arrow color picker
  if (arrowColorPicker) {
    arrowColorPicker.addEventListener('input', () => {
      arrowColorButtons.forEach((b) => b.classList.remove('active'));
      actions.setArrowColor(arrowColorPicker.value);
    });
  }

  // Arrow opacity slider
  const arrowOpacitySlider = $<HTMLInputElement>('.arrow-opacity-slider');
  const arrowOpacityValue = $<HTMLSpanElement>('.arrow-opacity-value');

  if (arrowOpacitySlider && arrowOpacityValue) {
    arrowOpacitySlider.addEventListener('input', () => {
      const value = parseInt(arrowOpacitySlider.value);
      arrowOpacityValue.textContent = `${value}%`;
      actions.setArrowOpacity(value / 100);
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
