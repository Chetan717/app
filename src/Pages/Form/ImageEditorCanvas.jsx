import { useState, useRef, useCallback, useEffect } from "react";

const CANVAS_SIZE = 300; // Logical size (CSS pixels)

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

export function ImageEditorCanvas({ src, onDone, onCancel }) {
    const displayRef = useRef(null);
    const imgRef = useRef(null);

    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [filter, setFilter] = useState("none");
    const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    const dragState = useRef(null);

    const drawDisplay = useCallback(() => {
        const canvas = displayRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        // --- FIX 1: HiDPI / Retina support ---
        const dpr = window.devicePixelRatio || 1;
        canvas.width = CANVAS_SIZE * dpr;
        canvas.height = CANVAS_SIZE * dpr;
        canvas.style.width = `${CANVAS_SIZE}px`;
        canvas.style.height = `${CANVAS_SIZE}px`;

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr); // All drawing below is in logical pixels
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // --- FIX 2: Contain (fit entire image) instead of square crop ---
        const isRotated90 = rotation % 180 !== 0;
        const srcW = isRotated90 ? img.naturalHeight : img.naturalWidth;
        const srcH = isRotated90 ? img.naturalWidth : img.naturalHeight;
        const { drawW, drawH } = getContainDimensions(srcW, srcH, CANVAS_SIZE);

        ctx.save();
        ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.filter = filter;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // --- Crop overlay ---
        const { x, y, w, h } = crop;
        const px = x * CANVAS_SIZE, py = y * CANVAS_SIZE;
        const pw = w * CANVAS_SIZE, ph = h * CANVAS_SIZE;

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_SIZE, py);
        ctx.fillRect(0, py + ph, CANVAS_SIZE, CANVAS_SIZE - py - ph);
        ctx.fillRect(0, py, px, ph);
        ctx.fillRect(px + pw, py, CANVAS_SIZE - px - pw, ph);

        // Border
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        // Rule-of-thirds grid
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 0.8;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(px + (pw / 3) * i, py);
            ctx.lineTo(px + (pw / 3) * i, py + ph); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px, py + (ph / 3) * i);
            ctx.lineTo(px + pw, py + (ph / 3) * i); ctx.stroke();
        }

        // Corner handles
        const hs = 10;
        ctx.fillStyle = "#6366f1";
        [[px, py], [px + pw - hs, py], [px, py + ph - hs], [px + pw - hs, py + ph - hs]]
            .forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
        ctx.restore();
    }, [rotation, flipH, flipV, filter, crop]);

    useEffect(() => {
        if (!src) return; // ← guard against empty src
        imgRef.current = null; // ← clear stale image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imgRef.current = img;
            drawDisplay();
        };
        img.onerror = (e) => console.error("ImageEditorCanvas failed to load:", src, e);
        img.src = src;
    }, [src]);

    useEffect(() => { if (imgRef.current) drawDisplay(); }, [drawDisplay]);

    const hitTest = (nx, ny) => {
        const { x, y, w, h } = crop;
        const hs = 14 / CANVAS_SIZE;
        for (const c of [
            { type: "tl", cx: x, cy: y },
            { type: "tr", cx: x + w, cy: y },
            { type: "bl", cx: x, cy: y + h },
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
        const o = ds.origCrop, MIN = 0.08;
        setCrop(() => {
            let { x, y, w, h } = o;
            if (ds.type === "move") {
                x = Math.max(0, Math.min(1 - w, o.x + dx));
                y = Math.max(0, Math.min(1 - h, o.y + dy));
            } else if (ds.type === "tl") {
                const nx2 = Math.min(o.x + o.w - MIN, o.x + dx);
                const ny2 = Math.min(o.y + o.h - MIN, o.y + dy);
                w = o.w - (nx2 - o.x); h = o.h - (ny2 - o.y); x = nx2; y = ny2;
            } else if (ds.type === "tr") {
                w = Math.max(MIN, o.w + dx);
                const ny2 = Math.min(o.y + o.h - MIN, o.y + dy);
                h = o.h - (ny2 - o.y); y = ny2;
            } else if (ds.type === "bl") {
                const nx2 = Math.min(o.x + o.w - MIN, o.x + dx);
                w = o.w - (nx2 - o.x); x = nx2; h = Math.max(MIN, o.h + dy);
            } else if (ds.type === "br") {
                w = Math.max(MIN, o.w + dx); h = Math.max(MIN, o.h + dy);
            }
            x = Math.max(0, x); y = Math.max(0, y);
            if (x + w > 1) w = 1 - x;
            if (y + h > 1) h = 1 - y;
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
        const img = imgRef.current; if (!img) return;

        // --- FIX 3: High-res output canvas ---
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
        cCtx.drawImage(
            out,
            x * OUTPUT_SIZE, y * OUTPUT_SIZE, w * OUTPUT_SIZE, h * OUTPUT_SIZE,
            0, 0, cropped.width, cropped.height
        );
        cropped.toBlob((blob) => onDone(blob), "image/png");
    };

    return (
        <div className="flex dark:bg-black w-full flex-col items-center gap-4 p-3">
            <div className="relative dark:bg-white rounded-lg select-none p-2">
                <canvas
                    ref={displayRef}
                    style={{ touchAction: "none", borderRadius: 12, display: "block" }}
                    onMouseDown={onPointerDown}
                    onMouseMove={(e) => { onPointerMove(e); onMouseMoveForCursor(e); }}
                    onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
                    onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
                />
                <p className="text-center text-xs text-slate-400 mt-1.5">Drag corners to resize • Drag inside to move</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => setRotation((r) => r - 90)} className="px-3 dark:text-black py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">↺ <span>Rotate</span></button>
                {/* <button onClick={() => setRotation((r) => r + 90)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">↻ +90°</button> */}
                <button onClick={() => setFlipH((v) => !v)} className={`px-3 dark:text-black py-1.5 rounded-lg text-sm font-medium transition ${flipH ? "bg-indigo-500 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>⇄ H</button>
                <button onClick={() => setFlipV((v) => !v)} className={`px-3 dark:text-black py-1.5 rounded-lg text-sm font-medium transition ${flipV ? "bg-indigo-500 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>⇅ V</button>
                <button onClick={() => setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })} className="px-3 dark:text-black py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">↺ Reset</button>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="px-5 py-2 dark:text-white rounded-lg border border-slate-300 text-sm hover:bg-slate-50 transition">Cancel</button>
                <button onClick={handleDone} className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-indigo-700 transition"> Use Cropped Image</button>
            </div>
        </div>
    );
}