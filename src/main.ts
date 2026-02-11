import { createCanvas } from './canvas';
import { setupMenu, setupToolbar, setupShapePanel, setupSidePanel, setupZoomControls, setupHistoryControls, setupElementInfoPanel } from './components';
import './style.css';

// Create HTML structure
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
      <button id='theme-menu-trigger' class='menu-item menu-item-expandable'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.25M15.54 15.54l4.24 4.25M1 12h6M17 12h6M4.22 19.78l4.24-4.25M15.54 8.46l4.24-4.25"></path>
        </svg>
        <span>Theme</span>
        <svg class='menu-chevron' width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <div id='theme-submenu' class='submenu hidden'>
        <button class='menu-item theme-option' data-theme='dark'>
          Midnight
        </button>
        <button class='menu-item theme-option' data-theme='light'>
          Daylight
        </button>
        <button class='menu-item theme-option' data-theme='blue'>
          Ocean Deep
        </button>
        <button class='menu-item theme-option' data-theme='purple'>
          Cosmic Purple
        </button>
      </div>
    </div>
  </div>
  <div id='toolbar'>
    <button id='reset-canvas' class='tool-btn' title='Reset Canvas'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
    </button>
    <div class='toolbar-separator'></div>
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
    <button id='tool-shape' class='tool-btn' title='Shapes'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      </svg>
    <button id='tool-arrow' class='tool-btn' title='Seta'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </button>
    <button id='tool-line' class='tool-btn' title='Seta'>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
  <div id='shape-panel' class='hidden'>
    <span class='panel-label'>Shapes</span>
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
    <button id='undo-btn' class='disabled' disabled title='Desfazer (Ctrl+Z)'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 10h10a5 5 0 0 1 5 5v2"></path>
        <polyline points="3 10 7 6"></polyline>
        <polyline points="3 10 7 14"></polyline>
      </svg>
    </button>
    <button id='redo-btn' class='disabled' disabled title='Refazer (Ctrl+Y)'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10H11a5 5 0 0 0-5 5v2"></path>
        <polyline points="21 10 17 6"></polyline>
        <polyline points="21 10 17 14"></polyline>
      </svg>
    </button>
    <span class='foot-separator'></span>
    <button id='zoom-out' title='Diminuir zoom'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <button id='zoom-in' title='Aumentar zoom'>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
  <div id='side-panel' class='hidden'>
    <div id='text-options' class='panel-section hidden'>
      <span class='panel-label'>Font</span>
      <div class='font-select-wrapper'>
        <button id='font-trigger' class='font-trigger' style='font-family: Inter, sans-serif'>Inter
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div id='font-dropdown' class='font-dropdown hidden'>
          <button class='font-option active' data-font='Inter, sans-serif' data-label='Inter' style='font-family: Inter, sans-serif'>Inter</button>
          <button class='font-option' data-font='DM Sans, sans-serif' data-label='DM Sans' style='font-family: DM Sans, sans-serif'>DM Sans</button>
          <button class='font-option' data-font='Poppins, sans-serif' data-label='Poppins' style='font-family: Poppins, sans-serif'>Poppins</button>
          <button class='font-option' data-font='Space Grotesk, sans-serif' data-label='Space Grotesk' style='font-family: Space Grotesk, sans-serif'>Space Grotesk</button>
          <button class='font-option' data-font='Sora, sans-serif' data-label='Sora' style='font-family: Sora, sans-serif'>Sora</button>
          <button class='font-option' data-font='Outfit, sans-serif' data-label='Outfit' style='font-family: Outfit, sans-serif'>Outfit</button>
          <button class='font-option' data-font='Raleway, sans-serif' data-label='Raleway' style='font-family: Raleway, sans-serif'>Raleway</button>
          <button class='font-option' data-font='Merriweather, serif' data-label='Merriweather' style='font-family: Merriweather, serif'>Merriweather</button>
          <button class='font-option' data-font='Playfair Display, serif' data-label='Playfair Display' style='font-family: Playfair Display, serif'>Playfair Display</button>
          <button class='font-option' data-font='Abril Fatface, serif' data-label='Abril Fatface' style='font-family: Abril Fatface, serif'>Abril Fatface</button>
          <button class='font-option' data-font='Lobster, cursive' data-label='Lobster' style='font-family: Lobster, cursive'>Lobster</button>
          <button class='font-option' data-font='JetBrains Mono, monospace' data-label='JetBrains Mono' style='font-family: JetBrains Mono, monospace'>JetBrains Mono</button>
          <button class='font-option' data-font='Fira Code, monospace' data-label='Fira Code' style='font-family: Fira Code, monospace'>Fira Code</button>
          <button class='font-option' data-font='Inconsolata, monospace' data-label='Inconsolata' style='font-family: Inconsolata, monospace'>Inconsolata</button>
          <button class='font-option' data-font='Caveat, cursive' data-label='Caveat' style='font-family: Caveat, cursive'>Caveat</button>
          <button class='font-option' data-font='Dancing Script, cursive' data-label='Dancing Script' style='font-family: Dancing Script, cursive'>Dancing Script</button>
          <button class='font-option' data-font='Pacifico, cursive' data-label='Pacifico' style='font-family: Pacifico, cursive'>Pacifico</button>
          <button class='font-option' data-font='Permanent Marker, cursive' data-label='Permanent Marker' style='font-family: Permanent Marker, cursive'>Permanent Marker</button>
          <button class='font-option' data-font='Bebas Neue, sans-serif' data-label='Bebas Neue' style='font-family: Bebas Neue, sans-serif'>Bebas Neue</button>
        </div>
      </div>
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
      <div class='panel-buttons color-palette'>
        <button class='color-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='color-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='color-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='color-btn' data-color='#f97316' style='background-color: #f97316'></button>
        <button class='color-btn' data-color='#eab308' style='background-color: #eab308'></button>
        <button class='color-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='color-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='color-btn' data-color='#8b5cf6' style='background-color: #8b5cf6'></button>
        <button class='color-btn' data-color='#ec4899' style='background-color: #ec4899'></button>
        <input type='color' class='color-picker text-color-picker' value='#ffffff' title='Escolher cor'>
      </div>
      <span class='panel-label'>Opacity</span>
      <div class='opacity-slider-container'>
        <input type='range' class='opacity-slider text-opacity-slider' min='0' max='100' value='100'>
        <span class='opacity-value text-opacity-value'>100%</span>
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
      <div class='panel-buttons color-palette'>
        <button class='stroke-color-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='stroke-color-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='stroke-color-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='stroke-color-btn' data-color='#f97316' style='background-color: #f97316'></button>
        <button class='stroke-color-btn' data-color='#eab308' style='background-color: #eab308'></button>
        <button class='stroke-color-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='stroke-color-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='stroke-color-btn' data-color='#8b5cf6' style='background-color: #8b5cf6'></button>
        <button class='stroke-color-btn' data-color='#ec4899' style='background-color: #ec4899'></button>
        <input type='color' class='color-picker stroke-color-picker' value='#ffffff' title='Escolher cor'>
      </div>
      <span class='panel-label'>Opacity</span>
      <div class='opacity-slider-container'>
        <input type='range' class='opacity-slider stroke-opacity-slider' min='0' max='100' value='100'>
        <span class='opacity-value stroke-opacity-value'>100%</span>
      </div>
    </div>
    <div id='line-options' class='panel-section hidden'>
      <span class='panel-label'>Line width</span>
      <div class='panel-buttons'>
        <button class='line-width-btn' data-width='2'>
          <span class='stroke-preview' style='height: 2px'></span>
        </button>
        <button class='line-width-btn active' data-width='4'>
          <span class='stroke-preview' style='height: 4px'></span>
        </button>
        <button class='line-width-btn' data-width='8'>
          <span class='stroke-preview' style='height: 8px'></span>
        </button>
      </div>
      <span class='panel-label'>Line style</span>
      <div class='panel-buttons'>
        <button class='line-style-btn active' data-style='solid' title='Sólido'>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"></line>
          </svg>
        </button>
        <button class='line-style-btn' data-style='dashed' title='Tracejado'>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"></line>
          </svg>
        </button>
        <button class='line-style-btn' data-style='dotted' title='Pontilhado'>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-dasharray="1 2"></line>
          </svg>
        </button>
      </div>
      <span class='panel-label'>Roughness</span>
      <div class='opacity-slider-container'>
        <input type='range' class='line-roughness-slider' min='0' max='100' value='0'>
        <span class='opacity-value line-roughness-value'>0%</span>
      </div>
      <span class='panel-label'>Color</span>
      <div class='panel-buttons color-palette'>
        <button class='line-color-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='line-color-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='line-color-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='line-color-btn' data-color='#f97316' style='background-color: #f97316'></button>
        <button class='line-color-btn' data-color='#eab308' style='background-color: #eab308'></button>
        <button class='line-color-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='line-color-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='line-color-btn' data-color='#8b5cf6' style='background-color: #8b5cf6'></button>
        <button class='line-color-btn' data-color='#ec4899' style='background-color: #ec4899'></button>
        <input type='color' class='color-picker line-color-picker' value='#ffffff' title='Escolher cor'>
      </div>
      <span class='panel-label'>Opacity</span>
      <div class='opacity-slider-container'>
        <input type='range' class='opacity-slider line-opacity-slider' min='0' max='100' value='100'>
        <span class='opacity-value line-opacity-value'>100%</span>
      </div>
    </div>
    <div id='arrow-options' class='panel-section hidden'>
      <span class='panel-label'>Arrow width</span>
      <div class='panel-buttons'>
        <button class='arrow-width-btn' data-width='2'>
          <span class='stroke-preview' style='height: 2px'></span>
        </button>
        <button class='arrow-width-btn active' data-width='4'>
          <span class='stroke-preview' style='height: 4px'></span>
        </button>
        <button class='arrow-width-btn' data-width='8'>
          <span class='stroke-preview' style='height: 8px'></span>
        </button>
      </div>
      <span class='panel-label'>Arrow style</span>
      <div class='panel-buttons'>
        <button class='arrow-style-btn active' data-style='solid' title='Sólido'>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"></line>
            <polyline points="15 7 20 12 15 17" fill="none" stroke="currentColor" stroke-width="2"></polyline>
          </svg>
        </button>
        <button class='arrow-style-btn' data-style='dashed' title='Tracejado'>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"></line>
            <polyline points="15 7 20 12 15 17" fill="none" stroke="currentColor" stroke-width="2"></polyline>
          </svg>
        </button>
        <button class='arrow-style-btn' data-style='dotted' title='Pontilhado'>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-dasharray="1 2"></line>
            <polyline points="15 7 20 12 15 17" fill="none" stroke="currentColor" stroke-width="2"></polyline>
          </svg>
        </button>
      </div>
      <span class='panel-label'>Roughness</span>
      <div class='opacity-slider-container'>
        <input type='range' class='arrow-roughness-slider' min='0' max='100' value='0'>
        <span class='opacity-value arrow-roughness-value'>0%</span>
      </div>
      <span class='panel-label'>Color</span>
      <div class='panel-buttons color-palette'>
        <button class='arrow-color-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='arrow-color-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='arrow-color-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='arrow-color-btn' data-color='#f97316' style='background-color: #f97316'></button>
        <button class='arrow-color-btn' data-color='#eab308' style='background-color: #eab308'></button>
        <button class='arrow-color-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='arrow-color-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='arrow-color-btn' data-color='#8b5cf6' style='background-color: #8b5cf6'></button>
        <button class='arrow-color-btn' data-color='#ec4899' style='background-color: #ec4899'></button>
        <input type='color' class='color-picker arrow-color-picker' value='#ffffff' title='Escolher cor'>
      </div>
      <span class='panel-label'>Opacity</span>
      <div class='opacity-slider-container'>
        <input type='range' class='opacity-slider arrow-opacity-slider' min='0' max='100' value='100'>
        <span class='opacity-value arrow-opacity-value'>100%</span>
      </div>
    </div>
    <div id='shape-options' class='panel-section hidden'>
      <span class='panel-label'>Fill color (Shape)</span>
      <div class='panel-buttons color-palette'>
        <button class='shape-fill-btn active' data-color='transparent' title='Sem preenchimento' style='background: linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px; background-color: #333;'></button>
        <button class='shape-fill-btn' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='shape-fill-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='shape-fill-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='shape-fill-btn' data-color='#f97316' style='background-color: #f97316'></button>
        <button class='shape-fill-btn' data-color='#eab308' style='background-color: #eab308'></button>
        <button class='shape-fill-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='shape-fill-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='shape-fill-btn' data-color='#8b5cf6' style='background-color: #8b5cf6'></button>
        <button class='shape-fill-btn' data-color='#ec4899' style='background-color: #ec4899'></button>
        <input type='color' class='color-picker shape-fill-picker' value='#3b82f6' title='Escolher cor'>
      </div>
      <span class='panel-label'>Fill opacity (Shape)</span>
      <div class='opacity-slider-container'>
        <input type='range' class='opacity-slider shape-fill-opacity-slider' min='0' max='100' value='100'>
        <span class='opacity-value shape-fill-opacity-value'>100%</span>
      </div>
      <span class='panel-label'>Stroke color (Shape)</span>
      <div class='panel-buttons color-palette'>
        <button class='shape-stroke-btn' data-color='transparent' title='Sem borda' style='background: linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px; background-color: #333;'></button>
        <button class='shape-stroke-btn active' data-color='#ffffff' style='background-color: #ffffff'></button>
        <button class='shape-stroke-btn' data-color='#000000' style='background-color: #000000'></button>
        <button class='shape-stroke-btn' data-color='#ef4444' style='background-color: #ef4444'></button>
        <button class='shape-stroke-btn' data-color='#f97316' style='background-color: #f97316'></button>
        <button class='shape-stroke-btn' data-color='#eab308' style='background-color: #eab308'></button>
        <button class='shape-stroke-btn' data-color='#22c55e' style='background-color: #22c55e'></button>
        <button class='shape-stroke-btn' data-color='#3b82f6' style='background-color: #3b82f6'></button>
        <button class='shape-stroke-btn' data-color='#8b5cf6' style='background-color: #8b5cf6'></button>
        <button class='shape-stroke-btn' data-color='#ec4899' style='background-color: #ec4899'></button>
        <input type='color' class='color-picker shape-stroke-picker' value='#ffffff' title='Escolher cor'>
      </div>
      <span class='panel-label'>Stroke opacity (Shape)</span>
      <div class='opacity-slider-container'>
        <input type='range' class='opacity-slider shape-stroke-opacity-slider' min='0' max='100' value='100'>
        <span class='opacity-value shape-stroke-opacity-value'>100%</span>
      </div>
      <span class='panel-label'>Stroke width (Shape)</span>
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
      <span class='panel-label'>Border radius</span>
      <div class='panel-buttons'>
        <button class='shape-radius-btn active' data-radius='0' title='Sem arredondamento'>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16"></rect>
          </svg>
        </button>
        <button class='shape-radius-btn' data-radius='8' title='Pouco arredondado'>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="4"></rect>
          </svg>
        </button>
        <button class='shape-radius-btn' data-radius='16' title='Arredondado'>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="8"></rect>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <div id='element-info-panel' class='hidden'>
    <div class='info-header'>
      <span class='info-title'>Element</span>
      <span id='element-type' class='info-badge'>-</span>
    </div>
    <div class='info-section'>
      <span class='info-label'>Position</span>
      <div class='info-row'>
        <div class='info-field'>
          <label>X</label>
          <input type='number' id='element-x' class='info-input' />
        </div>
        <div class='info-field'>
          <label>Y</label>
          <input type='number' id='element-y' class='info-input' />
        </div>
      </div>
    </div>
    <div class='info-section'>
      <span class='info-label'>Size</span>
      <div class='info-row'>
        <div class='info-field'>
          <label>W</label>
          <input type='number' id='element-width' class='info-input' />
        </div>
        <div class='info-field'>
          <label>H</label>
          <input type='number' id='element-height' class='info-input' />
        </div>
      </div>
    </div>
    <div class='info-section'>
      <span class='info-label'>Rotation</span>
      <div class='info-row'>
        <div class='info-field full'>
          <input type='number' id='element-rotation' class='info-input' />
          <span class='info-unit'>°</span>
        </div>
      </div>
    </div>
    <div class='info-section' id='element-stroke-section'>
      <span class='info-label'>Stroke</span>
      <div class='info-row'>
        <div class='info-field full'>
          <label>Width</label>
          <input type='number' id='element-stroke-width' class='info-input' step='0.5' />
        </div>
      </div>
    </div>
  </div>
`;

// Initialize canvas
const canvasElement = document.querySelector<HTMLCanvasElement>('#canvas')!;
const canvas = createCanvas(canvasElement);

// Setup UI components
setupMenu();
setupToolbar(canvas);
setupShapePanel(canvas);
setupSidePanel(canvas);
setupZoomControls(canvas);
setupHistoryControls(canvas);
setupElementInfoPanel(canvas);
