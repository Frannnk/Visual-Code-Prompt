import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { AppMode, EditableItem, EditPatch } from '../runtime/spec-runtime';

interface EditHandlesProps {
  mode: AppMode;
  activeItem: EditableItem | null;
  patch: EditPatch | null;
  onPatchChange: (patch: EditPatch) => void;
}

const HANDLE_SIZE = 12;
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

function getLayout(activeItem: EditableItem, patch: EditPatch | null) {
  return {
    left: activeItem.rect.left + window.scrollX + (patch?.x ?? 0),
    top: activeItem.rect.top + window.scrollY + (patch?.y ?? 0),
    width: patch?.width ?? activeItem.rect.width,
    height: patch?.height ?? activeItem.rect.height
  };
}

export function EditHandles({ mode, activeItem, patch, onPatchChange }: EditHandlesProps) {
  const dragStateRef = useRef<{
    kind: 'move' | 'resize';
    handle?: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    patch: EditPatch;
  } | null>(null);

  const layout = useMemo(() => {
    if (!activeItem) return null;
    return getLayout(activeItem, patch);
  }, [activeItem, patch]);

  if (mode !== 'edit' || !activeItem || !layout || !patch) {
    return null;
  }

  const activePatch = patch;

  useEffect(() => {
    if (mode !== 'edit') {
      dragStateRef.current = null;
    }
  }, [mode]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const deltaX = Math.round(event.clientX - dragState.startX);
      const deltaY = Math.round(event.clientY - dragState.startY);

      if (dragState.kind === 'move') {
        onPatchChange({
          ...dragState.patch,
          x: dragState.patch.x + deltaX,
          y: dragState.patch.y + deltaY
        });
        return;
      }

      const startPatch = dragState.patch;
      const handleKey = dragState.handle;

      if (handleKey === 'se') {
        onPatchChange({
          ...startPatch,
          width: Math.max(MIN_WIDTH, startPatch.width + deltaX),
          height: Math.max(MIN_HEIGHT, startPatch.height + deltaY)
        });
        return;
      }

      if (handleKey === 'nw') {
        const nextWidth = Math.max(MIN_WIDTH, startPatch.width - deltaX);
        const nextHeight = Math.max(MIN_HEIGHT, startPatch.height - deltaY);
        const appliedDeltaX = startPatch.width - nextWidth;
        const appliedDeltaY = startPatch.height - nextHeight;

        onPatchChange({
          x: startPatch.x + appliedDeltaX,
          y: startPatch.y + appliedDeltaY,
          width: nextWidth,
          height: nextHeight
        });
        return;
      }

      if (handleKey === 'ne') {
        const nextWidth = Math.max(MIN_WIDTH, startPatch.width + deltaX);
        const nextHeight = Math.max(MIN_HEIGHT, startPatch.height - deltaY);
        const appliedDeltaY = startPatch.height - nextHeight;

        onPatchChange({
          ...startPatch,
          y: startPatch.y + appliedDeltaY,
          width: nextWidth,
          height: nextHeight
        });
        return;
      }

      const nextWidth = Math.max(MIN_WIDTH, startPatch.width - deltaX);
      const nextHeight = Math.max(MIN_HEIGHT, startPatch.height + deltaY);
      const appliedDeltaX = startPatch.width - nextWidth;

      onPatchChange({
        x: startPatch.x + appliedDeltaX,
        y: startPatch.y,
        width: nextWidth,
        height: nextHeight
      });
    };

    const onPointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPatchChange]);

  function startMove(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      kind: 'move',
      startX: event.clientX,
      startY: event.clientY,
      patch: activePatch
    };
  }

  function startResize(
    handle: 'nw' | 'ne' | 'sw' | 'se',
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      kind: 'resize',
      handle,
      startX: event.clientX,
      startY: event.clientY,
      patch: activePatch
    };
  }

  const handles = [
    { key: 'nw', left: layout.left - HANDLE_SIZE / 2, top: layout.top - HANDLE_SIZE / 2, cursor: 'nwse-resize' },
    {
      key: 'ne',
      left: layout.left + layout.width - HANDLE_SIZE / 2,
      top: layout.top - HANDLE_SIZE / 2,
      cursor: 'nesw-resize'
    },
    {
      key: 'sw',
      left: layout.left - HANDLE_SIZE / 2,
      top: layout.top + layout.height - HANDLE_SIZE / 2,
      cursor: 'nesw-resize'
    },
    {
      key: 'se',
      left: layout.left + layout.width - HANDLE_SIZE / 2,
      top: layout.top + layout.height - HANDLE_SIZE / 2,
      cursor: 'nwse-resize'
    }
  ] as const;

  function nudge(handleKey: string) {
    const delta = 8;

    if (handleKey === 'se') {
      onPatchChange({
        ...activePatch,
        width: activePatch.width + delta,
        height: activePatch.height + delta
      });
      return;
    }

    if (handleKey === 'nw') {
      onPatchChange({
        x: activePatch.x - delta,
        y: activePatch.y - delta,
        width: Math.max(80, activePatch.width + delta),
        height: Math.max(40, activePatch.height + delta)
      });
      return;
    }

    if (handleKey === 'ne') {
      onPatchChange({
        ...activePatch,
        y: activePatch.y - delta,
        width: activePatch.width + delta,
        height: Math.max(40, activePatch.height + delta)
      });
      return;
    }

    onPatchChange({
      ...activePatch,
      x: activePatch.x - delta,
      width: Math.max(80, activePatch.width + delta),
      height: activePatch.height + delta
    });
  }

  return (
    <div className="edit-handle-layer" aria-hidden="true">
      <div
        className="edit-selection-frame"
        style={{
          left: `${layout.left}px`,
          top: `${layout.top}px`,
          width: `${layout.width}px`,
          height: `${layout.height}px`
        }}
        onPointerDown={startMove}
      />
      {handles.map((handle) => (
        <button
          key={handle.key}
          className="edit-handle"
          style={{
            left: `${handle.left}px`,
            top: `${handle.top}px`,
            cursor: handle.cursor
          }}
          onClick={() => nudge(handle.key)}
          onPointerDown={(event) => startResize(handle.key, event)}
          title="点击快速微调尺寸"
        />
      ))}
    </div>
  );
}
