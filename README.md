# Visual Code Prompt-通过视觉方式生成代码修改提示词

Visual Code Prompt is a browser extension for AI agents and frontend workflows. It lets you select live webpage elements, inspect them in context, and generate precise edit prompts or runtime patch notes that can be handed directly to an AI model or code agent.

The repository contains two parts:

- `chrome-extension/`: the main Chrome MV3 extension
- `/src`: a companion React demo for local preview and testing

## What It Does

- Pick elements on any live webpage
- Inspect layout, style, and structure in context
- Switch between selection, edit, move, and resize workflows
- Generate structured prompts for targeted code changes
- Copy patch notes for handoff to an AI agent or developer
- Keep the original page running while you work

## Extension Scope

The extension is intentionally focused on live-page editing and prompt generation. It is not a full design system manager or a generic annotation board.

## Install the Extension

1. Clone the repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select the [`chrome-extension`](./chrome-extension/) folder.

## Run the Demo

```bash
npm install
npm run dev
```

Build the demo:

```bash
npm run build
```

## Repository Layout

```txt
chrome-extension/
  manifest.json
  src/
    background.js
    content.js
    content.css
    assets/
src/
  components/
  pages/
  runtime/
  data/
```

## Notes

- The extension works on live webpages through a content script and injected toolbar.
- The React app is a companion demo, not a requirement for loading the extension.
- Source code is licensed under MIT.

## License

[MIT](./LICENSE)

## Chrome Web Store

Store copy, permission justifications, privacy disclosures, reviewer notes, and
submission assets are maintained in [`CHROME_WEB_STORE_LISTING.md`](./CHROME_WEB_STORE_LISTING.md),
[`PRIVACY.md`](./PRIVACY.md), and [`store-assets/`](./store-assets/).
