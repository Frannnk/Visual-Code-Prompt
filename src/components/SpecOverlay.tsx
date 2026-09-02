import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AppMode, EditPatch, EditableItem } from '../runtime/spec-runtime';

interface SpecOverlayProps {
  mode: AppMode;
  items: EditableItem[];
  activeId: string | null;
  hoveredId: string | null;
  pickerActive: boolean;
  patchMap: Record<string, EditPatch>;
}

interface LayoutRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface MeasurementLine {
  key: string;
  orientation: 'horizontal' | 'vertical';
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

interface ChildMeasurement {
  key: string;
  rect: LayoutRect;
  lines: MeasurementLine[];
}

function applyPatchStyle(
  rect: DOMRect,
  patch: EditPatch | undefined,
  hostRect: DOMRect | null
): LayoutRect {
  const hostLeft = hostRect?.left ?? 0;
  const hostTop = hostRect?.top ?? 0;

  return {
    left: rect.left - hostLeft + (patch?.x ?? 0),
    top: rect.top - hostTop + (patch?.y ?? 0),
    width: patch?.width ?? rect.width,
    height: patch?.height ?? rect.height
  };
}

function visibleChildren(element: HTMLElement) {
  return Array.from(element.children).filter((node): node is HTMLElement => {
    if (!(node instanceof HTMLElement)) return false;
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return (
      rect.width > 4 &&
      rect.height > 4 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      style.position !== 'fixed'
    );
  });
}

function px(value: number) {
  return `${Math.round(value)}`;
}

function buildChildMeasurements(
  item: EditableItem & { layout: LayoutRect },
  hostRect: DOMRect | null
): ChildMeasurement[] {
  if (!hostRect) return [];

  const container = item.layout;
  const children = visibleChildren(item.element).slice(0, 6);
  if (children.length === 0) return [];

  const childRects = children.map((child) => applyPatchStyle(child.getBoundingClientRect(), undefined, hostRect));

  const innerBounds = childRects.reduce<LayoutRect>(
    (acc, rect) => ({
      left: Math.min(acc.left, rect.left),
      top: Math.min(acc.top, rect.top),
      width: Math.max(acc.left + acc.width, rect.left + rect.width) - Math.min(acc.left, rect.left),
      height: Math.max(acc.top + acc.height, rect.top + rect.height) - Math.min(acc.top, rect.top)
    }),
    { ...childRects[0] }
  );

  const topGap = innerBounds.top - container.top;
  const bottomGap = container.top + container.height - (innerBounds.top + innerBounds.height);
  const leftGap = innerBounds.left - container.left;
  const rightGap = container.left + container.width - (innerBounds.left + innerBounds.width);

  const aggregateLines: MeasurementLine[] = [];

  if (topGap >= 4) {
    aggregateLines.push({
      key: 'aggregate-top',
      orientation: 'vertical',
      left: innerBounds.left + innerBounds.width / 2,
      top: container.top,
      width: 0,
      height: topGap,
      label: px(topGap)
    });
  }

  if (bottomGap >= 4) {
    aggregateLines.push({
      key: 'aggregate-bottom',
      orientation: 'vertical',
      left: innerBounds.left + innerBounds.width / 2,
      top: innerBounds.top + innerBounds.height,
      width: 0,
      height: bottomGap,
      label: px(bottomGap)
    });
  }

  if (leftGap >= 4) {
    aggregateLines.push({
      key: 'aggregate-left',
      orientation: 'horizontal',
      left: container.left,
      top: innerBounds.top + innerBounds.height / 2,
      width: leftGap,
      height: 0,
      label: px(leftGap)
    });
  }

  if (rightGap >= 4) {
    aggregateLines.push({
      key: 'aggregate-right',
      orientation: 'horizontal',
      left: innerBounds.left + innerBounds.width,
      top: innerBounds.top + innerBounds.height / 2,
      width: rightGap,
      height: 0,
      label: px(rightGap)
    });
  }

  const measurements: ChildMeasurement[] = [
    {
      key: `${item.id}-inner-bounds`,
      rect: innerBounds,
      lines: aggregateLines
    }
  ];

  const siblingMeasurements = children.map((child, index) => {
    const rect = child.getBoundingClientRect();
    const childLayout = applyPatchStyle(rect, undefined, hostRect);
    const nextSibling = childRects[index + 1];

    const lines: MeasurementLine[] = [];

    if (nextSibling) {
      const siblingGap = nextSibling.left - (childLayout.left + childLayout.width);
      if (siblingGap >= 4) {
        const sharedTop = Math.max(childLayout.top, nextSibling.top);
        const sharedBottom = Math.min(
          childLayout.top + childLayout.height,
          nextSibling.top + nextSibling.height
        );

        lines.push({
          key: `gap-right-${index}`,
          orientation: 'horizontal',
          left: childLayout.left + childLayout.width,
          top: sharedTop + Math.max(0, sharedBottom - sharedTop) / 2,
          width: siblingGap,
          height: 0,
          label: px(siblingGap)
        });
      }
    }

    if (index === 0 && leftGap >= 4) {
      lines.push({
        key: `left-${index}`,
        orientation: 'horizontal',
        left: container.left,
        top: childLayout.top + childLayout.height / 2,
        width: leftGap,
        height: 0,
        label: px(leftGap)
      });
    }

    if (index === children.length - 1 && rightGap >= 4) {
      lines.push({
        key: `right-${index}`,
        orientation: 'horizontal',
        left: childLayout.left + childLayout.width,
        top: childLayout.top + childLayout.height / 2,
        width: rightGap,
        height: 0,
        label: px(rightGap)
      });
    }

    return {
      key: `${item.id}-child-${index}`,
      rect: childLayout,
      lines
    };
  });

  return [...measurements, ...siblingMeasurements];
}

export function SpecOverlay({
  mode,
  items,
  activeId,
  hoveredId,
  pickerActive,
  patchMap
}: SpecOverlayProps) {
  const [viewportTick, setViewportTick] = useState(0);
  const layerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const onViewportChange = () => setViewportTick((value) => value + 1);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, []);

  useEffect(() => {
    setViewportTick((value) => value + 1);
  }, [items.length, mode]);

  const overlayItems = useMemo(() => {
    void viewportTick;
    const hostRect = layerRef.current?.parentElement?.getBoundingClientRect() ?? null;

    return items
      .filter((item) => {
        if (mode === 'preview') return false;
        if (pickerActive) return item.id === hoveredId || item.id === activeId;
        return item.id === activeId;
      })
      .map((item) => ({
        ...item,
        layout: applyPatchStyle(item.rect, patchMap[item.id], hostRect),
        childMeasurements:
          item.id === activeId && !pickerActive
            ? buildChildMeasurements(
                {
                  ...item,
                  layout: applyPatchStyle(item.rect, patchMap[item.id], hostRect)
                },
                hostRect
              )
            : []
      }));
  }, [items, patchMap, viewportTick, mode, pickerActive, hoveredId, activeId]);

  if (mode === 'preview') {
    return null;
  }

  return (
    <div ref={layerRef} className="spec-overlay-layer" aria-hidden="true">
      {overlayItems.map((item) => {
        const isActive = item.id === activeId;
        const isHovered = item.id === hoveredId;

        return (
          <div
            key={`${item.id}-${Math.round(item.layout.left)}-${Math.round(item.layout.top)}`}
            className={[
              'spec-overlay-box',
              isActive ? 'is-active' : '',
              isHovered ? 'is-hovered' : '',
              mode === 'edit' ? 'is-edit' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              left: `${item.layout.left}px`,
              top: `${item.layout.top}px`,
              width: `${item.layout.width}px`,
              height: `${item.layout.height}px`
            }}
          >
            <span className="spec-overlay-index">{item.label}</span>
            {isActive
              ? item.childMeasurements.map((child) => (
                  <div key={child.key}>
                    <div
                      className="spec-overlay-child-box"
                      style={{
                        left: `${child.rect.left - item.layout.left}px`,
                        top: `${child.rect.top - item.layout.top}px`,
                        width: `${child.rect.width}px`,
                        height: `${child.rect.height}px`
                      }}
                    />
                    {child.lines.map((line) => (
                      <div
                        key={line.key}
                        className={[
                          'spec-measure-line',
                          line.orientation === 'horizontal'
                            ? 'is-horizontal'
                            : 'is-vertical'
                        ].join(' ')}
                        style={{
                          left: `${line.left - item.layout.left}px`,
                          top: `${line.top - item.layout.top}px`,
                          width: `${line.width}px`,
                          height: `${line.height}px`
                        }}
                      >
                        <span className="spec-measure-label">{line.label}</span>
                      </div>
                    ))}
                  </div>
                ))
              : null}
          </div>
        );
      })}
    </div>
  );
}
