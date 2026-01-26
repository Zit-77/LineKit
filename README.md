# G-Draw

Aplicação de desenho em canvas com arquitetura modular.

## Estrutura do Projeto

```
src/
├── main.ts                     # Entry point
├── style.css                   # Estilos globais
├── constants.ts                # Constantes da aplicação
├── types/                      # Tipos TypeScript centralizados
├── state/                      # Gerenciamento de estado
├── canvas/                     # Core do canvas
│   └── tools/                  # Ferramentas de desenho
├── components/                 # Componentes de UI
└── utils/                      # Utilitários
```

## Arquitetura

### 1. Types (`src/types/index.ts`)

Todos os tipos TypeScript centralizados em um único lugar:

```typescript
// Tipos de ferramentas
type Tool = 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow';
type ShapeType = 'triangle' | 'square' | 'rectangle' | 'circle' | ...;

// Tipos de elementos
interface TextBlock { text, x, y, fontSize, fontStyle, color, rotation }
interface DrawPath { points, lineWidth, color, rotation, centerX, centerY }
interface Shape { shapeType, x, y, width, height, fillColor, strokeColor, ... }
interface Arrow { startX, startY, endX, endY, color, lineWidth }

// União de todos os elementos do canvas
type CanvasElement =
  | { type: 'text'; data: TextBlock }
  | { type: 'path'; data: DrawPath }
  | { type: 'shape'; data: Shape }
  | { type: 'arrow'; data: Arrow };
```

### 2. Constants (`src/constants.ts`)

Valores constantes usados em toda a aplicação:

```typescript
// Handles de seleção
export const HANDLE_SIZE = 8;
export const ROTATE_HANDLE_OFFSET = 24;

// Zoom
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_FACTOR = 1.2;

// Configurações padrão
export const DEFAULT_TEXT_SIZE = 24;
export const DEFAULT_STROKE_WIDTH = 4;
// ...
```

### 3. State Management (`src/state/`)

Gerenciamento de estado centralizado usando padrão pub/sub:

#### `store.ts` - Estado Global

```typescript
// O store mantém todo o estado da aplicação
const state = {
  elements: [],              // Elementos no canvas
  selectedElements: Set(),   // Elementos selecionados
  currentTool: 'select',     // Ferramenta ativa
  offset: { x: 0, y: 0 },    // Pan do canvas
  scale: 1,                  // Zoom
  // ... configurações de ferramentas
};

// Sistema de subscriptions
store.subscribe(listener);           // Notificado em qualquer mudança
store.subscribeToSelection(listener); // Notificado em mudanças de seleção
store.subscribeToTool(listener);      // Notificado em mudanças de ferramenta
```

#### `actions.ts` - Modificação do Estado

Todas as modificações de estado passam por actions:

```typescript
// Elementos
addElement(element);
removeElement(element);
removeSelectedElements();

// Seleção
selectElement(element, addToSelection?);
deselectElement(element);
clearSelection();

// Ferramentas
setTool(tool);
setTextSize(size);
setStrokeColor(color);
// ...

// View
zoomIn(centerX, centerY);
zoomOut(centerX, centerY);
setOffset(point);
```

#### `selectors.ts` - Leitura do Estado

Funções para ler estado derivado:

```typescript
getElements();
getSelectedElements();
getCurrentTool();
getSelectionInfo();  // { hasText, hasPath, hasShape, hasArrow, count }
getMarqueeBox();
// ...
```

### 4. Canvas (`src/canvas/`)

#### `Canvas.ts` - Classe Principal

Orquestra renderização, eventos e ferramentas:

```typescript
const canvas = createCanvas(canvasElement);

// Retorna API pública
canvas.setTool('draw');
canvas.setTextSize(24);
canvas.zoomIn();
canvas.onSelectionChange((info) => { ... });
canvas.onToolChange((tool) => { ... });
```

#### `renderer.ts` - Funções de Renderização

Funções puras para desenhar elementos:

```typescript
drawPath(ctx, path);
drawText(ctx, textBlock, showCursor?);
drawShape(ctx, shape);
drawArrow(ctx, arrow);
drawSelectionUI(ctx, boundingBox, rotation);
drawMarquee(ctx, startX, startY, endX, endY);
```

#### `tools/` - Sistema de Ferramentas

Cada ferramenta implementa a interface `BaseTool`:

```typescript
interface BaseTool {
  name: string;
  cursor: string;

  onActivate?(context): void;
  onDeactivate?(context): void;
  onMouseDown?(e, point, context): void;
  onMouseMove?(e, point, context): void;
  onMouseUp?(e, point, context): void;
  onDoubleClick?(e, point, context): void;
  onKeyDown?(e, context): void;
}
```

**Ferramentas disponíveis:**

| Ferramenta | Arquivo | Descrição |
|------------|---------|-----------|
| Select | `SelectTool.ts` | Seleção, arraste, resize e rotação |
| Move | `MoveTool.ts` | Pan do canvas |
| Draw | `DrawTool.ts` | Desenho livre |
| Text | `TextTool.ts` | Inserção de texto |
| Shape | `ShapeTool.ts` | Formas geométricas |
| Arrow | `ArrowTool.ts` | Setas |

**Exemplo de ferramenta:**

```typescript
// DrawTool.ts
export const DrawTool: BaseTool = {
  name: 'draw',
  cursor: 'crosshair',

  onActivate(context) {
    context.canvas.style.cursor = 'crosshair';
  },

  onMouseDown(_e, point, _context) {
    actions.setIsDrawing(true);
    actions.setCurrentPath({
      points: [point],
      lineWidth: state.strokeWidth,
      color: state.strokeColor,
      // ...
    });
  },

  onMouseMove(_e, point, context) {
    if (state.isDrawing && state.currentPath) {
      state.currentPath.points.push(point);
      context.render();
    }
  },

  onMouseUp() {
    actions.commitCurrentPath();
  },
};
```

### 5. Components (`src/components/`)

Componentes de UI que conectam ao canvas:

```typescript
// Toolbar.ts - Barra de ferramentas
setupToolbar(canvas);

// ShapePanel.ts - Painel de formas
setupShapePanel(canvas);

// SidePanel.ts - Painel lateral com opções
setupSidePanel(canvas);

// ZoomControls.ts - Controles de zoom
setupZoomControls(canvas);
```

Cada componente:
1. Configura event listeners nos elementos DOM
2. Chama métodos do canvas quando o usuário interage
3. Se inscreve em mudanças de estado para atualizar a UI

### 6. Utils (`src/utils/`)

#### `geometry.ts` - Cálculos Geométricos

```typescript
getBoundingBox(element, ctx);           // Bounding box de um elemento
getSelectionBoundingBox(elements, ctx); // Bounding box da seleção
boxesIntersect(a, b);                   // Teste de interseção
hitTest(point, elements, ctx);          // Encontra elemento sob o cursor
hitTestHandle(point, box, rotation);    // Testa handles de seleção
getCanvasPoint(event, offset, scale);   // Converte coordenadas de tela
```

#### `transform.ts` - Transformações

```typescript
moveElement(element, dx, dy);
scaleElement(element, scaleX, scaleY, centerX, centerY);
rotateElement(element, angle, pivotX, pivotY);
```

#### `dom.ts` - Helpers DOM

```typescript
$(selector);        // querySelector com tipo
$all(selector);     // querySelectorAll
show(element);      // Remove classe 'hidden'
hide(element);      // Adiciona classe 'hidden'
// ...
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        User Input                           │
│                    (mouse, keyboard)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Canvas.ts                              │
│              (Event handlers, coordinates)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Active Tool                              │
│        (SelectTool, DrawTool, TextTool, etc.)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Actions                                │
│           (addElement, setTool, zoomIn, etc.)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Store                                 │
│                   (State + notify)                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Canvas       │ │    Toolbar      │ │   SidePanel     │
│   (render)      │ │   (update UI)   │ │   (update UI)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Como Adicionar uma Nova Ferramenta

1. Crie o arquivo em `src/canvas/tools/NovaTool.ts`:

```typescript
import type { BaseTool, ToolContext } from './BaseTool';
import type { Point } from '../../types';
import { store } from '../../state/store';
import * as actions from '../../state/actions';

export const NovaTool: BaseTool = {
  name: 'nova',
  cursor: 'crosshair',

  onActivate(context) {
    context.canvas.style.cursor = this.cursor;
  },

  onMouseDown(_e, point, context) {
    // Lógica ao pressionar mouse
  },

  onMouseMove(_e, point, context) {
    // Lógica ao mover mouse
  },

  onMouseUp(_e, _point, _context) {
    // Lógica ao soltar mouse
  },
};
```

2. Exporte em `src/canvas/tools/index.ts`:

```typescript
export { NovaTool } from './NovaTool';

export const tools: Record<Tool, BaseTool> = {
  // ...
  nova: NovaTool,
};
```

3. Adicione o tipo em `src/types/index.ts`:

```typescript
export type Tool = 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow' | 'nova';
```

4. Adicione o botão na toolbar em `src/main.ts`.

## Scripts

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run preview # Preview do build
```
