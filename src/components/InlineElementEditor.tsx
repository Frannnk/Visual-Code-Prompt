import type {
  EditableItem,
  EditPatch,
  ElementOverride,
  SpecElementRecord,
  StyleSnapshot
} from '../runtime/spec-runtime';

interface InlineElementEditorProps {
  visible: boolean;
  activeItem: EditableItem | null;
  activeSpec: SpecElementRecord | null;
  patch: EditPatch | null;
  override: ElementOverride | null;
  snapshot: StyleSnapshot | null;
  onPatchChange: (patch: EditPatch) => void;
  onOverrideChange: (override: ElementOverride) => void;
}

function getEditorLayout(activeItem: EditableItem, patch: EditPatch | null) {
  const width = patch?.width ?? activeItem.rect.width;
  const left = activeItem.rect.left + window.scrollX + (patch?.x ?? 0);
  const top = activeItem.rect.top + window.scrollY + (patch?.y ?? 0);

  return {
    left: Math.min(left + width + 16, window.scrollX + window.innerWidth - 260),
    top: Math.max(window.scrollY + 96, top - 12)
  };
}

export function InlineElementEditor({
  visible,
  activeItem,
  activeSpec,
  patch,
  override,
  snapshot,
  onPatchChange,
  onOverrideChange
}: InlineElementEditorProps) {
  if (!visible || !activeItem || !patch) {
    return null;
  }

  const layout = getEditorLayout(activeItem, patch);
  const textFieldLabel = activeSpec?.type === 'input' ? 'Placeholder' : 'Text';
  const textFieldValue = activeSpec?.type === 'input' ? override?.placeholder ?? '' : override?.text ?? '';
  const summaryLabel = activeSpec?.name ?? activeItem.label;
  const typeLabel = activeSpec?.type ?? 'module';
  const paddingSummary = snapshot
    ? `${snapshot.paddingTop} / ${snapshot.paddingRight} / ${snapshot.paddingBottom} / ${snapshot.paddingLeft}`
    : '—';

  return (
    <div
      className="inline-element-editor card"
      style={{
        left: `${layout.left}px`,
        top: `${layout.top}px`
      }}
    >
      <div className="inline-element-editor-head">
        <div>
          <p className="section-title">Live Edit</p>
          <strong>{summaryLabel}</strong>
        </div>
        <span>{typeLabel}</span>
      </div>

      <div className="inline-element-metrics">
        <div>
          <span>Size</span>
          <strong>
            {Math.round(patch.width)} × {Math.round(patch.height)}
          </strong>
        </div>
        <div>
          <span>Background</span>
          <strong>{override?.background || snapshot?.background || 'transparent'}</strong>
        </div>
        <div>
          <span>Padding</span>
          <strong>{paddingSummary}</strong>
        </div>
        <div>
          <span>Font</span>
          <strong>{override?.fontSize ? `${override.fontSize}px` : snapshot?.fontSize || 'auto'}</strong>
        </div>
      </div>

      {activeItem.kind === 'spec' ? (
        <label className="inline-editor-field inline-editor-field-full">
          <span>{textFieldLabel}</span>
          <input
            type="text"
            value={textFieldValue}
            onChange={(event) =>
              onOverrideChange(activeSpec?.type === 'input' ? { placeholder: event.target.value } : { text: event.target.value })
            }
          />
        </label>
      ) : null}

      <div className="inline-editor-grid">
        <label className="inline-editor-field">
          <span>W</span>
          <input
            type="number"
            value={patch.width}
            onChange={(event) =>
              onPatchChange({
                ...patch,
                width: Number(event.target.value) || patch.width
              })
            }
          />
        </label>
        <label className="inline-editor-field">
          <span>H</span>
          <input
            type="number"
            value={patch.height}
            onChange={(event) =>
              onPatchChange({
                ...patch,
                height: Number(event.target.value) || patch.height
              })
            }
          />
        </label>
        <label className="inline-editor-field">
          <span>Font</span>
          <input
            type="number"
            value={override?.fontSize ?? ''}
            placeholder="Auto"
            onChange={(event) => onOverrideChange({ fontSize: Number(event.target.value) || undefined })}
          />
        </label>
        <label className="inline-editor-field">
          <span>Radius</span>
          <input
            type="number"
            value={override?.borderRadius ?? ''}
            placeholder="Auto"
            onChange={(event) => onOverrideChange({ borderRadius: Number(event.target.value) || undefined })}
          />
        </label>
      </div>
    </div>
  );
}
