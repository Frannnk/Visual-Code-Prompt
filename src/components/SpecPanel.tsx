import { useMemo, useState } from 'react';
import { buildCodegenResult } from '../runtime/codegen';
import type {
  EditableItem,
  EditPatch,
  ElementOverride,
  SpecElementRecord,
  StyleSnapshot
} from '../runtime/spec-runtime';

interface SpecPanelProps {
  activeItem: EditableItem | null;
  activeSpec: SpecElementRecord | null;
  baselineSnapshot: StyleSnapshot | null;
  currentPatch: EditPatch | null;
  onPatchChange: (patch: EditPatch) => void;
  currentOverride: ElementOverride | null;
  onOverrideChange: (override: ElementOverride) => void;
}

type PanelView = 'props' | 'code';

function metric(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function SpecPanel({
  activeItem,
  activeSpec,
  baselineSnapshot,
  currentPatch,
  onPatchChange,
  currentOverride,
  onOverrideChange
}: SpecPanelProps) {
  const [view, setView] = useState<PanelView>('props');
  const codegen = useMemo(
    () => buildCodegenResult(activeItem, activeSpec, baselineSnapshot, currentPatch, currentOverride),
    [activeItem, activeSpec, baselineSnapshot, currentPatch, currentOverride]
  );

  const selectedLabel = activeSpec?.name ?? activeItem?.label ?? '请选择页面中的节点';
  const selectedSelector =
    activeSpec?.binding.selector ?? (activeItem ? activeItem.selector : '[data-edit-id]');
  const selectedKind = activeSpec?.type ?? activeItem?.kind ?? 'module';

  return (
    <aside className="card spec-panel">
      <div className="spec-panel-head">
        <div className="spec-panel-topbar">
          <div className="spec-panel-topbar-tabs">
            <button className="is-active">检查</button>
            <button>插件</button>
          </div>
          <span className="spec-panel-zoom">74%</span>
        </div>
        <div className="spec-panel-head-meta">
          <div className="spec-panel-module-tag">代码</div>
        </div>
      </div>

      <div className="spec-panel-body">
        <section className="panel-section panel-section-intro">
          <div className="spec-panel-tabs spec-panel-tabs-compact">
            <button className={view === 'props' ? 'is-active' : ''} onClick={() => setView('props')}>
              检查
            </button>
            <button className={view === 'code' ? 'is-active' : ''} onClick={() => setView('code')}>
              代码
            </button>
          </div>
        </section>

        <section className="panel-section panel-section-intro">
          <p className="section-title">当前选中</p>
          <div className="panel-inline-module">{selectedKind}</div>
          <h3 className="panel-inline-title">{selectedLabel}</h3>
          <p className="muted">{selectedSelector}</p>
        </section>

        {view === 'props' ? (
          <div className="panel-stack">
            <section className="panel-section">
              <p className="section-title">画框</p>
              <div className="info-grid">
                <div>
                  <span className="muted">宽度</span>
                  <strong>{metric(currentPatch?.width ? `${currentPatch.width}px` : null)}</strong>
                </div>
                <div>
                  <span className="muted">高度</span>
                  <strong>{metric(currentPatch?.height ? `${currentPatch.height}px` : null)}</strong>
                </div>
                <div>
                  <span className="muted">偏移 X</span>
                  <strong>{metric(currentPatch?.x ? `${currentPatch.x}px` : '0px')}</strong>
                </div>
                <div>
                  <span className="muted">偏移 Y</span>
                  <strong>{metric(currentPatch?.y ? `${currentPatch.y}px` : '0px')}</strong>
                </div>
              </div>
            </section>

            <section className="panel-section">
              <p className="section-title">图层属性</p>
              <div className="copy-grid">
                <div className="copy-item">
                  <span>Background</span>
                  <strong>{metric(currentOverride?.background || baselineSnapshot?.background)}</strong>
                </div>
                <div className="copy-item">
                  <span>Color</span>
                  <strong>{metric(currentOverride?.color || baselineSnapshot?.color)}</strong>
                </div>
                <div className="copy-item">
                  <span>Font Size</span>
                  <strong>
                    {metric(
                      currentOverride?.fontSize
                        ? `${currentOverride.fontSize}px`
                        : baselineSnapshot?.fontSize
                    )}
                  </strong>
                </div>
                <div className="copy-item">
                  <span>Radius</span>
                  <strong>
                    {metric(
                      currentOverride?.borderRadius !== undefined
                        ? `${currentOverride.borderRadius}px`
                        : baselineSnapshot?.borderRadius
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="panel-section">
              <p className="section-title">布局</p>
              <div className="copy-grid">
                <div className="copy-item">
                  <span>Padding Top</span>
                  <strong>{metric(baselineSnapshot?.paddingTop)}</strong>
                </div>
                <div className="copy-item">
                  <span>Padding Right</span>
                  <strong>{metric(baselineSnapshot?.paddingRight)}</strong>
                </div>
                <div className="copy-item">
                  <span>Padding Bottom</span>
                  <strong>{metric(baselineSnapshot?.paddingBottom)}</strong>
                </div>
                <div className="copy-item">
                  <span>Padding Left</span>
                  <strong>{metric(baselineSnapshot?.paddingLeft)}</strong>
                </div>
              </div>
            </section>

            <section className="panel-section">
              <p className="section-title">快速调整</p>
              {currentPatch ? (
                <div className="prop-editor-grid">
                  <label className="prop-field">
                    <span>Width</span>
                    <input
                      type="number"
                      value={currentPatch.width}
                      onChange={(event) =>
                        onPatchChange({
                          ...currentPatch,
                          width: Number(event.target.value) || currentPatch.width
                        })
                      }
                    />
                  </label>
                  <label className="prop-field">
                    <span>Height</span>
                    <input
                      type="number"
                      value={currentPatch.height}
                      onChange={(event) =>
                        onPatchChange({
                          ...currentPatch,
                          height: Number(event.target.value) || currentPatch.height
                        })
                      }
                    />
                  </label>
                  <label className="prop-field">
                    <span>Font Size</span>
                    <input
                      type="number"
                      value={currentOverride?.fontSize ?? ''}
                      placeholder="Auto"
                      onChange={(event) => onOverrideChange({ fontSize: Number(event.target.value) || undefined })}
                    />
                  </label>
                  <label className="prop-field">
                    <span>Radius</span>
                    <input
                      type="number"
                      value={currentOverride?.borderRadius ?? ''}
                      placeholder="Auto"
                      onChange={(event) => onOverrideChange({ borderRadius: Number(event.target.value) || undefined })}
                    />
                  </label>
                </div>
              ) : (
                <p className="empty-hint">先选择网页节点，再进行调整。</p>
              )}
            </section>
          </div>
        ) : (
          <div className="panel-stack">
            <section className="panel-section">
              <p className="section-title">改动摘要</p>
              <ul className="panel-list">
                {codegen.summary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="panel-section">
              <div className="panel-code-head">
                <p className="section-title">CSS</p>
                <button onClick={() => navigator.clipboard.writeText(codegen.css)}>复制</button>
              </div>
              <pre>{codegen.css}</pre>
            </section>

            <section className="panel-section">
              <div className="panel-code-head">
                <p className="section-title">JSON Patch</p>
                <button onClick={() => navigator.clipboard.writeText(codegen.json)}>复制</button>
              </div>
              <pre>{codegen.json}</pre>
            </section>

            <section className="panel-section">
              <div className="panel-code-head">
                <p className="section-title">Runtime Patch</p>
                <button onClick={() => navigator.clipboard.writeText(codegen.runtimePatch)}>复制</button>
              </div>
              <pre>{codegen.runtimePatch}</pre>
            </section>

            <section className="panel-section">
              <div className="panel-code-head">
                <p className="section-title">源码修改说明</p>
                <button onClick={() => navigator.clipboard.writeText(codegen.applyToSource)}>复制</button>
              </div>
              <pre>{codegen.applyToSource}</pre>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
