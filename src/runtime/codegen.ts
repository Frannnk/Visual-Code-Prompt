import {
  buildRuntimePatchRecord,
  type EditableItem,
  type EditPatch,
  type ElementOverride,
  type SpecElementRecord,
  type StyleSnapshot
} from './spec-runtime';

export interface CodegenResult {
  summary: string[];
  css: string;
  tailwind: string;
  json: string;
  runtimePatch: string;
  applyToSource: string;
  prompt: string;
}

function pxToken(value: number) {
  return `${Math.max(0, Math.round(value))}px`;
}

export function buildCodegenResult(
  item: EditableItem | null,
  spec: SpecElementRecord | null,
  baseline: StyleSnapshot | null,
  patch: EditPatch | null,
  override: ElementOverride | null
): CodegenResult {
  if (!item || !baseline || !patch) {
    return {
      summary: ['选中元素后，编辑模式会在这里生成结构化代码交接信息。'],
      css: '/* 暂无编辑变更 */',
      tailwind: '/* 暂无编辑变更 */',
      json: JSON.stringify({ target: null, changes: {} }, null, 2),
      runtimePatch: JSON.stringify({ patches: [] }, null, 2),
      applyToSource: '暂无源码修改建议。请先选中节点并做一次编辑。',
      prompt: '请先选中一个元素并进行微调，再生成代码交接信息。'
    };
  }

  const diffX = patch.x;
  const diffY = patch.y;
  const targetLabel = spec?.name ?? item.label;
  const targetId = spec?.id ?? item.id;
  const targetSelector = spec?.binding.selector ?? item.selector;
  const targetType = spec?.type ?? item.kind;

  const summary = [
    `目标节点：${targetLabel}（${targetId}）`,
    `尺寸调整为 ${patch.width}px × ${patch.height}px`,
    `位置偏移：x ${diffX >= 0 ? '+' : ''}${diffX}px，y ${diffY >= 0 ? '+' : ''}${diffY}px`,
    override?.fontSize ? `字号调整为 ${override.fontSize}px` : '字号保持原样'
  ];

  const styleLines = [
    `  width: ${pxToken(patch.width)};`,
    `  height: ${pxToken(patch.height)};`,
    `  transform: translate(${pxToken(diffX)}, ${pxToken(diffY)});`,
    override?.fontSize ? `  font-size: ${pxToken(override.fontSize)};` : null,
    override?.borderRadius !== undefined ? `  border-radius: ${pxToken(override.borderRadius)};` : null,
    override?.background ? `  background: ${override.background};` : null,
    override?.color ? `  color: ${override.color};` : null
  ].filter(Boolean) as string[];

  const css = [`${targetSelector} {`, ...styleLines, '}'].join('\n');

  const tailwind = [
    `w-[${Math.round(patch.width)}px]`,
    `h-[${Math.round(patch.height)}px]`,
    diffX !== 0 ? `translate-x-[${Math.round(diffX)}px]` : null,
    diffY !== 0 ? `translate-y-[${Math.round(diffY)}px]` : null,
    override?.fontSize ? `text-[${Math.round(override.fontSize)}px]` : null,
    override?.borderRadius !== undefined ? `rounded-[${Math.round(override.borderRadius)}px]` : null
  ]
    .filter(Boolean)
    .join(' ');

  const json = JSON.stringify(
    {
      target: targetId,
      selector: targetSelector,
      baseline: {
        x: baseline.x,
        y: baseline.y,
        width: baseline.width,
        height: baseline.height
      },
      changes: {
        translateX: patch.x,
        translateY: patch.y,
        width: patch.width,
        height: patch.height,
        fontSize: override?.fontSize ?? null,
        borderRadius: override?.borderRadius ?? null,
        background: override?.background ?? null,
        color: override?.color ?? null,
        text: override?.text ?? null,
        placeholder: override?.placeholder ?? null
      }
    },
    null,
    2
  );

  const prompt = [
    `请更新 ${targetId} 对应的前端实现。`,
    `目标元素：${targetLabel}，类型：${targetType}。`,
    `请将宽度改为 ${patch.width}px，高度改为 ${patch.height}px。`,
    `同时增加 transform: translate(${patch.x}px, ${patch.y}px)。`,
    override?.fontSize ? `请将字号调整为 ${override.fontSize}px。` : '字号不需要调整。',
    override?.text ? `请同步更新文案为：${override.text}。` : null,
    override?.placeholder ? `请同步更新 placeholder 为：${override.placeholder}。` : null,
    '保持原有交互逻辑不变，只调整视觉布局。',
    `如果项目使用 Tailwind，可优先参考：${tailwind || '无需新增 Tailwind 类'}。`
  ]
    .filter(Boolean)
    .join('\n');

  const runtimePatch = JSON.stringify(
    {
      patches: [buildRuntimePatchRecord(targetId, patch)],
      overrides: {
        [targetId]: {
          fontSize: override?.fontSize ?? null,
          borderRadius: override?.borderRadius ?? null,
          background: override?.background ?? null,
          color: override?.color ?? null,
          text: override?.text ?? null,
          placeholder: override?.placeholder ?? null
        }
      }
    },
    null,
    2
  );

  const applyToSource = [
    `Target: ${targetId}`,
    `Selector: ${targetSelector}`,
    '',
    'Apply these source-level layout changes:',
    `1. Update width to ${patch.width}px.`,
    `2. Update height to ${patch.height}px.`,
    `3. Add transform: translate(${patch.x}px, ${patch.y}px).`,
    override?.fontSize ? `4. Update font-size to ${override.fontSize}px.` : '4. Keep the current font-size.',
    override?.text ? `5. Replace display text with "${override.text}".` : null,
    override?.placeholder ? `5. Replace placeholder with "${override.placeholder}".` : null,
    '6. Keep existing interaction logic and data behavior unchanged.',
    '',
    'Recommended implementation order:',
    '- adjust base component/container style',
    '- verify the selected node still matches its parent layout',
    '- confirm the runtime patch can be removed after source update is applied'
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary,
    css,
    tailwind: tailwind || '无需额外 Tailwind 位移类',
    json,
    runtimePatch,
    applyToSource,
    prompt
  };
}
