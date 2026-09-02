import {
  buildRuntimePatchRecord,
  type EditPatch,
  type RuntimePageState,
  type RuntimePatchRecord,
  type SpecDocument,
  type SpecElementRecord
} from './spec-runtime';

type InjectorMode = 'preview' | 'spec' | 'edit' | 'code';

interface InjectorOptions {
  spec: SpecDocument;
  pageState?: RuntimePageState;
  targetDocument?: Document;
}

interface InjectorController {
  unmount: () => void;
  setMode: (mode: InjectorMode) => void;
  selectById: (specId: string) => void;
}

declare global {
  interface Window {
    RuntimeSpecLayer?: {
      mount: (options: InjectorOptions) => InjectorController;
    };
  }
}

const HOST_ID = '__runtime_spec_layer_host__';
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

function buildStyles() {
  return `
    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .rsl-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483646;
    }

    .rsl-toolbar {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid rgba(15, 23, 42, 0.1);
      box-shadow: 0 22px 50px rgba(15, 23, 42, 0.16);
      pointer-events: auto;
      backdrop-filter: blur(18px);
    }

    .rsl-divider {
      width: 1px;
      height: 36px;
      background: rgba(148, 163, 184, 0.26);
    }

    .rsl-button {
      width: 44px;
      height: 44px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.92);
      color: #0f172a;
      cursor: pointer;
      font-size: 12px;
      font-weight: 800;
      transition: 160ms ease;
    }

    .rsl-button.is-active {
      background: #0f172a;
      color: #fff;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
    }

    .rsl-frame {
      position: absolute;
      display: none;
      border: 1.5px solid rgba(249, 115, 22, 0.92);
      border-radius: 14px;
      background: rgba(249, 115, 22, 0.08);
      pointer-events: none;
      box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.14);
    }

    .rsl-frame.is-editing {
      pointer-events: auto;
      cursor: move;
      border-color: rgba(37, 99, 235, 0.96);
      background: rgba(37, 99, 235, 0.06);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
    }

    .rsl-badge {
      position: absolute;
      top: -12px;
      left: 10px;
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      background: #0f172a;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }

    .rsl-frame.is-editing .rsl-badge {
      background: #2563eb;
    }

    .rsl-handle {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      border: 2px solid #fff;
      background: #2563eb;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.24);
      pointer-events: auto;
      display: none;
    }

    .rsl-frame.is-editing .rsl-handle {
      display: block;
    }

    .rsl-panel {
      position: fixed;
      top: 86px;
      right: 20px;
      width: 360px;
      max-height: calc(100vh - 106px);
      overflow: auto;
      padding: 18px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(15, 23, 42, 0.1);
      box-shadow: 0 24px 56px rgba(15, 23, 42, 0.16);
      pointer-events: auto;
      display: none;
    }

    .rsl-panel.is-visible {
      display: block;
    }

    .rsl-panel h3 {
      margin: 10px 0 8px;
      font-size: 28px;
      line-height: 1.05;
      color: #0f172a;
    }

    .rsl-panel p,
    .rsl-panel li,
    .rsl-panel strong,
    .rsl-panel span {
      color: #334155;
    }

    .rsl-label {
      margin: 0;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748b;
    }

    .rsl-section + .rsl-section {
      margin-top: 16px;
    }

    .rsl-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .rsl-chip {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: #eef2ff;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }

    .rsl-list {
      margin: 10px 0 0;
      padding-left: 18px;
    }

    .rsl-list li + li {
      margin-top: 8px;
    }

    .rsl-empty {
      margin-top: 10px;
      color: #94a3b8;
      font-size: 14px;
    }

    .rsl-code {
      margin-top: 10px;
      padding: 14px;
      border-radius: 16px;
      background: #0f172a;
      color: #e2e8f0 !important;
      font-size: 12px;
      line-height: 1.6;
      overflow: auto;
      white-space: pre-wrap;
    }

    .rsl-copy {
      margin-top: 10px;
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 12px;
      background: #fff;
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
  `;
}

function readPatchedRect(target: HTMLElement, patch?: EditPatch) {
  const rect = target.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX + (patch?.x ?? 0),
    top: rect.top + window.scrollY + (patch?.y ?? 0),
    width: patch?.width ?? rect.width,
    height: patch?.height ?? rect.height
  };
}

function renderSpecPanel(panel: HTMLDivElement, spec: SpecElementRecord | null, pageState: RuntimePageState) {
  if (!spec) {
    panel.classList.remove('is-visible');
    panel.innerHTML = '';
    return;
  }

  panel.classList.add('is-visible');
  panel.innerHTML = `
    <div class="rsl-section">
      <p class="rsl-label">Injected Inspector</p>
      <h3>${spec.name}</h3>
      <p>当前处于 ${pageState}，这是一个 ${spec.module} 模块中的 ${spec.type} 节点。</p>
    </div>
    <div class="rsl-section">
      <p class="rsl-label">States</p>
      <div class="rsl-chip-row">
        ${spec.states.map((state) => `<span class="rsl-chip">${state}</span>`).join('')}
      </div>
    </div>
    <div class="rsl-section">
      <p class="rsl-label">Interaction</p>
      <ul class="rsl-list">${spec.interaction.map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>
    <div class="rsl-section">
      <p class="rsl-label">Rules</p>
      <ul class="rsl-list">${spec.rules.map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>
  `;
}

function renderCodePanel(
  panel: HTMLDivElement,
  spec: SpecElementRecord | null,
  patchRecord: RuntimePatchRecord | null
) {
  if (!spec || !patchRecord) {
    panel.classList.add('is-visible');
    panel.innerHTML = `
      <div class="rsl-section">
        <p class="rsl-label">Injected Code Handoff</p>
        <h3>等待编辑变更</h3>
        <p class="rsl-empty">切换到 Edit，选中节点并拖拽或拉伸后，这里会出现可复制的 runtime patch。</p>
      </div>
    `;
    return;
  }

  const patchText = JSON.stringify({ patches: [patchRecord] }, null, 2);
  panel.classList.add('is-visible');
  panel.innerHTML = `
    <div class="rsl-section">
      <p class="rsl-label">Injected Code Handoff</p>
      <h3>${spec.name}</h3>
      <p>这是当前节点的运行态 patch，可直接复制给代码工具或开发同学。</p>
      <pre class="rsl-code">${patchText}</pre>
      <button class="rsl-copy" type="button">复制 Runtime Patch</button>
    </div>
  `;

  panel.querySelector<HTMLButtonElement>('.rsl-copy')?.addEventListener('click', () => {
    void navigator.clipboard.writeText(patchText);
  });
}

function setFrame(
  frame: HTMLDivElement,
  target: HTMLElement | null,
  label: string | null,
  patch?: EditPatch,
  mode: InjectorMode = 'spec'
) {
  if (!target || !label) {
    frame.style.display = 'none';
    return;
  }

  const rect = readPatchedRect(target, patch);
  frame.style.display = 'block';
  frame.style.left = `${rect.left}px`;
  frame.style.top = `${rect.top}px`;
  frame.style.width = `${rect.width}px`;
  frame.style.height = `${rect.height}px`;
  frame.classList.toggle('is-editing', mode === 'edit');
  frame.querySelector<HTMLElement>('.rsl-badge')!.textContent = label;

  const handles = Array.from(frame.querySelectorAll<HTMLElement>('.rsl-handle'));
  const positions = [
    { left: -6, top: -6 },
    { left: rect.width - 6, top: -6 },
    { left: -6, top: rect.height - 6 },
    { left: rect.width - 6, top: rect.height - 6 }
  ];

  handles.forEach((handle, index) => {
    handle.style.left = `${positions[index].left}px`;
    handle.style.top = `${positions[index].top}px`;
  });
}

function createButton(targetDocument: Document, label: string, title: string) {
  const button = targetDocument.createElement('button');
  button.className = 'rsl-button';
  button.textContent = label;
  button.title = title;
  button.type = 'button';
  return button;
}

export function mountRuntimeSpecInjector(options: InjectorOptions): InjectorController {
  const targetDocument = options.targetDocument ?? document;
  const previousHost = targetDocument.getElementById(HOST_ID);
  previousHost?.remove();

  const host = targetDocument.createElement('div');
  host.id = HOST_ID;
  targetDocument.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = targetDocument.createElement('style');
  style.textContent = buildStyles();
  shadow.appendChild(style);

  const root = targetDocument.createElement('div');
  root.className = 'rsl-root';

  const toolbar = targetDocument.createElement('div');
  toolbar.className = 'rsl-toolbar';

  const previewButton = createButton(targetDocument, 'P', 'Preview');
  const inspectButton = createButton(targetDocument, 'S', 'Spec');
  const editButton = createButton(targetDocument, 'E', 'Edit');
  const codeButton = createButton(targetDocument, '</>', 'Code');
  const closeButton = createButton(targetDocument, '×', 'Close');

  const divider = targetDocument.createElement('div');
  divider.className = 'rsl-divider';

  toolbar.append(previewButton, inspectButton, editButton, codeButton, divider, closeButton);

  const frame = targetDocument.createElement('div');
  frame.className = 'rsl-frame';
  frame.innerHTML = `
    <span class="rsl-badge"></span>
    <button class="rsl-handle" data-handle="nw" type="button"></button>
    <button class="rsl-handle" data-handle="ne" type="button"></button>
    <button class="rsl-handle" data-handle="sw" type="button"></button>
    <button class="rsl-handle" data-handle="se" type="button"></button>
  `;

  const panel = targetDocument.createElement('div');
  panel.className = 'rsl-panel';

  root.append(toolbar, frame, panel);
  shadow.appendChild(root);

  const pageState = options.pageState ?? 'default';
  const specById = new Map(options.spec.elements.map((item) => [item.id, item]));

  let mode: InjectorMode = 'spec';
  let selectedId: string | null = null;
  const patchMap = new Map<string, EditPatch>();
  const dragState: {
    kind: 'move' | 'resize';
    handle?: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    patch: EditPatch;
  } = {} as never;

  function getTarget(specId: string | null) {
    return specId
      ? targetDocument.querySelector<HTMLElement>(`[data-spec-id="${specId}"]`)
      : null;
  }

  function getPatch(specId: string | null) {
    return specId ? patchMap.get(specId) : undefined;
  }

  function ensurePatch(specId: string, target: HTMLElement) {
    if (!patchMap.has(specId)) {
      const rect = target.getBoundingClientRect();
      patchMap.set(specId, {
        x: 0,
        y: 0,
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    }

    return patchMap.get(specId)!;
  }

  function syncFrame() {
    const target = getTarget(selectedId);
    const spec = selectedId ? specById.get(selectedId) ?? null : null;
    setFrame(frame, target, spec?.name ?? null, getPatch(selectedId), mode);
  }

  function syncButtons() {
    previewButton.classList.toggle('is-active', mode === 'preview');
    inspectButton.classList.toggle('is-active', mode === 'spec');
    editButton.classList.toggle('is-active', mode === 'edit');
    codeButton.classList.toggle('is-active', mode === 'code');
  }

  function renderCurrentPanel() {
    const spec = selectedId ? specById.get(selectedId) ?? null : null;
    if (mode === 'preview') {
      panel.classList.remove('is-visible');
      panel.innerHTML = '';
      return;
    }

    if (mode === 'code') {
      const patchRecord = spec && selectedId ? buildRuntimePatchRecord(selectedId, getPatch(selectedId) ?? ensurePatch(selectedId, getTarget(selectedId)!)) : null;
      renderCodePanel(panel, spec, patchRecord);
      return;
    }

    renderSpecPanel(panel, spec, pageState);
  }

  function selectById(specId: string) {
    const target = getTarget(specId);
    const spec = specById.get(specId) ?? null;
    if (!target || !spec) return;
    selectedId = specId;
    ensurePatch(specId, target);
    syncFrame();
    renderCurrentPanel();
  }

  function setMode(nextMode: InjectorMode) {
    mode = nextMode;
    syncButtons();
    if (mode === 'preview') {
      setFrame(frame, null, null);
    } else {
      syncFrame();
    }
    renderCurrentPanel();
  }

  function onPointerMove(event: PointerEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if ((dragState as unknown as { kind?: string }).kind && selectedId) {
      const selectedTarget = getTarget(selectedId);
      if (!selectedTarget) return;
      const startPatch = dragState.patch;
      const deltaX = Math.round(event.clientX - dragState.startX);
      const deltaY = Math.round(event.clientY - dragState.startY);

      if (dragState.kind === 'move') {
        patchMap.set(selectedId, {
          ...startPatch,
          x: startPatch.x + deltaX,
          y: startPatch.y + deltaY
        });
      } else if (dragState.handle === 'se') {
        patchMap.set(selectedId, {
          ...startPatch,
          width: Math.max(MIN_WIDTH, startPatch.width + deltaX),
          height: Math.max(MIN_HEIGHT, startPatch.height + deltaY)
        });
      } else if (dragState.handle === 'nw') {
        const nextWidth = Math.max(MIN_WIDTH, startPatch.width - deltaX);
        const nextHeight = Math.max(MIN_HEIGHT, startPatch.height - deltaY);
        patchMap.set(selectedId, {
          x: startPatch.x + (startPatch.width - nextWidth),
          y: startPatch.y + (startPatch.height - nextHeight),
          width: nextWidth,
          height: nextHeight
        });
      } else if (dragState.handle === 'ne') {
        const nextWidth = Math.max(MIN_WIDTH, startPatch.width + deltaX);
        const nextHeight = Math.max(MIN_HEIGHT, startPatch.height - deltaY);
        patchMap.set(selectedId, {
          ...startPatch,
          y: startPatch.y + (startPatch.height - nextHeight),
          width: nextWidth,
          height: nextHeight
        });
      } else if (dragState.handle === 'sw') {
        const nextWidth = Math.max(MIN_WIDTH, startPatch.width - deltaX);
        const nextHeight = Math.max(MIN_HEIGHT, startPatch.height + deltaY);
        patchMap.set(selectedId, {
          x: startPatch.x + (startPatch.width - nextWidth),
          y: startPatch.y,
          width: nextWidth,
          height: nextHeight
        });
      }

      syncFrame();
      renderCurrentPanel();
      return;
    }

    if (mode !== 'spec' || selectedId) return;
    const node = target.closest<HTMLElement>('[data-spec-id]');
    if (!node) {
      setFrame(frame, null, null);
      return;
    }

    const specId = node.dataset.specId ?? null;
    const spec = specId ? specById.get(specId) ?? null : null;
    setFrame(frame, node, spec?.name ?? null, getPatch(specId), mode);
  }

  function onClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(`#${HOST_ID}`)) return;
    const node = target.closest<HTMLElement>('[data-spec-id]');
    if (!node?.dataset.specId) return;
    selectById(node.dataset.specId);
  }

  function onPointerUp() {
    Object.assign(dragState, {});
  }

  function startMove(event: PointerEvent) {
    if (mode !== 'edit' || !selectedId) return;
    event.preventDefault();
    const target = getTarget(selectedId);
    if (!target) return;
    Object.assign(dragState, {
      kind: 'move',
      startX: event.clientX,
      startY: event.clientY,
      patch: { ...ensurePatch(selectedId, target) }
    });
  }

  function startResize(handle: 'nw' | 'ne' | 'sw' | 'se', event: PointerEvent) {
    if (mode !== 'edit' || !selectedId) return;
    event.preventDefault();
    event.stopPropagation();
    const target = getTarget(selectedId);
    if (!target) return;
    Object.assign(dragState, {
      kind: 'resize',
      handle,
      startX: event.clientX,
      startY: event.clientY,
      patch: { ...ensurePatch(selectedId, target) }
    });
  }

  frame.addEventListener('pointerdown', startMove);
  frame.querySelectorAll<HTMLElement>('.rsl-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) =>
      startResize(handle.dataset.handle as 'nw' | 'ne' | 'sw' | 'se', event)
    );
  });

  previewButton.addEventListener('click', () => setMode('preview'));
  inspectButton.addEventListener('click', () => setMode('spec'));
  editButton.addEventListener('click', () => setMode('edit'));
  codeButton.addEventListener('click', () => setMode('code'));

  function unmount() {
    targetDocument.removeEventListener('pointermove', onPointerMove, true);
    targetDocument.removeEventListener('click', onClick, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('scroll', syncFrame, true);
    window.removeEventListener('resize', syncFrame, true);
    frame.removeEventListener('pointerdown', startMove);
    host.remove();
    window.dispatchEvent(new CustomEvent('runtime-spec-layer:unmounted'));
  }

  closeButton.addEventListener('click', unmount);

  targetDocument.addEventListener('pointermove', onPointerMove, true);
  targetDocument.addEventListener('click', onClick, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('scroll', syncFrame, true);
  window.addEventListener('resize', syncFrame, true);

  syncButtons();
  renderCurrentPanel();

  return {
    unmount,
    setMode,
    selectById
  };
}

export function registerRuntimeSpecInjector() {
  if (typeof window === 'undefined') return;

  window.RuntimeSpecLayer = {
    mount: mountRuntimeSpecInjector
  };
}
