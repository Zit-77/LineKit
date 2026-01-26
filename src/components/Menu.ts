import { $ } from '../utils/dom';

export function setupMenu() {
  const menuBtn = $<HTMLButtonElement>('#menu-btn')!;
  const menuDropdown = $<HTMLDivElement>('#menu-dropdown')!;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target as Node) && !menuDropdown.contains(e.target as Node)) {
      menuDropdown.classList.add('hidden');
    }
  });

  return {
    open: () => menuDropdown.classList.remove('hidden'),
    close: () => menuDropdown.classList.add('hidden'),
    toggle: () => menuDropdown.classList.toggle('hidden'),
  };
}
