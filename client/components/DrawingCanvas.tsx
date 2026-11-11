'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { StrokeOp } from '../lib/types';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  RotateCcw,
  Trash2
} from 'lucide-react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PALETTE = [
  '#000000', '#FFFFFF', '#6B7280', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#78350F', '#831843', '#14532D', '#1E3A8A'
];

const BRUSH_SIZES = [
  { label: 'S', size: 2 },
  { label: 'M', size: 6 },
  { label: 'L', size: 12 },
  { label: 'XL', size: 24 }
];

interface DrawingCanvasProps {
  socket: Socket | null;
  isDrawer: boolean;
  onClear?: () => void;
  className?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  socket,
  isDrawer,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tools state
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(6);

  // Local drawing tracking
  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef<string | null>(null);
  const localPointsRef = useRef<[number, number][]>([]);
  const pendingBatchRef = useRef<[number, number][]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stroke history for re-rendering on undo/replay
  const historyRef = useRef<StrokeOp[]>([]);

  // --- Canvas Rendering Helpers ---
  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    return canvasRef.current?.getContext('2d', { willReadFrequently: true }) || null;
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [getContext]);

  // Render a stroke segment onto the 800x600 canvas
  const renderStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: [number, number][],
      color: string,
      size: number,
      tool: 'brush' | 'eraser' = 'brush'
    ) => {
      if (points.length === 0) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = size;

      if (points.length === 1) {
        // Single dot
        const [x0, y0] = points[0];
        ctx.beginPath();
        ctx.arc(x0 * CANVAS_WIDTH, y0 * CANVAS_HEIGHT, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : color;
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.beginPath();
      const p0 = points[0];
      ctx.moveTo(p0[0] * CANVAS_WIDTH, p0[1] * CANVAS_HEIGHT);

      for (let i = 1; i < points.length; i++) {
        const pPrev = points[i - 1];
        const pCurr = points[i];
        const midX = ((pPrev[0] + pCurr[0]) / 2) * CANVAS_WIDTH;
        const midY = ((pPrev[1] + pCurr[1]) / 2) * CANVAS_HEIGHT;
        ctx.quadraticCurveTo(
          pPrev[0] * CANVAS_WIDTH,
          pPrev[1] * CANVAS_HEIGHT,
          midX,
          midY
        );
      }

      const pLast = points[points.length - 1];
      ctx.lineTo(pLast[0] * CANVAS_WIDTH, pLast[1] * CANVAS_HEIGHT);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  // Deterministic Flood Fill
  const executeFloodFill = useCallback(
    (normalizedX: number, normalizedY: number, fillColorHex: string) => {
      const ctx = getContext();
      if (!ctx) return;

      const startX = Math.floor(normalizedX * CANVAS_WIDTH);
      const startY = Math.floor(normalizedY * CANVAS_HEIGHT);

      if (startX < 0 || startX >= CANVAS_WIDTH || startY < 0 || startY >= CANVAS_HEIGHT) return;

      const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const data = imgData.data;

      // Hex to RGBA
      const r = parseInt(fillColorHex.slice(1, 3), 16);
      const g = parseInt(fillColorHex.slice(3, 5), 16);
      const b = parseInt(fillColorHex.slice(5, 7), 16);
      const a = 255;

      const startIdx = (startY * CANVAS_WIDTH + startX) * 4;
      const targetR = data[startIdx];
      const targetG = data[startIdx + 1];
      const targetB = data[startIdx + 2];
      const targetA = data[startIdx + 3];

      // If already target color within small tolerance, return
      const colorTolerance = 28;
      const colorMatches = (idx: number) => {
        const dr = Math.abs(data[idx] - targetR);
        const dg = Math.abs(data[idx + 1] - targetG);
        const db = Math.abs(data[idx + 2] - targetB);
        const da = Math.abs(data[idx + 3] - targetA);
        return dr <= colorTolerance && dg <= colorTolerance && db <= colorTolerance && da <= colorTolerance;
      };

      if (
        Math.abs(targetR - r) <= 5 &&
        Math.abs(targetG - g) <= 5 &&
        Math.abs(targetB - b) <= 5 &&
        Math.abs(targetA - a) <= 5
      ) {
        return;
      }

      // Scanline BFS flood fill
      const queue: [number, number][] = [[startX, startY]];
      const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        const cIdx = (cy * CANVAS_WIDTH + cx) * 4;
        const vIdx = cy * CANVAS_WIDTH + cx;

        if (visited[vIdx]) continue;
        if (!colorMatches(cIdx)) continue;

        visited[vIdx] = 1;
        data[cIdx] = r;
        data[cIdx + 1] = g;
        data[cIdx + 2] = b;
        data[cIdx + 3] = a;

        if (cx > 0 && !visited[vIdx - 1]) queue.push([cx - 1, cy]);
        if (cx < CANVAS_WIDTH - 1 && !visited[vIdx + 1]) queue.push([cx + 1, cy]);
        if (cy > 0 && !visited[vIdx - CANVAS_WIDTH]) queue.push([cx, cy - 1]);
        if (cy < CANVAS_HEIGHT - 1 && !visited[vIdx + CANVAS_WIDTH]) queue.push([cx, cy + 1]);
      }

      ctx.putImageData(imgData, 0, 0);
    },
    [getContext]
  );

  // Redraw entire history from scratch (used for undo / late join replay)
  const redrawAll = useCallback(
    (ops: StrokeOp[]) => {
      clearCanvas();
      const ctx = getContext();
      if (!ctx) return;

      for (const op of ops) {
        if (op.type === 'stroke' && op.points) {
          renderStroke(
            ctx,
            op.points,
            op.color || '#000000',
            op.size || 6,
            op.tool || 'brush'
          );
        } else if (op.type === 'fill' && op.x !== undefined && op.y !== undefined) {
          executeFloodFill(op.x, op.y, op.color);
        }
      }
    },
    [clearCanvas, getContext, renderStroke, executeFloodFill]
  );

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket) return;

    const handleDrawStroke = (data: {
      strokeId: string;
      tool: 'brush' | 'eraser';
      color: string;
      size: number;
      points: [number, number][];
      isStart: boolean;
      isEnd: boolean;
    }) => {
      const ctx = getContext();
      if (!ctx) return;

      renderStroke(ctx, data.points, data.color, data.size, data.tool);

      // Save into history
      const lastOp = historyRef.current[historyRef.current.length - 1];
      if (lastOp && lastOp.type === 'stroke' && lastOp.opId === data.strokeId && !data.isStart) {
        if (lastOp.points) lastOp.points.push(...data.points);
      } else {
        historyRef.current.push({
          opId: data.strokeId,
          type: 'stroke',
          tool: data.tool,
          color: data.color,
          size: data.size,
          points: [...data.points]
        });
      }
    };

    const handleFill = (data: { opId: string; x: number; y: number; color: string }) => {
      executeFloodFill(data.x, data.y, data.color);
      historyRef.current.push({
        opId: data.opId,
        type: 'fill',
        x: data.x,
        y: data.y,
        color: data.color
      });
    };

    const handleUndo = () => {
      historyRef.current.pop();
      redrawAll(historyRef.current);
    };

    const handleClear = () => {
      historyRef.current = [];
      clearCanvas();
    };

    const handleHistory = (data: { history: StrokeOp[] }) => {
      historyRef.current = data.history || [];
      redrawAll(historyRef.current);
    };

    socket.on('canvas:draw_stroke', handleDrawStroke);
    socket.on('canvas:fill', handleFill);
    socket.on('canvas:undo', handleUndo);
    socket.on('canvas:clear', handleClear);
    socket.on('canvas:history', handleHistory);

    return () => {
      socket.off('canvas:draw_stroke', handleDrawStroke);
      socket.off('canvas:fill', handleFill);
      socket.off('canvas:undo', handleUndo);
      socket.off('canvas:clear', handleClear);
      socket.off('canvas:history', handleHistory);
    };
  }, [socket, getContext, renderStroke, executeFloodFill, redrawAll, clearCanvas]);

  // Initial clear on mount
  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  // Send batched stroke segments over socket
  const flushStrokeBatch = useCallback(
    (isEnd: boolean = false) => {
      if (!socket || !isDrawer || pendingBatchRef.current.length === 0 || !currentStrokeIdRef.current) return;

      const pointsToSend = [...pendingBatchRef.current];
      pendingBatchRef.current = [];

      socket.emit('canvas:draw_stroke', {
        strokeId: currentStrokeIdRef.current,
        tool: activeTool === 'eraser' ? 'eraser' : 'brush',
        color: currentColor,
        size: brushSize,
        points: pointsToSend,
        isStart: localPointsRef.current.length === pointsToSend.length,
        isEnd
      });
    },
    [socket, isDrawer, activeTool, currentColor, brushSize]
  );

  // --- Pointer Event Handlers for Drawer ---
  const getNormalizedCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return [
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y))
    ];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const coords = getNormalizedCoordinates(e);
    if (!coords) return;

    const [nx, ny] = coords;

    if (activeTool === 'fill') {
      const opId = `fill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      executeFloodFill(nx, ny, currentColor);
      historyRef.current.push({
        opId,
        type: 'fill',
        x: nx,
        y: ny,
        color: currentColor
      });
      if (socket) {
        socket.emit('canvas:fill', { opId, x: nx, y: ny, color: currentColor });
      }
      return;
    }

    // Brush or Eraser
    isDrawingRef.current = true;
    const strokeId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    currentStrokeIdRef.current = strokeId;
    localPointsRef.current = [coords];
    pendingBatchRef.current = [coords];

    const ctx = getContext();
    if (ctx) {
      renderStroke(
        ctx,
        [coords],
        currentColor,
        brushSize,
        activeTool === 'eraser' ? 'eraser' : 'brush'
      );
    }

    // Start 30ms throttle timer for socket flushing
    batchTimerRef.current = setInterval(() => {
      flushStrokeBatch(false);
    }, 30);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current || activeTool === 'fill') return;
    const coords = getNormalizedCoordinates(e);
    if (!coords) return;

    localPointsRef.current.push(coords);
    pendingBatchRef.current.push(coords);

    const ctx = getContext();
    if (ctx && localPointsRef.current.length >= 2) {
      // Render smooth line segment
      const pts = localPointsRef.current.slice(-3);
      renderStroke(
        ctx,
        pts,
        currentColor,
        brushSize,
        activeTool === 'eraser' ? 'eraser' : 'brush'
      );
    }
  };

  const finishDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    flushStrokeBatch(true);

    if (currentStrokeIdRef.current && localPointsRef.current.length > 0) {
      historyRef.current.push({
        opId: currentStrokeIdRef.current,
        type: 'stroke',
        tool: activeTool === 'eraser' ? 'eraser' : 'brush',
        color: currentColor,
        size: brushSize,
        points: [...localPointsRef.current]
      });
    }

    currentStrokeIdRef.current = null;
    localPointsRef.current = [];
    pendingBatchRef.current = [];
  };

  const handleUndoClick = () => {
    if (!isDrawer || !socket) return;
    socket.emit('canvas:undo');
  };

  const handleClearClick = () => {
    if (!isDrawer || !socket) return;
    socket.emit('canvas:clear');
  };

  return (
    <div className={`flex flex-col items-center w-full select-none ${className}`}>
      {/* Canvas Container with fixed aspect ratio 4:3 (800x600) */}
      <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerLeave={finishDrawing}
          className={`w-full h-full block ${
            isDrawer
              ? activeTool === 'fill'
                ? 'cursor-cell'
                : activeTool === 'eraser'
                ? 'cursor-crosshair'
                : 'cursor-crosshair'
              : 'pointer-events-none cursor-default'
          }`}
          style={{ touchAction: 'none' }}
        />

        {/* Read-only overlay watermark for guessers */}
        {!isDrawer && (
          <div className="absolute bottom-3 right-3 pointer-events-none opacity-40 text-xs font-semibold uppercase tracking-widest text-slate-500 bg-white/70 px-2 py-1 rounded backdrop-blur-sm">
            Live View
          </div>
        )}
      </div>

      {/* Drawer Control Toolbar */}
      {isDrawer && (
        <div className="w-full max-w-[800px] mt-3 bg-slate-900 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Tool select: Brush, Eraser, Fill */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTool('brush')}
              title="Brush Tool"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeTool === 'brush'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Paintbrush className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              title="Eraser Tool"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('fill')}
              title="Bucket Fill Tool"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeTool === 'fill'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PaintBucket className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Brush Sizes */}
          {activeTool !== 'fill' && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.size}
                  type="button"
                  onClick={() => setBrushSize(b.size)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    brushSize === b.size
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div
                    className="rounded-full bg-current"
                    style={{
                      width: Math.min(18, Math.max(4, b.size * 0.7)),
                      height: Math.min(18, Math.max(4, b.size * 0.7))
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Color Palette (16 colors + custom picker) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="grid grid-cols-8 sm:grid-cols-8 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCurrentColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                    currentColor.toLowerCase() === color.toLowerCase()
                      ? 'scale-120 ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900'
                      : 'hover:scale-110 opacity-90'
                  }`}
                  style={{
                    backgroundColor: color,
                    border: color === '#FFFFFF' ? '1px solid #475569' : undefined
                  }}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <label
              title="Custom Color"
              className="relative w-8 h-8 rounded-xl overflow-hidden cursor-pointer border border-slate-700 bg-slate-950 flex items-center justify-center hover:border-indigo-500"
            >
              <div
                className="w-5 h-5 rounded-md shadow-inner"
                style={{ backgroundColor: currentColor }}
              />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Undo and Clear actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndoClick}
              title="Undo Last Action"
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              type="button"
              onClick={handleClearClick}
              title="Clear Canvas"
              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-900/50 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

