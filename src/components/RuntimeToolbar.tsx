import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface RuntimeToolbarProps {
  pickerActive: boolean;
  onPickElement: () => void;
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 3.5 18.8 10c.6.3.6 1.2 0 1.5l-5.3 2.2 2.4 5.2c.2.5 0 1-.4 1.3l-1.8 1c-.5.2-1 0-1.3-.4l-2.4-5.2-3 4.7c-.4.5-1.2.4-1.4-.2L4.4 4.8C4.2 4 4.2 3.7 5 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m9 8-4 4 4 4m6-8 4 4-4 4m-3-9-2 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InspectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.75 12c2.1-3.5 4.52-5.25 7.25-5.25S17.15 8.5 19.25 12c-2.1 3.5-4.52 5.25-7.25 5.25S6.85 15.5 4.75 12Zm7.25-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ToolButtonProps {
  active?: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function ToolButton({ active, label, onClick, icon }: ToolButtonProps) {
  return (
    <button
      className={['runtime-tool-button', active ? 'is-active' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span className="runtime-tool-icon">{icon}</span>
    </button>
  );
}

export function RuntimeToolbar({
  pickerActive,
  onPickElement
}: RuntimeToolbarProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      setPosition({
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY)
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
  }, []);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('button')) return;

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y
    };
  }

  return (
    <div
      className="runtime-toolbar card"
      onPointerDown={startDrag}
      style={{
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`
      }}
    >
      <div className="runtime-toolbar-title" data-code-ignore="true">
        <span className="runtime-toolbar-dot" />
        <strong>代码</strong>
      </div>

      <div className="runtime-toolbar-group">
        <ToolButton active={pickerActive} label="选择节点" onClick={onPickElement} icon={<CursorIcon />} />
        <ToolButton active label="代码模式" onClick={() => undefined} icon={<CodeIcon />} />
        <ToolButton label="检查" onClick={() => undefined} icon={<InspectIcon />} />
      </div>
    </div>
  );
}
