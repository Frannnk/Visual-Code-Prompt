(() => {
  if (window.__RUNTIME_CODE_MODE__) return;
  window.__RUNTIME_CODE_MODE__ = true;

  const state = {
    visible: false,
    picking: false,
    mode: 'interaction',
    designTool: '',
    devTab: 'edit',
    hoverEl: null,
    selectedEl: null,
    dragSession: null,
    cardVisible: false,
    interactionSideVisible: false,
    annotations: new Map(),
    adjustments: new Map(),
    originals: new Map(),
    moveNotice: '',
    colorDrag: null
  };

  const HOST_ID = '__runtime_code_mode_host__';
  let shadowHost = null;
  let shadowRoot = null;
  let toolbar = null;
  let selectedOutline = null;
  let hoverOutline = null;
  let contextBadge = null;
  let interactionCard = null;
  let interactionSideCard = null;
  let devCard = null;
  let designFloatingToolbar = null;
  let dragGuides = null;
  let reorderGuide = null;
  let sizeBadge = null;
  let devInputDraft = null;
  let layoutObserver = null;
  let elementKeySeed = 0;
  let sizeBadgeTimer = null;
  const FIGMA_ASSETS = {
    interactionActive: chrome.runtime.getURL('src/assets/interaction-icon.svg'),
    interactionInactive: chrome.runtime.getURL('src/assets/interaction-icon.svg'),
    designActive: chrome.runtime.getURL('src/assets/design-icon.svg'),
    designInactive: chrome.runtime.getURL('src/assets/design-icon.svg'),
    pickInactiveInteraction: chrome.runtime.getURL('src/assets/pick-interaction-icon.svg'),
    pickActiveInteraction: chrome.runtime.getURL('src/assets/pick-interaction-icon.svg'),
    pickActiveDesign: chrome.runtime.getURL('src/assets/pick-design-icon.svg'),
    annotationActive: chrome.runtime.getURL('src/assets/annotation-icon.svg'),
    annotationInactive: chrome.runtime.getURL('src/assets/annotation-icon.svg'),
    moveInactive: chrome.runtime.getURL('src/assets/move-icon.svg'),
    editInactive: chrome.runtime.getURL('src/assets/edit-icon.svg'),
    close: chrome.runtime.getURL('src/assets/close-icon.svg')
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'RUNTIME_CODE_MODE_TOGGLE') {
      if (state.visible) teardown();
      else void setup();
    }
  });

  async function setup() {
    if (toolbar) return;
    preloadToolbarAssets();

    const cssText = await fetch(chrome.runtime.getURL('src/content.css')).then((response) =>
      response.text()
    );

    shadowHost = document.createElement('div');
    shadowHost.id = HOST_ID;
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = cssText;
    shadowRoot.appendChild(style);

    const root = document.createElement('div');
    root.id = 'runtime-code-mode-root';
    root.innerHTML = `
      <div class="runtime-toolbar-preload" aria-hidden="true">
        <img src="${FIGMA_ASSETS.interactionActive}" alt="" />
        <img src="${FIGMA_ASSETS.designActive}" alt="" />
        <img src="${FIGMA_ASSETS.pickInactiveInteraction}" alt="" />
        <img src="${FIGMA_ASSETS.pickActiveDesign}" alt="" />
        <img src="${FIGMA_ASSETS.annotationActive}" alt="" />
        <img src="${FIGMA_ASSETS.moveInactive}" alt="" />
        <img src="${FIGMA_ASSETS.editInactive}" alt="" />
        <img src="${FIGMA_ASSETS.pickActiveDesign}" alt="" />
        <img src="${FIGMA_ASSETS.close}" alt="" />
      </div>
      <section class="runtime-toolbar"></section>
      <section class="runtime-floating-editbar"></section>
      <div class="runtime-context-badge"></div>
      <section class="runtime-note-card runtime-note-card-interaction">
        <div class="runtime-note-head">
          <button class="runtime-note-tag is-interaction" data-act="interaction-card-tag">
            <img class="runtime-note-tag-icon" alt="" src="${FIGMA_ASSETS.annotationInactive}" />
            <span>交互注释</span>
            <span class="runtime-note-tag-caret">${caretDownIcon()}</span>
          </button>
          <button class="runtime-note-close" data-act="hide-card">×</button>
        </div>
        <div class="runtime-note-form">
          <label class="runtime-note-field">
            <span class="runtime-note-field-label">交互说明</span>
            <textarea class="runtime-note-body runtime-note-input" data-note-field="interaction" placeholder="请输入交互说明..."></textarea>
          </label>
          <label class="runtime-note-field">
            <span class="runtime-note-field-label">其他说明</span>
            <textarea class="runtime-note-body runtime-note-input" data-note-field="other" placeholder="请输入其他说明..."></textarea>
          </label>
          <button class="runtime-note-confirm" data-act="confirm-interaction-note" type="button">确定</button>
        </div>
      </section>
      <section class="runtime-note-card runtime-note-card-interaction-side">
        <div class="runtime-note-head">
          <div class="runtime-note-head-title">交互说明</div>
          <button class="runtime-note-close" data-act="hide-interaction-side" aria-label="关闭">
            <img class="runtime-note-close-icon" alt="" src="${FIGMA_ASSETS.close}" />
          </button>
        </div>
        <div class="runtime-dev-panel runtime-interaction-side-panel"></div>
      </section>
      <section class="runtime-note-card runtime-note-card-dev">
        <div class="runtime-note-head">
          <div class="runtime-note-tabs">
            <button class="runtime-note-tab" data-act="switch-dev-tab" data-tab="edit">编辑</button>
            <button class="runtime-note-tab" data-act="switch-dev-tab" data-tab="adjustments">调整项</button>
          </div>
          <button class="runtime-note-close" data-act="hide-card" aria-label="关闭">
            <img class="runtime-note-close-icon" alt="" src="${FIGMA_ASSETS.close}" />
          </button>
        </div>
        <div class="runtime-dev-panel"></div>
      </section>
      <div class="runtime-selected-outline">
        <div class="runtime-selected-frame"></div>
        <button class="runtime-resize-handle runtime-resize-handle-nw" data-handle="nw" aria-label="左上缩放"></button>
        <button class="runtime-resize-handle runtime-resize-handle-ne" data-handle="ne" aria-label="右上缩放"></button>
        <button class="runtime-resize-handle runtime-resize-handle-se" data-handle="se" aria-label="右下缩放"></button>
        <button class="runtime-resize-handle runtime-resize-handle-sw" data-handle="sw" aria-label="左下缩放"></button>
      </div>
      <div class="runtime-hover-outline">
        <div class="runtime-outline-frame"></div>
        <div class="runtime-padding-region runtime-padding-top"></div>
        <div class="runtime-padding-region runtime-padding-right"></div>
        <div class="runtime-padding-region runtime-padding-bottom"></div>
        <div class="runtime-padding-region runtime-padding-left"></div>
        <div class="runtime-content-box"></div>
        <div class="runtime-measure-badge runtime-measure-top"></div>
        <div class="runtime-measure-badge runtime-measure-right"></div>
        <div class="runtime-measure-badge runtime-measure-bottom"></div>
        <div class="runtime-measure-badge runtime-measure-left"></div>
      </div>
      <div class="runtime-drag-guide runtime-drag-guide-v"></div>
      <div class="runtime-drag-guide runtime-drag-guide-h"></div>
      <div class="runtime-reorder-guide"></div>
      <div class="runtime-size-badge"></div>
    `;

    shadowRoot.appendChild(root);
    document.documentElement.appendChild(shadowHost);

    toolbar = root.querySelector('.runtime-toolbar');
    selectedOutline = root.querySelector('.runtime-selected-outline');
    hoverOutline = root.querySelector('.runtime-hover-outline');
    contextBadge = root.querySelector('.runtime-context-badge');
    interactionCard = root.querySelector('.runtime-note-card-interaction');
    interactionSideCard = root.querySelector('.runtime-note-card-interaction-side');
    devCard = root.querySelector('.runtime-note-card-dev');
    designFloatingToolbar = root.querySelector('.runtime-floating-editbar');
    dragGuides = {
      v: root.querySelector('.runtime-drag-guide-v'),
      h: root.querySelector('.runtime-drag-guide-h')
    };
    reorderGuide = root.querySelector('.runtime-reorder-guide');
    sizeBadge = root.querySelector('.runtime-size-badge');

    toolbar.addEventListener('click', onToolbarClick);
    selectedOutline?.addEventListener('mousedown', onPointerDown);
    designFloatingToolbar?.addEventListener('click', onFloatingToolbarClick);
    interactionCard?.addEventListener('input', onInteractionInput);
    interactionCard?.addEventListener('click', onInteractionCardClick);
    devCard?.addEventListener('input', onDevInput);
    devCard?.addEventListener('keydown', onDevInputKeyDown);
    devCard?.addEventListener('click', onDevCardClick);
    devCard?.addEventListener('pointerdown', onDevCardPointerDown);
    devCard?.addEventListener('focusout', onDevInputCommit, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('pointermove', onColorPointerMove, true);
    document.addEventListener('pointerup', onColorPointerUp, true);
    document.addEventListener('pointercancel', onColorPointerUp, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('mouseup', onPointerUp, true);
    document.addEventListener('click', onPageClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange, true);
    window.addEventListener('blur', onWindowBlur);

    state.visible = true;
    state.mode = 'design';
    state.designTool = 'edit';
    state.picking = true;
    renderToolbar();
    updateToolbarButtons();
    renderCards();
  }

  function preloadToolbarAssets() {
    Object.values(FIGMA_ASSETS).forEach((src) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => {});
    });
  }

  function setImageSourceIfNeeded(node, nextSrc) {
    if (!(node instanceof HTMLImageElement)) return;
    const currentSrc = node.getAttribute('src');
    if (currentSrc === nextSrc) return;
    node.setAttribute('src', nextSrc);
  }

  function teardown() {
    if (!toolbar) return;

    toolbar.removeEventListener('click', onToolbarClick);
    selectedOutline?.removeEventListener('mousedown', onPointerDown);
    designFloatingToolbar?.removeEventListener('click', onFloatingToolbarClick);
    interactionCard?.removeEventListener('input', onInteractionInput);
    interactionCard?.removeEventListener('click', onInteractionCardClick);
    devCard?.removeEventListener('input', onDevInput);
    devCard?.removeEventListener('keydown', onDevInputKeyDown);
    devCard?.removeEventListener('click', onDevCardClick);
    devCard?.removeEventListener('pointerdown', onDevCardPointerDown);
    devCard?.removeEventListener('focusout', onDevInputCommit, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('pointermove', onColorPointerMove, true);
    document.removeEventListener('pointerup', onColorPointerUp, true);
    document.removeEventListener('pointercancel', onColorPointerUp, true);
    document.removeEventListener('mousedown', onPointerDown, true);
    document.removeEventListener('mouseup', onPointerUp, true);
    document.removeEventListener('click', onPageClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange, true);
    window.removeEventListener('blur', onWindowBlur);
    layoutObserver?.disconnect();
    layoutObserver = null;

    shadowHost?.remove();
    shadowHost = null;
    shadowRoot = null;
    toolbar = null;
    selectedOutline = null;
    hoverOutline = null;
    contextBadge = null;
    interactionCard = null;
    interactionSideCard = null;
    devCard = null;
    designFloatingToolbar = null;
    dragGuides = null;
    reorderGuide = null;
    sizeBadge = null;
    state.visible = false;
    state.picking = false;
    state.designTool = '';
    state.hoverEl = null;
    state.selectedEl = null;
    state.dragSession = null;
    clearTimeout(sizeBadgeTimer);
    sizeBadgeTimer = null;
    state.cardVisible = false;
    devInputDraft = null;
    state.colorDrag = null;
  }

  function onToolbarClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const action = button.dataset.act;

    if (action === 'close') {
      teardown();
      return;
    }

    if (action === 'interaction' || action === 'design') {
      state.mode = action;
      if (action === 'design') {
        state.designTool = 'edit';
        state.picking = true;
        state.cardVisible = !!state.selectedEl;
        state.interactionSideVisible = false;
      } else {
        state.designTool = '';
        state.picking = true;
        state.cardVisible = false;
        state.interactionSideVisible = !!state.selectedEl && !!state.annotations.get(buildSelector(state.selectedEl));
      }
      renderToolbar();
      updateToolbarButtons();
      renderCards();
      renderFloatingToolbar();
      return;
    }

    if (action === 'inspect') {
      if (state.selectedEl) {
        state.cardVisible = !state.cardVisible;
        if (state.cardVisible) state.interactionSideVisible = false;
      }
      renderToolbar();
      updateToolbarButtons();
      renderCards();
      return;
    }

    if (['edit', 'scale', 'move'].includes(action)) {
      state.designTool = action;
      state.picking = true;
      state.cardVisible = !!state.selectedEl;
      renderToolbar();
      updateToolbarButtons();
      renderCards();
      renderFloatingToolbar();
      if (state.selectedEl) drawSelectedOutline(state.selectedEl);
      return;
    }

    if (action === 'hide-card') {
      if (state.mode === 'design') return;
      state.cardVisible = false;
      renderToolbar();
      renderCards();
      renderFloatingToolbar();
      return;
    }

    if (action === 'hide-interaction-side') {
      if (state.mode !== 'interaction') return;
      state.interactionSideVisible = false;
      renderCards();
    }
  }

  function isDesignSelectionMode() {
    return state.mode === 'design' && state.picking && ['edit', 'scale', 'move'].includes(state.designTool);
  }

  function onMouseMove(event) {
    if (state.dragSession?.element instanceof Element) {
      event.preventDefault();
      if (state.dragSession.kind === 'resize') {
        updateResizeSession(event);
        return;
      }
      const deltaX = event.clientX - state.dragSession.startX;
      const deltaY = event.clientY - state.dragSession.startY;
      if (state.dragSession.moveStrategy === 'reorder') {
        const orderBefore = getSiblingOrder(state.dragSession.element);
        const reorderMeta = maybeReorderWithinParent(
          state.dragSession.element,
          event.clientX,
          event.clientY,
          state.dragSession.bounds
        );
        const orderAfter = getSiblingOrder(state.dragSession.element);
        state.dragSession.reordered = orderBefore !== orderAfter;
        state.dragSession.changed = state.dragSession.reordered;
        drawReorderGuide(reorderMeta);
        hideDragGuides();
        drawSelectedOutline(state.dragSession.element);
        renderCards();
        return;
      }
      const snapped = getSnappedDragPosition(
        state.dragSession.element,
        state.dragSession.baseTranslateX + deltaX,
        state.dragSession.baseTranslateY + deltaY,
        state.dragSession.bounds
      );
      setTransformPosition(
        state.dragSession.element,
        snapped.x,
        snapped.y
      );
      state.dragSession.hitBoundary = snapped.clamped;
      state.dragSession.outsideParent = !snapped.insideParent;
      state.dragSession.changed =
        Math.abs(snapped.x - state.dragSession.baseTranslateX) > 0.01 ||
        Math.abs(snapped.y - state.dragSession.baseTranslateY) > 0.01;
      hideReorderGuide();
      drawDragGuides(snapped.guides);
      drawSelectedOutline(state.dragSession.element);
      renderCards();
      return;
    }

    const shouldHover = state.mode === 'interaction' ? state.picking : isDesignSelectionMode();
    if (!state.visible || !shouldHover) return;

    const target = findTarget(event.target);
    // Keep inspection and selection as distinct layers. Rendering both for the
    // same node makes the selected state read like a transient hover state.
    const hoverTarget = target && target !== state.selectedEl ? target : null;
    state.hoverEl = hoverTarget;
    drawHoverOutline(hoverTarget);
    if (state.mode === 'design' && state.selectedEl) {
      positionBadge(state.selectedEl, buildSelector(state.selectedEl));
      contextBadge?.classList.add('is-visible');
    } else if (hoverTarget) {
      positionBadge(hoverTarget, buildSelector(hoverTarget));
      contextBadge?.classList.add('is-visible');
    } else if (state.selectedEl) {
      positionBadge(state.selectedEl, buildSelector(state.selectedEl));
      contextBadge?.classList.add('is-visible');
    }
  }

  function onPageClick(event) {
    if (
      state.visible &&
      devCard?.querySelector('.runtime-dev-color-wrap.is-picker-open') &&
      !isInsideOverlay(event.target)
    ) {
      closeColorPickers();
    }

    const shouldPick = state.mode === 'interaction' ? state.picking : isDesignSelectionMode();
    if (!state.visible || !shouldPick) return;
    if (isInsideOverlay(event.target)) return;

    const target = findTarget(event.target);
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    state.selectedEl = target;
    state.hoverEl = null;
    state.picking = state.mode === 'design' ? true : false;
    state.cardVisible = state.mode === 'design' && !!target;
    observeSelectedLayout(target);
    drawSelectedOutline(target);
    hideHover();
    renderToolbar();
    updateToolbarButtons();
    renderCards();
    renderFloatingToolbar();
  }

  function onPointerDown(event) {
    if (!state.visible || state.mode !== 'design' || !state.picking) return;
    if (event.button !== 0) return;
    const resizeHandle = event.target instanceof Element ? event.target.closest('.runtime-resize-handle') : null;
    if (resizeHandle instanceof HTMLElement) {
      if (state.designTool !== 'scale' || !(state.selectedEl instanceof Element)) return;
      event.preventDefault();
      event.stopPropagation();
      startResizeSession(state.selectedEl, resizeHandle.dataset.handle || 'se', event);
      return;
    }
    if (isInsideOverlay(event.target)) return;
    if (state.designTool !== 'move') return;
    const target = findTarget(event.target);
    if (!(target instanceof Element)) return;

    event.preventDefault();
    event.stopPropagation();
    if (state.selectedEl !== target) {
      state.selectedEl = target;
      state.hoverEl = null;
      state.cardVisible = true;
      observeSelectedLayout(target);
      renderToolbar();
      updateToolbarButtons();
      renderCards();
    }

    ensureOriginalSnapshot(target);
    const targetRect = target.getBoundingClientRect();
    state.dragSession = {
      element: target,
      startX: event.clientX,
      startY: event.clientY,
      baseRect: targetRect,
      baseTranslateX: Number.parseFloat(target.dataset.runtimeTranslateX || '0') || 0,
      baseTranslateY: Number.parseFloat(target.dataset.runtimeTranslateY || '0') || 0,
      bounds: getDragBounds(target),
      moveStrategy: getMoveStrategy(target),
      reordered: false,
      hitBoundary: false,
      outsideParent: false,
      changed: false
    };
    drawSelectedOutline(target);
  }

  function onPointerUp() {
    commitDragSession();
  }

  function onWindowBlur() {
    if (state.dragSession) commitDragSession();
    state.colorDrag = null;
  }

  function commitDragSession() {
    if (!(state.dragSession?.element instanceof Element)) return;
    const element = state.dragSession.element;
    const session = state.dragSession;
    const hitBoundary = session.hitBoundary;
    const dragKind = session.kind;
    const outsideParent = !!session.outsideParent;
    state.dragSession = null;
    hideDragGuides();
    hideReorderGuide();
    const rect = element.getBoundingClientRect();
    const baseRect = session.baseRect;
    const currentTranslateX = Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0;
    const currentTranslateY = Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0;
    const isReorder = dragKind !== 'resize' && session.moveStrategy === 'reorder';
    const movedX = dragKind === 'resize'
      ? Math.abs(rect.left - baseRect.left) > 0.5
      : Math.abs(currentTranslateX - (session.baseTranslateX || 0)) > 0.5;
    const movedY = dragKind === 'resize'
      ? Math.abs(rect.top - baseRect.top) > 0.5
      : Math.abs(currentTranslateY - (session.baseTranslateY || 0)) > 0.5;
    const resizedWidth = dragKind === 'resize' && Math.abs(rect.width - baseRect.width) > 0.5;
    const resizedHeight = dragKind === 'resize' && Math.abs(rect.height - baseRect.height) > 0.5;
    const changed = session.changed || movedX || movedY || resizedWidth || resizedHeight;

    if (!changed) {
      refreshSelectionUI();
      return;
    }

    if (isReorder) {
      recordAdjustment(element, '__order', String(getSiblingIndex(element) + 1));
    } else {
      if (movedX) recordAdjustment(element, 'x', String(Math.round(rect.left)));
      if (movedY) recordAdjustment(element, 'y', String(Math.round(rect.top)));
    }
    if (dragKind !== 'resize' && outsideParent) {
      recordAdjustment(element, '__moveScope', 'cross-parent-visual');
    }
    if (resizedWidth) recordAdjustment(element, 'width', String(Math.round(rect.width)));
    if (resizedHeight) recordAdjustment(element, 'height', String(Math.round(rect.height)));
    refreshConstraintBaseline(element);
    renderCards();
    showSizeBadge(
      element,
      rect,
      outsideParent
        ? '已拖出原容器，后续按高风险移动处理'
        : hitBoundary
          ? '已限制在原容器内移动'
          : ''
    );
  }

  function onKeyDown(event) {
    if (!state.visible) return;
    if (event.key !== 'Escape') return;

    state.picking = false;
    state.hoverEl = null;
    if (state.selectedEl) {
      drawSelectedOutline(state.selectedEl);
    } else {
      hideHover();
    }
    renderToolbar();
    updateToolbarButtons();
    renderFloatingToolbar();
  }

  function onViewportChange() {
    applyConstraintLayoutToAll();
    refreshSelectionUI();
  }

  function renderCards() {
    if (!interactionCard || !interactionSideCard || !devCard || !contextBadge) return;

    const selected = state.selectedEl;
    const selector = selected ? buildSelector(selected) : 'Div button';
    const rect = selected ? selected.getBoundingClientRect() : null;
    const style = selected ? window.getComputedStyle(selected) : null;

    contextBadge.textContent = selector;
    if (selected) {
      positionBadge(selected, selector);
      contextBadge.classList.add('is-visible');
    } else {
      contextBadge.classList.remove('is-visible');
    }

    const interactionInputs = interactionCard.querySelectorAll('.runtime-note-input');
    const interactionSidePanel = interactionSideCard.querySelector('.runtime-interaction-side-panel');
    const devPanel = devCard.querySelector('.runtime-dev-panel');
    const devTabs = Array.from(devCard.querySelectorAll('.runtime-note-tab'));
    const selectedKey = selected ? buildSelector(selected) : '';
    const savedAnnotation = selectedKey ? state.annotations.get(selectedKey) ?? { interaction: '', other: '' } : { interaction: '', other: '' };

    interactionInputs.forEach((node) => {
      if (!(node instanceof HTMLTextAreaElement)) return;
      node.dataset.selector = selectedKey;
      const field = node.dataset.noteField;
      node.value = field === 'other' ? savedAnnotation.other || '' : savedAnnotation.interaction || '';
    });

    devTabs.forEach((tabButton) => {
      tabButton.classList.toggle('is-active', tabButton.dataset.tab === state.devTab);
    });

    const activeDevInput =
      document.activeElement instanceof HTMLElement &&
      document.activeElement.closest('.runtime-note-card-dev') === devCard
        ? document.activeElement
        : null;
    const preserveDevPanel =
      devPanel instanceof HTMLElement &&
      state.devTab === 'edit' &&
      !!selected &&
      !!devInputDraft &&
      activeDevInput instanceof HTMLElement &&
      devPanel.dataset.selectedKey === selectedKey &&
      devPanel.dataset.tab === state.devTab;

    if (devPanel instanceof HTMLElement && !preserveDevPanel) {
      if (!selected && state.devTab === 'edit') {
        devPanel.innerHTML = `<div class="runtime-dev-empty">请选择一个网页元素...</div>`;
      } else if (state.devTab === 'adjustments') {
        devPanel.innerHTML = buildAdjustmentsPanelMarkup();
      } else {
        devPanel.innerHTML = selected
          ? buildDevPanelMarkup(selected, selector, rect, style)
          : `<div class="runtime-dev-empty">请选择一个网页元素...</div>`;
      }
      devPanel.dataset.selectedKey = selectedKey;
      devPanel.dataset.tab = state.devTab;
    }
    if (!devCard.querySelector('.runtime-dev-color-wrap.is-picker-open')) {
      devCard.classList.remove('has-color-picker');
      state.colorDrag = null;
    }

    if (devInputDraft && devPanel instanceof HTMLElement) {
      const activeInput = devPanel.querySelector(`[data-prop="${CSS.escape(devInputDraft.prop)}"]`);
      if (activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement) {
        activeInput.value = devInputDraft.value;
        if (!preserveDevPanel) {
          queueMicrotask(() => {
            try {
              activeInput.focus();
              const end = activeInput.value.length;
              activeInput.setSelectionRange?.(end, end);
            } catch {}
          });
        }
      }
    }

    const showInteraction = state.cardVisible && !!selected && state.mode === 'interaction';
    const showInteractionSide = state.mode === 'interaction' && !!selected && state.interactionSideVisible;
    const showDev = state.cardVisible && state.mode === 'design' && (state.devTab === 'adjustments' || !!selected);

    interactionCard.classList.toggle('is-visible', showInteraction);
    interactionSideCard.classList.toggle('is-visible', showInteractionSide);
    devCard.classList.toggle('is-visible', showDev);
    if (showInteraction && selected) {
      positionInteractionCard(selected);
    }
    if (interactionSidePanel instanceof HTMLElement) {
      interactionSidePanel.innerHTML = showInteractionSide && selected
        ? buildInteractionPanelMarkup(selected, selector, savedAnnotation)
        : `<div class="runtime-dev-empty">请选择一个网页元素并添加交互说明。</div>`;
    }
    if (showInteractionSide) {
      positionInteractionSideCard();
    }
    if (showDev) {
      positionDevCard();
    }
  }

  function renderToolbar() {
    if (!toolbar) return;

    toolbar.dataset.mode = 'design';
    shadowRoot?.getElementById('runtime-code-mode-root')?.classList.toggle(
      'is-move-mode',
      state.mode === 'design' && state.designTool === 'move'
    );
    if (!toolbar.dataset.ready) {
      toolbar.innerHTML = `
        <div class="runtime-toolbar-group runtime-toolbar-group-primary runtime-toolbar-design-only" data-mode="design">
          <button class="runtime-toolbar-segment is-active" data-act="design" aria-label="Design Tuning">
            <img class="runtime-toolbar-icon runtime-toolbar-icon-design" alt="" src="${FIGMA_ASSETS.designActive}" />
            <span>Design Tuning</span>
          </button>
        </div>
        <div class="runtime-toolbar-group runtime-toolbar-group-actions runtime-toolbar-actions-only">
          <button class="runtime-toolbar-icon-button" data-act="edit" aria-label="编辑" data-tooltip="编辑">
            <img class="runtime-toolbar-icon runtime-toolbar-icon-tool-small" alt="" src="${FIGMA_ASSETS.pickActiveDesign}" />
          </button>
          <button class="runtime-toolbar-icon-button" data-act="move" aria-label="移动" data-tooltip="移动">
            <img class="runtime-toolbar-icon runtime-toolbar-icon-tool-small" alt="" src="${FIGMA_ASSETS.moveInactive}" />
          </button>
          <button class="runtime-toolbar-icon-button" data-act="scale" aria-label="缩放" data-tooltip="缩放">
            <img class="runtime-toolbar-icon runtime-toolbar-icon-tool-small" alt="" src="${FIGMA_ASSETS.editInactive}" />
          </button>
          <button class="runtime-toolbar-icon-button runtime-toolbar-close-button" data-act="close" aria-label="关闭" data-tooltip="关闭">
            <img class="runtime-toolbar-icon runtime-toolbar-icon-tool-small" alt="" src="${FIGMA_ASSETS.close}" />
          </button>
        </div>
      `;
      toolbar.dataset.ready = 'true';
    }

    const moveButton = toolbar.querySelector('[data-act="move"]');
    const editButton = toolbar.querySelector('[data-act="edit"]');
    const scaleButton = toolbar.querySelector('[data-act="scale"]');
    if (moveButton instanceof HTMLElement) {
      moveButton.classList.toggle('is-accent', state.designTool === 'move');
    }
    if (editButton instanceof HTMLElement) {
      editButton.classList.toggle('is-accent', state.designTool === 'edit');
    }
    if (scaleButton instanceof HTMLElement) {
      scaleButton.classList.toggle('is-accent', state.designTool === 'scale');
    }
  }

  function updateToolbarButtons() {
    if (!toolbar) return;

    toolbar.querySelectorAll('.runtime-toolbar-segment').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.act === state.mode);
    });

    const scaleButton = toolbar.querySelector('[data-act="scale"]');
    if (scaleButton instanceof HTMLElement) {
      scaleButton.classList.toggle('is-accent', state.designTool === 'scale');
    }
  }

  function drawHoverOutline(element) {
    if (!hoverOutline || !element) return hideHover();

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const paddingTop = clampPadding(style.paddingTop, rect.height);
    const paddingRight = clampPadding(style.paddingRight, rect.width);
    const paddingBottom = clampPadding(style.paddingBottom, rect.height);
    const paddingLeft = clampPadding(style.paddingLeft, rect.width);
    const contentWidth = Math.max(0, rect.width - paddingLeft - paddingRight);
    const contentHeight = Math.max(0, rect.height - paddingTop - paddingBottom);

    hoverOutline.classList.add('is-visible');
    hoverOutline.style.left = `${rect.left}px`;
    hoverOutline.style.top = `${rect.top}px`;
    hoverOutline.style.width = `${rect.width}px`;
    hoverOutline.style.height = `${rect.height}px`;

    const topRegion = hoverOutline.querySelector('.runtime-padding-top');
    const rightRegion = hoverOutline.querySelector('.runtime-padding-right');
    const bottomRegion = hoverOutline.querySelector('.runtime-padding-bottom');
    const leftRegion = hoverOutline.querySelector('.runtime-padding-left');
    const contentBox = hoverOutline.querySelector('.runtime-content-box');
    setBox(topRegion, 0, 0, rect.width, paddingTop);
    setBox(rightRegion, rect.width - paddingRight, paddingTop, paddingRight, contentHeight);
    setBox(bottomRegion, 0, rect.height - paddingBottom, rect.width, paddingBottom);
    setBox(leftRegion, 0, paddingTop, paddingLeft, contentHeight);
    setBox(contentBox, paddingLeft, paddingTop, contentWidth, contentHeight);

    placeMeasure(
      hoverOutline.querySelector('.runtime-measure-top'),
      paddingTop,
      rect.width / 2,
      0,
      'top'
    );
    placeMeasure(
      hoverOutline.querySelector('.runtime-measure-right'),
      paddingRight,
      rect.width,
      rect.height / 2,
      'right'
    );
    placeMeasure(
      hoverOutline.querySelector('.runtime-measure-bottom'),
      paddingBottom,
      rect.width / 2,
      rect.height,
      'bottom'
    );
    placeMeasure(
      hoverOutline.querySelector('.runtime-measure-left'),
      paddingLeft,
      0,
      rect.height / 2,
      'left'
    );
  }

  function drawSelectedOutline(element) {
    if (!selectedOutline || !element) return hideSelectedOutline();
    const rect = element.getBoundingClientRect();
    selectedOutline.classList.add('is-visible');
    selectedOutline.style.left = `${rect.left}px`;
    selectedOutline.style.top = `${rect.top}px`;
    selectedOutline.style.width = `${rect.width}px`;
    selectedOutline.style.height = `${rect.height}px`;
    const showHandles = state.mode === 'design' && state.designTool === 'scale' && state.selectedEl === element;
    toggleResizeHandles(showHandles, rect.width, rect.height);
    positionBadge(element, buildSelector(element));
  }

  function hideHover() {
    if (!hoverOutline) return;
    hoverOutline.classList.remove('is-visible');
    hoverOutline.style.left = '0px';
    hoverOutline.style.top = '0px';
    hoverOutline.style.width = '0px';
    hoverOutline.style.height = '0px';
    if (!state.selectedEl) {
      toggleResizeHandles(false, 0, 0);
      contextBadge?.classList.remove('is-visible');
    }
  }

  function hideSelectedOutline() {
    if (!selectedOutline) return;
    selectedOutline.classList.remove('is-visible');
    selectedOutline.style.left = '0px';
    selectedOutline.style.top = '0px';
    selectedOutline.style.width = '0px';
    selectedOutline.style.height = '0px';
    toggleResizeHandles(false, 0, 0);
    if (!state.hoverEl) {
      contextBadge?.classList.remove('is-visible');
    }
  }

  function toggleResizeHandles(visible, width, height) {
    if (!selectedOutline) return;
    selectedOutline.querySelectorAll('.runtime-resize-handle').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const shouldShow = visible && width >= 8 && height >= 8;
      node.classList.toggle('is-visible', shouldShow);
    });
  }

  function getDragBounds(element) {
    const parent = element.parentElement;
    if (!parent) return null;
    const rect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const currentX = Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0;
    const currentY = Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0;
    const baseLeft = rect.left - currentX;
    const baseTop = rect.top - currentY;
    return {
      parent,
      parentRect,
      minX: parentRect.left - baseLeft,
      maxX: parentRect.right - rect.width - baseLeft,
      minY: parentRect.top - baseTop,
      maxY: parentRect.bottom - rect.height - baseTop
    };
  }

  function getMoveStrategy(element) {
    const parent = element?.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) return 'bounded';
    const style = window.getComputedStyle(parent);
    const siblings = Array.from(parent.children).filter((child) => {
      if (child === element || !(child instanceof HTMLElement)) return false;
      const childStyle = window.getComputedStyle(child);
      const rect = child.getBoundingClientRect();
      return childStyle.display !== 'none' && childStyle.visibility !== 'hidden' && rect.width > 1 && rect.height > 1;
    });
    if (siblings.length === 0) return 'bounded';
    const elementPosition = window.getComputedStyle(element).position;
    const parentPosition = style.position;
    if (
      siblings.length >= 1 &&
      !['absolute', 'fixed'].includes(elementPosition) &&
      !['absolute', 'fixed'].includes(parentPosition)
    ) {
      return 'reorder';
    }
    return 'bounded';
  }

  function getSiblingOrder(element) {
    const parent = element?.parentElement;
    if (!parent) return '';
    return Array.from(parent.children).map((child) => getElementRecordKey(child)).join('|');
  }

  function getSiblingIndex(element) {
    const parent = element?.parentElement;
    return parent ? Array.from(parent.children).indexOf(element) : -1;
  }

  function getResizeBounds(element) {
    const parent = element.parentElement;
    if (!parent) return null;
    return parent.getBoundingClientRect();
  }

  function getSnappedDragPosition(element, nextX, nextY, bounds = null) {
    const SNAP = 6;
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const currentX = Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0;
    const currentY = Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0;
    const baseLeft = rect.left - currentX;
    const baseTop = rect.top - currentY;

    let candidateLeft = baseLeft + nextX;
    let candidateTop = baseTop + nextY;
    let bestVX = null;
    let bestVGuide = null;
    let bestHY = null;
    let bestHGuide = null;

    const candidates = collectSnapCandidates(element);
    const myVerticals = [
      { type: 'left', value: candidateLeft },
      { type: 'center', value: candidateLeft + width / 2 },
      { type: 'right', value: candidateLeft + width }
    ];
    const myHorizontals = [
      { type: 'top', value: candidateTop },
      { type: 'center', value: candidateTop + height / 2 },
      { type: 'bottom', value: candidateTop + height }
    ];

    candidates.forEach((item) => {
      myVerticals.forEach((mine) => {
        const diff = item.vertical - mine.value;
        if (Math.abs(diff) <= SNAP && (bestVX == null || Math.abs(diff) < Math.abs(bestVX))) {
          bestVX = diff;
          bestVGuide = item.vertical;
        }
      });
      myHorizontals.forEach((mine) => {
        const diff = item.horizontal - mine.value;
        if (Math.abs(diff) <= SNAP && (bestHY == null || Math.abs(diff) < Math.abs(bestHY))) {
          bestHY = diff;
          bestHGuide = item.horizontal;
        }
      });
    });

    if (bestVX != null) candidateLeft += bestVX;
    if (bestHY != null) candidateTop += bestHY;

    let clamped = false;
    let insideParent = true;
    if (bounds?.parentRect) {
      insideParent =
        candidateLeft >= bounds.parentRect.left &&
        candidateTop >= bounds.parentRect.top &&
        candidateLeft + width <= bounds.parentRect.right &&
        candidateTop + height <= bounds.parentRect.bottom;

      if (insideParent) {
        const boundedLeft = Math.min(bounds.maxX + baseLeft, Math.max(bounds.minX + baseLeft, candidateLeft));
        const boundedTop = Math.min(bounds.maxY + baseTop, Math.max(bounds.minY + baseTop, candidateTop));
        clamped = boundedLeft !== candidateLeft || boundedTop !== candidateTop;
        candidateLeft = boundedLeft;
        candidateTop = boundedTop;
      }
    }

    return {
      x: candidateLeft - baseLeft,
      y: candidateTop - baseTop,
      guides: {
        vertical: bestVGuide,
        horizontal: bestHGuide
      },
      clamped,
      insideParent
    };
  }

  function maybeReorderWithinParent(element, pointerX, pointerY, bounds) {
    const parent = bounds?.parent;
    if (!(parent instanceof Element)) return null;
    const siblings = Array.from(parent.children).filter((child) => child !== element);
    if (!siblings.length) return null;

    const parentStyle = window.getComputedStyle(parent);
    const isGrid = parentStyle.display === 'grid' || parentStyle.display === 'inline-grid';
    const gridColumns = isGrid ? parentStyle.gridTemplateColumns.split(' ').filter(Boolean).length : 0;
    const direction = isGrid
      ? (gridColumns > 1 ? 'row' : 'column')
      : (parentStyle.flexDirection?.startsWith('row') ? 'row' : 'column');

    let inserted = false;
    let guide = null;
    for (const sibling of siblings) {
      if (!(sibling instanceof HTMLElement)) continue;
      const rect = sibling.getBoundingClientRect();
      const threshold = direction === 'row' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      const pointerValue = direction === 'row' ? pointerX : pointerY;
      if (pointerValue < threshold) {
        guide = direction === 'row'
          ? { orientation: 'vertical', x: rect.left, top: rect.top, height: rect.height }
          : { orientation: 'horizontal', y: rect.top, left: rect.left, width: rect.width };
        if (sibling.previousElementSibling !== element) {
          parent.insertBefore(element, sibling);
        }
        inserted = true;
        break;
      }
    }

    if (!inserted && parent.lastElementChild !== element) {
      const last = parent.lastElementChild;
      if (last instanceof HTMLElement) {
        const rect = last.getBoundingClientRect();
        guide = direction === 'row'
          ? { orientation: 'vertical', x: rect.right, top: rect.top, height: rect.height }
          : { orientation: 'horizontal', y: rect.bottom, left: rect.left, width: rect.width };
      }
      parent.appendChild(element);
    }
    return guide;
  }

  function collectSnapCandidates(selected) {
    const values = [];
    const parent = selected.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      values.push(
        { vertical: parentRect.left, horizontal: parentRect.top },
        { vertical: parentRect.left + parentRect.width / 2, horizontal: parentRect.top + parentRect.height / 2 },
        { vertical: parentRect.right, horizontal: parentRect.bottom }
      );
    }

    values.push(
      { vertical: 0, horizontal: 0 },
      { vertical: window.innerWidth / 2, horizontal: window.innerHeight / 2 },
      { vertical: window.innerWidth, horizontal: window.innerHeight }
    );

    const nodes = Array.from(document.body.querySelectorAll('*')).filter((node) => {
      return node instanceof HTMLElement && node !== selected && !selected.contains(node) && !isInsideOverlay(node);
    });
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (rect.width < 8 || rect.height < 8) return;
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
      values.push(
        { vertical: rect.left, horizontal: rect.top },
        { vertical: rect.left + rect.width / 2, horizontal: rect.top + rect.height / 2 },
        { vertical: rect.right, horizontal: rect.bottom }
      );
    });
    return values;
  }

  function drawDragGuides(guides) {
    if (!dragGuides?.v || !dragGuides?.h) return;
    if (guides.vertical != null) {
      dragGuides.v.classList.add('is-visible');
      dragGuides.v.style.left = `${Math.round(guides.vertical)}px`;
    } else {
      dragGuides.v.classList.remove('is-visible');
    }
    if (guides.horizontal != null) {
      dragGuides.h.classList.add('is-visible');
      dragGuides.h.style.top = `${Math.round(guides.horizontal)}px`;
    } else {
      dragGuides.h.classList.remove('is-visible');
    }
  }

  function hideDragGuides() {
    dragGuides?.v?.classList.remove('is-visible');
    dragGuides?.h?.classList.remove('is-visible');
  }

  function drawReorderGuide(meta) {
    if (!(reorderGuide instanceof HTMLElement)) return;
    if (!meta) {
      hideReorderGuide();
      return;
    }
    reorderGuide.classList.add('is-visible');
    if (meta.orientation === 'vertical') {
      reorderGuide.dataset.orientation = 'vertical';
      reorderGuide.style.left = `${Math.round(meta.x)}px`;
      reorderGuide.style.top = `${Math.round(meta.top)}px`;
      reorderGuide.style.width = '2px';
      reorderGuide.style.height = `${Math.round(meta.height)}px`;
    } else {
      reorderGuide.dataset.orientation = 'horizontal';
      reorderGuide.style.left = `${Math.round(meta.left)}px`;
      reorderGuide.style.top = `${Math.round(meta.y)}px`;
      reorderGuide.style.width = `${Math.round(meta.width)}px`;
      reorderGuide.style.height = '2px';
    }
  }

  function hideReorderGuide() {
    if (!(reorderGuide instanceof HTMLElement)) return;
    reorderGuide.classList.remove('is-visible');
    reorderGuide.style.left = '0px';
    reorderGuide.style.top = '0px';
    reorderGuide.style.width = '0px';
    reorderGuide.style.height = '0px';
  }

  function showSizeBadge(element, rect = element.getBoundingClientRect(), extraMessage = '') {
    if (!(sizeBadge instanceof HTMLElement)) return;
    clearTimeout(sizeBadgeTimer);
    sizeBadge.textContent = extraMessage
      ? `W ${Math.round(rect.width)}px  H ${Math.round(rect.height)}px · ${extraMessage}`
      : `W ${Math.round(rect.width)}px  H ${Math.round(rect.height)}px`;
    sizeBadge.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
    sizeBadge.style.top = `${Math.round(rect.bottom + 10)}px`;
    sizeBadge.classList.add('is-visible');
    sizeBadgeTimer = window.setTimeout(() => {
      sizeBadge?.classList.remove('is-visible');
    }, 1400);
  }

  function startResizeSession(element, handle, event) {
    ensureOriginalSnapshot(element);
    const rect = element.getBoundingClientRect();
    state.dragSession = {
      kind: 'resize',
      element,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      baseRect: rect,
      baseWidth: rect.width,
      baseHeight: rect.height,
      baseLeft: rect.left,
      baseTop: rect.top,
      baseRight: rect.right,
      baseBottom: rect.bottom,
      baseTranslateX: Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0,
      baseTranslateY: Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0,
      bounds: getResizeBounds(element),
      hitBoundary: false,
      changed: false
    };
      drawSelectedOutline(element);
  }

  function updateResizeSession(event) {
    if (!(state.dragSession?.element instanceof Element) || state.dragSession.kind !== 'resize') return;
    const { element, handle, startX, startY, baseWidth, baseHeight, baseLeft, baseTop, baseRight, baseBottom, baseTranslateX, baseTranslateY, bounds } = state.dragSession;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const minSize = 8;
    let nextWidth = baseWidth;
    let nextHeight = baseHeight;
    let nextLeft = baseLeft;
    let nextTop = baseTop;

    if (handle.includes('e')) {
      nextWidth = Math.max(minSize, baseWidth + dx);
      if (bounds) nextWidth = Math.min(nextWidth, bounds.right - baseLeft);
    }
    if (handle.includes('s')) {
      nextHeight = Math.max(minSize, baseHeight + dy);
      if (bounds) nextHeight = Math.min(nextHeight, bounds.bottom - baseTop);
    }
    if (handle.includes('w')) {
      nextLeft = baseLeft + dx;
      if (bounds) nextLeft = Math.max(bounds.left, nextLeft);
      if (nextLeft > baseRight - minSize) nextLeft = baseRight - minSize;
      nextWidth = Math.max(minSize, baseRight - nextLeft);
    }
    if (handle.includes('n')) {
      nextTop = baseTop + dy;
      if (bounds) nextTop = Math.max(bounds.top, nextTop);
      if (nextTop > baseBottom - minSize) nextTop = baseBottom - minSize;
      nextHeight = Math.max(minSize, baseBottom - nextTop);
    }

    const clamped =
      nextWidth !== baseWidth + (handle.includes('e') ? dx : 0) ||
      nextHeight !== baseHeight + (handle.includes('s') ? dy : 0) ||
      nextLeft !== baseLeft + (handle.includes('w') ? dx : 0) ||
      nextTop !== baseTop + (handle.includes('n') ? dy : 0);

    element.style.width = `${Math.round(nextWidth)}px`;
    element.style.height = `${Math.round(nextHeight)}px`;
    setTransformPosition(
      element,
      baseTranslateX + (nextLeft - baseLeft),
      baseTranslateY + (nextTop - baseTop)
    );
    state.dragSession.hitBoundary = clamped;
    state.dragSession.changed =
      Math.abs(nextWidth - baseWidth) > 0.01 ||
      Math.abs(nextHeight - baseHeight) > 0.01 ||
      Math.abs(nextLeft - baseLeft) > 0.01 ||
      Math.abs(nextTop - baseTop) > 0.01;
    drawSelectedOutline(element);
    renderCards();
  }

  function positionBadge(element, selector) {
    if (!contextBadge) return;
    const rect = element.getBoundingClientRect();
    const placeBelow = rect.top < 32;
    contextBadge.textContent = selector;
    contextBadge.style.left = `${Math.round(rect.left)}px`;
    contextBadge.style.top = `${Math.round(placeBelow ? rect.bottom : rect.top - 4)}px`;
    contextBadge.dataset.placement = placeBelow ? 'below' : 'above';
  }

  function positionInteractionCard(element) {
    if (!interactionCard) return;
    const rect = element.getBoundingClientRect();
    const cardWidth = 240;
    const cardHeight = 130;
    const gap = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right + gap;
    let top = rect.top;

    if (left + cardWidth > viewportWidth - 12) {
      left = rect.left - cardWidth - gap;
    }
    if (left < 12) {
      left = Math.min(viewportWidth - cardWidth - 12, Math.max(12, rect.left));
      top = rect.bottom + gap;
    }
    if (top + cardHeight > viewportHeight - 12) {
      top = Math.max(12, viewportHeight - cardHeight - 12);
    }

    interactionCard.style.left = `${Math.round(left)}px`;
    interactionCard.style.top = `${Math.round(top)}px`;
    interactionCard.style.right = 'auto';
  }

  function positionInteractionSideCard() {
    if (!interactionSideCard) return;
    interactionSideCard.style.right = '20px';
    interactionSideCard.style.top = '20px';
    interactionSideCard.style.left = 'auto';
  }

  function positionDevCard() {
    if (!devCard) return;
    devCard.style.right = '20px';
    devCard.style.top = '20px';
    devCard.style.left = 'auto';
  }

  function clampPadding(value, maxSize) {
    const parsed = Number.parseFloat(value || '0');
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(parsed, Math.max(0, maxSize / 2)));
  }

  function setBox(node, left, top, width, height) {
    if (!(node instanceof HTMLElement)) return;
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
    node.style.width = `${Math.max(0, width)}px`;
    node.style.height = `${Math.max(0, height)}px`;
    if (node.classList.contains('runtime-padding-region')) {
      node.style.backgroundPosition = `${-left}px ${-top}px`;
    }
    node.style.display = width > 0 && height > 0 ? 'block' : 'none';
  }

  function placeMeasure(node, value, anchorX, anchorY, side) {
    if (!(node instanceof HTMLElement)) return;

    if (value < 4) {
      node.classList.remove('is-visible');
      return;
    }

    node.textContent = `${Math.round(value)}`;
    node.classList.add('is-visible');

    if (side === 'top') {
      node.style.left = `${anchorX}px`;
      node.style.top = `0px`;
      node.style.transform = 'translate(-50%, -50%)';
      return;
    }

    if (side === 'bottom') {
      node.style.left = `${anchorX}px`;
      node.style.top = `${anchorY}px`;
      node.style.transform = 'translate(-50%, -50%)';
      return;
    }

    if (side === 'left') {
      node.style.left = `0px`;
      node.style.top = `${anchorY}px`;
      node.style.transform = 'translate(-50%, -50%)';
      return;
    }

    node.style.left = `${anchorX}px`;
    node.style.top = `${anchorY}px`;
    node.style.transform = 'translate(-50%, -50%)';
  }

  function findTarget(target) {
    let element = target instanceof Element ? target : null;

    while (element && element !== document.body) {
      if (isInsideOverlay(element)) return null;

      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      if (
        rect.width > 6 &&
        rect.height > 6 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      ) {
        return element;
      }

      element = element.parentElement;
    }

    return document.body;
  }

  function buildSelector(element) {
    if (element === document.body) return 'body';
    if (element.id) return `#${CSS.escape(element.id)}`;

    const classes = Array.from(element.classList || [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.map((item) => CSS.escape(item)).join('.')}`;
    }

    return element.tagName.toLowerCase();
  }

  function getElementRecordKey(element) {
    if (!(element instanceof HTMLElement)) {
      return buildSelector(element);
    }
    if (!element.dataset.runtimeRecordKey) {
      elementKeySeed += 1;
      element.dataset.runtimeRecordKey = `record-${elementKeySeed}`;
    }
    return element.dataset.runtimeRecordKey;
  }

  function buildPanelLabel(element) {
    if (element instanceof HTMLInputElement) {
      return element.placeholder || element.value || buildSelector(element);
    }
    if (element instanceof HTMLTextAreaElement) {
      return element.placeholder || element.value || buildSelector(element);
    }
    const directText = getEditableText(element).trim().replace(/\s+/g, ' ');
    if (directText) return directText;
    const aria = element.getAttribute('aria-label') || element.getAttribute('title');
    if (aria) return aria.trim();
    return buildSelector(element);
  }

  function isInsideOverlay(target) {
    return shadowHost?.contains(target) ?? false;
  }

  function refreshSelectionUI() {
    if (!state.visible) return;

    if (state.selectedEl && state.selectedEl.isConnected) {
      drawSelectedOutline(state.selectedEl);
      if (state.mode === 'interaction' && state.cardVisible) {
        positionInteractionCard(state.selectedEl);
      }
      if (state.mode === 'interaction' && state.interactionSideVisible) {
        positionInteractionSideCard();
      }
      if (state.mode === 'design') {
        renderFloatingToolbar();
      }
      if (state.cardVisible || state.interactionSideVisible) {
        renderCards();
      } else {
        positionBadge(state.selectedEl, buildSelector(state.selectedEl));
      }
      return;
    }

    if (state.hoverEl && state.hoverEl.isConnected && state.picking) {
      drawHoverOutline(state.hoverEl);
      if (state.hoverEl !== state.selectedEl) {
        positionBadge(state.hoverEl, buildSelector(state.hoverEl));
      }
      return;
    }

    hideHover();
    if (!state.selectedEl) hideSelectedOutline();
  }

  function observeSelectedLayout(element) {
    layoutObserver?.disconnect();
    if (!(element instanceof Element) || typeof ResizeObserver === 'undefined') return;
    layoutObserver = new ResizeObserver(() => {
      applyConstraintLayoutToAll();
      refreshSelectionUI();
    });
    layoutObserver.observe(element);
    if (element.parentElement) {
      layoutObserver.observe(element.parentElement);
    }
  }

  function onInteractionInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    if (!target.classList.contains('runtime-note-input')) return;
    const selector = target.dataset.selector;
    if (!selector) return;
    const existing = state.annotations.get(selector) ?? { interaction: '', other: '' };
    const field = target.dataset.noteField === 'other' ? 'other' : 'interaction';
    existing[field] = target.value;
    state.annotations.set(selector, existing);
  }

  function onInteractionCardClick(event) {
    const closeButton = event.target.closest('[data-act="hide-card"]');
    if (closeButton instanceof HTMLButtonElement) {
      state.cardVisible = false;
      renderCards();
      return;
    }

    const button = event.target.closest('[data-act="confirm-interaction-note"]');
    if (!(button instanceof HTMLButtonElement)) return;
    if (!state.selectedEl) return;
    const selector = buildSelector(state.selectedEl);
    const current = state.annotations.get(selector) ?? { interaction: '', other: '' };
    state.annotations.set(selector, {
      interaction: current.interaction || '',
      other: current.other || ''
    });
    state.cardVisible = false;
    state.interactionSideVisible = true;
    renderCards();
  }

  function buildInteractionPanelMarkup(element, selector, annotation) {
    const title = buildPanelLabel(element);
    const interaction = (annotation?.interaction || '').trim();
    const other = (annotation?.other || '').trim();
    return `
      <div class="runtime-interaction-panel">
        <section class="runtime-interaction-summary">
          <div class="runtime-interaction-summary-title" title="${escapeAttr(title)}">${escapeHtml(title)}</div>
          <div class="runtime-interaction-summary-meta">${escapeHtml(selector)}</div>
        </section>
        <section class="runtime-interaction-section">
          <div class="runtime-interaction-section-title">交互说明</div>
          <div class="runtime-interaction-section-body">${interaction ? escapeHtml(interaction) : '暂无交互说明'}</div>
        </section>
        <section class="runtime-interaction-section">
          <div class="runtime-interaction-section-title">其他说明</div>
          <div class="runtime-interaction-section-body">${other ? escapeHtml(other) : '暂无其他说明'}</div>
        </section>
      </div>
    `;
  }

  function onDevInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    if (!target.classList.contains('runtime-dev-input')) return;
    if (!state.selectedEl) return;

    const prop = target.dataset.prop;
    if (target instanceof HTMLSelectElement || target.type === 'color') {
      const value = target.value;
      applyDevEdit(state.selectedEl, prop, value);
      if (target.type === 'color') {
        syncColorControlState(target, target.value.replace('#', ''));
      }
      devInputDraft = null;
      drawSelectedOutline(state.selectedEl);
      renderCards();
      return;
    }

    if (target.dataset.format === 'hex-raw') {
      const sanitized = target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
      if (target.value !== sanitized) target.value = sanitized;
      devInputDraft = { prop, value: sanitized };
      syncColorControlState(target, sanitized);
      return;
    }
    devInputDraft = { prop, value: target.value };
  }

  function onDevInputCommit(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains('runtime-dev-input')) return;
    if (state.selectedEl && target.dataset.prop) {
      let value = target.value;
      if (target.dataset.format === 'hex-raw') {
        const sanitized = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
        if (!sanitized || !isValidHexDraft(sanitized)) {
          devInputDraft = null;
          renderCards();
          return;
        }
        target.value = sanitized;
        value = `#${expandHexColor(sanitized)}`;
      }
      applyDevEdit(state.selectedEl, target.dataset.prop, value);
      drawSelectedOutline(state.selectedEl);
    }
    devInputDraft = null;
    const related = event.relatedTarget;
    const switchingInside = related instanceof Element && related.closest('.runtime-note-card-dev');
    if (!switchingInside) {
      renderCards();
    }
  }

  function onDevInputKeyDown(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (!target.classList.contains('runtime-dev-input')) return;
    if (!state.selectedEl) return;

    if (event.key === 'Enter' && !(target instanceof HTMLTextAreaElement)) {
      event.preventDefault();
      onDevInputCommit(event);
      return;
    }

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const prop = target.dataset.prop;
    if (!supportsStepper(prop)) return;
    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? getStepForProp(prop) : -getStepForProp(prop);
    nudgeDevInput(target, delta);
  }

  function onDevCardClick(event) {
    const closeButton = event.target.closest('[data-act="hide-card"]');
    if (closeButton instanceof HTMLButtonElement) {
      closeColorPickers();
      state.cardVisible = false;
      renderCards();
      return;
    }

    const colorTrigger = event.target.closest('.runtime-dev-color-trigger');
    if (colorTrigger instanceof HTMLButtonElement) {
      const wrap = colorTrigger.closest('.runtime-dev-color-wrap');
      if (wrap instanceof HTMLElement) {
        const isOpen = wrap.classList.contains('is-picker-open');
        closeColorPickers();
        if (!isOpen) {
          const triggerRect = colorTrigger.getBoundingClientRect();
          wrap.dataset.pickerPlacement = window.innerHeight - triggerRect.bottom < 176 ? 'above' : 'below';
          wrap.classList.add('is-picker-open');
          devCard?.classList.add('has-color-picker');
          syncColorPickerVisual(wrap);
        }
      }
      return;
    }

    const tabButton = event.target.closest('[data-act="switch-dev-tab"]');
    if (tabButton instanceof HTMLButtonElement) {
      state.devTab = tabButton.dataset.tab === 'adjustments' ? 'adjustments' : 'edit';
      state.cardVisible = true;
      renderCards();
      return;
    }

    const copyButton = event.target.closest('[data-act="copy-adjustment-prompt"]');
    if (copyButton instanceof HTMLButtonElement) {
      void copyAdjustmentPrompt(copyButton);
      return;
    }

    const removeAdjustmentButton = event.target.closest('[data-act="remove-adjustment"]');
    if (removeAdjustmentButton instanceof HTMLButtonElement) {
      const key = removeAdjustmentButton.dataset.key;
      if (key) {
        restoreAdjustmentTarget(key);
        state.adjustments.delete(key);
        renderCards();
      }
      return;
    }

    const clearAdjustmentsButton = event.target.closest('[data-act="clear-adjustments"]');
    if (clearAdjustmentsButton instanceof HTMLButtonElement) {
      Array.from(state.adjustments.keys()).forEach((key) => restoreAdjustmentTarget(key));
      state.adjustments.clear();
      renderCards();
      refreshSelectionUI();
      return;
    }

    const effectButton = event.target.closest('[data-act="add-effect"], [data-act="remove-effect"]');
    if (effectButton instanceof HTMLButtonElement && state.selectedEl) {
      if (effectButton.dataset.act === 'add-effect') {
        state.selectedEl.dataset.runtimeEffectEnabled = 'true';
        state.selectedEl.dataset.runtimeEffectX ||= '0';
        state.selectedEl.dataset.runtimeEffectY ||= '4';
        state.selectedEl.dataset.runtimeEffectBlur ||= '12';
        state.selectedEl.dataset.runtimeEffectSpread ||= '0';
        state.selectedEl.dataset.runtimeEffectColor ||= '#000000';
        state.selectedEl.dataset.runtimeEffectOpacity ||= '0.16';
        syncRuntimeEffects(state.selectedEl);
        recordAdjustment(state.selectedEl, 'effectEnabled', 'true');
      } else {
        state.selectedEl.dataset.runtimeEffectEnabled = 'false';
        syncRuntimeEffects(state.selectedEl);
        recordAdjustment(state.selectedEl, 'effectEnabled', 'false');
      }
      renderCards();
      return;
    }

    const button = event.target.closest('.runtime-dev-stepper-button');
    if (!(button instanceof HTMLButtonElement)) return;
    if (!devCard || !state.selectedEl) return;
    const inputWrap = button.closest('.runtime-dev-compact-input-wrap');
    const input = inputWrap?.querySelector('.runtime-dev-input');
    if (!(input instanceof HTMLInputElement)) return;
    const delta = button.dataset.direction === 'up' ? getStepForProp(input.dataset.prop) : -getStepForProp(input.dataset.prop);
    nudgeDevInput(input, delta);
  }

  function onDevCardPointerDown(event) {
    const target = event.target instanceof Element ? event.target : null;
    const surface = target?.closest('.runtime-dev-color-surface');
    const hue = target?.closest('.runtime-dev-color-hue');
    if (!(surface instanceof HTMLElement) && !(hue instanceof HTMLElement)) return;
    const wrap = (surface || hue)?.closest('.runtime-dev-color-wrap');
    if (!(wrap instanceof HTMLElement)) return;
    const input = wrap.querySelector('.runtime-dev-input-chip-color');
    if (!(input instanceof HTMLInputElement) || !state.selectedEl) return;

    event.preventDefault();
    event.stopPropagation();
    wrap.classList.add('is-picker-open');
    devCard?.classList.add('has-color-picker');
    state.colorDrag = {
      pointerId: event.pointerId,
      kind: surface instanceof HTMLElement ? 'surface' : 'hue',
      wrap,
      prop: input.dataset.prop || '',
      hue: Number.parseFloat(wrap.dataset.hue || '0') || 0
    };
    updateColorFromPointer(event);
  }

  function onColorPointerMove(event) {
    if (!state.colorDrag) return;
    event.preventDefault();
    updateColorFromPointer(event);
  }

  function onColorPointerUp(event) {
    if (!state.colorDrag) return;
    if (event.pointerId === state.colorDrag.pointerId) {
      state.colorDrag = null;
    }
  }

  function updateColorFromPointer(event) {
    const drag = state.colorDrag;
    if (!drag || !state.selectedEl) return;
    const node = drag.kind === 'surface'
      ? drag.wrap.querySelector('.runtime-dev-color-surface')
      : drag.wrap.querySelector('.runtime-dev-color-hue');
    if (!(node instanceof HTMLElement)) return;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    if (drag.kind === 'surface') {
      const saturation = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
      const value = clampNumber(1 - (event.clientY - rect.top) / rect.height, 0, 1);
      const hue = Number.parseFloat(drag.wrap.dataset.hue || `${drag.hue}`) || 0;
      applyColorPickerValue(drag.wrap, drag.prop, hsvToHex(hue, saturation, value), hue, saturation, value);
      return;
    }

    const hue = clampNumber((event.clientX - rect.left) / rect.width, 0, 1) * 360;
    const current = readColorPickerHsv(drag.wrap);
    applyColorPickerValue(drag.wrap, drag.prop, hsvToHex(hue, current.saturation, current.value), hue, current.saturation, current.value);
  }

  function applyColorPickerValue(wrap, prop, hex, hue, saturation, value) {
    const colorInput = wrap.querySelector('.runtime-dev-input-chip-color');
    if (!(colorInput instanceof HTMLInputElement) || !state.selectedEl) return;
    const raw = hex.replace('#', '').toUpperCase();
    colorInput.value = raw;
    devInputDraft = null;
    wrap.dataset.hue = `${hue}`;
    wrap.dataset.saturation = `${saturation}`;
    wrap.dataset.value = `${value}`;
    syncColorPickerVisual(wrap, hex, hue, saturation, value);
    applyDevEdit(state.selectedEl, prop, hex);
    drawSelectedOutline(state.selectedEl);
  }

  function closeColorPickers() {
    devCard?.querySelectorAll('.runtime-dev-color-wrap.is-picker-open').forEach((node) => {
      node.classList.remove('is-picker-open');
    });
    devCard?.classList.remove('has-color-picker');
    state.colorDrag = null;
  }

  function nudgeDevInput(input, delta) {
    const prop = input.dataset.prop;
    if (!prop || !state.selectedEl) return;
    const current = parseNumericFieldValue(input.value);
    if (!Number.isFinite(current)) return;
    const next = current + delta;
    const nextDisplay = formatPropValue(prop, next);
    input.value = nextDisplay;
    devInputDraft = { prop, value: nextDisplay };
    const nextApply = input.dataset.format === 'hex-raw' ? `#${input.value.replace(/^#/, '')}` : nextDisplay;
    applyDevEdit(state.selectedEl, prop, nextApply);
    drawSelectedOutline(state.selectedEl);
  }

  function syncColorControlState(target, rawValue) {
    const wrap = target.closest('.runtime-dev-color-wrap');
    if (!(wrap instanceof HTMLElement)) return;
    const safe = isValidHexDraft(rawValue) ? `#${expandHexColor(rawValue)}` : '#000000';
    syncColorPickerVisual(wrap, safe);
  }

  function syncColorPickerVisual(wrap, color = '', hueValue, saturationValue, brightnessValue) {
    if (!(wrap instanceof HTMLElement)) return;
    const input = wrap.querySelector('.runtime-dev-input-chip-color');
    const trigger = wrap.querySelector('.runtime-dev-color-trigger');
    const nativeColor = wrap.querySelector('.runtime-dev-native-color');
    const surface = wrap.querySelector('.runtime-dev-color-surface');
    const surfaceCursor = wrap.querySelector('.runtime-dev-color-surface-cursor');
    const hueCursor = wrap.querySelector('.runtime-dev-color-hue-cursor');
    const fallback = input instanceof HTMLInputElement ? `#${input.value.replace(/^#/, '')}` : '#000000';
    const safe = normalizePickerHex(color || fallback);
    const derived = hexToHsv(safe);
    const preservedHue = Number.parseFloat(wrap.dataset.hue || '0') || 0;
    const hue = Number.isFinite(hueValue)
      ? hueValue
      : derived.saturation === 0
        ? preservedHue
        : derived.hue;
    const saturation = Number.isFinite(saturationValue) ? saturationValue : derived.saturation;
    const value = Number.isFinite(brightnessValue) ? brightnessValue : derived.value;

    wrap.dataset.hue = `${hue}`;
    wrap.dataset.saturation = `${saturation}`;
    wrap.dataset.value = `${value}`;
    if (trigger instanceof HTMLElement) trigger.style.background = safe;
    if (nativeColor instanceof HTMLInputElement) nativeColor.value = safe;
    if (surface instanceof HTMLElement) surface.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
    if (surfaceCursor instanceof HTMLElement) {
      surfaceCursor.style.left = `${saturation * 100}%`;
      surfaceCursor.style.top = `${(1 - value) * 100}%`;
    }
    if (hueCursor instanceof HTMLElement) hueCursor.style.left = `${(hue / 360) * 100}%`;
  }

  function readColorPickerHsv(wrap) {
    return {
      hue: Number.parseFloat(wrap.dataset.hue || '0') || 0,
      saturation: clampNumber(Number.parseFloat(wrap.dataset.saturation || '0') || 0, 0, 1),
      value: clampNumber(Number.parseFloat(wrap.dataset.value || '1') || 0, 0, 1)
    };
  }

  function onFloatingToolbarClick(event) {
    const button = event.target.closest('button');
    if (!button || !state.selectedEl) return;
    const action = button.dataset.act;

    if (action === 'bold') {
      const current = getComputedStyle(state.selectedEl).fontWeight;
      applyDevEdit(state.selectedEl, 'fontWeight', Number(current) >= 600 ? '400' : '700');
    } else if (action === 'italic') {
      const current = getComputedStyle(state.selectedEl).fontStyle;
      applyDevEdit(state.selectedEl, 'fontStyle', current === 'italic' ? 'normal' : 'italic');
    } else if (action === 'underline') {
      const current = getComputedStyle(state.selectedEl).textDecorationLine;
      applyDevEdit(state.selectedEl, 'textDecoration', current.includes('underline') ? 'none' : 'underline');
    } else if (action === 'align-left' || action === 'align-center' || action === 'align-right') {
      applyDevEdit(state.selectedEl, 'textAlign', action.replace('align-', ''));
    } else if (action === 'duplicate') {
      const clone = state.selectedEl.cloneNode(true);
      state.selectedEl.parentNode?.insertBefore(clone, state.selectedEl.nextSibling);
      state.selectedEl = clone;
      observeSelectedLayout(clone);
    } else if (action === 'delete') {
      const next = state.selectedEl.previousElementSibling || state.selectedEl.nextElementSibling;
      state.selectedEl.remove();
      state.selectedEl = next instanceof Element ? next : null;
      if (state.selectedEl) {
        observeSelectedLayout(state.selectedEl);
      } else {
        layoutObserver?.disconnect();
        layoutObserver = null;
      }
    }

    if (state.selectedEl) {
      drawSelectedOutline(state.selectedEl);
    } else {
      hideHover();
      hideSelectedOutline();
    }
    renderCards();
    renderFloatingToolbar();
  }

  function linkIcon() {
    return `
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 6.5 1.5 5a2.12 2.12 0 0 1 3-3l1 1M9 5.5 10.5 7a2.12 2.12 0 0 1-3 3l-1-1M4 8l4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  function caretDownIcon() {
    return `
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  function buildDevPanelMarkup(element, selector, rect, style) {
    const textTarget = resolveTextTarget(element);
    const textStyle = textTarget ? window.getComputedStyle(textTarget) : style;
    const isTextLike = !!textTarget;
    const fontSize = roundPx(textStyle.fontSize);
    const lineHeight = normalizeLineHeight(textStyle.lineHeight, fontSize);
    const letterSpacing = roundPx(textStyle.letterSpacing);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    const x = Math.round(rect.left);
    const y = Math.round(rect.top);
    const radius = `${parseFloat(style.borderTopLeftRadius || '0') || 0}`;
    const radiusTopLeft = `${parseFloat(style.borderTopLeftRadius || '0') || 0}`;
    const radiusTopRight = `${parseFloat(style.borderTopRightRadius || '0') || 0}`;
    const radiusBottomLeft = `${parseFloat(style.borderBottomLeftRadius || '0') || 0}`;
    const radiusBottomRight = `${parseFloat(style.borderBottomRightRadius || '0') || 0}`;
    const background = colorToHex(style.backgroundColor);
    const textColor = colorToHex(textStyle.color);
    const borderColor = colorToHex(style.borderTopColor);
    const borderWidth = `${parseFloat(style.borderTopWidth || '0') || 0}`;
    const opacity = `${Math.round((parseFloat(style.opacity || '1') || 1) * 100)}`;
    const fillOpacity = `${Math.round(getColorAlpha(isTextLike ? textStyle.color : style.backgroundColor) * 100)}`;
    const strokeOpacity = `${Math.round(getColorAlpha(style.borderTopColor) * 100)}`;
    const rotation = `${Math.round(parseFloat(element.dataset.runtimeRotate || '0') || 0)}°`;
    const strokeAlign = element.dataset.runtimeStrokeAlign || 'inside';
    const constraint = element.dataset.runtimeConstraintMode || 'default';
    const fontFamily = cleanFontFamily(textStyle.fontFamily);
    const fontWeight = normalizeFontWeight(textStyle.fontWeight || '400');
    const text = getEditableText(textTarget || element);
    const effectEnabled = element.dataset.runtimeEffectEnabled === 'true';
    const effectX = `${parseFloat(element.dataset.runtimeEffectX || '0') || 0}`;
    const effectY = `${parseFloat(element.dataset.runtimeEffectY || '4') || 4}`;
    const effectBlur = `${parseFloat(element.dataset.runtimeEffectBlur || '12') || 12}`;
    const effectSpread = `${parseFloat(element.dataset.runtimeEffectSpread || '0') || 0}`;
    const effectColor = colorToHex(element.dataset.runtimeEffectColor || '#000000');
    const effectOpacity = `${Math.round((parseFloat(element.dataset.runtimeEffectOpacity || '0.16') || 0.16) * 100)}`;
    if (isTextLike) {
      return `
        <div class="runtime-dev-figma-panel">
          ${sectionBlock('位置', `
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('X', 'x', `${x}`)}
              ${inlineField('Y', 'y', `${y}`)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('宽度', 'width', `${width}`)}
              ${inlineField('高度', 'height', `${height}`)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('旋转', 'rotation', rotation)}
              ${inlineSelect('约束', 'constraints', constraint, [['default','默认'],['center','居中跟随'],['right-bottom','右下跟随'],['stretch-x','水平拉伸'],['stretch-y','垂直拉伸'],['stretch-both','双向拉伸']])}
            </div>
          `)}
          ${sectionBlock('外观', `
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('透明度', 'opacity', opacity, false, '%')}
              ${inlineField('圆角', 'radius', radius)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('圆角-上左', 'borderTopLeftRadius', radiusTopLeft)}
              ${inlineField('圆角-上右', 'borderTopRightRadius', radiusTopRight)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('圆角-下左', 'borderBottomLeftRadius', radiusBottomLeft)}
              ${inlineField('圆角-下右', 'borderBottomRightRadius', radiusBottomRight)}
            </div>
          `)}
          ${sectionBlock('字体排印', `
            <div class="runtime-dev-row">
              ${inlineTextField('字体', 'fontFamily', fontFamily)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineSelect('字重', 'fontWeight', fontWeight, [['400','常规'],['500','中等'],['600','半粗'],['700','加粗']])}
              ${inlineField('字号', 'fontSize', `${fontSize}`)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('行高', 'lineHeight', `${lineHeight}`)}
              ${inlineField('字距', 'letterSpacing', `${letterSpacing}`)}
            </div>
            <div class="runtime-dev-row">
              ${inlineSelect('对齐', 'textAlign', textStyle.textAlign || 'left', [['left','左对齐'],['center','居中'],['right','右对齐']])}
            </div>
            <div class="runtime-dev-row">
              ${inlineTextarea('文本', 'text', text)}
            </div>
          `)}
          ${sectionBlock('填充', `
            <div class="runtime-dev-row runtime-dev-row-fill">
              ${colorControl('color', textColor)}
              ${percentControl('fillOpacity', fillOpacity)}
            </div>
          `)}
          ${sectionBlock('描边', `
            <div class="runtime-dev-row runtime-dev-row-fill">
              ${colorControl('borderColor', borderColor)}
              ${percentControl('strokeOpacity', strokeOpacity)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineSelect('位置', 'strokeAlign', strokeAlign, [['inside','内部'],['center','居中'],['outside','外部']])}
              ${inlineField('宽度', 'borderWidth', borderWidth)}
            </div>
          `)}
          ${sectionBlock('效果', effectEnabled ? `
            <div class="runtime-dev-row runtime-dev-row-fill">
              ${colorControl('effectColor', effectColor)}
              ${percentControl('effectOpacity', effectOpacity)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('X', 'effectX', effectX)}
              ${inlineField('Y', 'effectY', effectY)}
            </div>
            <div class="runtime-dev-row runtime-dev-row-2">
              ${inlineField('模糊', 'effectBlur', effectBlur)}
              ${inlineStatic('扩散', '文本不支持')}
            </div>
          ` : '', effectEnabled ? `<button class="runtime-dev-plus runtime-dev-plus-button" data-act="remove-effect" type="button">-</button>` : `<button class="runtime-dev-plus runtime-dev-plus-button" data-act="add-effect" type="button">+</button>`)}
        </div>
      `;
    }

    return `
      <div class="runtime-dev-figma-panel">
        ${sectionBlock('位置', `
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('X', 'x', `${x}`)}
            ${inlineField('Y', 'y', `${y}`)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('宽度', 'width', `${width}`)}
            ${inlineField('高度', 'height', `${height}`)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('旋转', 'rotation', rotation)}
            ${inlineSelect('约束', 'constraints', constraint, [['default','默认'],['center','居中跟随'],['right-bottom','右下跟随'],['stretch-x','水平拉伸'],['stretch-y','垂直拉伸'],['stretch-both','双向拉伸']])}
          </div>
        `)}
        ${sectionBlock('外观', `
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('透明度', 'opacity', opacity, false, '%')}
            ${inlineField('圆角', 'radius', radius)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('圆角-上左', 'borderTopLeftRadius', radiusTopLeft)}
            ${inlineField('圆角-上右', 'borderTopRightRadius', radiusTopRight)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('圆角-下左', 'borderBottomLeftRadius', radiusBottomLeft)}
            ${inlineField('圆角-下右', 'borderBottomRightRadius', radiusBottomRight)}
          </div>
        `)}
        ${sectionBlock('填充', `
          <div class="runtime-dev-row runtime-dev-row-fill">
            ${colorControl('background', background)}
            ${percentControl('fillOpacity', fillOpacity)}
          </div>
        `)}
        ${sectionBlock('描边', `
          <div class="runtime-dev-row runtime-dev-row-fill">
            ${colorControl('borderColor', borderColor)}
            ${percentControl('strokeOpacity', strokeOpacity)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineSelect('位置', 'strokeAlign', strokeAlign, [['inside','内部'],['center','居中'],['outside','外部']])}
            ${inlineField('宽度', 'borderWidth', borderWidth)}
          </div>
        `)}
        ${sectionBlock('效果', effectEnabled ? `
          <div class="runtime-dev-row runtime-dev-row-fill">
            ${colorControl('effectColor', effectColor)}
            ${percentControl('effectOpacity', effectOpacity)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('X', 'effectX', effectX)}
            ${inlineField('Y', 'effectY', effectY)}
          </div>
          <div class="runtime-dev-row runtime-dev-row-2">
            ${inlineField('模糊', 'effectBlur', effectBlur)}
            ${inlineField('扩散', 'effectSpread', effectSpread)}
          </div>
        ` : '', effectEnabled ? `<button class="runtime-dev-plus runtime-dev-plus-button" data-act="remove-effect" type="button">-</button>` : `<button class="runtime-dev-plus runtime-dev-plus-button" data-act="add-effect" type="button">+</button>`)}
      </div>
    `;
  }

  function buildAdjustmentsPanelMarkup() {
    const items = Array.from(state.adjustments.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    const adjustmentCount = items.reduce(
      (total, item) => total + Object.keys(item.changes || {}).length,
      0
    );
    if (items.length === 0) {
      return `
        <div class="runtime-adjustments-panel">
          <div class="runtime-adjustments-actions">
            <span class="runtime-adjustments-count">共 ${adjustmentCount} 项调整</span>
            <button class="runtime-adjustments-clear" type="button" data-act="clear-adjustments" disabled>清空调整项</button>
          </div>
          <div class="runtime-dev-empty runtime-adjustments-empty">当前还没有调整项，先在“编辑”里修改一个元素。</div>
          <button class="runtime-adjustments-copy" type="button" data-act="copy-adjustment-prompt">复制调整提示词</button>
        </div>
      `;
    }

    const cards = items
      .map((item) => {
        const code = buildAdjustmentCode(item);
        return `
          <article class="runtime-adjustment-card">
            <div class="runtime-adjustment-card-head">
              <div class="runtime-adjustment-card-copy">
                <div class="runtime-adjustment-card-title" title="${escapeAttr(item.label)}">${escapeHtml(item.label)}</div>
                <button class="runtime-adjustment-remove" type="button" data-act="remove-adjustment" data-key="${escapeAttr(item.key)}">删除</button>
              </div>
              <div class="runtime-adjustment-card-meta">${escapeHtml(item.selector)}</div>
            </div>
            <pre class="runtime-adjustment-code"><code>${escapeHtml(code)}</code></pre>
          </article>
        `;
      })
      .join('');

    return `
      <div class="runtime-adjustments-panel">
        <div class="runtime-adjustments-actions">
          <span class="runtime-adjustments-count">共 ${adjustmentCount} 项调整</span>
          <button class="runtime-adjustments-clear" type="button" data-act="clear-adjustments">清空调整项</button>
        </div>
        <div class="runtime-adjustments-list">${cards}</div>
        <button class="runtime-adjustments-copy" type="button" data-act="copy-adjustment-prompt">复制调整提示词</button>
      </div>
    `;
  }

  function applyDevEdit(element, prop, rawValue) {
    if (!element || !prop) return;
    const target = resolveEditingTarget(element, prop);
    ensureOriginalSnapshot(target);
    const value = rawValue ?? '';
    switch (prop) {
      case 'x': {
        const currentRect = element.getBoundingClientRect();
        const targetX = Number.parseFloat(value);
        if (Number.isFinite(targetX)) {
          const dx = targetX - currentRect.left;
          updateTransform(element, dx, null);
          refreshConstraintBaseline(element);
        }
        break;
      }
      case 'y': {
        const currentRect = element.getBoundingClientRect();
        const targetY = Number.parseFloat(value);
        if (Number.isFinite(targetY)) {
          const dy = targetY - currentRect.top;
          updateTransform(element, null, dy);
          refreshConstraintBaseline(element);
        }
        break;
      }
      case 'rotation':
        applyRotation(element, value);
        break;
      case 'constraints':
        applyConstraintMode(element, value);
        break;
      case 'fillOpacity':
        applyColorAlpha(target, isTextElement(target) ? 'color' : 'background', value);
        break;
      case 'strokeOpacity':
        applyColorAlpha(target, 'borderColor', value);
        break;
      case 'strokeAlign':
        applyStrokeAlign(element, value);
        break;
      case 'effectColor':
      case 'effectOpacity':
      case 'effectX':
      case 'effectY':
      case 'effectBlur':
      case 'effectSpread':
        applyEffectValue(target, prop, value);
        break;
      case 'width':
        element.style.width = normalizeUnit(value);
        refreshConstraintBaseline(element);
        break;
      case 'height':
        element.style.height = normalizeUnit(value);
        refreshConstraintBaseline(element);
        break;
      case 'radius':
        element.style.borderRadius = normalizeUnit(value);
        break;
      case 'borderTopLeftRadius':
        element.style.borderTopLeftRadius = normalizeUnit(value);
        break;
      case 'borderTopRightRadius':
        element.style.borderTopRightRadius = normalizeUnit(value);
        break;
      case 'borderBottomLeftRadius':
        element.style.borderBottomLeftRadius = normalizeUnit(value);
        break;
      case 'borderBottomRightRadius':
        element.style.borderBottomRightRadius = normalizeUnit(value);
        break;
      case 'background':
        target.style.background = value || '';
        break;
      case 'color':
        target.style.color = value || '';
        break;
      case 'borderColor':
        target.dataset.runtimeStrokeBaseColor = value || '';
        target.style.borderColor = value || '';
        if (!isTextElement(target)) {
          syncNonTextShadows(target);
        }
        break;
      case 'borderWidth':
        target.style.borderWidth = normalizeUnit(value);
        target.style.borderStyle = Number.parseFloat(value) > 0 ? 'solid' : target.style.borderStyle;
        if (!isTextElement(target)) {
          syncNonTextShadows(target);
        }
        break;
      case 'opacity':
        target.style.opacity = `${Math.max(0, Math.min(100, Number.parseFloat(value) || 0)) / 100}`;
        break;
      case 'fontFamily':
        target.style.fontFamily = value || '';
        break;
      case 'fontWeight':
        target.style.fontWeight = value || '';
        break;
      case 'fontSize':
        target.style.fontSize = normalizeUnit(value);
        break;
      case 'fontStyle':
        target.style.fontStyle = value || '';
        break;
      case 'textDecoration':
        target.style.textDecoration = value || '';
        break;
      case 'lineHeight':
        target.style.lineHeight = normalizeUnit(value);
        break;
      case 'letterSpacing':
        target.style.letterSpacing = normalizeUnit(value);
        break;
      case 'textAlign':
        target.style.textAlign = value || '';
        break;
      case 'text':
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          target.value = value;
        } else {
          target.textContent = value;
        }
        break;
      default:
        break;
    }
    recordAdjustment(target, prop, rawValue);
  }

  function recordAdjustment(element, prop, rawValue) {
    if (!(element instanceof Element) || !prop) return;
    const key = getElementRecordKey(element);
    const selector = buildSelector(element);
    const label = buildPanelLabel(element);
    const existing = state.adjustments.get(key) || {
      key,
      label,
      selector,
      kind: 'style',
      changes: {},
      updatedAt: Date.now()
    };
    existing.label = label;
    existing.selector = selector;
    if (prop === '__moveScope') {
      existing.kind = 'structure';
    }
    existing.changes[prop] = normalizeRecordedValue(prop, rawValue);
    existing.updatedAt = Date.now();
    state.adjustments.set(key, existing);
  }

  function ensureOriginalSnapshot(element) {
    if (!(element instanceof Element)) return;
    const key = getElementRecordKey(element);
    if (state.originals.has(key)) return;
    state.originals.set(key, {
      element,
      parent: element.parentElement,
      nextSibling: element.nextElementSibling,
      style: element.getAttribute('style') || '',
      value: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : null,
      text: !(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement) ? element.textContent ?? '' : null,
      dataset: captureRuntimeDataset(element)
    });
  }

  function captureRuntimeDataset(element) {
    const snapshot = {};
    Object.keys(element.dataset)
      .filter((key) => key.startsWith('runtime'))
      .forEach((key) => {
        snapshot[key] = element.dataset[key];
      });
    return snapshot;
  }

  function restoreAdjustmentTarget(key) {
    const snapshot = state.originals.get(key);
    if (!snapshot) return;
    const element = snapshot.element;
    if (!(element instanceof Element) || !element.isConnected) {
      state.originals.delete(key);
      return;
    }

    if (snapshot.parent instanceof Element && element.parentElement === snapshot.parent) {
      const nextSibling = snapshot.nextSibling;
      if (nextSibling instanceof Element && nextSibling.parentElement === snapshot.parent) {
        snapshot.parent.insertBefore(element, nextSibling);
      } else {
        snapshot.parent.appendChild(element);
      }
    }

    const currentRuntimeKeys = Object.keys(element.dataset).filter((name) => name.startsWith('runtime'));
    currentRuntimeKeys.forEach((name) => {
      if (!(name in snapshot.dataset)) {
        delete element.dataset[name];
      }
    });
    Object.entries(snapshot.dataset).forEach(([name, value]) => {
      element.dataset[name] = value;
    });

    if (snapshot.style) {
      element.setAttribute('style', snapshot.style);
    } else {
      element.removeAttribute('style');
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = snapshot.value ?? '';
    } else if (snapshot.text != null) {
      element.textContent = snapshot.text;
    }

    state.originals.delete(key);
  }

  function normalizeRecordedValue(prop, rawValue) {
    if (rawValue == null) return '';
    const value = String(rawValue);
    if (prop === 'background' || prop === 'color' || prop === 'borderColor' || prop === 'effectColor') {
      return value.startsWith('#') ? value : `#${value.replace(/^#/, '')}`;
    }
    return value;
  }

  function buildAdjustmentCode(item) {
    const lines = Object.entries(item.changes).map(([prop, value]) => `    ${prop}: ${JSON.stringify(value)},`);
    return `// ${item.label}${item.kind === 'structure' ? '（结构调整）' : ''}
const target = ${JSON.stringify(item.selector)};
const patch = {
  label: ${JSON.stringify(item.label)},
  kind: ${JSON.stringify(item.kind || 'style')},
  edits: {
${lines.join('\n')}
  }
};`;
  }

  function buildAdjustmentPrompt() {
    const items = Array.from(state.adjustments.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    if (items.length === 0) {
      return '当前还没有任何调整项。';
    }
    const blocks = items.map((item) => buildAdjustmentCode(item));
    const hasStructure = items.some((item) => item.kind === 'structure');
    return [
      '请根据下面这些网页节点的调整项，直接修改对应页面代码，并保持现有 DOM 结构、布局关系和页面语义不变。',
      '如果某项是样式修改，请优先改对应组件或选择器的样式定义；如果某项是文本修改，请直接更新节点文本或属性。',
      hasStructure ? '其中标记为“结构调整”的项，表示该元素已被拖出原容器或发生高风险位置变更，请谨慎评估是否需要调整父子关系、顺序或布局实现。' : '',
      '',
      ...blocks
    ].filter(Boolean).join('\n');
  }

  async function copyAdjustmentPrompt(button) {
    const text = buildAdjustmentPrompt();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = text;
        fallback.setAttribute('readonly', '');
        fallback.style.position = 'fixed';
        fallback.style.opacity = '0';
        document.body.appendChild(fallback);
        fallback.select();
        const copied = document.execCommand('copy');
        fallback.remove();
        if (!copied) throw new Error('Clipboard copy failed');
      }
      const previous = button.textContent;
      button.textContent = '已复制';
      window.setTimeout(() => {
        button.textContent = previous || '复制调整提示词';
      }, 1200);
    } catch {
      button.textContent = '复制失败';
      window.setTimeout(() => {
        button.textContent = '复制调整提示词';
      }, 1200);
    }
  }

  function updateTransform(element, deltaX, deltaY) {
    const currentX = Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0;
    const currentY = Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0;
    const nextX = deltaX == null ? currentX : currentX + deltaX;
    const nextY = deltaY == null ? currentY : currentY + deltaY;
    if (!element.dataset.runtimeBaseTransform) {
      element.dataset.runtimeBaseTransform = element.style.transform || '';
    }
    element.dataset.runtimeTranslateX = `${nextX}`;
    element.dataset.runtimeTranslateY = `${nextY}`;
    syncTransform(element);
  }

  function setTransformPosition(element, nextX, nextY) {
    if (!element.dataset.runtimeBaseTransform) {
      element.dataset.runtimeBaseTransform = element.style.transform || '';
    }
    element.dataset.runtimeTranslateX = `${nextX}`;
    element.dataset.runtimeTranslateY = `${nextY}`;
    syncTransform(element);
  }

  function applyRotation(element, rawValue) {
    const parsed = Number.parseFloat(`${rawValue}`.replace('°', ''));
    if (!Number.isFinite(parsed)) return;
    element.dataset.runtimeRotate = `${parsed}`;
    syncTransform(element);
  }

  function applyConstraintMode(element, value) {
    const parent = element.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    element.dataset.runtimeConstraintMode = value || 'default';
    element.dataset.runtimeConstraintParentWidth = `${Math.round(parentRect.width)}`;
    element.dataset.runtimeConstraintParentHeight = `${Math.round(parentRect.height)}`;
    element.dataset.runtimeConstraintWidth = `${Math.round(rect.width)}`;
    element.dataset.runtimeConstraintHeight = `${Math.round(rect.height)}`;
    element.dataset.runtimeConstraintTranslateBaseX = `${Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0}`;
    element.dataset.runtimeConstraintTranslateBaseY = `${Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0}`;
    applyConstraintLayout(element);
  }

  function applyConstraintLayoutToAll() {
    document.querySelectorAll('[data-runtime-constraint-mode]').forEach((node) => {
      if (node instanceof Element) applyConstraintLayout(node);
    });
  }

  function applyConstraintLayout(element) {
    const mode = element.dataset.runtimeConstraintMode;
    if (!mode || mode === 'default') return;
    const parent = element.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const baseParentWidth = parseFloat(element.dataset.runtimeConstraintParentWidth || '0') || parentRect.width;
    const baseParentHeight = parseFloat(element.dataset.runtimeConstraintParentHeight || '0') || parentRect.height;
    const baseWidth = parseFloat(element.dataset.runtimeConstraintWidth || '0') || element.getBoundingClientRect().width;
    const baseHeight = parseFloat(element.dataset.runtimeConstraintHeight || '0') || element.getBoundingClientRect().height;
    const deltaW = parentRect.width - baseParentWidth;
    const deltaH = parentRect.height - baseParentHeight;

    if (mode === 'stretch-x' || mode === 'stretch-both') {
      element.style.width = `${Math.max(1, baseWidth + deltaW)}px`;
    }
    if (mode === 'stretch-y' || mode === 'stretch-both') {
      element.style.height = `${Math.max(1, baseHeight + deltaH)}px`;
    }
    if (mode === 'center' || mode === 'right-bottom') {
      const baseTx = parseFloat(element.dataset.runtimeConstraintTranslateBaseX || '0') || 0;
      const baseTy = parseFloat(element.dataset.runtimeConstraintTranslateBaseY || '0') || 0;
      const dx = mode === 'center' ? deltaW / 2 : deltaW;
      const dy = mode === 'center' ? deltaH / 2 : deltaH;
      element.dataset.runtimeTranslateX = `${baseTx + dx}`;
      element.dataset.runtimeTranslateY = `${baseTy + dy}`;
      syncTransform(element);
    }
  }

  function refreshConstraintBaseline(element) {
    if (!element.dataset.runtimeConstraintMode || element.dataset.runtimeConstraintMode === 'default') return;
    const parent = element.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    element.dataset.runtimeConstraintParentWidth = `${Math.round(parentRect.width)}`;
    element.dataset.runtimeConstraintParentHeight = `${Math.round(parentRect.height)}`;
    element.dataset.runtimeConstraintWidth = `${Math.round(rect.width)}`;
    element.dataset.runtimeConstraintHeight = `${Math.round(rect.height)}`;
    element.dataset.runtimeConstraintTranslateBaseX = `${Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0}`;
    element.dataset.runtimeConstraintTranslateBaseY = `${Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0}`;
  }

  function syncTransform(element) {
    if (!element.dataset.runtimeBaseTransform) {
      element.dataset.runtimeBaseTransform = element.style.transform || '';
    }
    const tx = Number.parseFloat(element.dataset.runtimeTranslateX || '0') || 0;
    const ty = Number.parseFloat(element.dataset.runtimeTranslateY || '0') || 0;
    const rotate = Number.parseFloat(element.dataset.runtimeRotate || '0') || 0;
    const base = element.dataset.runtimeBaseTransform || '';
    const transforms = [];
    if (tx !== 0 || ty !== 0) transforms.push(`translate(${tx}px, ${ty}px)`);
    if (rotate !== 0) transforms.push(`rotate(${rotate}deg)`);
    if (base) transforms.push(base);
    element.style.transform = transforms.join(' ').trim();
  }

  function applyColorAlpha(element, kind, rawValue) {
    const alpha = Math.max(0, Math.min(100, Number.parseFloat(rawValue) || 0)) / 100;
    if (kind === 'background') {
      const next = setColorAlpha(window.getComputedStyle(element).backgroundColor, alpha);
      if (next) element.style.backgroundColor = next;
      return;
    }
    if (kind === 'color') {
      const next = setColorAlpha(window.getComputedStyle(element).color, alpha);
      if (next) element.style.color = next;
      return;
    }
    const next = setColorAlpha(window.getComputedStyle(element).borderTopColor, alpha);
    if (next) {
      element.dataset.runtimeStrokeBaseColor = next;
      element.style.borderColor = next;
      if (!isTextElement(element)) {
        syncNonTextShadows(element);
      }
    }
  }

  function applyStrokeAlign(element, value) {
    if (!element.dataset.runtimeBaseShadow) {
      element.dataset.runtimeBaseShadow = element.style.boxShadow || '';
    }
    element.dataset.runtimeStrokeAlign = value;
    syncNonTextShadows(element);
  }

  function applyEffectValue(element, prop, rawValue) {
    if (prop === 'effectColor') {
      element.dataset.runtimeEffectColor = rawValue;
    } else if (prop === 'effectOpacity') {
      const parsed = Math.max(0, Math.min(100, Number.parseFloat(rawValue) || 0)) / 100;
      element.dataset.runtimeEffectOpacity = `${parsed}`;
    } else {
      element.dataset[`runtime${prop.charAt(0).toUpperCase()}${prop.slice(1)}`] = `${Number.parseFloat(rawValue) || 0}`;
    }
    element.dataset.runtimeEffectEnabled = 'true';
    syncRuntimeEffects(element);
  }

  function syncRuntimeEffects(element) {
    if (isTextElement(element)) {
      syncTextEffects(element);
      return;
    }
    syncNonTextShadows(element);
  }

  function syncTextEffects(element) {
    if (!element.dataset.runtimeBaseTextShadow) {
      element.dataset.runtimeBaseTextShadow = element.style.textShadow || '';
    }
    const base = element.dataset.runtimeBaseTextShadow || '';
    const effect = buildEffectShadow(element, true);
    element.style.textShadow = [base, effect].filter(Boolean).join(', ') || 'none';
  }

  function syncNonTextShadows(element) {
    if (!element.dataset.runtimeBaseShadow) {
      element.dataset.runtimeBaseShadow = element.style.boxShadow || '';
    }
    const base = element.dataset.runtimeBaseShadow || '';
    const computed = window.getComputedStyle(element);
    const width = parseFloat(computed.borderTopWidth || '0') || 0;
    const color = element.dataset.runtimeStrokeBaseColor || computed.borderTopColor;
    const align = element.dataset.runtimeStrokeAlign || 'inside';
    const effect = buildEffectShadow(element, false);

    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.borderColor = color;
    const parts = [base];
    if (align === 'outside' && width > 0) {
      element.style.borderColor = 'transparent';
      parts.push(`0 0 0 ${width}px ${color}`);
    } else if (align === 'center' && width > 0) {
      element.style.borderColor = 'transparent';
      const inner = Math.max(1, width / 2);
      const outer = Math.max(0, width - inner);
      parts.push(`inset 0 0 0 ${inner}px ${color}`);
      if (outer > 0) parts.push(`0 0 0 ${outer}px ${color}`);
    }
    if (effect) parts.push(effect);
    element.style.boxShadow = parts.filter(Boolean).join(', ') || 'none';
  }

  function buildEffectShadow(element, isText) {
    if (element.dataset.runtimeEffectEnabled !== 'true') return '';
    const x = parseFloat(element.dataset.runtimeEffectX || '0') || 0;
    const y = parseFloat(element.dataset.runtimeEffectY || '4') || 4;
    const blur = parseFloat(element.dataset.runtimeEffectBlur || '12') || 12;
    const spread = parseFloat(element.dataset.runtimeEffectSpread || '0') || 0;
    const opacity = parseFloat(element.dataset.runtimeEffectOpacity || '0.16');
    const color = setColorAlpha(element.dataset.runtimeEffectColor || '#000000', opacity);
    if (isText) {
      return `${x}px ${y}px ${blur}px ${color}`;
    }
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  function numberField(label, prop, value) {
    return `
      <label class="runtime-dev-field">
        <span class="runtime-dev-label">${label}</span>
        <input class="runtime-dev-input" data-prop="${prop}" type="number" value="${escapeAttr(value)}" />
      </label>
    `;
  }

  function panelTitle(title) {
    return `<div class="runtime-dev-panel-title">${title}</div>`;
  }

  function sectionBlock(title, content, actions = '') {
    return `
      <section class="runtime-dev-figma-section">
        <div class="runtime-dev-figma-section-head">
          <div class="runtime-dev-figma-section-title">${title}</div>
          ${actions}
        </div>
        <div class="runtime-dev-figma-section-body">${content}</div>
      </section>
    `;
  }

  function sectionHeaderOnly(title) {
    return `
      <section class="runtime-dev-figma-section runtime-dev-figma-section-empty">
        <div class="runtime-dev-figma-section-head">
          <div class="runtime-dev-figma-section-title">${title}</div>
          <div class="runtime-dev-plus">+</div>
        </div>
      </section>
    `;
  }

  function inlineField(label, prop, value, disabled = false, suffix = '') {
    return `
      <label class="runtime-dev-compact-field ${disabled ? 'is-disabled' : ''}">
        <span class="runtime-dev-compact-label">${label}</span>
        <span class="runtime-dev-compact-input-wrap">
          <input class="runtime-dev-input runtime-dev-input-compact" data-prop="${prop}" type="text" value="${escapeAttr(value)}" ${disabled ? 'disabled' : ''} />
          ${!disabled && supportsStepper(prop) ? stepperControl() : ''}
          ${suffix ? `<span class="runtime-dev-suffix">${suffix}</span>` : ''}
        </span>
      </label>
    `;
  }

  function inlineStatic(label, value) {
    return `
      <label class="runtime-dev-compact-field is-disabled">
        <span class="runtime-dev-compact-label">${label}</span>
        <span class="runtime-dev-compact-input-wrap">
          <input class="runtime-dev-input runtime-dev-input-compact" type="text" value="${escapeAttr(value)}" disabled />
        </span>
      </label>
    `;
  }

  function inlineTextField(label, prop, value) {
    return `
      <label class="runtime-dev-compact-field runtime-dev-compact-field-wide">
        <span class="runtime-dev-compact-label">${label}</span>
        <span class="runtime-dev-compact-input-wrap">
          <input class="runtime-dev-input runtime-dev-input-compact" data-prop="${prop}" type="text" value="${escapeAttr(value)}" />
        </span>
      </label>
    `;
  }

  function inlineSelect(label, prop, current, options) {
    const optionMarkup = options
      .map(([value, display]) => `<option value="${escapeAttr(value)}" ${value === current ? 'selected' : ''}>${display}</option>`)
      .join('');
    return `
      <label class="runtime-dev-compact-field">
        <span class="runtime-dev-compact-label">${label}</span>
        <span class="runtime-dev-compact-input-wrap">
          <select class="runtime-dev-input runtime-dev-input-compact" data-prop="${prop}">
            ${optionMarkup}
          </select>
        </span>
      </label>
    `;
  }

  function inlineTextarea(label, prop, value) {
    return `
      <label class="runtime-dev-compact-field runtime-dev-compact-field-wide">
        <span class="runtime-dev-compact-label">${label}</span>
        <textarea class="runtime-dev-input runtime-dev-input-compact runtime-dev-textarea-compact" data-prop="${prop}">${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  function colorControl(prop, value) {
    const safe = normalizePickerHex(value);
    const normalized = safe.replace('#', '');
    const hsv = hexToHsv(safe);
    return `
      <div class="runtime-dev-color-combo">
        <span class="runtime-dev-compact-input-wrap runtime-dev-color-wrap" data-hue="${hsv.hue}" data-saturation="${hsv.saturation}" data-value="${hsv.value}">
          <button class="runtime-dev-color-trigger" type="button" style="background:${escapeAttr(safe)}" aria-label="打开颜色面板"></button>
          <input class="runtime-dev-input runtime-dev-input-chip runtime-dev-input-chip-color" data-prop="${prop}" data-format="hex-raw" type="text" value="${escapeAttr(normalized)}" />
          <input class="runtime-dev-input runtime-dev-native-color" data-prop="${prop}" type="color" value="${escapeAttr(safe)}" tabindex="-1" aria-hidden="true" />
          <div class="runtime-dev-color-picker">
            <div class="runtime-dev-color-surface" style="background-color:hsl(${hsv.hue}, 100%, 50%)">
              <span class="runtime-dev-color-surface-cursor" style="left:${hsv.saturation * 100}%;top:${(1 - hsv.value) * 100}%"></span>
            </div>
            <div class="runtime-dev-color-hue">
              <span class="runtime-dev-color-hue-cursor" style="left:${(hsv.hue / 360) * 100}%"></span>
            </div>
          </div>
        </span>
      </div>
    `;
  }

  function normalizePickerHex(value) {
    const converted = colorToHex(value || '#000000').replace('#', '');
    return isValidHexDraft(converted) ? `#${expandHexColor(converted)}` : '#000000';
  }

  function hexToHsv(value) {
    const safe = normalizePickerHexWithoutConversion(value);
    const red = parseInt(safe.slice(1, 3), 16) / 255;
    const green = parseInt(safe.slice(3, 5), 16) / 255;
    const blue = parseInt(safe.slice(5, 7), 16) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let hue = 0;
    if (delta > 0) {
      if (max === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (max === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);
    }
    if (hue < 0) hue += 360;
    return {
      hue,
      saturation: max === 0 ? 0 : delta / max,
      value: max
    };
  }

  function normalizePickerHexWithoutConversion(value) {
    const raw = String(value || '').replace('#', '');
    return isValidHexDraft(raw) ? `#${expandHexColor(raw)}` : '#000000';
  }

  function hsvToHex(hue, saturation, value) {
    const normalizedHue = ((hue % 360) + 360) % 360;
    const chroma = value * saturation;
    const segment = normalizedHue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));
    let red = 0;
    let green = 0;
    let blue = 0;
    if (segment < 1) [red, green, blue] = [chroma, x, 0];
    else if (segment < 2) [red, green, blue] = [x, chroma, 0];
    else if (segment < 3) [red, green, blue] = [0, chroma, x];
    else if (segment < 4) [red, green, blue] = [0, x, chroma];
    else if (segment < 5) [red, green, blue] = [x, 0, chroma];
    else [red, green, blue] = [chroma, 0, x];
    const match = value - chroma;
    const toHex = (channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isValidHexDraft(value) {
    return /^[0-9A-F]{3}$|^[0-9A-F]{6}$/i.test(value);
  }

  function expandHexColor(value) {
    if (value.length === 3) {
      return value.split('').map((char) => char + char).join('').toUpperCase();
    }
    return value.toUpperCase();
  }

  function percentControl(prop, value) {
    return `
      <label class="runtime-dev-percent-combo">
        <span class="runtime-dev-compact-input-wrap">
          <input class="runtime-dev-input runtime-dev-input-chip runtime-dev-input-chip-small" data-prop="${prop}" type="text" value="${escapeAttr(value)}" />
          ${stepperControl()}
          <span class="runtime-dev-suffix">%</span>
        </span>
      </label>
    `;
  }

  function stepperControl() {
    return `
      <span class="runtime-dev-stepper">
        <button class="runtime-dev-stepper-button runtime-dev-stepper-button-up" type="button" data-direction="up" tabindex="-1" aria-label="增加"></button>
        <button class="runtime-dev-stepper-button runtime-dev-stepper-button-down" type="button" data-direction="down" tabindex="-1" aria-label="减少"></button>
      </span>
    `;
  }

  function colorField(label, prop, value) {
    return `
      <label class="runtime-dev-field">
        <span class="runtime-dev-label">${label}</span>
        <input class="runtime-dev-input runtime-dev-input-color" data-prop="${prop}" type="text" value="${escapeAttr(value)}" />
      </label>
    `;
  }

  function textField(label, prop, value) {
    return `
      <label class="runtime-dev-field runtime-dev-field-wide">
        <span class="runtime-dev-label">${label}</span>
        <input class="runtime-dev-input" data-prop="${prop}" type="text" value="${escapeAttr(value)}" />
      </label>
    `;
  }

  function textAreaField(label, prop, value) {
    return `
      <label class="runtime-dev-field runtime-dev-field-block">
        <span class="runtime-dev-label">${label}</span>
        <textarea class="runtime-dev-input runtime-dev-textarea" data-prop="${prop}">${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  function selectField(label, prop, current, options) {
    const optionMarkup = options
      .map(([value, display]) => `<option value="${escapeAttr(value)}" ${value === current ? 'selected' : ''}>${display}</option>`)
      .join('');
    return `
      <label class="runtime-dev-field">
        <span class="runtime-dev-label">${label}</span>
        <select class="runtime-dev-input" data-prop="${prop}">
          ${optionMarkup}
        </select>
      </label>
    `;
  }

  function isTextElement(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return true;
    const text = getDirectEditableText(element).trim();
    return text.length > 0;
  }

  function getDirectEditableText(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value || element.placeholder || '';
    }
    return Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || '')
      .join(' ');
  }

  function resolveTextTarget(element) {
    if (!(element instanceof Element)) return null;
    if (isTextElement(element)) return element;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        if (!(node instanceof Element)) return NodeFilter.FILTER_SKIP;
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return NodeFilter.FILTER_SKIP;
        }
        return isTextElement(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const directMatch = walker.nextNode();
    if (directMatch instanceof Element) return directMatch;

    const fallback = Array.from(element.querySelectorAll('*')).find((node) => {
      if (!(node instanceof Element)) return false;
      const style = window.getComputedStyle(node);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return false;
      }
      return (node.textContent || '').trim().length > 0;
    });
    return fallback instanceof Element ? fallback : null;
  }

  function resolveEditingTarget(element, prop) {
    const textProps = new Set([
      'color',
      'fillOpacity',
      'fontFamily',
      'fontWeight',
      'fontSize',
      'fontStyle',
      'textDecoration',
      'lineHeight',
      'letterSpacing',
      'textAlign',
      'text'
    ]);
    if (!textProps.has(prop)) return element;
    return resolveTextTarget(element) || element;
  }

  function renderFloatingToolbar() {
    if (!designFloatingToolbar) return;
    designFloatingToolbar.classList.remove('is-visible');
    designFloatingToolbar.innerHTML = '';
  }

  function getEditableText(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value || element.placeholder || '';
    }
    return element.textContent || '';
  }

  function roundPx(value) {
    const parsed = parseFloat(value || '0');
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }

  function normalizeLineHeight(value, fallback) {
    if (!value || value === 'normal') return fallback;
    return roundPx(value);
  }

  function normalizeFontWeight(value) {
    const normalized = `${value}`;
    if (normalized === '700') return '700';
    if (normalized === '600') return '600';
    if (normalized === '500') return '500';
    return '400';
  }

  function normalizeUnit(value) {
    if (value === '') return '';
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? `${parsed}px` : value;
  }

  function supportsStepper(prop) {
    return [
      'x',
      'y',
      'width',
      'height',
      'rotation',
      'opacity',
      'radius',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomLeftRadius',
      'borderBottomRightRadius',
      'fontSize',
      'lineHeight',
      'letterSpacing',
      'borderWidth',
      'fillOpacity',
      'strokeOpacity',
      'effectX',
      'effectY',
      'effectBlur',
      'effectSpread',
      'effectOpacity'
    ].includes(prop);
  }

  function getStepForProp(prop) {
    if (prop === 'rotation') return 1;
    if (prop === 'opacity' || prop === 'fillOpacity' || prop === 'strokeOpacity') return 1;
    if (prop === 'letterSpacing') return 0.5;
    return 1;
  }

  function parseNumericFieldValue(value) {
    const parsed = Number.parseFloat(`${value}`.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatPropValue(prop, value) {
    if (prop === 'rotation') return `${value}°`;
    if (Number.isInteger(value)) return `${value}`;
    return `${Math.round(value * 10) / 10}`;
  }

  function colorToHex(value) {
    if (!value || value === 'transparent') return '#000000';
    if (value.startsWith('#')) return value.toUpperCase();
    const match = value.match(/rgba?\(([^)]+)\)/i);
    if (!match) return value;
    const parts = match[1].split(',').map((part) => part.trim());
    const [r, g, b] = parts;
    const toHex = (num) => Number.parseInt(num, 10).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function getColorAlpha(value) {
    const match = `${value || ''}`.match(/rgba?\(([^)]+)\)/i);
    if (!match) return 1;
    const parts = match[1].split(',').map((item) => item.trim());
    if (parts.length < 4) return 1;
    const alpha = Number.parseFloat(parts[3]);
    return Number.isFinite(alpha) ? alpha : 1;
  }

  function setColorAlpha(value, alpha) {
    const normalized = `${value || ''}`.trim();
    const rgba = normalized.match(/rgba?\(([^)]+)\)/i);
    if (rgba) {
      const parts = rgba[1].split(',').map((item) => item.trim());
      const red = Number.parseFloat(parts[0]) || 0;
      const green = Number.parseFloat(parts[1]) || 0;
      const blue = Number.parseFloat(parts[2]) || 0;
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
    if (normalized.startsWith('#')) {
      const hex = normalized.replace('#', '');
      const expanded = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
      if (expanded.length !== 6) return '';
      const red = parseInt(expanded.slice(0, 2), 16);
      const green = parseInt(expanded.slice(2, 4), 16);
      const blue = parseInt(expanded.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
    return normalized;
  }

  function cleanFontFamily(value) {
    return (value || '').split(',')[0].replace(/["']/g, '').trim();
  }

  function escapeAttr(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
