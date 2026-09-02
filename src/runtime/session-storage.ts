import type { EditPatch, ElementOverride, RuntimePageState, SpecDocument } from './spec-runtime';

export interface RuntimeSessionData {
  version: 1;
  fingerprint: string;
  source: {
    href: string;
    title: string;
    pageId: string;
  };
  pageState: RuntimePageState;
  selectedId: string | null;
  patches: Record<string, EditPatch>;
  elementOverrides: Record<string, ElementOverride>;
  savedAt: string;
}

const STORAGE_PREFIX = 'runtime-spec-session:';

export function buildPageFingerprint(spec: SpecDocument) {
  const source = [window.location.href, document.title, spec.page.id, spec.elements.map((item) => item.id).join('|')].join('::');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return `${spec.page.id}-${hash.toString(16)}`;
}

export function createRuntimeSessionData(params: {
  spec: SpecDocument;
  pageState: RuntimePageState;
  selectedId: string | null;
  patches: Record<string, EditPatch>;
  elementOverrides: RuntimeSessionData['elementOverrides'];
}): RuntimeSessionData {
  const fingerprint = buildPageFingerprint(params.spec);
  return {
    version: 1,
    fingerprint,
    source: {
      href: window.location.href,
      title: document.title,
      pageId: params.spec.page.id
    },
    pageState: params.pageState,
    selectedId: params.selectedId,
    patches: params.patches,
    elementOverrides: params.elementOverrides,
    savedAt: new Date().toISOString()
  };
}

export function saveRuntimeSession(session: RuntimeSessionData) {
  localStorage.setItem(`${STORAGE_PREFIX}${session.fingerprint}`, JSON.stringify(session));
}

export function loadRuntimeSession(spec: SpecDocument) {
  const fingerprint = buildPageFingerprint(spec);
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${fingerprint}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as RuntimeSessionData;
    if (parsed.version !== 1 || parsed.fingerprint !== fingerprint) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function exportRuntimeSession(session: RuntimeSessionData) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${session.fingerprint}.runtime-spec.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importRuntimeSession(file: File) {
  const text = await file.text();
  return JSON.parse(text) as RuntimeSessionData;
}
