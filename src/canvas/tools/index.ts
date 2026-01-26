export type { BaseTool, ToolContext } from './BaseTool';
export { SelectTool } from './SelectTool';
export { MoveTool } from './MoveTool';
export { DrawTool } from './DrawTool';
export { TextTool } from './TextTool';
export { ShapeTool } from './ShapeTool';
export { ArrowTool } from './ArrowTool';

import type { Tool } from '../../types';
import type { BaseTool } from './BaseTool';
import { SelectTool } from './SelectTool';
import { MoveTool } from './MoveTool';
import { DrawTool } from './DrawTool';
import { TextTool } from './TextTool';
import { ShapeTool } from './ShapeTool';
import { ArrowTool } from './ArrowTool';
import { LineTool } from './LineTools';

export const tools: Record<Tool, BaseTool> = {
  select: SelectTool,
  move: MoveTool,
  draw: DrawTool,
  text: TextTool,
  shape: ShapeTool,
  arrow: ArrowTool,
  line: LineTool
};
