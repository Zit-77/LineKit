import type { Canvas } from '../canvas';
import type { CanvasElement, SelectionInfo, BoundingBox } from '../types';
import { $, show, hide } from '../utils/dom';
import { store } from '../state/store';
import { getBoundingBox } from '../utils/geometry';
import { moveElement, scaleElement, rotateElement } from '../elements';

interface ElementInfo {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  strokeWidth?: number;
}

export function setupElementInfoPanel(canvas: Canvas) {
  const panel = $<HTMLDivElement>('#element-info-panel')!;
  const elementType = $<HTMLSpanElement>('#element-type')!;
  const elementX = $<HTMLInputElement>('#element-x')!;
  const elementY = $<HTMLInputElement>('#element-y')!;
  const elementWidth = $<HTMLInputElement>('#element-width')!;
  const elementHeight = $<HTMLInputElement>('#element-height')!;
  const elementRotation = $<HTMLInputElement>('#element-rotation')!;
  const strokeSection = $<HTMLDivElement>('#element-stroke-section')!;
  const strokeWidthInput = $<HTMLInputElement>('#element-stroke-width')!;

  let currentElement: CanvasElement | null = null;
  let selectedElements: CanvasElement[] = [];
  let lastBoundingBox: BoundingBox | null = null;
  let lastRotation: number = 0;
  let isUpdating = false;

  // Cria um canvas temporário para calcular bounding box
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;

  function getElementInfo(element: CanvasElement): ElementInfo {
    const box = getBoundingBox(element, tempCtx);

    const baseInfo: ElementInfo = {
      type: element.type,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
    };

    if (box) {
      baseInfo.x = Math.round(box.x);
      baseInfo.y = Math.round(box.y);
      baseInfo.width = Math.round(box.width);
      baseInfo.height = Math.round(box.height);
    }

    switch (element.type) {
      case 'text':
        baseInfo.x = Math.round(element.data.x);
        baseInfo.y = Math.round(element.data.y);
        baseInfo.rotation = Math.round((element.data.rotation * 180) / Math.PI);

        break;

      case 'shape':
        baseInfo.x = Math.round(element.data.x);
        baseInfo.y = Math.round(element.data.y);
        baseInfo.width = Math.round(element.data.width);
        baseInfo.height = Math.round(element.data.height);
        baseInfo.rotation = Math.round((element.data.rotation * 180) / Math.PI);
        baseInfo.strokeWidth = element.data.strokeWidth;
        break;

      case 'path':
        baseInfo.rotation = Math.round((element.data.rotation * 180) / Math.PI);

        baseInfo.strokeWidth = element.data.lineWidth;
        break;

      case 'arrow':
      case 'line':
        baseInfo.strokeWidth = element.data.lineWidth;
        break;
    }

    return baseInfo;
  }

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      text: 'Text',
      shape: 'Shape',
      path: 'Path',
      arrow: 'Arrow',
      line: 'Line',
    };
    return labels[type] || type;
  }


  function calculateCombinedBoundingBox(elements: CanvasElement[]): BoundingBox | null {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const el of elements) {
      const box = getBoundingBox(el, tempCtx);
      if (box) {
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      }
    }

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function updatePanel() {
    const state = store.getState();
    selectedElements = Array.from(state.selectedElements);

    if (selectedElements.length === 0) {
      hide(panel);
      currentElement = null;
      lastBoundingBox = null;
      lastRotation = 0;
      return;
    }

    // Hide panel for arrow/line (not implemented yet)
    const hasUnsupportedElement = selectedElements.some(el => el.type === 'arrow' || el.type === 'line');
    if (hasUnsupportedElement) {
      hide(panel);
      currentElement = null;
      lastBoundingBox = null;
      lastRotation = 0;
      return;
    }

    if (selectedElements.length > 1) {
      // Multiple elements selected
      show(panel);
      elementType.textContent = `${selectedElements.length} items`;

      // Calcular bounding box combinado
      const combinedBox = calculateCombinedBoundingBox(selectedElements);
      lastBoundingBox = combinedBox;

      isUpdating = true;
      elementX.value = combinedBox ? Math.round(combinedBox.x).toString() : '-';
      elementY.value = combinedBox ? Math.round(combinedBox.y).toString() : '-';
      elementWidth.value = combinedBox ? Math.round(combinedBox.width).toString() : '-';
      elementHeight.value = combinedBox ? Math.round(combinedBox.height).toString() : '-';
      elementRotation.value = '-';
      elementRotation.disabled = true;
      isUpdating = false;

      hide(strokeSection);
      currentElement = null;
      return;
    }

    // Um único elemento selecionado
    const element = selectedElements[0];
    currentElement = element;
    lastBoundingBox = getBoundingBox(element, tempCtx);
    const info = getElementInfo(element);
    lastRotation = info.rotation;

    show(panel);
    elementType.textContent = getTypeLabel(info.type);

    isUpdating = true;
    elementX.value = info.x.toString();
    elementY.value = info.y.toString();
    elementWidth.value = info.width.toString();
    elementHeight.value = info.height.toString();
    elementRotation.value = info.rotation.toString();
    elementRotation.disabled = false;


    // Mostrar seção de stroke
    if (info.strokeWidth !== undefined) {
      show(strokeSection);
      strokeWidthInput.value = info.strokeWidth.toString();
    } else {
      hide(strokeSection);
    }

    isUpdating = false;
  }

  function applyChanges() {
    if (isUpdating) return;

    const newX = parseFloat(elementX.value);
    const newY = parseFloat(elementY.value);
    const newWidth = parseFloat(elementWidth.value);
    const newHeight = parseFloat(elementHeight.value);

    // Múltiplos elementos selecionados
    if (selectedElements.length > 1 && lastBoundingBox) {
      const dx = (isNaN(newX) ? 0 : newX) - lastBoundingBox.x;
      const dy = (isNaN(newY) ? 0 : newY) - lastBoundingBox.y;

      // Mover todos os elementos
      if (dx !== 0 || dy !== 0) {
        for (const el of selectedElements) {
          moveElement(el, dx, dy);
        }
        lastBoundingBox.x += dx;
        lastBoundingBox.y += dy;
      }

      // Escalar todos os elementos (se width/height mudou)
      if (!isNaN(newWidth) && !isNaN(newHeight) && lastBoundingBox.width > 0 && lastBoundingBox.height > 0) {
        const scaleX = newWidth / lastBoundingBox.width;
        const scaleY = newHeight / lastBoundingBox.height;

        if (scaleX !== 1 || scaleY !== 1) {
          const centerX = lastBoundingBox.x + lastBoundingBox.width / 2;
          const centerY = lastBoundingBox.y + lastBoundingBox.height / 2;

          for (const el of selectedElements) {
            scaleElement(el, scaleX, scaleY, centerX, centerY);
          }

          // Atualizar bounding box
          lastBoundingBox.width = newWidth;
          lastBoundingBox.height = newHeight;
        }
      }

      store.notify();
      return;
    }

    // Um único elemento selecionado
    if (!currentElement) return;

    const x = newX || 0;
    const y = newY || 0;
    const width = newWidth || 0;
    const height = newHeight || 0;
    const rotation = ((parseFloat(elementRotation.value) || 0) * Math.PI) / 180;
    const strokeWidth = parseFloat(strokeWidthInput.value) || 0;

    switch (currentElement.type) {
      case 'text':
        currentElement.data.x = x;
        currentElement.data.y = y;
        currentElement.data.rotation = rotation;
        break;

      case 'shape':
        currentElement.data.x = x;
        currentElement.data.y = y;
        currentElement.data.width = Math.max(1, width);
        currentElement.data.height = Math.max(1, height);
        currentElement.data.rotation = rotation;
        currentElement.data.strokeWidth = strokeWidth;
        break;

      case 'path':
        // For path, use element handlers for all transformations
        if (lastBoundingBox) {
          const centerX = lastBoundingBox.x + lastBoundingBox.width / 2;
          const centerY = lastBoundingBox.y + lastBoundingBox.height / 2;

          // Handle rotation change
          const newRotationDeg = parseFloat(elementRotation.value) || 0;
          const rotationDelta = newRotationDeg - lastRotation;
          if (rotationDelta !== 0) {
            const deltaRad = (rotationDelta * Math.PI) / 180;
            rotateElement(currentElement, deltaRad, centerX, centerY);
            lastRotation = newRotationDeg;
            lastBoundingBox = getBoundingBox(currentElement, tempCtx);
          }

          // Handle scale change (width/height)
          if (lastBoundingBox && lastBoundingBox.width > 0 && lastBoundingBox.height > 0) {
            const scaleX = width / lastBoundingBox.width;
            const scaleY = height / lastBoundingBox.height;

            if (scaleX !== 1 || scaleY !== 1) {
              const newCenterX = lastBoundingBox.x + lastBoundingBox.width / 2;
              const newCenterY = lastBoundingBox.y + lastBoundingBox.height / 2;
              scaleElement(currentElement, scaleX, scaleY, newCenterX, newCenterY);
              lastBoundingBox = getBoundingBox(currentElement, tempCtx);
            }
          }

          // Handle position change (move)
          if (lastBoundingBox) {
            const dx = x - lastBoundingBox.x;
            const dy = y - lastBoundingBox.y;
            if (dx !== 0 || dy !== 0) {
              moveElement(currentElement, dx, dy);
              lastBoundingBox.x += dx;
              lastBoundingBox.y += dy;
            }
          }
        }
        currentElement.data.lineWidth = strokeWidth;
        break;
    }

    store.notify();
  }

  // Event listeners para inputs - atualiza em tempo real
  const inputs = [elementX, elementY, elementWidth, elementHeight, elementRotation, strokeWidthInput];

  inputs.forEach(input => {
    // Atualiza em tempo real enquanto digita
    input.addEventListener('input', applyChanges);

    // Enter para confirmar e sair do campo
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyChanges();
        input.blur();
      }
      // Escape para cancelar e sair do campo
      if (e.key === 'Escape') {
        updatePanel(); // Restaura valores originais
        input.blur();
      }
    });
  });

  // Subscribe to selection changes
  canvas.onSelectionChange((_info: SelectionInfo) => {
    updatePanel();
  });

  // Subscribe to state changes para atualizar quando elementos são modificados
  store.subscribe(() => {

    if (!isUpdating) {
      // Só atualiza se não estiver editando um input
      const activeElement = document.activeElement;
      const isInputFocused = inputs.some(input => input === activeElement);
      if (!isInputFocused) {
        updatePanel();
      }
    }
  });

  return { updatePanel };
}
