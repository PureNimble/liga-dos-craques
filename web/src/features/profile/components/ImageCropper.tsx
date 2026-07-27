import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Alert, Button, Modal } from '@/shared/components/ui';
import s from './ImageCropper.module.css';

const FRAME_WIDTH = 260;
const MAX_ZOOM = 3;

interface Size {
  w: number;
  h: number;
}
interface Offset {
  x: number;
  y: number;
}

/** Smallest zoom at which the image fully covers a `frameW`x`frameH` frame. */
function coverScale(natural: Size, frameW: number, frameH: number) {
  return Math.max(frameW / natural.w, frameH / natural.h);
}

/** Keeps the image covering the frame - offset can't reveal empty space past its edges. */
function clampOffset(offset: Offset, displayed: Size, frameW: number, frameH: number): Offset {
  const minX = frameW - displayed.w;
  const minY = frameH - displayed.h;
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
}

interface ImageCropperProps {
  file: File;
  /** Frame width / height, e.g. 1 for a square avatar or 3/4 for a portrait photo. */
  aspect: number;
  /** Output image width in px (height derived from `aspect`). */
  outputWidth: number;
  /** Round frame preview (for circular avatars) instead of the default rounded rectangle. */
  round?: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/** Modal crop tool: drag to reposition, slider to zoom, inside a fixed-aspect frame.
 *  Decodes the source once via `createImageBitmap` and draws it straight to a canvas -
 *  no `<img onLoad>` timing to race. Bakes the chosen framing into a fixed-size image
 *  so every place that photo is displayed later shows exactly what was framed here. */
export function ImageCropper({
  file,
  aspect,
  outputWidth,
  round,
  title,
  onCancel,
  onConfirm,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; from: Offset } | null>(null);

  const [natural, setNatural] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const frameW = FRAME_WIDTH;
  const frameH = FRAME_WIDTH / aspect;

  useEffect(() => {
    let cancelled = false;
    createImageBitmap(file)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close();
          return;
        }
        bitmapRef.current = bitmap;
        const size = { w: bitmap.width, h: bitmap.height };
        const base = coverScale(size, frameW, frameH);
        setNatural(size);
        setOffset({ x: (frameW - size.w * base) / 2, y: (frameH - size.h * base) / 2 });
        setZoom(1);
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
      bitmapRef.current?.close();
      bitmapRef.current = null;
    };
  }, [file, frameW, frameH]);

  const scale = natural ? coverScale(natural, frameW, frameH) * zoom : 1;
  const displayed: Size = natural ? { w: natural.w * scale, h: natural.h * scale } : { w: 0, h: 0 };

  useEffect(() => {
    const canvas = canvasRef.current;
    const bitmap = bitmapRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !bitmap || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, offset.x, offset.y, displayed.w, displayed.h);
  }, [offset, displayed.w, displayed.h]);

  function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom);
    if (!natural) return;
    const nextScale = coverScale(natural, frameW, frameH) * nextZoom;
    setOffset((prev) =>
      clampOffset(prev, { w: natural.w * nextScale, h: natural.h * nextScale }, frameW, frameH),
    );
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, from: offset };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const next = {
      x: drag.from.x + (e.clientX - drag.startX),
      y: drag.from.y + (e.clientY - drag.startY),
    };
    setOffset(clampOffset(next, displayed, frameW, frameH));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    const bitmap = bitmapRef.current;
    if (!natural || !bitmap) return;
    setSaving(true);
    const outputHeight = Math.round(outputWidth / aspect);
    const k = outputWidth / frameW;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setSaving(false);
      return;
    }
    ctx.drawImage(bitmap, offset.x * k, offset.y * k, displayed.w * k, displayed.h * k);
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onConfirm(blob);
      },
      'image/webp',
      0.9,
    );
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={saving} disabled={!natural}>
            Aplicar
          </Button>
        </>
      }
    >
      <div className={s.wrap}>
        {loadError ? (
          <Alert kind="error">Não foi possível ler esta imagem.</Alert>
        ) : (
          <canvas
            ref={canvasRef}
            width={frameW}
            height={frameH}
            className={`${s.frame} ${round ? s.frameRound : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}

        <input
          type="range"
          className={s.zoom}
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          aria-label="Zoom"
        />
      </div>
    </Modal>
  );
}
