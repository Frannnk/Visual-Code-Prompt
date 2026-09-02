import { useEffect, useMemo, useRef, useState } from 'react';
import { RuntimeToolbar } from './components/RuntimeToolbar';
import { SpecOverlay } from './components/SpecOverlay';
import { SpecPanel } from './components/SpecPanel';
import { LoginPage } from './pages/LoginPage';
import {
  createRuntimeSessionData,
  loadRuntimeSession,
  saveRuntimeSession
} from './runtime/session-storage';
import {
  collectEditableItems,
  createEditableItemFromElement,
  type EditableItem,
  type ElementOverride,
  findInspectableTarget,
  readStyleSnapshot,
  specDocument,
  type AppMode,
  type EditPatch,
  type RuntimePageState,
  type StyleSnapshot
} from './runtime/spec-runtime';

function inferInitialPatch(item: EditableItem): EditPatch {
  return {
    x: 0,
    y: 0,
    width: Math.round(item.rect.width),
    height: Math.round(item.rect.height)
  };
}

export default function App() {
  const hydrationDoneRef = useRef(false);
  const [mode, setMode] = useState<AppMode>('edit');
  const [pageState, setPageState] = useState<RuntimePageState>('default');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pickerActive, setPickerActive] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [patches, setPatches] = useState<Record<string, EditPatch>>({});
  const [baselineSnapshots, setBaselineSnapshots] = useState<Record<string, StyleSnapshot>>({});
  const [elementOverrides, setElementOverrides] = useState<
    Record<string, ElementOverride>
  >({});
  const [hoveredItem, setHoveredItem] = useState<EditableItem | null>(null);
  const [activeDynamicItem, setActiveDynamicItem] = useState<EditableItem | null>(null);

  useEffect(() => {
    const syncOverlay = () => {
      const allEditableItems = collectEditableItems();
      setEditableItems(allEditableItems);
      setPatches((current) => {
        const next = { ...current };

        allEditableItems.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = inferInitialPatch(item);
          }
        });

        return next;
      });

      setBaselineSnapshots((current) => {
        const next = { ...current };
        allEditableItems.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = readStyleSnapshot(item.element);
          }
        });
        return next;
      });
    };

    syncOverlay();
    window.addEventListener('resize', syncOverlay);
    window.addEventListener('scroll', syncOverlay, true);

    return () => {
      window.removeEventListener('resize', syncOverlay);
      window.removeEventListener('scroll', syncOverlay, true);
    };
  }, [mode, phone, password, errorMessage, successMessage, pageState]);

  useEffect(() => {
    const restored = loadRuntimeSession(specDocument);
    if (restored) {
      setPageState(restored.pageState);
      setActiveId(restored.selectedId);
      setPatches(restored.patches);
      setElementOverrides(restored.elementOverrides ?? {});
    }
    hydrationDoneRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydrationDoneRef.current) return;
    saveRuntimeSession(buildSession());
  }, [pageState, activeId, patches, elementOverrides]);

  useEffect(() => {
    if (mode === 'preview' && !pickerActive) {
      setHoveredId(null);
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pickerActive) return;
      const target = findInspectableTarget(event.target);
      const nextItem = target ? createEditableItemFromElement(target) : null;
      setHoveredId(nextItem?.id ?? null);
      setHoveredItem(nextItem);
    };

    const onClick = (event: MouseEvent) => {
      if (!pickerActive) return;
      const target = findInspectableTarget(event.target);
      const nextItem = target ? createEditableItemFromElement(target) : null;
      if (!nextItem) return;

      event.preventDefault();
      event.stopPropagation();

      setActiveId(nextItem.id);
      setActiveDynamicItem(nextItem);
      setHoveredId(null);
      setHoveredItem(null);
      setMode('edit');
      setPickerActive(false);

      setPatches((current) => ({
        ...current,
        [nextItem.id]: current[nextItem.id] ?? inferInitialPatch(nextItem)
      }));

      setBaselineSnapshots((current) => ({
        ...current,
        [nextItem.id]: current[nextItem.id] ?? readStyleSnapshot(nextItem.element)
      }));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPickerActive(false);
      setHoveredId(null);
      setHoveredItem(null);
    };

    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [mode, pickerActive]);

  useEffect(() => {
    const syncDynamicRects = () => {
      setHoveredItem((current) =>
        current ? { ...current, rect: current.element.getBoundingClientRect() } : null
      );
      setActiveDynamicItem((current) =>
        current ? { ...current, rect: current.element.getBoundingClientRect() } : null
      );
    };

    window.addEventListener('resize', syncDynamicRects);
    window.addEventListener('scroll', syncDynamicRects, true);

    return () => {
      window.removeEventListener('resize', syncDynamicRects);
      window.removeEventListener('scroll', syncDynamicRects, true);
    };
  }, []);

  const activeItem = useMemo(() => {
    if (activeDynamicItem && activeDynamicItem.id === activeId) {
      return activeDynamicItem;
    }
    return editableItems.find((item) => item.id === activeId) ?? null;
  }, [editableItems, activeDynamicItem, activeId]);
  const activeSpec = useMemo(() => activeItem?.spec ?? null, [activeItem]);
  const currentPatch = activeId ? patches[activeId] ?? null : null;
  const baselineSnapshot = activeId ? baselineSnapshots[activeId] ?? null : null;
  const overlayItems = useMemo(() => {
    const next = [...editableItems];

    if (activeDynamicItem && !next.find((item) => item.id === activeDynamicItem.id)) {
      next.push(activeDynamicItem);
    }

    if (hoveredItem && !next.find((item) => item.id === hoveredItem.id)) {
      next.push(hoveredItem);
    }

    return next;
  }, [editableItems, activeDynamicItem, hoveredItem]);

  useEffect(() => {
    if (mode !== 'edit' || !activeId) return;

    const node = document.querySelector<HTMLElement>(`[data-spec-id="${activeId}"]`);
    if (!node) return;

    const canLiveEditText = ['login-button', 'login-error-alert', 'login-loading-hint'].includes(activeId);
    if (!canLiveEditText) return;

    const previousContentEditable = node.getAttribute('contenteditable');
    node.setAttribute('contenteditable', 'plaintext-only');
    node.setAttribute('data-runtime-live-editable', '1');
    node.spellcheck = false;

    const handleInput = () => {
      const text = node.textContent?.trim() ?? '';
      setElementOverrides((current) => ({
        ...current,
        [activeId]: {
          ...current[activeId],
          text
        }
      }));
    };

    node.addEventListener('input', handleInput);

    return () => {
      node.removeEventListener('input', handleInput);
      node.removeAttribute('data-runtime-live-editable');
      if (previousContentEditable === null) {
        node.removeAttribute('contenteditable');
      } else {
        node.setAttribute('contenteditable', previousContentEditable);
      }
    };
  }, [mode, activeId]);

  useEffect(() => {
    const styledItems = [...editableItems];
    if (activeDynamicItem && !styledItems.find((item) => item.id === activeDynamicItem.id)) {
      styledItems.push(activeDynamicItem);
    }

    styledItems
      .filter((item) => item.kind === 'generic')
      .forEach((item) => {
        const patch = patches[item.id];
        const override = elementOverrides[item.id];
        if (!patch) return;

        item.element.style.width = `${patch.width}px`;
        item.element.style.height = `${patch.height}px`;
        item.element.style.transform = `translate(${patch.x}px, ${patch.y}px)`;
        item.element.style.borderRadius =
          override?.borderRadius !== undefined ? `${override.borderRadius}px` : '';
        item.element.style.background = override?.background ?? '';
        item.element.style.color = override?.color ?? '';
        item.element.style.fontSize = override?.fontSize ? `${override.fontSize}px` : '';
      });
  }, [editableItems, activeDynamicItem, patches, elementOverrides]);

  function updatePatch(nextPatch: EditPatch) {
    if (!activeId) return;
    setPatches((current) => ({
      ...current,
      [activeId]: {
        x: nextPatch.x,
        y: nextPatch.y,
        width: Math.max(80, nextPatch.width),
        height: Math.max(40, nextPatch.height)
      }
    }));
  }

  function handleSubmit() {
    setSuccessMessage('');

    if (!/^1\d{10}$/.test(phone)) {
      setPageState('error');
      setErrorMessage('请输入正确的手机号');
      return;
    }

    if (password.length < 6 || password.length > 20) {
      setPageState('error');
      setErrorMessage('请输入 6-20 位密码');
      return;
    }

    setPageState('loading');
    setErrorMessage('');

    window.setTimeout(() => {
      if (phone === '13800138000' && password === '123456') {
        setPageState('success');
        setSuccessMessage('登录成功，演示模式下停留在当前页面。');
      } else {
        setPageState('error');
        setErrorMessage('账号或密码错误，请重新输入');
      }
    }, 1600);
  }

  function resetDemo() {
    setPhone('');
    setPassword('');
    setPageState('default');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function buildSession() {
    return createRuntimeSessionData({
      spec: specDocument,
      pageState,
      selectedId: activeId,
      patches,
      elementOverrides
    });
  }

  return (
    <div className="app-shell">
      <main className="canvas-area">
        <div className="code-mode-page-chip" data-code-ignore="true">
          <span className="code-mode-page-dot" />
          <strong>Google 首页 Demo</strong>
        </div>
        <RuntimeToolbar
            pickerActive={pickerActive}
            onPickElement={() => {
              setPickerActive((current) => !current);
              setHoveredId(null);
              setHoveredItem(null);
            }}
          />

        <LoginPage
            phone={phone}
            password={password}
            pageState={pageState}
            errorMessage={errorMessage}
            successMessage={successMessage}
            onPhoneChange={setPhone}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            onResetDemo={resetDemo}
            patches={patches}
            elementOverrides={elementOverrides}
          />

        <SpecOverlay
            mode={mode}
            items={overlayItems}
            activeId={activeId}
            hoveredId={hoveredId}
            pickerActive={pickerActive}
            patchMap={patches}
          />

        <div className="panel-shell">
          <SpecPanel
            activeItem={activeItem}
            activeSpec={activeSpec}
            baselineSnapshot={baselineSnapshot}
            currentPatch={currentPatch}
            onPatchChange={updatePatch}
            currentOverride={activeId ? elementOverrides[activeId] ?? null : null}
            onOverrideChange={(nextOverride) => {
              if (!activeId) return;
              setElementOverrides((current) => ({
                ...current,
                [activeId]: {
                  ...current[activeId],
                  ...nextOverride
                }
              }));
            }}
          />
        </div>
      </main>
    </div>
  );
}
