import { useState, useRef, useCallback, useEffect } from "react";

const ASPECT_RATIO = 2 / 3;
const INITIAL_W = 0.8;
const INITIAL_H = INITIAL_W / ASPECT_RATIO;
const INITIAL_CROP = {
  x: (1 - INITIAL_W) / 2,
  y: (1 - INITIAL_H) / 2,
  w: INITIAL_W,
  h: INITIAL_H,
};

function getContainDimensions(imgW, imgH, canvasSize) {
  const imgAspect = imgW / imgH;
  let drawW, drawH;
  if (imgAspect >= 1) {
    drawW = canvasSize;
    drawH = canvasSize / imgAspect;
  } else {
    drawH = canvasSize;
    drawW = canvasSize * imgAspect;
  }
  return { drawW, drawH };
}

export function ImageEditorCanvas({ src, onDone, onCancel, setOpen }) {
  const displayRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(300);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [filter, setFilter] = useState("none");
  const [crop, setCrop] = useState(INITIAL_CROP);
  const dragState = useRef(null);

  // ── Measure container and set canvas size ─────────────────────
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      // Leave room for the toolbar (~56px) and action buttons (~56px)
      const available = Math.min(width - 16, height - 120);
      setCanvasSize(Math.max(200, available));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const drawDisplay = useCallback(() => {
    const canvas = displayRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const isRotated90 = rotation % 180 !== 0;
    const srcW = isRotated90 ? img.naturalHeight : img.naturalWidth;
    const srcH = isRotated90 ? img.naturalWidth : img.naturalHeight;
    const { drawW, drawH } = getContainDimensions(srcW, srcH, canvasSize);

    ctx.save();
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.filter = filter;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const { x, y, w, h } = crop;
    const px = x * canvasSize, py = y * canvasSize;
    const pw = w * canvasSize, ph = h * canvasSize;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvasSize, py);
    ctx.fillRect(0, py + ph, canvasSize, canvasSize - py - ph);
    ctx.fillRect(0, py, px, ph);
    ctx.fillRect(px + pw, py, canvasSize - px - pw, ph);

    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(px + (pw / 3) * i, py);
      ctx.lineTo(px + (pw / 3) * i, py + ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py + (ph / 3) * i);
      ctx.lineTo(px + pw, py + (ph / 3) * i); ctx.stroke();
    }

    const hs = 10;
    ctx.fillStyle = "#6366f1";
    [[px, py], [px + pw - hs, py], [px, py + ph - hs], [px + pw - hs, py + ph - hs]]
      .forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
    ctx.restore();
  }, [rotation, flipH, flipV, filter, crop, canvasSize]);

  useEffect(() => {
    if (!src) return;
    imgRef.current = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; drawDisplay(); };
    img.onerror = (e) => console.error("ImageEditorCanvas failed to load:", src, e);
    img.src = src;
  }, [src]);

  useEffect(() => { if (imgRef.current) drawDisplay(); }, [drawDisplay]);

  const hitTest = (nx, ny) => {
    const { x, y, w, h } = crop;
    const hs = 14 / canvasSize;
    for (const c of [
      { type: "tl", cx: x,     cy: y },
      { type: "tr", cx: x + w, cy: y },
      { type: "bl", cx: x,     cy: y + h },
      { type: "br", cx: x + w, cy: y + h },
    ]) {
      if (Math.abs(nx - c.cx) < hs && Math.abs(ny - c.cy) < hs) return c.type;
    }
    if (nx > x && nx < x + w && ny > y && ny < y + h) return "move";
    return null;
  };

  const normPos = (e) => {
    const rect = displayRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { nx: (clientX - rect.left) / rect.width, ny: (clientY - rect.top) / rect.height };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const { nx, ny } = normPos(e);
    const type = hitTest(nx, ny);
    if (!type) return;
    dragState.current = { type, startX: nx, startY: ny, origCrop: { ...crop } };
  };

  const onPointerMove = (e) => {
    if (!dragState.current) return;
    e.preventDefault();
    const { nx, ny } = normPos(e);
    const ds = dragState.current;
    const dx = nx - ds.startX, dy = ny - ds.startY;
    const o = ds.origCrop;
    const MIN = 0.08;

    setCrop(() => {
      let { x, y, w, h } = o;
      if (ds.type === "move") {
        x = Math.max(0, Math.min(1 - w, o.x + dx));
        y = Math.max(0, Math.min(1 - h, o.y + dy));
      } else {
        if (ds.type === "br") {
          w = Math.max(MIN, o.w + dx); h = w / ASPECT_RATIO;
        } else if (ds.type === "bl") {
          w = Math.max(MIN, o.w - dx); h = w / ASPECT_RATIO;
          x = o.x + o.w - w;
        } else if (ds.type === "tr") {
          w = Math.max(MIN, o.w + dx); h = w / ASPECT_RATIO;
          y = o.y + o.h - h;
        } else if (ds.type === "tl") {
          w = Math.max(MIN, o.w - dx); h = w / ASPECT_RATIO;
          x = o.x + o.w - w; y = o.y + o.h - h;
        }
        x = Math.max(0, x); y = Math.max(0, y);
        if (x + w > 1) { w = 1 - x; h = w / ASPECT_RATIO; }
        if (y + h > 1) { h = 1 - y; w = h * ASPECT_RATIO; }
      }
      return { x, y, w, h };
    });
  };

  const onPointerUp = () => { dragState.current = null; };

  const onMouseMoveForCursor = (e) => {
    const { nx, ny } = normPos(e);
    const t = hitTest(nx, ny);
    const map = { tl: "nwse-resize", tr: "nesw-resize", bl: "nesw-resize", br: "nwse-resize", move: "move" };
    displayRef.current.style.cursor = map[t] || "crosshair";
  };

  const handleDone = () => {
    const img = imgRef.current;
    if (!img) return;
    const OUTPUT_SIZE = Math.max(img.naturalWidth, img.naturalHeight, 1024);
    const isRotated90 = rotation % 180 !== 0;
    const srcW = isRotated90 ? img.naturalHeight : img.naturalWidth;
    const srcH = isRotated90 ? img.naturalWidth : img.naturalHeight;
    const { drawW, drawH } = getContainDimensions(srcW, srcH, OUTPUT_SIZE);

    const out = document.createElement("canvas");
    out.width = out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.filter = filter;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const { x, y, w, h } = crop;
    const cropped = document.createElement("canvas");
    cropped.width = Math.round(w * OUTPUT_SIZE);
    cropped.height = Math.round(h * OUTPUT_SIZE);
    const cCtx = cropped.getContext("2d");
    cCtx.imageSmoothingEnabled = true;
    cCtx.imageSmoothingQuality = "high";
    cCtx.drawImage(out, x * OUTPUT_SIZE, y * OUTPUT_SIZE, w * OUTPUT_SIZE, h * OUTPUT_SIZE, 0, 0, cropped.width, cropped.height);
    cropped.toBlob((blob) => onDone(blob), "image/png");
    setOpen(false);
  };

  const onCancelClick = () => { setOpen(false); onCancel(); };

  return (
    // ── Outer wrapper fills whatever space the Modal.Body gives it ──
    <div ref={containerRef} className="flex flex-col items-center justify-between w-full h-full gap-3 p-2">
      
      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-3 w-full">
        <button onClick={() => setRotation((r) => r - 90)} className="p-2 dark:text-black py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-medium transition">↺</button>
        <button onClick={() => setFlipH((v) => !v)} className={`p-2 dark:text-black py-1.5 rounded-lg text-sm font-medium transition ${flipH ? "bg-indigo-500 text-white" : "bg-slate-200 hover:bg-slate-300"}`}>⇄</button>
        <button onClick={() => setFlipV((v) => !v)} className={`p-2 dark:text-black py-1.5 rounded-lg text-sm font-medium transition ${flipV ? "bg-indigo-500 text-white" : "bg-slate-200 hover:bg-slate-300"}`}>⇅</button>
        <button onClick={() => setCrop(INITIAL_CROP)} className="px-3 dark:text-black py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-medium transition">Reset</button>
      </div>

      {/* Canvas — sized dynamically */}
      <canvas
        ref={displayRef}
        style={{ touchAction: "none", borderRadius: 12, display: "block", flexShrink: 0 }}
        onMouseDown={onPointerDown}
        onMouseMove={(e) => { onPointerMove(e); onMouseMoveForCursor(e); }}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={onCancelClick} className="px-5 py-2 dark:text-white rounded-lg border border-slate-300 text-sm hover:bg-slate-50 transition">Cancel</button>
        <button onClick={handleDone} className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">Save & Exit</button>
      </div>
    </div>
  );
}