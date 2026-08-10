import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, X, Check, Loader } from "lucide-react";

const CANVAS_SIZE = 320;
const RADIUS = CANVAS_SIZE / 2 - 6;

interface ImageCropModalProps {
  imageSrc: string;
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export function ImageCropModal({ imageSrc, onSave, onClose }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const baseScaleRef = useRef(1);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load image and calculate base scale to cover the canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale so image covers the circular crop area
      const scale = Math.max(
        (RADIUS * 2) / img.naturalWidth,
        (RADIUS * 2) / img.naturalHeight
      );
      baseScaleRef.current = scale;
      imageRef.current = img;
      setImageLoaded(true);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw frame
  const draw = useCallback((z: number, r: number, ox: number, oy: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const totalScale = baseScaleRef.current * z;

    // Draw the image
    ctx.save();
    ctx.translate(cx + ox, cy + oy);
    ctx.rotate((r * Math.PI) / 180);
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Dark overlay outside the circle (evenodd fill)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2, true);
    ctx.fillStyle = "rgba(3, 2, 12, 0.72)";
    ctx.fill("evenodd");
    ctx.restore();

    // Violet border circle
    ctx.save();
    ctx.strokeStyle = "rgba(139, 92, 246, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Crosshair guides
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - RADIUS);
    ctx.lineTo(cx, cy + RADIUS);
    ctx.moveTo(cx - RADIUS, cy);
    ctx.lineTo(cx + RADIUS, cy);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    if (imageLoaded) draw(zoom, rotation, offset.x, offset.y);
  }, [zoom, rotation, offset, imageLoaded, draw]);

  // Mouse / touch drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    dragStartRef.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.mx;
      const dy = e.clientY - dragStartRef.current.my;
      const newOx = dragStartRef.current.ox + dx;
      const newOy = dragStartRef.current.oy + dy;
      setOffset({ x: newOx, y: newOy });
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Touch support
  const touchStartRef = useRef({ tx: 0, ty: 0 });
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    const t = e.touches[0];
    touchStartRef.current = { tx: t.clientX, ty: t.clientY };
    dragStartRef.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartRef.current.mx;
    const dy = t.clientY - dragStartRef.current.my;
    setOffset({ x: dragStartRef.current.ox + dx, y: dragStartRef.current.oy + dy });
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const rotate = (dir: 1 | -1) => setRotation((r) => (r + dir * 90 + 360) % 360);

  const handleSave = async () => {
    const img = imageRef.current;
    if (!img) return;
    setSaving(true);

    try {
      const outputSize = 400;
      const out = document.createElement("canvas");
      out.width = outputSize;
      out.height = outputSize;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      const scale = outputSize / CANVAS_SIZE;
      const cx = outputSize / 2;
      const cy = outputSize / 2;
      const totalScale = baseScaleRef.current * zoom * scale;

      // Clip to circle
      ctx.beginPath();
      ctx.arc(cx, cy, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.translate(cx + offset.x * scale, cy + offset.y * scale);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(totalScale, totalScale);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      out.toBlob(
        async (blob) => {
          if (blob) await onSave(blob);
          setSaving(false);
        },
        "image/jpeg",
        0.92
      );
    } catch {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-sm rounded-3xl glass-strong violet-glow p-6 flex flex-col gap-5"
          initial={{ scale: 0.93, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.93, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Crop Profile Picture</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className={`cursor-grab active:cursor-grabbing select-none ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => { draggingRef.current = false; }}
              />
            </div>
          </div>

          {/* Hint */}
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/50">
            Drag to position · Scroll or slide to zoom
          </p>

          {/* Zoom control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-widest">Zoom</span>
              <span className="tabular-nums">{zoom.toFixed(1)}×</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition hover:bg-white/5 hover:text-white"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <div className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  setZoom(0.5 + pct * 2.5); // 0.5 to 3.0
                }}
              >
                <div
                  className="h-full rounded-full bg-[var(--violet)]"
                  style={{ width: `${((zoom - 0.5) / 2.5) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-[var(--violet)] bg-background shadow-lg cursor-grab"
                  style={{ left: `calc(${((zoom - 0.5) / 2.5) * 100}% - 8px)` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const bar = e.currentTarget.parentElement!;
                    const onMove = (mv: MouseEvent) => {
                      const rect = bar.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (mv.clientX - rect.left) / rect.width));
                      setZoom(0.5 + pct * 2.5);
                    };
                    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                />
              </div>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition hover:bg-white/5 hover:text-white"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Rotate */}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Rotate</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => rotate(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-muted-foreground transition hover:border-[var(--violet)]/40 hover:bg-[var(--violet)]/10 hover:text-[var(--violet-glow)]"
                title="Rotate left"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
                {rotation}°
              </span>
              <button
                onClick={() => rotate(1)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-muted-foreground transition hover:border-[var(--violet)]/40 hover:bg-[var(--violet)]/10 hover:text-[var(--violet-glow)]"
                title="Rotate right"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !imageLoaded}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {saving ? (
                <><Loader className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><Check className="h-4 w-4" /> Save</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
