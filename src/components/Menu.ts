import { $ } from '../utils/dom';
import { store } from '../state';
import type { CanvasElement } from '../types';

function invertColor(color: string): string {
  // Converte cores white/black e variações
  const c = color.toLowerCase().trim();

  if (c === '#ffffff' || c === '#fff' || c === 'white' || c === 'rgb(255, 255, 255)') {
    return '#000000';
  }
  if (c === '#000000' || c === '#000' || c === 'black' || c === 'rgb(0, 0, 0)') {
    return '#ffffff';
  }

  // Mantém outras cores
  return color;
}

function invertElementColors(element: CanvasElement): void {
  switch (element.type) {
    case 'text':
      element.data.color = invertColor(element.data.color);
      break;
    case 'path':
      element.data.color = invertColor(element.data.color);
      break;
    case 'shape':
      element.data.fillColor = invertColor(element.data.fillColor);
      element.data.strokeColor = invertColor(element.data.strokeColor);
      break;
    case 'arrow':
    case 'line':
      element.data.color = invertColor(element.data.color);
      break;
  }
}

export function setupMenu() {
  const menuBtn = $<HTMLButtonElement>('#menu-btn')!;
  const menuDropdown = $<HTMLDivElement>('#menu-dropdown')!;
  const themeMenuTrigger = $<HTMLButtonElement>('#theme-menu-trigger')!;
  const themeSubmenu = $<HTMLDivElement>('#theme-submenu')!;
  const themeOptions = document.querySelectorAll<HTMLButtonElement>('.theme-option');

  menuBtn.addEventListener('click', (e) => {
    console.log("click menu options");
    e.stopPropagation();
    menuDropdown.classList.toggle('hidden');
    themeSubmenu.classList.add('hidden');
    themeMenuTrigger.classList.remove('expanded');
  });

  // Submenu toggle
  themeMenuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    themeSubmenu.classList.toggle('hidden');
    themeMenuTrigger.classList.toggle('expanded');
  });

  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target as Node) && !menuDropdown.contains(e.target as Node)) {
      menuDropdown.classList.add('hidden');
      themeSubmenu.classList.add('hidden');
      themeMenuTrigger.classList.remove('expanded');
    }
  });

  // Theme functionality
  const applyTheme = (theme: string) => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('light-theme', 'blue-theme', 'purple-theme');

    // Add new theme class (except for dark which is default)
    if (theme !== 'dark') {
      root.classList.add(`${theme}-theme`);
    }

    // Update active state
    themeOptions.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    // Save theme
    localStorage.setItem('theme', theme);
  };

  const shouldInvertColors = (fromTheme: string, toTheme: string): boolean => {
    const lightThemes = ['light'];

    const fromLight = lightThemes.includes(fromTheme);
    const toLight = lightThemes.includes(toTheme);

    return fromLight !== toLight;
  };

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  let currentTheme = savedTheme;

  // Add click handlers to theme options
  themeOptions.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newTheme = btn.dataset.theme!;
      const state = store.getState();

      // Inverte as cores dos elementos se mudar entre light/dark
      if (shouldInvertColors(currentTheme, newTheme)) {
        state.elements.forEach(element => {
          invertElementColors(element);
        });
      }

      // Aplica o novo tema
      applyTheme(newTheme);
      currentTheme = newTheme;

      // Notifica mudanças para forçar re-render
      store.notify();

      // Fecha menus
      themeSubmenu.classList.add('hidden');
      themeMenuTrigger.classList.remove('expanded');
      menuDropdown.classList.add('hidden');
    });
  });

  return {
    open: () => menuDropdown.classList.remove('hidden'),
    close: () => menuDropdown.classList.add('hidden'),
    toggle: () => menuDropdown.classList.toggle('hidden'),
  };
}
