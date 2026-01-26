import { Canvas, type SelectionInfo } from './components/canvas'
import './style.css'


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id='canvas'></canvas>
  <div id='header'>
    <button id='menu-btn'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <div id='menu-dropdown' class='hidden'>
      <button class='menu-item' id='export-btn'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>Export image</span>
      </button>
      <button class='menu-item' id='save-btn'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Save</span>
      </button>
      <button class='menu-item' id='clear-btn'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Clear</span>
      </button>
    </div>
  </div>
  <div id='toolbar'>
    <button id='tool-select' class='tool-btn active' title='Selecionar'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
        <path d="M13 13l6 6"></path>
      </svg>
    </button>
    <button id='tool-move' class='tool-btn' title='Mover'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
      </svg>
    </button>
    <button id='tool-draw' class='tool-btn' title='Desenhar'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 10-3-3z"></path>
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"></path>
        <path d="M14.5 17.5L4.5 15"></path>
      </svg>
    </button>
    <button id='tool-text' class='tool-btn' title='Texto'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
      </svg>
    </button>
    <button id='tool-shape' class='tool-btn' title='Formas'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      </svg>
    </button>
    <button id='tool-arrow' class='tool-btn' title='Seta'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </button>
  </div>
  <div id='shape-panel' class='hidden'>
    <span class='panel-label'>Formas</span>
    <div class='shape-grid'>
      <button class='shape-item active' data-shape='rectangle' title='Retângulo'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="5" width="18" height="14"></rect>
        </svg>
      </button>
      <button class='shape-item' data-shape='square' title='Quadrado'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16"></rect>
        </svg>
      </button>
      <button class='shape-item' data-shape='circle' title='Círculo'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"></circle>
        </svg>
      </button>
      <button class='shape-item' data-shape='ellipse' title='Elipse'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="12" cy="12" rx="10" ry="6"></ellipse>
        </svg>
      </button>
      <button class='shape-item' data-shape='triangle' title='Triângulo'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3L22 21H2L12 3z"></path>
        </svg>
      </button>
      <button class='shape-item' data-shape='diamond' title='Losango'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L22 12L12 22L2 12L12 2z"></path>
        </svg>
      </button>
      <button class='shape-item' data-shape='cylinder' title='Cilindro'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="12" cy="5" rx="8" ry="3"></ellipse>
          <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"></path>
        </svg>
      </button>
      <button class='shape-item' data-shape='pyramid' title='Pirâmide'>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 22h20L12 2z"></path>
          <path d="M12 2L12 22"></path>
          <path d="M12 2L22 22"></path>
        </svg>
      </button>
    </div>
  </div>
  <div id='foot'>
    <button id='zoom-out'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <button id='zoom-in'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
  <div id='side-panel' class='hidden'>
    <div id='text-options' class='panel-section hidden'>
      <span class='panel-label'>Font size</span>
      <div class='panel-buttons'>
        <button class='size-btn' data-size='16'>S</button>
        <button class='size-btn active' data-size='24'>M</button>
        <button class='size-btn' data-size='36'>L</button>
        <button class='size-btn' data-size='48'>XL</button>
      </div>
      <span class='panel-label'>Style</span>
      <div class='panel-buttons'>
        <button class='style-btn active' data-style='normal'>N</button>
        <button class='style-btn' data-style='bold'>B</button>
        <button class='style-btn' data-style='italic'>I</button>
      </div>
      <span class='panel-label'>Color</span>
      <div class='panel-buttons'>
        <button class='color-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='color-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='color-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
      </div>
    </div>
    <div id='stroke-options' class='panel-section hidden'>
      <span class='panel-label'>Stroke width</span>
      <div class='panel-buttons'>
        <button class='stroke-btn' data-width='2'>
          <span class='stroke-preview' style='height: 2px'></span>
        </button>
        <button class='stroke-btn active' data-width='4'>
          <span class='stroke-preview' style='height: 4px'></span>
        </button>
        <button class='stroke-btn' data-width='8'>
          <span class='stroke-preview' style='height: 8px'></span>
        </button>
      </div>
      <span class='panel-label'>Color</span>
      <div class='panel-buttons'>
        <button class='stroke-color-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='stroke-color-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='stroke-color-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
      </div>
    </div>
    <div id='shape-options' class='panel-section hidden'>
      <span class='panel-label'>Fill color</span>
      <div class='panel-buttons'>
        <button class='shape-fill-btn active' data-color='transparent' title='Sem preenchimento' style='background: linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px; background-color: #333;'></button>
        <button class='shape-fill-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='shape-fill-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='shape-fill-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='shape-fill-btn' data-color='#eab308' style='background-color: #eab308'></button>
      </div>
      <span class='panel-label'>Stroke color</span>
      <div class='panel-buttons'>
        <button class='shape-stroke-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='shape-stroke-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='shape-stroke-btn' data-color='transparent' style='background: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px;'></button>
      </div>
      <span class='panel-label'>Stroke width</span>
      <div class='panel-buttons'>
        <button class='shape-width-btn' data-width='0'>
          <span style='font-size: 10px'>0</span>
        </button>
        <button class='shape-width-btn active' data-width='2'>
          <span class='stroke-preview' style='height: 2px'></span>
        </button>
        <button class='shape-width-btn' data-width='4'>
          <span class='stroke-preview' style='height: 4px'></span>
        </button>
      </div>
    </div>
  </div>
`

const canvas = Canvas(document.querySelector<HTMLCanvasElement>('#canvas')!);

const menuBtn = document.querySelector<HTMLButtonElement>('#menu-btn')!;
const menuDropdown = document.querySelector<HTMLDivElement>('#menu-dropdown')!;

menuBtn.addEventListener('click', () => {
  menuDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  if (!menuBtn.contains(e.target as Node) && !menuDropdown.contains(e.target as Node)) {
    menuDropdown.classList.add('hidden');
  }
});

// Toolbar
const toolButtons = document.querySelectorAll<HTMLButtonElement>('.tool-btn');
const sidePanel = document.querySelector<HTMLDivElement>('#side-panel')!;
const textOptions = document.querySelector<HTMLDivElement>('#text-options')!;
const strokeOptions = document.querySelector<HTMLDivElement>('#stroke-options')!;
const shapeOptions = document.querySelector<HTMLDivElement>('#shape-options')!;
const shapePanel = document.querySelector<HTMLDivElement>('#shape-panel')!;

let currentSelection: SelectionInfo = { hasText: false, hasPath: false, hasShape: false, hasArrow: false, count: 0 };
let currentToolState = 'select';

function updateSidePanel() {
  const tool = currentToolState;
  const selection = currentSelection;

  // Show panel if tool is text/draw/shape/arrow OR if elements are selected
  const showTextOptions = tool === 'text' || selection.hasText;
  const showStrokeOptions = tool === 'draw' || tool === 'arrow' || selection.hasPath || selection.hasArrow;
  const showShapeOptions = tool === 'shape' || selection.hasShape;

  if (showTextOptions || showStrokeOptions || showShapeOptions) {
    sidePanel.classList.remove('hidden');

    if (showTextOptions) {
      textOptions.classList.remove('hidden');
    } else {
      textOptions.classList.add('hidden');
    }

    if (showStrokeOptions) {
      strokeOptions.classList.remove('hidden');
    } else {
      strokeOptions.classList.add('hidden');
    }

    if (showShapeOptions) {
      shapeOptions.classList.remove('hidden');
    } else {
      shapeOptions.classList.add('hidden');
    }
  } else {
    sidePanel.classList.add('hidden');
    textOptions.classList.add('hidden');
    strokeOptions.classList.add('hidden');
    shapeOptions.classList.add('hidden');
  }
}

toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    toolButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tool = btn.id.replace('tool-', '') as 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow';
    canvas.setTool(tool);
    currentToolState = tool;
    updateSidePanel();
    updateShapePanel();
  });
});

// Shape panel handling
const shapeItems = document.querySelectorAll<HTMLButtonElement>('.shape-item');
shapeItems.forEach(item => {
  item.addEventListener('click', () => {
    shapeItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const shapeType = item.dataset.shape as 'triangle' | 'square' | 'rectangle' | 'circle' | 'ellipse' | 'diamond' | 'cylinder' | 'pyramid';
    canvas.setShapeType(shapeType);
  });
});

function updateShapePanel() {
  if (currentToolState === 'shape') {
    shapePanel.classList.remove('hidden');
  } else {
    shapePanel.classList.add('hidden');
  }
}

// Listen for selection changes
canvas.onSelectionChange((info) => {
  currentSelection = info;
  updateSidePanel();
});

// Font size buttons
const sizeButtons = document.querySelectorAll<HTMLButtonElement>('.size-btn');
sizeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sizeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const size = parseInt(btn.dataset.size || '24');
    canvas.setTextSize(size);
  });
});

// Stroke width buttons
const strokeButtons = document.querySelectorAll<HTMLButtonElement>('.stroke-btn');
strokeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    strokeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const width = parseInt(btn.dataset.width || '4');
    canvas.setStrokeWidth(width);
  });
});

// Text style buttons
const styleButtons = document.querySelectorAll<HTMLButtonElement>('.style-btn');
styleButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    styleButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const style = btn.dataset.style || 'normal';
    canvas.setTextStyle(style as 'normal' | 'bold' | 'italic');
  });
});

// Text color buttons
const colorButtons = document.querySelectorAll<HTMLButtonElement>('.color-btn');
colorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    colorButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const color = btn.dataset.color || '#ffffff';
    canvas.setTextColor(color);
  });
});

// Stroke color buttons
const strokeColorButtons = document.querySelectorAll<HTMLButtonElement>('.stroke-color-btn');
strokeColorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    strokeColorButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const color = btn.dataset.color || '#ffffff';
    canvas.setStrokeColor(color);
  });
});

// Shape fill color buttons
const shapeFillButtons = document.querySelectorAll<HTMLButtonElement>('.shape-fill-btn');
shapeFillButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    shapeFillButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const color = btn.dataset.color || '#3b82f6';
    canvas.setShapeFillColor(color);
  });
});

// Shape stroke color buttons
const shapeStrokeButtons = document.querySelectorAll<HTMLButtonElement>('.shape-stroke-btn');
shapeStrokeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    shapeStrokeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const color = btn.dataset.color || '#ffffff';
    canvas.setShapeStrokeColor(color);
  });
});

// Shape stroke width buttons
const shapeWidthButtons = document.querySelectorAll<HTMLButtonElement>('.shape-width-btn');
shapeWidthButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    shapeWidthButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const width = parseInt(btn.dataset.width || '2');
    canvas.setShapeStrokeWidth(width);
  });
});

// Zoom buttons
const zoomInBtn = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn = document.querySelector<HTMLButtonElement>('#zoom-out')!;

zoomInBtn.addEventListener('click', () => {
  canvas.zoomIn();
});

zoomOutBtn.addEventListener('click', () => {
  canvas.zoomOut();
});
