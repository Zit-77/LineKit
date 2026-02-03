import type { Line } from '../../types';
import type { ElementHandler } from '../types';
import { moveLinear, scaleLinear, rotateLinear, getLinearBoundingBox } from './lineBase';

export const lineHandler: ElementHandler<Line> = {
  move: moveLinear,
  scale: scaleLinear,
  rotate: rotateLinear,
  getBoundingBox: (data) => getLinearBoundingBox(data),
};
