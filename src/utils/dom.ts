export function $<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

export function $all<T extends HTMLElement>(selector: string): NodeListOf<T> {
  return document.querySelectorAll<T>(selector);
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  children?: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        el.className = value;
      } else if (key.startsWith('data-')) {
        el.setAttribute(key, value);
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }

  return el;
}

export function addClass(el: HTMLElement, ...classes: string[]) {
  el.classList.add(...classes);
}

export function removeClass(el: HTMLElement, ...classes: string[]) {
  el.classList.remove(...classes);
}

export function toggleClass(el: HTMLElement, className: string, force?: boolean) {
  return el.classList.toggle(className, force);
}

export function hasClass(el: HTMLElement, className: string): boolean {
  return el.classList.contains(className);
}

export function show(el: HTMLElement) {
  el.classList.remove('hidden');
}

export function hide(el: HTMLElement) {
  el.classList.add('hidden');
}

export function isHidden(el: HTMLElement): boolean {
  return el.classList.contains('hidden');
}
