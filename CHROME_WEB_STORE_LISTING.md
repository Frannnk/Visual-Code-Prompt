# Chrome Web Store Listing

This file is the source of truth for the Chrome Web Store submission. Keep the
store listing, `manifest.json`, and `PRIVACY.md` aligned when the product changes.

## Basic information

- **Product name:** Visual Code Prompt
- **Short description:** Select webpage elements visually and generate precise AI prompts for frontend code changes.
- **Category:** Developer Tools
- **Primary language:** English
- **Website:** https://github.com/Frannnk/Visual-Code-Prompt
- **Support URL:** https://github.com/Frannnk/Visual-Code-Prompt/issues
- **Privacy policy URL:** https://github.com/Frannnk/Visual-Code-Prompt/blob/main/PRIVACY.md
- **Version:** 0.1.0

## Chinese translation

Use this as a Chinese-language listing if you add a second localized listing in
the developer dashboard.

- **名称：** Visual Code Prompt
- **简短描述：** 在网页上可视化选中元素，为前端代码修改生成精准的 AI 提示词。
- **详细描述：**

  Visual Code Prompt 帮助前端开发者和 AI 编程 Agent 把视觉反馈转化为更精准的实现指令。

  在网页上启动插件，选中需要调整的元素，查看它的布局、间距、字体、颜色和运行时样式，并进行临时的编辑、移动或缩放。插件会根据选中元素及其上下文生成结构化修改提示词。复制提示词后，可以直接交给你常用的 AI 编程 Agent 或开发者，减少来回描述和定位误差。

  - 直接在普通网页上选中元素
  - 查看布局、间距、字体、颜色和运行时样式
  - 临时编辑、移动和缩放元素
  - 添加交互说明和实现备注
  - 生成并复制结构化 AI 修改提示词
  - 不修改源代码；刷新页面即可恢复原始状态

  Visual Code Prompt 不包含 AI 模型，也不会向远程 AI 服务发送请求。提示词在本地生成，你可以把它交给自己偏好的 Agent 和开发流程。

## Detailed description

Visual Code Prompt helps frontend developers and AI coding agents turn visual
feedback into precise implementation instructions.

Open the extension on a live webpage, select the element that needs attention,
inspect its rendered layout and styles, and make a temporary visual adjustment.
The extension then generates a structured prompt that describes the selected
element, its context, and the requested change. Copy the prompt and hand it to
your AI coding agent or developer for a more targeted code update.

### Features

- Select elements directly on any regular webpage.
- Inspect layout, spacing, typography, color, and rendered style details.
- Edit, move, and resize elements in a temporary runtime preview.
- Add interaction or implementation notes to the selected element.
- Generate and copy structured AI edit prompts.
- Keep the original source code unchanged; refresh the page to restore the
  original runtime state.

Visual Code Prompt does not include an AI model or make remote AI requests. It
creates the prompt locally so you can use it with the coding agent and workflow
you already prefer.

## Permission justifications

Use these explanations in the Chrome Web Store Privacy practices section.

### Host access: `<all_urls>`

The extension needs to work on the regular webpages that a developer is
reviewing, not only on a fixed list of domains. The content script runs locally
in the current tab to read DOM and computed-style information, draw selection
overlays, apply temporary runtime adjustments, and generate prompts. No page
data is transmitted to a server.

### Content script

The content script injects the visual toolbar only after the user activates the
extension. It reads the selected page element and its rendered context locally.
It does not submit page data, credentials, or form content to an external
service.

### `web_accessible_resources`

The extension exposes only its own CSS and icon assets so the locally injected
overlay can load them inside the page. This is not a data collection channel.

## Data disclosure answers

- **Does the extension collect user data?** No.
- **Does the extension sell or transfer user data?** No.
- **Does the extension use data for advertising?** No.
- **Does the extension use data for creditworthiness, lending, or insurance?** No.
- **Does the extension handle authentication information?** No.
- **Does the extension handle financial or payment information?** No.
- **Does the extension handle health information?** No.
- **Does the extension handle personally identifiable information?** No.
- **Does the extension handle webpage content?** It reads the current page locally only to perform the user-requested visual inspection and prompt generation; it does not collect or transmit that content.

## Distribution and pricing

- **Visibility:** Public
- **Price:** Free
- **In-app purchases:** None
- **Recommended regions:** All regions where Chrome Web Store distribution is available
- **Recommended website:** The public GitHub repository above

## Version notes

Paste this into the release notes field for version `0.1.0`:

> Initial public release. Select live webpage elements, inspect their rendered
> styles, make temporary visual adjustments, and copy precise prompts for AI
> coding agents.

## Graphic assets

| Asset | File | Size | Use |
| --- | --- | ---: | --- |
| Extension icon | `chrome-extension/src/assets/icon-128.png` | 128x128 | Required store icon |
| Toolbar icon | `chrome-extension/src/assets/icon-48.png` | 48x48 | Browser action icon |
| Small icon | `chrome-extension/src/assets/icon-16.png` | 16x16 | Browser/UI fallback |
| Product screenshot | `store-assets/visual-code-prompt-screenshot-1280x800.png` | 1280x800 | Store screenshot |
| Promotional tile | `store-assets/visual-code-prompt-promo-440x280.png` | 440x280 | Small promotional tile |

The product screenshot is intentionally a designed sample webpage. It contains
no personal information, customer data, external brand marks, or unsupported
claims.

## Reviewer notes

To verify the core flow:

1. Load the `chrome-extension/` directory as an unpacked extension.
2. Open any regular webpage.
3. Click the Visual Code Prompt toolbar icon.
4. Hover and click a visible webpage element.
5. Use Edit, Move, or Scale to make a temporary adjustment.
6. Open the adjustment panel and choose **复制调整提示词** to copy the local prompt.
7. Refresh the page to confirm that the runtime-only adjustment is gone.

The extension does not work on browser-internal pages such as `chrome://`
pages, which is expected Chrome platform behavior.

## Submission checklist

- [ ] Upload the ZIP produced at `dist/visual-code-prompt-v0.1.0.zip`.
- [ ] Add the 1280x800 product screenshot from `store-assets/`.
- [ ] Add the 440x280 small promotional tile from `store-assets/`.
- [ ] Confirm the public privacy policy URL resolves without sign-in.
- [ ] Confirm the support URL accepts issue reports.
- [ ] Confirm the store category and primary language.
- [ ] Complete the Privacy practices answers using the declarations above.
- [ ] Review the permission warning shown by the dashboard before publishing.
