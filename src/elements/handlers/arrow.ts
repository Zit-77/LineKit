import type { Arrow, BoundingBox } from '../../types';
import type { ElementHandler } from '../types';
import { moveLinear, scaleLinear, rotateLinear, getLinearBoundingBox } from './lineBase';

export const arrowHandler: ElementHandler<Arrow> = {
  move: moveLinear,
  scale: scaleLinear,
  rotate: rotateLinear,
  getBoundingBox(data): BoundingBox {
    // Arrow needs extra padding for the arrowhead
    const headLength = Math.max(data.lineWidth * 5, 20);
    const extraPadding = headLength * 0.8 - 6; // Compensate base padding
    return getLinearBoundingBox(data, Math.max(0, extraPadding));
  },
};
