import rawSpec from '../data/spec.json';

export type AppMode = 'preview' | 'spec' | 'edit';
export type InspectorTab = 'spec' | 'state' | 'flow' | 'props' | 'code';
export type RuntimePageState = 'default' | 'loading' | 'error' | 'success';

export interface SpecBinding {
  specId: string;
  selector: string;
}

export interface SpecElementRecord {
  id: string;
  name: string;
  type: string;
  module: string;
  binding: SpecBinding;
  states: string[];
  interaction: string[];
  rules: string[];
  copy: Record<string, string>;
  exceptions: string[];
  devNotes?: string[];
}

export interface StateSpecRecord {
  id: string;
  scope: string;
  state: RuntimePageState;
  name: string;
  when: string[];
  ui: string[];
  next: string[];
  exceptions: string[];
}

export interface FlowStepRecord {
  id: string;
  name: string;
  goal: string;
}

export interface FlowRecord {
  id: string;
  name: string;
  steps: FlowStepRecord[];
}

export interface RuntimePatchRecord {
  id: string;
  target: string;
  type: 'style-update';
  changes: {
    translateX: number;
    translateY: number;
    width: number;
    height: number;
  };
  codegen: {
    css: Record<string, string>;
    tailwind: string;
  };
}

export interface SpecDocument {
  page: {
    id: string;
    name: string;
    module: string;
  };
  elements: SpecElementRecord[];
  stateSpecs: StateSpecRecord[];
  flows: FlowRecord[];
}

export interface OverlayItem {
  index: number;
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  spec: SpecElementRecord;
}

export interface EditableItem {
  index: number;
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  label: string;
  kind: 'spec' | 'generic';
  selector: string;
  spec?: SpecElementRecord;
}

export interface EditPatch {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementOverride {
  text?: string;
  placeholder?: string;
  borderRadius?: number;
  background?: string;
  color?: string;
  fontSize?: number;
}

export interface StyleSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: string;
  background: string;
  color: string;
  fontSize: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
}

export interface SpecCompletenessIssue {
  key: string;
  label: string;
  severity: 'info' | 'warning';
  reason: string;
  suggestion: string;
}

export interface SpecCompletenessReport {
  score: number;
  status: '完整' | '较完整' | '待补充';
  completed: string[];
  missing: SpecCompletenessIssue[];
}

export const specDocument = rawSpec as unknown as SpecDocument;

const PICKER_IGNORE_SELECTOR = [
  '.runtime-toolbar',
  '.panel-shell',
  '.spec-overlay-layer',
  '.edit-handle-layer',
  '.inline-element-editor',
  '[data-code-ignore="true"]'
].join(', ');

export function getSpecById(specId: string | null) {
  if (!specId) return null;
  return specDocument.elements.find((item) => item.id === specId) ?? null;
}

export function getStateSpec(pageState: RuntimePageState) {
  return specDocument.stateSpecs.find((item) => item.state === pageState) ?? null;
}

export function collectOverlayItems(root: ParentNode = document): OverlayItem[] {
  const items = specDocument.elements.flatMap((spec, index) => {
    const node = root.querySelector<HTMLElement>(spec.binding.selector);
    if (!node) return [];

    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [];

    return [
      {
        index: index + 1,
        id: spec.id,
        element: node,
        rect,
        spec
      }
    ];
  });

  return items;
}

function buildGenericLabel(element: HTMLElement) {
  const className =
    typeof element.className === 'string'
      ? element.className
          .split(' ')
          .map((item) => item.trim())
          .filter(Boolean)[0]
      : '';

  return className ? `${element.tagName.toLowerCase()}.${className}` : element.tagName.toLowerCase();
}

function isVisibleElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 8 &&
    rect.height > 8 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

export function buildElementSelector(element: HTMLElement) {
  if (element.dataset.specId) {
    return `[data-spec-id="${element.dataset.specId}"]`;
  }

  if (element.dataset.editId) {
    return `[data-edit-id="${element.dataset.editId}"]`;
  }

  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const classes = Array.from(element.classList || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (classes.length > 0) {
    const candidate = `${element.tagName.toLowerCase()}.${classes.map((item) => CSS.escape(item)).join('.')}`;
    if (document.querySelectorAll(candidate).length === 1) {
      return candidate;
    }
  }

  const chain: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let part = current.tagName.toLowerCase();

    if (current.id) {
      part = `#${CSS.escape(current.id)}`;
      chain.unshift(part);
      break;
    }

    if (current.classList.length > 0) {
      const className = Array.from(current.classList)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 1)
        .map((item) => CSS.escape(item))
        .join('.');
      if (className) {
        part += `.${className}`;
      }
    } else if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (node) => node.tagName === current?.tagName
      );
      if (siblings.length > 1) {
        part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    chain.unshift(part);
    current = current.parentElement;
  }

  return chain.join(' > ');
}

export function findInspectableTarget(target: EventTarget | null) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== document.body) {
    if (element.closest(PICKER_IGNORE_SELECTOR)) {
      return null;
    }

    if (isVisibleElement(element)) {
      return (
        element.closest<HTMLElement>('[data-spec-id], [data-edit-id]') ??
        element
      );
    }

    element = element.parentElement;
  }

  return null;
}

export function createEditableItemFromElement(
  element: HTMLElement,
  root: ParentNode = document
): EditableItem | null {
  const anchor =
    element.closest<HTMLElement>('[data-spec-id], [data-edit-id]') ?? element;

  if (!isVisibleElement(anchor)) {
    return null;
  }

  const specId = anchor.dataset.specId ?? null;
  const spec = getSpecById(specId);
  const selector = spec?.binding.selector ?? buildElementSelector(anchor);
  const id = spec?.id ?? anchor.dataset.editId ?? `selector:${selector}`;

  const existingIndex = collectEditableItems(root).find((item) => item.id === id)?.index ?? 1;

  return {
    index: existingIndex,
    id,
    element: anchor,
    rect: anchor.getBoundingClientRect(),
    label: spec?.name ?? anchor.dataset.editLabel ?? buildGenericLabel(anchor),
    kind: spec ? 'spec' : 'generic',
    selector,
    spec: spec ?? undefined
  };
}

export function collectEditableItems(root: ParentNode = document): EditableItem[] {
  const specItems = collectOverlayItems(root).map<EditableItem>((item) => ({
    index: item.index,
    id: item.id,
    element: item.element,
    rect: item.rect,
    label: item.spec.name,
    kind: 'spec',
    selector: item.spec.binding.selector,
    spec: item.spec
  }));

  const usedIds = new Set(specItems.map((item) => item.id));
  const genericNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-edit-id]'));

  const genericItems = genericNodes.flatMap((element, index) => {
    const id = element.dataset.editId;
    if (!id || usedIds.has(id)) return [];

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [];

    return [
      {
        index: specItems.length + index + 1,
        id,
        element,
        rect,
        label: element.dataset.editLabel || buildGenericLabel(element),
        kind: 'generic' as const,
        selector: `[data-edit-id="${id}"]`
      }
    ];
  });

  return [...specItems, ...genericItems];
}

export function readStyleSnapshot(element: HTMLElement): StyleSnapshot {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return {
    x: Math.round(rect.left + window.scrollX),
    y: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    borderRadius: style.borderRadius,
    background: style.background,
    color: style.color,
    fontSize: style.fontSize,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft
  };
}

export function styleSnapshotToInlinePatch(snapshot: EditPatch) {
  return {
    transform: `translate(${snapshot.x}px, ${snapshot.y}px)`,
    width: `${snapshot.width}px`,
    height: `${snapshot.height}px`
  };
}

export function buildRuntimePatchRecord(specId: string, patch: EditPatch): RuntimePatchRecord {
  return {
    id: `patch-${specId}`,
    target: specId,
    type: 'style-update',
    changes: {
      translateX: patch.x,
      translateY: patch.y,
      width: patch.width,
      height: patch.height
    },
    codegen: {
      css: {
        width: `${patch.width}px`,
        height: `${patch.height}px`,
        transform: `translate(${patch.x}px, ${patch.y}px)`
      },
      tailwind: [
        `w-[${Math.round(patch.width)}px]`,
        `h-[${Math.round(patch.height)}px]`,
        patch.x !== 0 ? `translate-x-[${Math.round(patch.x)}px]` : null,
        patch.y !== 0 ? `translate-y-[${Math.round(patch.y)}px]` : null
      ]
        .filter(Boolean)
        .join(' ')
    }
  };
}

export function analyzeSpecCompleteness(spec: SpecElementRecord | null): SpecCompletenessReport | null {
  if (!spec) return null;

  const completed: string[] = [];
  const missing: SpecCompletenessIssue[] = [];
  let score = 0;
  const total = 7;

  if (spec.states.length > 0) {
    completed.push(`已定义 ${spec.states.length} 个状态`);
    score += 1;
  } else {
    missing.push({
      key: 'states',
      label: '状态定义',
      severity: 'warning',
      reason: '当前节点还没有明确状态列表。',
      suggestion: '补充 default / loading / error / disabled 等运行状态。'
    });
  }

  if (spec.interaction.length > 0) {
    completed.push(`已定义 ${spec.interaction.length} 条交互步骤`);
    score += 1;
  } else {
    missing.push({
      key: 'interaction',
      label: '交互步骤',
      severity: 'warning',
      reason: '当前节点缺少用户操作后的行为流程说明。',
      suggestion: '补充点击、输入、失焦、提交后的步骤化行为。'
    });
  }

  if (spec.rules.length > 0) {
    completed.push(`已定义 ${spec.rules.length} 条字段/行为规则`);
    score += 1;
  } else {
    missing.push({
      key: 'rules',
      label: '规则说明',
      severity: 'warning',
      reason: '当前节点还没有明确规则约束。',
      suggestion: '补充字段限制、禁用条件、重复点击限制等规则。'
    });
  }

  if (Object.keys(spec.copy).length > 0) {
    completed.push(`已沉淀 ${Object.keys(spec.copy).length} 个文案键值`);
    score += 1;
  } else {
    missing.push({
      key: 'copy',
      label: '文案规范',
      severity: 'warning',
      reason: '当前节点没有结构化文案。',
      suggestion: '补充 placeholder、error、loading、success 等文案字段。'
    });
  }

  if (spec.exceptions.length > 0) {
    completed.push(`已覆盖 ${spec.exceptions.length} 条异常情况`);
    score += 1;
  } else {
    missing.push({
      key: 'exceptions',
      label: '异常处理',
      severity: 'warning',
      reason: '当前节点未定义异常或兜底场景。',
      suggestion: '补充接口失败、超时、权限、空态等边界情况。'
    });
  }

  if (spec.binding.selector && spec.binding.specId) {
    completed.push('已绑定运行节点定位信息');
    score += 1;
  } else {
    missing.push({
      key: 'binding',
      label: '节点绑定',
      severity: 'warning',
      reason: '当前节点缺少稳定的运行时绑定信息。',
      suggestion: '补充 data-spec-id 与 selector，保证页面刷新后还能恢复。'
    });
  }

  const stateCoverageMissing: SpecCompletenessIssue[] = [];
  if (spec.type === 'input' && !spec.states.includes('focused')) {
    stateCoverageMissing.push({
      key: 'focused',
      label: '聚焦态',
      severity: 'info',
      reason: '输入类节点通常需要明确聚焦态。',
      suggestion: '补充 focused 状态下的视觉与提示规则。'
    });
  }
  if (spec.type === 'button' && !spec.states.includes('disabled')) {
    stateCoverageMissing.push({
      key: 'disabled',
      label: '禁用态',
      severity: 'info',
      reason: '按钮节点通常需要说明禁用逻辑。',
      suggestion: '补充 disabled 的进入条件和视觉反馈。'
    });
  }
  if (spec.type === 'feedback' && !spec.states.includes('hidden')) {
    stateCoverageMissing.push({
      key: 'hidden',
      label: '隐藏态',
      severity: 'info',
      reason: '反馈区通常需要明确隐藏与显示切换。',
      suggestion: '补充 hidden / visible 两种状态与切换条件。'
    });
  }
  missing.push(...stateCoverageMissing);

  const finalScore = Math.round((score / total) * 100);
  const status = finalScore >= 85 ? '完整' : finalScore >= 60 ? '较完整' : '待补充';

  return {
    score: finalScore,
    status,
    completed,
    missing
  };
}

export function analyzePageCompleteness() {
  const reports = specDocument.elements
    .map((element) => ({
      element,
      report: analyzeSpecCompleteness(element)
    }))
    .filter((item): item is { element: SpecElementRecord; report: SpecCompletenessReport } => Boolean(item.report));

  const averageScore = reports.length
    ? Math.round(reports.reduce((sum, item) => sum + item.report.score, 0) / reports.length)
    : 0;

  const missingCount = reports.reduce((sum, item) => sum + item.report.missing.length, 0);

  return {
    averageScore,
    missingCount,
    reports
  };
}
