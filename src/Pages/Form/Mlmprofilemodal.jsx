import { useState, useRef, useCallback, useEffect } from "react";
import { Modal, Button } from "@heroui/react";

// ── Firebase ──────────────────────────────────────────────────
import { db, app } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage(app);

// ════════════════════════════════════════════════════════════
// REMOVE.BG — rotates through keys on 402 / 429
// ════════════════════════════════════════════════════════════
export const REMOVE_BG_API_KEYS = [
  "t5JR6JsNU1D1N4QHMZjCfSLN",
  "YOUR_KEY_2",
  "YOUR_KEY_3",
];

export async function removeBackground(file) {
  for (const key of REMOVE_BG_API_KEYS) {
    const fd = new FormData();
    fd.append("image_file", file);
    fd.append("size", "auto");
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": key },
      body: fd,
    });
    if (res.ok) return await res.blob();
    if (res.status !== 402 && res.status !== 429) {
      console.warn("remove.bg error", res.status);
      return null;
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════
// IMAGE EDITOR — used ONLY for Profile Photo
// Freehand crop (drag corners / drag inside) + Rotate + Mirror + Filters
// ════════════════════════════════════════════════════════════
export function ImageEditorCanvas({ src, onDone, onCancel }) {
  const displayRef = useRef(null);
  const imgRef     = useRef(null);

  const [rotation, setRotation] = useState(0);
  const [flipH,    setFlipH]    = useState(false);
  const [flipV,    setFlipV]    = useState(false);
  const [filter,   setFilter]   = useState("none");
  const [crop,     setCrop]     = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const dragState  = useRef(null);
  const CANVAS_SIZE = 320;

  const FILTERS = [
    { label: "None",      value: "none" },
    { label: "Grayscale", value: "grayscale(100%)" },
    { label: "Sepia",     value: "sepia(80%)" },
    { label: "Warm",      value: "sepia(40%) saturate(150%)" },
    { label: "Cool",      value: "hue-rotate(200deg) saturate(120%)" },
    { label: "Vivid",     value: "saturate(200%) contrast(110%)" },
    { label: "Fade",      value: "opacity(70%) brightness(110%)" },
  ];

  const drawDisplay = useCallback(() => {
    const canvas = displayRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // draw transformed image
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.filter = filter;
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();

    // crop overlay
    const { x, y, w, h } = crop;
    const px = x * CANVAS_SIZE, py = y * CANVAS_SIZE;
    const pw = w * CANVAS_SIZE, ph = h * CANVAS_SIZE;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, CANVAS_SIZE, py);
    ctx.fillRect(0, py + ph, CANVAS_SIZE, CANVAS_SIZE - py - ph);
    ctx.fillRect(0, py, px, ph);
    ctx.fillRect(px + pw, py, CANVAS_SIZE - px - pw, ph);

    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth   = 2;
    ctx.strokeRect(px, py, pw, ph);

    // rule-of-thirds
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth   = 0.8;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(px + (pw / 3) * i, py);
      ctx.lineTo(px + (pw / 3) * i, py + ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py + (ph / 3) * i);
      ctx.lineTo(px + pw, py + (ph / 3) * i); ctx.stroke();
    }

    // corner handles
    const hs = 10;
    ctx.fillStyle = "#6366f1";
    [[px, py], [px + pw - hs, py], [px, py + ph - hs], [px + pw - hs, py + ph - hs]]
      .forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
    ctx.restore();
  }, [rotation, flipH, flipV, filter, crop]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; drawDisplay(); };
    img.src = src;
  }, [src]);

  useEffect(() => { if (imgRef.current) drawDisplay(); }, [drawDisplay]);

  const hitTest = (nx, ny) => {
    const { x, y, w, h } = crop;
    const hs = 12 / CANVAS_SIZE;
    for (const c of [
      { type: "tl", cx: x,     cy: y     },
      { type: "tr", cx: x + w, cy: y     },
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
    const o  = ds.origCrop, MIN = 0.08;
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
    const out = document.createElement("canvas");
    out.width = out.height = CANVAS_SIZE;
    const ctx = out.getContext("2d");
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.filter = filter;
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
    const { x, y, w, h } = crop;
    const cropped = document.createElement("canvas");
    cropped.width = w * CANVAS_SIZE; cropped.height = h * CANVAS_SIZE;
    cropped.getContext("2d").drawImage(out, x * CANVAS_SIZE, y * CANVAS_SIZE, w * CANVAS_SIZE, h * CANVAS_SIZE, 0, 0, w * CANVAS_SIZE, h * CANVAS_SIZE);
    cropped.toBlob((blob) => onDone(blob), "image/png");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative select-none">
        <canvas
          ref={displayRef}
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: "none", borderRadius: 12, display: "block" }}
          onMouseDown={onPointerDown}
          onMouseMove={(e) => { onPointerMove(e); onMouseMoveForCursor(e); }}
          onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
        />
        <p className="text-center text-xs text-slate-400 mt-1.5">Drag corners to resize • Drag inside to move</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => setRotation((r) => r - 90)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">↺ −90°</button>
        <button onClick={() => setRotation((r) => r + 90)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">↻ +90°</button>
        <button onClick={() => setFlipH((v) => !v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${flipH ? "bg-indigo-500 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>⇄ Flip H</button>
        <button onClick={() => setFlipV((v) => !v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${flipV ? "bg-indigo-500 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>⇅ Flip V</button>
        <button onClick={() => setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">↺ Reset</button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition border ${filter === f.value ? "bg-indigo-500 text-white border-indigo-500" : "bg-white border-slate-300 hover:border-indigo-400"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="px-5 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50 transition">Cancel</button>
        <button onClick={handleDone} className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">✂️ Use Cropped Image</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REUSABLE: SimpleImagePicker  (no editor — just upload + preview)
// ════════════════════════════════════════════════════════════
function SimpleImagePicker({ previewURL, onFileSelect, inputRef, buttonLabel = "Upload image", previewClass }) {
  return (
    <div className="flex items-center gap-4">
      {previewURL ? (
        <img src={previewURL} alt="Preview" className={previewClass} />
      ) : (
        <div className="h-16 w-24 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
          No image
        </div>
      )}
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition">
          {buttonLabel}
        </button>
        {previewURL && (
          <button type="button" onClick={() => onFileSelect(null)}
            className="px-4 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition">
            ✕ Remove
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ""; }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SOCIAL ICONS — inline SVG
// ════════════════════════════════════════════════════════════
const SocialIcon = ({ name, active }) => {
  const icons = {
    Facebook: (
      <svg viewBox="0 0 24 24" fill={active ? "#fff" : "#1877F2"} className="w-6 h-6">
        <path d="M22 12a10 10 0 1 0-11.56 9.87V14.89h-2.9V12h2.9v-1.8c0-2.87 1.7-4.45 4.32-4.45 1.25 0 2.56.22 2.56.22v2.82h-1.44c-1.42 0-1.86.88-1.86 1.79V12h3.17l-.5 2.89h-2.67v6.98A10 10 0 0 0 22 12z" />
      </svg>
    ),
    Instagram: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={active ? "#fff" : "#f09433"} />
            <stop offset="50%"  stopColor={active ? "#fff" : "#e6683c"} />
            <stop offset="100%" stopColor={active ? "#fff" : "#bc1888"} />
          </linearGradient>
        </defs>
        <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.82.679-1.382.896-.422.164-1.057.36-2.227.413-1.265.058-1.645.07-4.85.07s-3.584-.012-4.849-.07c-1.17-.053-1.805-.249-2.227-.413a3.7 3.7 0 0 1-1.381-.896 3.7 3.7 0 0 1-.896-1.382c-.164-.422-.36-1.057-.413-2.227C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.849c.053-1.17.249-1.805.413-2.227a3.7 3.7 0 0 1 .896-1.382 3.7 3.7 0 0 1 1.381-.896c.422-.164 1.057-.36 2.227-.413C8.416 2.175 8.796 2.163 12 2.163zM12 0C8.741 0 8.332.014 7.052.072c-1.28.058-2.155.261-2.918.558a5.9 5.9 0 0 0-2.126 1.384A5.9 5.9 0 0 0 .63 4.134C.333 4.897.13 5.772.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.058 1.28.261 2.155.558 2.918a5.9 5.9 0 0 0 1.384 2.126 5.9 5.9 0 0 0 2.126 1.384c.763.297 1.638.5 2.918.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.28-.058 2.155-.261 2.918-.558a5.9 5.9 0 0 0 2.126-1.384 5.9 5.9 0 0 0 1.384-2.126c.297-.763.5-1.638.558-2.918.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.058-1.28-.261-2.155-.558-2.918a5.9 5.9 0 0 0-1.384-2.126A5.9 5.9 0 0 0 19.866.63C19.103.333 18.228.13 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    Youtube: (
      <svg viewBox="0 0 24 24" fill={active ? "#fff" : "#FF0000"} className="w-6 h-6">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
    X: (
      <svg viewBox="0 0 24 24" fill={active ? "#fff" : "#000"} className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.125 2.25H8.06l4.264 5.633 5.92-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const SOCIAL_PLATFORMS = ["Facebook", "Instagram", "Youtube", "X"];

const initialForm = () => ({
  // 0 ▸ Logo
  logoType:            "company",  // "company" | "custom"
  logoSelected:        "",         // link from company logos[]
  logoCustomFile:      null,
  logoCustomURL:       null,
  // 1 ▸ Identity
  salutation:          "Mr",
  name:                "",
  mobile:              "",
  designation:         "",
  // 2 ▸ Profile photo
  profileImageBlob:    null,
  profileImageURL:     null,
  // 3 ▸ Topup line
  topuplineType:       "company",  // "company" | "custom"
  topuplineSelected:   "",
  topuplineCustomFile: null,
  topuplineCustomURL:  null,
  // 4 ▸ Socials
  socials:             { Facebook: "", Instagram: "", Youtube: "", X: "" },
  socialSameId:        "",
  socialSameSelected:  [],
});

export default function MLMProfileModal({ triggerLabel = "Create MLM Profile" }) {
  const [open,        setOpen]        = useState(false);
  const [form,        setForm]        = useState(initialForm());
  const [errors,      setErrors]      = useState({});
  const [step,        setStep]        = useState("form"); // "form" | "editor"
  const [editorSrc,   setEditorSrc]   = useState(null);
  const [removingBg,  setRemovingBg]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const profileInputRef = useRef(null);
  const logoInputRef    = useRef(null);
  const topupInputRef   = useRef(null);

  // ── Read localStorage once ────────────────────────────────
  const company = (() => {
    try { return JSON.parse(localStorage.getItem("selectedCompany") || "{}"); }
    catch { return {}; }
  })();

  const logos      = Array.isArray(company?.logos)      ? company.logos      : [];
  const topuplines = Array.isArray(company?.topuplines) ? company.topuplines : [];
  const designations = Array.isArray(company?.designation)
    ? company.designation
    : typeof company?.designation === "string" && company.designation
      ? [company.designation] : [];

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Logo file pick (no editor) ────────────────────────────
  const handleLogoFileSelect = (file) => {
    if (!file) {
      setForm((f) => ({ ...f, logoCustomFile: null, logoCustomURL: null }));
      return;
    }
    setForm((f) => ({ ...f, logoCustomFile: file, logoCustomURL: URL.createObjectURL(file) }));
  };

  // ── Profile photo: remove bg → editor ────────────────────
  const handleProfileFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemovingBg(true);
    try {
      const noGbBlob = await removeBackground(file);
      const blob = noGbBlob || file;
      setEditorSrc(URL.createObjectURL(blob));
      setStep("editor");
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingBg(false);
      e.target.value = "";
    }
  };

  const handleEditorDone = (blob) => {
    setForm((f) => ({ ...f, profileImageBlob: blob, profileImageURL: URL.createObjectURL(blob) }));
    setStep("form");
    setEditorSrc(null);
  };

  // ── Topupline file pick (no editor) ──────────────────────
  const handleTopupFileSelect = (file) => {
    if (!file) {
      setForm((f) => ({ ...f, topuplineCustomFile: null, topuplineCustomURL: null }));
      return;
    }
    setForm((f) => ({ ...f, topuplineCustomFile: file, topuplineCustomURL: URL.createObjectURL(file) }));
  };

  // ── Social same-id ────────────────────────────────────────
  const handleSocialSameToggle = (platform) => {
    setForm((f) => {
      const sel = f.socialSameSelected.includes(platform)
        ? f.socialSameSelected.filter((p) => p !== platform)
        : [...f.socialSameSelected, platform];
      const socials = { ...f.socials };
      sel.forEach((p) => (socials[p] = f.socialSameId));
      return { ...f, socialSameSelected: sel, socials };
    });
  };

  const handleSocialSameIdChange = (val) => {
    setForm((f) => {
      const socials = { ...f.socials };
      f.socialSameSelected.forEach((p) => (socials[p] = val));
      return { ...f, socialSameId: val, socials };
    });
  };

  // ── Validation ────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name = "Name is required";
    if (!form.mobile.trim())  e.mobile = "Mobile number is required";
    else if (!/^\d{10,15}$/.test(form.mobile.replace(/\s/g, "")))
      e.mobile = "Enter a valid mobile number";
    if (!form.designation)    e.designation = "Select a designation";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Firebase storage upload ───────────────────────────────
  const uploadFile = async (file, path) => {
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  };

  const uploadBlob = async (blob, path) => {
    const r = storageRef(storage, path);
    await uploadBytes(r, blob);
    return getDownloadURL(r);
  };

  // ── Save to Firestore ─────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const uid = Date.now().toString(36);

      // Logo
      const logoURL =
        form.logoType === "custom" && form.logoCustomFile
          ? await uploadFile(form.logoCustomFile, `mlmprofiles/${uid}/logo.png`)
          : form.logoType === "company" ? form.logoSelected : null;

      // Profile photo
      const profileImgURL = form.profileImageBlob
        ? await uploadBlob(form.profileImageBlob, `mlmprofiles/${uid}/profile.png`)
        : null;

      // Topupline
      const topupImgURL =
        form.topuplineType === "custom" && form.topuplineCustomFile
          ? await uploadFile(form.topuplineCustomFile, `mlmprofiles/${uid}/topupline.png`)
          : form.topuplineType === "company" ? form.topuplineSelected : null;

      await addDoc(collection(db, "mlmprofiles"), {
        fullName:          `${form.salutation}.${form.name.trim()}`,
        mobile:            form.mobile.trim(),
        designation:       form.designation,
        logoURL,
        profileImageURL:   profileImgURL,
        topuplineImageURL: topupImgURL,
        socials:           form.socials,
        companyId:         company?.id || null,
        createdAt:         serverTimestamp(),
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setOpen(false);
        setForm(initialForm());
        setStep("form");
      }, 1500);
    } catch (err) {
      setSaveError(err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep("form");
    setEditorSrc(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <>
      <Button
        onPress={() => setOpen(true)}
        className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-md"
      >
        {triggerLabel}
      </Button>

      <Modal isOpen={open} onOpenChange={handleClose}>
        <Modal.Backdrop>
          <Modal.Container className="max-w-2xl w-full mx-auto">
            <Modal.Dialog className="rounded-2xl shadow-2xl bg-white">
              <Modal.CloseTrigger />

              <Modal.Header>
                <Modal.Heading className="text-xl font-bold text-slate-800">
                  {step === "editor" ? "✂️ Crop & Edit Profile Photo" : "Create MLM Profile"}
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body className="max-h-[75vh] overflow-y-auto px-6 py-4">

                {/* ══ PROFILE PHOTO EDITOR (step) ══════════ */}
                {step === "editor" && editorSrc && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <p className="text-sm text-slate-500 text-center">
                      ✅ Background removed. Crop, rotate, flip & filter your photo.
                    </p>
                    <ImageEditorCanvas
                      src={editorSrc}
                      onDone={handleEditorDone}
                      onCancel={() => { setStep("form"); setEditorSrc(null); }}
                    />
                  </div>
                )}

                {/* ══ MAIN FORM ════════════════════════════ */}
                {step === "form" && (
                  <div className="flex flex-col gap-6">

                    {/* ── 0 ▸ LOGO ─────────────────────────
                        No editor. Select from company OR upload file.
                        ──────────────────────────────────── */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Company Logo
                      </label>
                      <div className="flex gap-3 mb-3">
                        {["company", "custom"].map((t) => (
                          <button key={t} type="button"
                            onClick={() => setField("logoType", t)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                              form.logoType === t
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400"}`}>
                            {t === "company" ? "Select from company" : "Upload manually"}
                          </button>
                        ))}
                      </div>

                      {/* Company logos grid */}
                      {form.logoType === "company" && (
                        <div className="grid grid-cols-4 gap-3">
                          {logos.length === 0 ? (
                            <p className="text-xs text-slate-400 col-span-4">No logos found in company data.</p>
                          ) : logos.map((l, i) => (
                            <button key={i} type="button"
                              onClick={() => setField("logoSelected", l.link)}
                              className={`border-2 rounded-xl p-1.5 transition overflow-hidden bg-slate-50 ${
                                form.logoSelected === l.link
                                  ? "border-indigo-500 shadow-md"
                                  : "border-slate-200 hover:border-indigo-300"}`}>
                              {l.link
                                ? <img src={l.link} alt={`logo ${i + 1}`} className="w-full h-14 object-contain rounded-lg" />
                                : <div className="w-full h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No image</div>}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Custom logo upload — simple, no editor */}
                      {form.logoType === "custom" && (
                        <SimpleImagePicker
                          previewURL={form.logoCustomURL}
                          onFileSelect={handleLogoFileSelect}
                          inputRef={logoInputRef}
                          buttonLabel="📁 Upload logo"
                          previewClass="h-14 max-w-[120px] rounded-xl object-contain border border-slate-200 bg-slate-50 p-1"
                        />
                      )}
                    </div>

                    {/* ── 1 ▸ FULL NAME ───────────────────── */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select value={form.salutation}
                          onChange={(e) => setField("salutation", e.target.value)}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                          {["Mr", "Mrs", "Ms", "Dr"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="text" placeholder="Enter name" value={form.name}
                          onChange={(e) => setField("name", e.target.value)}
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                            errors.name ? "border-red-400 bg-red-50" : "border-slate-300"}`} />
                      </div>
                      {form.name && (
                        <p className="text-xs text-indigo-500 mt-1">
                          Preview: <strong>{form.salutation}.{form.name}</strong>
                        </p>
                      )}
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* ── 2 ▸ MOBILE ──────────────────────── */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input type="tel" placeholder="+91 98765 43210" value={form.mobile}
                        onChange={(e) => setField("mobile", e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                          errors.mobile ? "border-red-400 bg-red-50" : "border-slate-300"}`} />
                      {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                    </div>

                    {/* ── 3 ▸ DESIGNATION ─────────────────── */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <select value={form.designation}
                        onChange={(e) => setField("designation", e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                          errors.designation ? "border-red-400 bg-red-50" : "border-slate-300"}`}>
                        <option value="">Select designation…</option>
                        {designations.length > 0
                          ? designations.map((d, i) => <option key={i} value={d}>{d}</option>)
                          : <option disabled>No designations in company data</option>}
                      </select>
                      {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation}</p>}
                    </div>

                    {/* ── 4 ▸ PROFILE PHOTO (remove bg + editor) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Profile Photo
                      </label>
                      <div className="flex items-center gap-4">
                        {form.profileImageURL ? (
                          <img src={form.profileImageURL} alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-indigo-300 bg-slate-100" />
                        ) : (
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs text-center leading-tight px-2">
                            No photo
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <button type="button"
                            onClick={() => profileInputRef.current?.click()}
                            disabled={removingBg}
                            className="px-4 py-2 text-sm rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 flex items-center gap-2">
                            {removingBg ? (
                              <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Removing BG…
                              </>
                            ) : "📷 Upload & Remove BG"}
                          </button>
                          {form.profileImageURL && (
                            <>
                              <button type="button"
                                onClick={() => { setEditorSrc(form.profileImageURL); setStep("editor"); }}
                                className="px-4 py-2 text-sm rounded-lg bg-slate-50 border border-slate-300 text-slate-700 hover:bg-slate-100 transition">
                                ✏️ Edit / Re-crop
                              </button>
                              <button type="button"
                                onClick={() => setForm((f) => ({ ...f, profileImageBlob: null, profileImageURL: null }))}
                                className="px-4 py-2 text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition">
                                ✕ Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <input ref={profileInputRef} type="file" accept="image/*"
                        onChange={handleProfileFileSelect} className="hidden" />
                      <p className="text-xs text-slate-400 mt-1.5">
                        BG removed automatically → then crop, rotate &amp; apply filters.
                      </p>
                    </div>

                    {/* ── 5 ▸ TOPUP LINE (select or upload, no editor) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Topup Line Image
                      </label>
                      <div className="flex gap-3 mb-3">
                        {["company", "custom"].map((t) => (
                          <button key={t} type="button"
                            onClick={() => setField("topuplineType", t)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                              form.topuplineType === t
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400"}`}>
                            {t === "company" ? "Select from company" : "Upload manually"}
                          </button>
                        ))}
                      </div>

                      {/* Company topuplines grid */}
                      {form.topuplineType === "company" && (
                        <div className="grid grid-cols-3 gap-3">
                          {topuplines.length === 0 ? (
                            <p className="text-xs text-slate-400 col-span-3">No topup lines in company data.</p>
                          ) : topuplines.map((t, i) => (
                            <button key={i} type="button"
                              onClick={() => setField("topuplineSelected", t.link)}
                              className={`border-2 rounded-xl p-1 transition overflow-hidden ${
                                form.topuplineSelected === t.link
                                  ? "border-indigo-500 shadow-md"
                                  : "border-slate-200 hover:border-indigo-300"}`}>
                              {t.link
                                ? <img src={t.link} alt="" className="w-full h-16 object-cover rounded-lg" />
                                : <div className="w-full h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No image</div>}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Custom topupline upload — simple, no editor */}
                      {form.topuplineType === "custom" && (
                        <SimpleImagePicker
                          previewURL={form.topuplineCustomURL}
                          onFileSelect={handleTopupFileSelect}
                          inputRef={topupInputRef}
                          buttonLabel="📁 Upload topup image"
                          previewClass="h-16 rounded-lg object-cover border border-slate-200"
                        />
                      )}
                    </div>

                    {/* ── 6 ▸ SOCIAL MEDIA ────────────────── */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Social Media Links{" "}
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="flex flex-col gap-3">
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <div key={platform} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                              <SocialIcon name={platform} active={false} />
                            </div>
                            <input type="text"
                              placeholder={`${platform} user ID`}
                              maxLength={60}
                              value={form.socials[platform]}
                              onChange={(e) => setForm((f) => ({ ...f, socials: { ...f.socials, [platform]: e.target.value } }))}
                              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          </div>
                        ))}
                      </div>
                      {/* Same-ID shortcut */}
                      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-sm font-medium text-slate-700 mb-2">Same ID across platforms? Fill once:</p>
                        <input type="text" placeholder="Shared user ID" maxLength={40}
                          value={form.socialSameId}
                          onChange={(e) => handleSocialSameIdChange(e.target.value)}
                          className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3" />
                        <p className="text-xs text-slate-500 mb-2">Select platforms that share this ID:</p>
                        <div className="flex gap-3 flex-wrap">
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <button key={platform} type="button"
                              onClick={() => handleSocialSameToggle(platform)}
                              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition ${
                                form.socialSameSelected.includes(platform)
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-slate-300 bg-white hover:border-indigo-400"}`}>
                              <SocialIcon name={platform} active={form.socialSameSelected.includes(platform)} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Banners */}
                    {saveError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                        ⚠️ {saveError}
                      </div>
                    )}
                    {saveSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                        ✅ Profile saved successfully!
                      </div>
                    )}
                  </div>
                )}
              </Modal.Body>

              {step === "form" && (
                <Modal.Footer className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2 shadow-md">
                    {saving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Saving…
                      </>
                    ) : "💾 Save Profile"}
                  </button>
                </Modal.Footer>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}