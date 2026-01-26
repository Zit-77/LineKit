type Tool = 'select' | 'move' | 'draw' | 'text' | 'shape' | 'arrow';

type ShapeType = 'triangle' | 'square' | 'rectangle' | 'circle' | 'ellipse' | 'diamond' | 'cylinder' | 'pyramid';

type CanvasElement =
    | { type: 'text'; data: TextBlock }
    | { type: 'path'; data: DrawPath }
    | { type: 'shape'; data: Shape }
    | { type: 'arrow'; data: Arrow };

type FontStyle = 'normal' | 'bold' | 'italic';

interface TextBlock {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontStyle: FontStyle;
    color: string;
    rotation: number;
}

interface DrawPath {
    points: { x: number; y: number }[];
    lineWidth: number;
    color: string;
    rotation: number;
    centerX: number;
    centerY: number;
}

interface Shape {
    shapeType: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    rotation: number;
}

interface Arrow {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    lineWidth: number;
}

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'rotate' | null;

const HANDLE_SIZE = 8;
const ROTATE_HANDLE_OFFSET = 24;

export type SelectionInfo = {
    hasText: boolean;
    hasPath: boolean;
    hasShape: boolean;
    hasArrow: boolean;
    count: number;
};

export function Canvas(element: HTMLCanvasElement) {
    const context = element.getContext('2d')!;
    let currentTool: Tool = 'select';

    // Current settings (applied to new elements)
    let currentTextSize = 24;
    let currentTextStyle: FontStyle = 'normal';
    let currentTextColor = '#ffffff';
    let currentStrokeWidth = 4;
    let currentStrokeColor = '#ffffff';
    let currentShapeType: ShapeType = 'rectangle';
    let currentShapeFillColor = 'transparent';
    let currentShapeStrokeColor = '#ffffff';
    let currentShapeStrokeWidth = 2;

    // Selection change callback
    let onSelectionChangeCallback: ((info: SelectionInfo) => void) | null = null;
    let onToolChangeCallback: ((tool: Tool) => void) | null = null;

    // Elements
    const elements: CanvasElement[] = [];

    // Text state
    let activeTextBlock: TextBlock | null = null;

    // Draw state
    let currentPath: DrawPath | null = null;
    let isDrawing = false;

    // Shape state
    let currentShape: Shape | null = null;
    let isCreatingShape = false;
    let shapeStart = { x: 0, y: 0 };

    // Arrow state
    let currentArrow: Arrow | null = null;
    let isCreatingArrow = false;

    // Selection state
    const selectedElements: Set<CanvasElement> = new Set();
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    function notifySelectionChange() {
        if (!onSelectionChangeCallback) return;

        let hasText = false;
        let hasPath = false;
        let hasShape = false;
        let hasArrow = false;

        for (const el of selectedElements) {
            if (el.type === 'text') hasText = true;
            if (el.type === 'path') hasPath = true;
            if (el.type === 'shape') hasShape = true;
            if (el.type === 'arrow') hasArrow = true;
        }

        onSelectionChangeCallback({
            hasText,
            hasPath,
            hasShape,
            hasArrow,
            count: selectedElements.size
        });
    }

    // Resize/rotate state
    let activeHandle: HandleType = null;
    let transformStart = { x: 0, y: 0 };
    let initialSelectionBox: BoundingBox | null = null;
    let initialRotation = 0;
    let selectionRotation = 0;
    let rotationCenter = { x: 0, y: 0 };

    // Marquee selection state
    let isMarqueeSelecting = false;
    let marqueeStart = { x: 0, y: 0 };
    let marqueeEnd = { x: 0, y: 0 };

    // Pan state
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let offset = { x: 0, y: 0 };

    // Zoom state
    let scale = 1;
    const MIN_SCALE = 0.25;
    const MAX_SCALE = 4;

    function resize() {
        element.width = window.innerWidth;
        element.height = window.innerHeight;
        render();
    }

    function render() {
        context.clearRect(0, 0, element.width, element.height);
        context.save();
        context.translate(offset.x, offset.y);
        context.scale(scale, scale);

        // Draw all elements
        for (const el of elements) {
            if (el.type === 'path') {
                drawPath(el.data);
            } else if (el.type === 'text') {
                drawText(el.data);
            } else if (el.type === 'shape') {
                drawShape(el.data);
            } else if (el.type === 'arrow') {
                drawArrow(el.data);
            }
        }

        // Draw current path being drawn
        if (currentPath) {
            drawPath(currentPath);
        }

        // Draw current shape being created
        if (currentShape) {
            drawShape(currentShape);
        }

        // Draw current arrow being created
        if (currentArrow) {
            drawArrow(currentArrow);
        }

        // Draw active text block
        if (activeTextBlock) {
            drawText(activeTextBlock, true);
        }

        // Draw selection UI
        if (selectedElements.size > 0 && !isMarqueeSelecting) {
            drawSelectionUI();
        }

        // Draw marquee selection box
        if (isMarqueeSelecting) {
            drawMarquee();
        }

        context.restore();
    }

    function drawMarquee() {
        const x = Math.min(marqueeStart.x, marqueeEnd.x);
        const y = Math.min(marqueeStart.y, marqueeEnd.y);
        const width = Math.abs(marqueeEnd.x - marqueeStart.x);
        const height = Math.abs(marqueeEnd.y - marqueeStart.y);

        context.fillStyle = 'rgba(59, 130, 246, 0.1)';
        context.fillRect(x, y, width, height);
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 1;
        context.setLineDash([]);
        context.strokeRect(x, y, width, height);
    }

    function getMarqueeBox(): BoundingBox {
        return {
            x: Math.min(marqueeStart.x, marqueeEnd.x),
            y: Math.min(marqueeStart.y, marqueeEnd.y),
            width: Math.abs(marqueeEnd.x - marqueeStart.x),
            height: Math.abs(marqueeEnd.y - marqueeStart.y)
        };
    }

    function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
        return !(
            a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y
        );
    }

    function drawPath(path: DrawPath) {
        if (path.points.length < 2) return;

        context.save();

        if (path.rotation !== 0) {
            context.translate(path.centerX, path.centerY);
            context.rotate(path.rotation);
            context.translate(-path.centerX, -path.centerY);
        }

        context.strokeStyle = path.color;
        context.lineWidth = path.lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            context.lineTo(path.points[i].x, path.points[i].y);
        }
        context.stroke();

        context.restore();
    }

    function drawText(block: TextBlock, showCursor = false) {
        const fontSize = block.fontSize;

        context.save();

        if (block.rotation !== 0) {
            context.translate(block.x, block.y);
            context.rotate(block.rotation);
            context.translate(-block.x, -block.y);
        }

        const fontWeight = block.fontStyle === 'bold' ? 'bold' : 'normal';
        const fontStyleCss = block.fontStyle === 'italic' ? 'italic' : 'normal';
        context.font = `${fontStyleCss} ${fontWeight} ${fontSize}px sans-serif`;
        context.fillStyle = block.color;
        const lines = block.text.split('\n');
        const lineHeight = fontSize * 1.25;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const y = block.y + i * lineHeight;
            context.fillText(line, block.x, y);
            if (showCursor && i === lines.length - 1) {
                const textWidth = context.measureText(line).width;
                context.fillRect(block.x + textWidth + 2, y - fontSize * 0.75, 2, fontSize * 0.9);
            }
        }

        context.restore();
    }

    function drawShape(shape: Shape) {
        const { x, y, width, height, shapeType, fillColor, strokeColor, strokeWidth, rotation } = shape;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const hasFill = fillColor !== 'transparent';

        context.save();

        if (rotation !== 0) {
            context.translate(centerX, centerY);
            context.rotate(rotation);
            context.translate(-centerX, -centerY);
        }

        context.fillStyle = fillColor;
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;

        switch (shapeType) {
            case 'rectangle':
            case 'square':
                context.beginPath();
                context.rect(x, y, width, height);
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();
                break;

            case 'circle':
            case 'ellipse': {
                const radiusX = width / 2;
                const radiusY = height / 2;
                context.beginPath();
                context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();
                break;
            }

            case 'triangle': {
                context.beginPath();
                context.moveTo(centerX, y);
                context.lineTo(x + width, y + height);
                context.lineTo(x, y + height);
                context.closePath();
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();
                break;
            }

            case 'diamond': {
                context.beginPath();
                context.moveTo(centerX, y);
                context.lineTo(x + width, centerY);
                context.lineTo(centerX, y + height);
                context.lineTo(x, centerY);
                context.closePath();
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();
                break;
            }

            case 'cylinder': {
                const ellipseHeight = height * 0.15;
                const bodyHeight = height - ellipseHeight;

                // Draw side
                context.beginPath();
                context.moveTo(x, y + ellipseHeight / 2);
                context.lineTo(x, y + bodyHeight);
                context.ellipse(centerX, y + bodyHeight, width / 2, ellipseHeight / 2, 0, Math.PI, 0, true);
                context.lineTo(x + width, y + ellipseHeight / 2);
                context.ellipse(centerX, y + ellipseHeight / 2, width / 2, ellipseHeight / 2, 0, 0, Math.PI, true);
                context.closePath();
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();

                // Draw top ellipse
                context.beginPath();
                context.ellipse(centerX, y + ellipseHeight / 2, width / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();
                break;
            }

            case 'pyramid': {
                // Draw base (diamond shape viewed from angle)
                const baseY = y + height * 0.7;
                const baseHeight = height * 0.3;
                const apex = { x: centerX, y: y };

                // Front left face
                context.beginPath();
                context.moveTo(apex.x, apex.y);
                context.lineTo(x, baseY + baseHeight / 2);
                context.lineTo(centerX, baseY + baseHeight);
                context.closePath();
                context.fillStyle = fillColor;
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();

                // Front right face
                context.beginPath();
                context.moveTo(apex.x, apex.y);
                context.lineTo(centerX, baseY + baseHeight);
                context.lineTo(x + width, baseY + baseHeight / 2);
                context.closePath();
                context.fillStyle = fillColor;
                if (hasFill) context.fill();
                if (strokeWidth > 0) context.stroke();

                // Right face
                context.beginPath();
                context.moveTo(apex.x, apex.y);
                context.lineTo(x + width, baseY + baseHeight / 2);
                context.lineTo(centerX, baseY);
                context.closePath();
                context.fillStyle = fillColor;
                if (hasFill) {
                    context.globalAlpha = 0.7;
                    context.fill();
                    context.globalAlpha = 1;
                }
                if (strokeWidth > 0) context.stroke();
                break;
            }
        }

        context.restore();
    }

    function drawArrow(arrow: Arrow) {
        const { startX, startY, endX, endY, color, lineWidth } = arrow;

        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = Math.max(lineWidth * 4, 15);

        context.save();
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        // Draw line
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();

        // Draw arrowhead
        context.beginPath();
        context.moveTo(endX, endY);
        context.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        context.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        context.closePath();
        context.fill();

        context.restore();
    }

    function drawSelectionUI() {
        // Use initial box during rotation, otherwise calculate current box
        const box = (selectionRotation !== 0 && initialSelectionBox)
            ? initialSelectionBox
            : getSelectionBoundingBox();
        if (!box) return;

        const padding = 8;
        const width = box.width + padding * 2;
        const height = box.height + padding * 2;

        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(selectionRotation);
        context.translate(-centerX, -centerY);

        const x = box.x - padding;
        const y = box.y - padding;

        // Draw selection rectangle
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 1;
        context.setLineDash([]);
        context.strokeRect(x, y, width, height);

        // Draw corner handles
        context.fillStyle = 'white';
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 1;

        // NW handle
        context.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        context.strokeRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

        // NE handle
        context.fillRect(x + width - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        context.strokeRect(x + width - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

        // SW handle
        context.fillRect(x - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        context.strokeRect(x - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

        // SE handle
        context.fillRect(x + width - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        context.strokeRect(x + width - HANDLE_SIZE / 2, y + height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);

        // Rotate handle (top center)
        const rotateX = x + width / 2;
        const rotateY = y - ROTATE_HANDLE_OFFSET;

        // Line connecting to rotate handle
        context.beginPath();
        context.moveTo(x + width / 2, y);
        context.lineTo(rotateX, rotateY);
        context.stroke();

        // Rotate circle
        context.beginPath();
        context.arc(rotateX, rotateY, HANDLE_SIZE / 2, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.restore();
    }

    function getSelectionBoundingBox(): BoundingBox | null {
        if (selectedElements.size === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const el of selectedElements) {
            const box = getBoundingBox(el);
            if (!box) continue;

            if (box.x < minX) minX = box.x;
            if (box.y < minY) minY = box.y;
            if (box.x + box.width > maxX) maxX = box.x + box.width;
            if (box.y + box.height > maxY) maxY = box.y + box.height;
        }

        if (minX === Infinity) return null;

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    function getBoundingBox(el: CanvasElement): BoundingBox | null {
        if (el.type === 'text') {
            const block = el.data;
            const lines = block.text.split('\n');
            const lineHeight = block.fontSize * 1.25;
            let maxWidth = 0;

            context.font = `${block.fontSize}px sans-serif`;
            for (const line of lines) {
                const width = context.measureText(line).width;
                if (width > maxWidth) maxWidth = width;
            }

            return {
                x: block.x,
                y: block.y - block.fontSize * 0.75,
                width: maxWidth,
                height: lines.length * lineHeight
            };
        } else if (el.type === 'path') {
            const path = el.data;
            if (path.points.length === 0) return null;

            let minX = path.points[0].x;
            let minY = path.points[0].y;
            let maxX = path.points[0].x;
            let maxY = path.points[0].y;

            for (const point of path.points) {
                if (point.x < minX) minX = point.x;
                if (point.y < minY) minY = point.y;
                if (point.x > maxX) maxX = point.x;
                if (point.y > maxY) maxY = point.y;
            }

            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        } else if (el.type === 'shape') {
            const shape = el.data;
            return {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height
            };
        } else if (el.type === 'arrow') {
            const arrow = el.data;
            const minX = Math.min(arrow.startX, arrow.endX);
            const minY = Math.min(arrow.startY, arrow.endY);
            const maxX = Math.max(arrow.startX, arrow.endX);
            const maxY = Math.max(arrow.startY, arrow.endY);
            return {
                x: minX,
                y: minY,
                width: Math.max(maxX - minX, 10),
                height: Math.max(maxY - minY, 10)
            };
        }
        return null;
    }

    function hitTestHandle(point: { x: number; y: number }): HandleType {
        // Use initial box during rotation
        const box = (selectionRotation !== 0 && initialSelectionBox)
            ? initialSelectionBox
            : getSelectionBoundingBox();
        if (!box) return null;

        const padding = 8;
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        // Transform point to unrotated space
        const cos = Math.cos(-selectionRotation);
        const sin = Math.sin(-selectionRotation);
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        const localPoint = {
            x: centerX + dx * cos - dy * sin,
            y: centerY + dx * sin + dy * cos
        };

        const x = box.x - padding;
        const y = box.y - padding;
        const width = box.width + padding * 2;
        const height = box.height + padding * 2;

        // Check rotate handle
        const rotateX = x + width / 2;
        const rotateY = y - ROTATE_HANDLE_OFFSET;
        const distToRotate = Math.sqrt((localPoint.x - rotateX) ** 2 + (localPoint.y - rotateY) ** 2);
        if (distToRotate <= HANDLE_SIZE) return 'rotate';

        // Check corner handles
        const handleHitSize = HANDLE_SIZE + 4;

        if (Math.abs(localPoint.x - x) < handleHitSize && Math.abs(localPoint.y - y) < handleHitSize) return 'nw';
        if (Math.abs(localPoint.x - (x + width)) < handleHitSize && Math.abs(localPoint.y - y) < handleHitSize) return 'ne';
        if (Math.abs(localPoint.x - x) < handleHitSize && Math.abs(localPoint.y - (y + height)) < handleHitSize) return 'sw';
        if (Math.abs(localPoint.x - (x + width)) < handleHitSize && Math.abs(localPoint.y - (y + height)) < handleHitSize) return 'se';

        return null;
    }

    function hitTest(point: { x: number; y: number }): CanvasElement | null {
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            const box = getBoundingBox(el);
            if (!box) continue;

            const padding = 4;
            if (
                point.x >= box.x - padding &&
                point.x <= box.x + box.width + padding &&
                point.y >= box.y - padding &&
                point.y <= box.y + box.height + padding
            ) {
                return el;
            }
        }
        return null;
    }

    function moveElement(el: CanvasElement, dx: number, dy: number) {
        if (el.type === 'text') {
            el.data.x += dx;
            el.data.y += dy;
        } else if (el.type === 'path') {
            for (const point of el.data.points) {
                point.x += dx;
                point.y += dy;
            }
            el.data.centerX += dx;
            el.data.centerY += dy;
        } else if (el.type === 'shape') {
            el.data.x += dx;
            el.data.y += dy;
        } else if (el.type === 'arrow') {
            el.data.startX += dx;
            el.data.startY += dy;
            el.data.endX += dx;
            el.data.endY += dy;
        }
    }

    function scaleElement(el: CanvasElement, scaleX: number, scaleY: number, centerX: number, centerY: number) {
        if (el.type === 'text') {
            // Scale font size
            const scale = Math.max(scaleX, scaleY);
            el.data.fontSize = Math.max(8, el.data.fontSize * scale);

            // Scale position relative to center
            el.data.x = centerX + (el.data.x - centerX) * scaleX;
            el.data.y = centerY + (el.data.y - centerY) * scaleY;
        } else if (el.type === 'path') {
            // Scale line width
            const scale = Math.max(scaleX, scaleY);
            el.data.lineWidth = Math.max(1, el.data.lineWidth * scale);

            // Scale all points relative to center
            for (const point of el.data.points) {
                point.x = centerX + (point.x - centerX) * scaleX;
                point.y = centerY + (point.y - centerY) * scaleY;
            }

            // Update center
            el.data.centerX = centerX + (el.data.centerX - centerX) * scaleX;
            el.data.centerY = centerY + (el.data.centerY - centerY) * scaleY;
        } else if (el.type === 'shape') {
            const shape = el.data;
            const shapeCenterX = shape.x + shape.width / 2;
            const shapeCenterY = shape.y + shape.height / 2;

            // Scale position relative to selection center
            const newCenterX = centerX + (shapeCenterX - centerX) * scaleX;
            const newCenterY = centerY + (shapeCenterY - centerY) * scaleY;

            // Scale dimensions
            shape.width = Math.max(10, shape.width * scaleX);
            shape.height = Math.max(10, shape.height * scaleY);

            // Update position to keep new center
            shape.x = newCenterX - shape.width / 2;
            shape.y = newCenterY - shape.height / 2;
        } else if (el.type === 'arrow') {
            const arrow = el.data;
            arrow.startX = centerX + (arrow.startX - centerX) * scaleX;
            arrow.startY = centerY + (arrow.startY - centerY) * scaleY;
            arrow.endX = centerX + (arrow.endX - centerX) * scaleX;
            arrow.endY = centerY + (arrow.endY - centerY) * scaleY;
        }
    }

    function rotateElement(el: CanvasElement, angle: number, pivotX: number, pivotY: number) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        if (el.type === 'text') {
            // Rotate position around pivot
            const dx = el.data.x - pivotX;
            const dy = el.data.y - pivotY;
            el.data.x = pivotX + dx * cos - dy * sin;
            el.data.y = pivotY + dx * sin + dy * cos;
            // Also rotate the element itself
            el.data.rotation += angle;
        } else if (el.type === 'path') {
            // Rotate all points around pivot
            for (const point of el.data.points) {
                const dx = point.x - pivotX;
                const dy = point.y - pivotY;
                point.x = pivotX + dx * cos - dy * sin;
                point.y = pivotY + dx * sin + dy * cos;
            }
            // Update center
            const cdx = el.data.centerX - pivotX;
            const cdy = el.data.centerY - pivotY;
            el.data.centerX = pivotX + cdx * cos - cdy * sin;
            el.data.centerY = pivotY + cdx * sin + cdy * cos;
        } else if (el.type === 'shape') {
            const shape = el.data;
            const shapeCenterX = shape.x + shape.width / 2;
            const shapeCenterY = shape.y + shape.height / 2;

            // Rotate center around pivot
            const dx = shapeCenterX - pivotX;
            const dy = shapeCenterY - pivotY;
            const newCenterX = pivotX + dx * cos - dy * sin;
            const newCenterY = pivotY + dx * sin + dy * cos;

            shape.x = newCenterX - shape.width / 2;
            shape.y = newCenterY - shape.height / 2;
            shape.rotation += angle;
        } else if (el.type === 'arrow') {
            const arrow = el.data;

            // Rotate start point
            const dx1 = arrow.startX - pivotX;
            const dy1 = arrow.startY - pivotY;
            arrow.startX = pivotX + dx1 * cos - dy1 * sin;
            arrow.startY = pivotY + dx1 * sin + dy1 * cos;

            // Rotate end point
            const dx2 = arrow.endX - pivotX;
            const dy2 = arrow.endY - pivotY;
            arrow.endX = pivotX + dx2 * cos - dy2 * sin;
            arrow.endY = pivotY + dx2 * sin + dy2 * cos;
        }
    }

    function getCanvasPoint(e: MouseEvent) {
        return {
            x: (e.clientX - offset.x) / scale,
            y: (e.clientY - offset.y) / scale
        };
    }

    function handleMouseDown(e: MouseEvent) {
        const point = getCanvasPoint(e);

        if (currentTool === 'select') {
            // First check if clicking on a handle
            if (selectedElements.size > 0) {
                const handle = hitTestHandle(point);
                if (handle) {
                    activeHandle = handle;
                    transformStart = point;
                    initialSelectionBox = getSelectionBoundingBox();

                    if (handle === 'rotate') {
                        rotationCenter = {
                            x: initialSelectionBox!.x + initialSelectionBox!.width / 2,
                            y: initialSelectionBox!.y + initialSelectionBox!.height / 2
                        };
                        initialRotation = Math.atan2(point.y - rotationCenter.y, point.x - rotationCenter.x);
                    }
                    return;
                }
            }

            const hitElement = hitTest(point);

            if (hitElement) {
                if (e.shiftKey) {
                    if (selectedElements.has(hitElement)) {
                        selectedElements.delete(hitElement);
                    } else {
                        selectedElements.add(hitElement);
                    }
                    selectionRotation = 0;
                } else {
                    if (!selectedElements.has(hitElement)) {
                        selectedElements.clear();
                        selectedElements.add(hitElement);
                        selectionRotation = 0;
                    }
                }

                isDragging = true;
                dragStart = point;
                notifySelectionChange();
            } else {
                if (!e.shiftKey) {
                    selectedElements.clear();
                    selectionRotation = 0;
                    notifySelectionChange();
                }
                isMarqueeSelecting = true;
                marqueeStart = point;
                marqueeEnd = point;
            }
            render();
        } else if (currentTool === 'move') {
            isPanning = true;
            panStart = { x: e.clientX - offset.x, y: e.clientY - offset.y };
            element.style.cursor = 'grabbing';
        } else if (currentTool === 'draw') {
            isDrawing = true;
            currentPath = {
                points: [point],
                lineWidth: currentStrokeWidth,
                color: currentStrokeColor,
                rotation: 0,
                centerX: point.x,
                centerY: point.y
            };
        } else if (currentTool === 'text') {
            if (activeTextBlock && activeTextBlock.text.trim()) {
                elements.push({ type: 'text', data: activeTextBlock });
            }
            activeTextBlock = {
                text: '',
                x: point.x,
                y: point.y,
                fontSize: currentTextSize,
                fontStyle: currentTextStyle,
                color: currentTextColor,
                rotation: 0
            };
            render();
        } else if (currentTool === 'shape') {
            isCreatingShape = true;
            shapeStart = point;
            currentShape = {
                shapeType: currentShapeType,
                x: point.x,
                y: point.y,
                width: 0,
                height: 0,
                fillColor: currentShapeFillColor,
                strokeColor: currentShapeStrokeColor,
                strokeWidth: currentShapeStrokeWidth,
                rotation: 0
            };
        } else if (currentTool === 'arrow') {
            isCreatingArrow = true;
            currentArrow = {
                startX: point.x,
                startY: point.y,
                endX: point.x,
                endY: point.y,
                color: currentStrokeColor,
                lineWidth: currentStrokeWidth
            };
        }
    }

    function handleMouseMove(e: MouseEvent) {
        const point = getCanvasPoint(e);

        if (currentTool === 'select') {
            if (activeHandle && initialSelectionBox) {
                const box = initialSelectionBox;
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;

                if (activeHandle === 'rotate') {
                    const currentAngle = Math.atan2(point.y - rotationCenter.y, point.x - rotationCenter.x);
                    const deltaAngle = currentAngle - initialRotation;

                    for (const el of selectedElements) {
                        rotateElement(el, deltaAngle, rotationCenter.x, rotationCenter.y);
                    }
                    selectionRotation += deltaAngle;

                    initialRotation = currentAngle;
                } else {
                    // Resize handles
                    let scaleX = 1;
                    let scaleY = 1;

                    const dx = point.x - transformStart.x;
                    const dy = point.y - transformStart.y;

                    if (activeHandle === 'se') {
                        scaleX = (box.width + dx) / box.width;
                        scaleY = (box.height + dy) / box.height;
                    } else if (activeHandle === 'nw') {
                        scaleX = (box.width - dx) / box.width;
                        scaleY = (box.height - dy) / box.height;
                    } else if (activeHandle === 'ne') {
                        scaleX = (box.width + dx) / box.width;
                        scaleY = (box.height - dy) / box.height;
                    } else if (activeHandle === 'sw') {
                        scaleX = (box.width - dx) / box.width;
                        scaleY = (box.height + dy) / box.height;
                    }

                    // Constrain scale
                    scaleX = Math.max(0.1, scaleX);
                    scaleY = Math.max(0.1, scaleY);

                    for (const el of selectedElements) {
                        scaleElement(el, scaleX, scaleY, centerX, centerY);
                    }

                    transformStart = point;
                    initialSelectionBox = getSelectionBoundingBox();
                }

                render();
            } else if (isMarqueeSelecting) {
                marqueeEnd = point;
                render();
            } else if (isDragging && selectedElements.size > 0) {
                const dx = point.x - dragStart.x;
                const dy = point.y - dragStart.y;

                for (const el of selectedElements) {
                    moveElement(el, dx, dy);
                }

                dragStart = point;
                render();
            } else {
                // Update cursor based on what's under the mouse
                if (selectedElements.size > 0) {
                    const handle = hitTestHandle(point);
                    if (handle === 'rotate') {
                        element.style.cursor = 'grab';
                    } else if (handle) {
                        element.style.cursor = handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize';
                    } else {
                        const hitElement = hitTest(point);
                        element.style.cursor = hitElement ? 'move' : 'crosshair';
                    }
                } else {
                    const hitElement = hitTest(point);
                    element.style.cursor = hitElement ? 'move' : 'crosshair';
                }
            }
        } else if (currentTool === 'move' && isPanning) {
            offset = {
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            };
            render();
        } else if (currentTool === 'draw' && isDrawing && currentPath) {
            currentPath.points.push(point);
            render();
        } else if (currentTool === 'shape' && isCreatingShape && currentShape) {
            const minX = Math.min(shapeStart.x, point.x);
            const minY = Math.min(shapeStart.y, point.y);
            let width = Math.abs(point.x - shapeStart.x);
            let height = Math.abs(point.y - shapeStart.y);

            // For square and circle, make dimensions equal
            if (currentShape.shapeType === 'square' || currentShape.shapeType === 'circle') {
                const size = Math.max(width, height);
                width = size;
                height = size;
            }

            currentShape.x = minX;
            currentShape.y = minY;
            currentShape.width = width;
            currentShape.height = height;
            render();
        } else if (currentTool === 'arrow' && isCreatingArrow && currentArrow) {
            currentArrow.endX = point.x;
            currentArrow.endY = point.y;
            render();
        }
    }

    function handleMouseUp() {
        if (currentTool === 'select') {
            if (activeHandle) {
                // Reset rotation state after transform ends
                // Elements were already rotated, so selection box should be recalculated
                if (activeHandle === 'rotate') {
                    selectionRotation = 0;
                }
                activeHandle = null;
                initialSelectionBox = null;
            } else if (isMarqueeSelecting) {
                const marqueeBox = getMarqueeBox();

                if (marqueeBox.width > 5 || marqueeBox.height > 5) {
                    const hadSelection = selectedElements.size > 0;
                    for (const el of elements) {
                        const elBox = getBoundingBox(el);
                        if (elBox && boxesIntersect(marqueeBox, elBox)) {
                            selectedElements.add(el);
                        }
                    }
                    if (!hadSelection) {
                        selectionRotation = 0;
                    }
                    notifySelectionChange();
                }

                isMarqueeSelecting = false;
                render();
            }
            isDragging = false;
        } else if (currentTool === 'move' && isPanning) {
            isPanning = false;
            element.style.cursor = 'grab';
        } else if (currentTool === 'draw' && isDrawing && currentPath) {
            if (currentPath.points.length > 1) {
                // Calculate center for rotation
                let sumX = 0;
                let sumY = 0;
                for (const p of currentPath.points) {
                    sumX += p.x;
                    sumY += p.y;
                }
                currentPath.centerX = sumX / currentPath.points.length;
                currentPath.centerY = sumY / currentPath.points.length;

                elements.push({ type: 'path', data: currentPath });
            }
            currentPath = null;
            isDrawing = false;
        } else if (currentTool === 'shape' && isCreatingShape && currentShape) {
            if (currentShape.width > 5 && currentShape.height > 5) {
                elements.push({ type: 'shape', data: currentShape });
            }
            currentShape = null;
            isCreatingShape = false;
        } else if (currentTool === 'arrow' && isCreatingArrow && currentArrow) {
            const dx = currentArrow.endX - currentArrow.startX;
            const dy = currentArrow.endY - currentArrow.startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 10) {
                elements.push({ type: 'arrow', data: currentArrow });
            }
            currentArrow = null;
            isCreatingArrow = false;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        // Escape switches to select tool
        if (e.key === 'Escape') {
            if (currentTool === 'text' && activeTextBlock) {
                if (activeTextBlock.text.trim()) {
                    elements.push({ type: 'text', data: activeTextBlock });
                }
                activeTextBlock = null;
            }
            setTool('select');
            if (onToolChangeCallback) {
                onToolChangeCallback('select');
            }
            render();
            return;
        }

        if (currentTool === 'select' && (e.key === 'Delete' || e.key === 'Backspace')) {
            if (selectedElements.size > 0) {
                for (const el of selectedElements) {
                    const index = elements.indexOf(el);
                    if (index > -1) {
                        elements.splice(index, 1);
                    }
                }
                selectedElements.clear();
                notifySelectionChange();
                render();
                return;
            }
        }

        if (currentTool !== 'text' || !activeTextBlock) return;

        if (e.key === 'Enter') {
            activeTextBlock.text += '\n';
        } else if (e.key === 'Backspace') {
            activeTextBlock.text = activeTextBlock.text.slice(0, -1);
        } else if (e.key.length === 1) {
            activeTextBlock.text += e.key;
        }
        render();
    }

    function setTool(tool: Tool) {
        if (activeTextBlock && activeTextBlock.text.trim()) {
            elements.push({ type: 'text', data: activeTextBlock });
        }
        activeTextBlock = null;
        selectedElements.clear();
        selectionRotation = 0;
        notifySelectionChange();

        currentTool = tool;

        if (tool === 'select') {
            element.style.cursor = 'default';
        } else if (tool === 'move') {
            element.style.cursor = 'grab';
        } else if (tool === 'draw') {
            element.style.cursor = 'crosshair';
        } else if (tool === 'text') {
            element.style.cursor = 'text';
        } else if (tool === 'shape') {
            element.style.cursor = 'crosshair';
        } else if (tool === 'arrow') {
            element.style.cursor = 'crosshair';
        }

        render();
    }

    function setTextSize(size: number) {
        currentTextSize = size;

        // Apply to selected text elements
        for (const el of selectedElements) {
            if (el.type === 'text') {
                el.data.fontSize = size;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function setStrokeWidth(width: number) {
        currentStrokeWidth = width;

        // Apply to selected path elements
        for (const el of selectedElements) {
            if (el.type === 'path') {
                el.data.lineWidth = width;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function setTextStyle(style: FontStyle) {
        currentTextStyle = style;

        for (const el of selectedElements) {
            if (el.type === 'text') {
                el.data.fontStyle = style;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function setTextColor(color: string) {
        currentTextColor = color;

        for (const el of selectedElements) {
            if (el.type === 'text') {
                el.data.color = color;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function setStrokeColor(color: string) {
        currentStrokeColor = color;

        for (const el of selectedElements) {
            if (el.type === 'path') {
                el.data.color = color;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function onSelectionChange(callback: (info: SelectionInfo) => void) {
        onSelectionChangeCallback = callback;
    }

    function onToolChange(callback: (tool: Tool) => void) {
        onToolChangeCallback = callback;
    }

    function setShapeType(shapeType: ShapeType) {
        currentShapeType = shapeType;
    }

    function setShapeFillColor(color: string) {
        currentShapeFillColor = color;

        for (const el of selectedElements) {
            if (el.type === 'shape') {
                el.data.fillColor = color;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function setShapeStrokeColor(color: string) {
        currentShapeStrokeColor = color;

        for (const el of selectedElements) {
            if (el.type === 'shape') {
                el.data.strokeColor = color;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function setShapeStrokeWidth(width: number) {
        currentShapeStrokeWidth = width;

        for (const el of selectedElements) {
            if (el.type === 'shape') {
                el.data.strokeWidth = width;
            }
        }
        if (selectedElements.size > 0) {
            render();
        }
    }

    function handleDoubleClick(e: MouseEvent) {
        const point = getCanvasPoint(e);

        if (currentTool === 'select') {
            const hitElement = hitTest(point);

            if (hitElement && hitElement.type === 'text') {
                // Remove from elements array
                const index = elements.indexOf(hitElement);
                if (index > -1) {
                    elements.splice(index, 1);
                }

                // Make it the active text block for editing
                activeTextBlock = hitElement.data;
                selectedElements.clear();
                selectionRotation = 0;
                notifySelectionChange();

                // Switch to text tool
                currentTool = 'text';
                element.style.cursor = 'text';

                render();
            }
        }
    }

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);
    element.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', resize);

    resize();
    setTool('select');

    function zoomIn() {
        const centerX = element.width / 2;
        const centerY = element.height / 2;
        const newScale = Math.min(scale * 1.2, MAX_SCALE);

        // Adjust offset to zoom towards center
        offset.x = centerX - (centerX - offset.x) * (newScale / scale);
        offset.y = centerY - (centerY - offset.y) * (newScale / scale);

        scale = newScale;
        render();
    }

    function zoomOut() {
        const centerX = element.width / 2;
        const centerY = element.height / 2;
        const newScale = Math.max(scale / 1.2, MIN_SCALE);

        // Adjust offset to zoom towards center
        offset.x = centerX - (centerX - offset.x) * (newScale / scale);
        offset.y = centerY - (centerY - offset.y) * (newScale / scale);

        scale = newScale;
        render();
    }

    function resetZoom() {
        scale = 1;
        offset = { x: 0, y: 0 };
        render();
    }

    return {
        setTool,
        setTextSize,
        setStrokeWidth,
        setTextStyle,
        setTextColor,
        setStrokeColor,
        setShapeType,
        setShapeFillColor,
        setShapeStrokeColor,
        setShapeStrokeWidth,
        onSelectionChange,
        onToolChange,
        zoomIn,
        zoomOut,
        resetZoom
    };
}
