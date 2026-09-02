# Visual Code Prompt Extension

Visual Code Prompt is a lightweight Chrome MV3 extension for selecting live webpage elements, inspecting their styles, and generating precise edit prompts for AI agents.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select the [`chrome-extension`](./) folder.

## Main Features

- Select elements directly on the page
- Inspect layout, typography, color, spacing, and other runtime styles
- Switch between selection, edit, move, and resize workflows
- Generate structured prompt text for code handoff
- Copy adjustment notes for an AI agent or developer
- Keep page changes in memory while the overlay is open

## Scope

The extension is designed for live-page tuning and prompt generation. Reloading the page restores the original state.

## Validation

From the repository root:

```bash
node --check chrome-extension/src/content.js
node --check chrome-extension/src/background.js
```

## Notes

- The extension runs on regular webpages only.
- It does not run on browser-internal pages such as `chrome://extensions`.
- The root React app is a separate demo and is not required for extension use.
