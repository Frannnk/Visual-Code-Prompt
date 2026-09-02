import type { CSSProperties, FormEvent } from 'react';
import type { EditPatch, ElementOverride, RuntimePageState } from '../runtime/spec-runtime';

interface LoginPageProps {
  phone: string;
  password: string;
  pageState: RuntimePageState;
  errorMessage: string;
  successMessage: string;
  patches: Record<string, EditPatch>;
  elementOverrides: Record<string, ElementOverride>;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onResetDemo: () => void;
}

function patchStyle(patch?: EditPatch): CSSProperties | undefined {
  if (!patch) return undefined;

  return {
    width: `${patch.width}px`,
    height: `${patch.height}px`,
    transform: `translate(${patch.x}px, ${patch.y}px)`
  };
}

function editableStyle(override?: ElementOverride): CSSProperties | undefined {
  if (!override) return undefined;

  return {
    borderRadius: override.borderRadius ? `${override.borderRadius}px` : undefined,
    background: override.background,
    color: override.color,
    fontSize: override.fontSize ? `${override.fontSize}px` : undefined
  };
}

export function LoginPage({
  phone,
  pageState,
  errorMessage,
  successMessage,
  patches,
  elementOverrides,
  onPhoneChange,
  onSubmit,
  onResetDemo
}: LoginPageProps) {
  const isLoading = pageState === 'loading';
  const helperMessage =
    errorMessage ||
    successMessage ||
    elementOverrides['login-error-alert']?.text ||
    (isLoading ? '正在准备搜索结果…' : '试着搜索一个关键词，观察网页节点在 Code Mode 里的表现。');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="google-page-shell">
      <div className="google-page-frame">
        <header className="google-topbar" data-edit-id="google-topbar" data-edit-label="header.google-topbar">
          <nav className="google-topbar-links" data-edit-id="google-topbar-links" data-edit-label="nav.google-topbar-links">
            <a href="#" onClick={(event) => event.preventDefault()}>
              Gmail
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              Images
            </a>
          </nav>
          <div className="google-topbar-actions" data-edit-id="google-topbar-actions" data-edit-label="div.google-topbar-actions">
            <button type="button" className="google-icon-button">
              ⋮⋮
            </button>
            <button type="button" className="google-avatar-button">
              F
            </button>
          </div>
        </header>

        <main className="google-main" data-edit-id="google-main" data-edit-label="main.google-main">
          <section className="google-hero" data-edit-id="google-hero" data-edit-label="section.google-hero">
            <div className="google-logo" data-edit-id="google-logo" data-edit-label="div.google-logo">
              <span className="is-blue">G</span>
              <span className="is-red">o</span>
              <span className="is-yellow">o</span>
              <span className="is-blue">g</span>
              <span className="is-green">l</span>
              <span className="is-red">e</span>
            </div>

            <form className="google-search-area" onSubmit={handleSubmit}>
              <label
                data-spec-id="login-phone-input"
                className="google-search-shell"
                style={patchStyle(patches['login-phone-input'])}
              >
                <span className="google-search-icon">⌕</span>
                <input
                  className="google-search-input"
                  placeholder={elementOverrides['login-phone-input']?.placeholder ?? 'Search Google or type a URL'}
                  value={phone}
                  style={editableStyle(elementOverrides['login-phone-input'])}
                  onChange={(event) => onPhoneChange(event.target.value)}
                />
                <span className="google-search-tools">⌨︎ ◉</span>
              </label>

              <div className="google-search-actions" data-edit-id="google-search-actions" data-edit-label="div.google-search-actions">
                <button
                  data-spec-id="login-button"
                  className={['google-search-button', isLoading ? 'is-loading' : ''].filter(Boolean).join(' ')}
                  type="submit"
                  style={{
                    ...patchStyle(patches['login-button']),
                    ...editableStyle(elementOverrides['login-button'])
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching…' : elementOverrides['login-button']?.text ?? 'Google Search'}
                </button>

                <button type="button" className="google-search-button" onClick={onResetDemo}>
                  {elementOverrides['login-loading-hint']?.text ?? "I'm Feeling Lucky"}
                </button>
              </div>
            </form>

            <div
              data-spec-id="login-error-alert"
              className={['google-helper', errorMessage ? 'is-error' : '', successMessage ? 'is-success' : '']
                .filter(Boolean)
                .join(' ')}
              style={{
                ...patchStyle(patches['login-error-alert']),
                ...editableStyle(elementOverrides['login-error-alert'])
              }}
            >
              {helperMessage}
            </div>

            <div className="google-language-row" data-edit-id="google-language-row" data-edit-label="div.google-language-row">
              Google offered in:
              <a href="#" onClick={(event) => event.preventDefault()}>
                中文(简体)
              </a>
              <a href="#" onClick={(event) => event.preventDefault()}>
                English
              </a>
            </div>
          </section>
        </main>

        <footer className="google-footer" data-edit-id="google-footer" data-edit-label="footer.google-footer">
          <div className="google-footer-location">China</div>
          <div className="google-footer-meta">
            <div className="google-footer-links">
              <a href="#" onClick={(event) => event.preventDefault()}>
                About
              </a>
              <a href="#" onClick={(event) => event.preventDefault()}>
                Advertising
              </a>
              <a href="#" onClick={(event) => event.preventDefault()}>
                Business
              </a>
            </div>
            <div className="google-footer-links">
              <a href="#" onClick={(event) => event.preventDefault()}>
                Privacy
              </a>
              <a href="#" onClick={(event) => event.preventDefault()}>
                Terms
              </a>
              <a href="#" onClick={(event) => event.preventDefault()}>
                Settings
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
