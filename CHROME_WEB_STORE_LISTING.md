# Chrome Web Store 上架文案

本文件按 Chrome Web Store 开发者后台的常见字段整理。优先使用下面的中文版本；如果商店后台以英文作为主语言，可使用英文版本。

## 一、基础信息

### 商品名称

```text
Visual Code Prompt-通过视觉方式生成代码修改提示词
```

### 中文名称（如创建中文语言版本）

```text
Visual Code Prompt-通过视觉方式生成代码修改提示词
```

### 分类

```text
Developer Tools
```

### 商店语言

```text
中文（简体）
```

建议同时创建英文语言版本，扩大开发者用户覆盖范围。

### 官方网站

```text
https://github.com/Frannnk/Visual-Code-Prompt
```

### 支持页面

```text
https://github.com/Frannnk/Visual-Code-Prompt/issues
```

### 隐私权政策网址

```text
https://github.com/Frannnk/Visual-Code-Prompt/blob/main/PRIVACY.md
```

## 二、中文商店文案

### 简短描述

Chrome Web Store 简短描述建议控制在 132 个字符以内。

```text
在网页上可视化选中元素，为前端代码修改生成精准的 AI 提示词。
```

### 上架信息：用途与安装理由

```text
Visual Code Prompt 用于帮助前端开发者、设计师和 AI 编程 Agent 更准确地完成网页视觉调整。当页面已经可以运行，但某个按钮、间距、字体、颜色或布局与预期不一致时，用户无需反复截图、描述位置或手动猜测 CSS。安装插件后，只需在网页上直接选中目标元素，查看它的实际布局和渲染样式，进行临时的移动、缩放或编辑，并添加交互说明和实现备注。插件会把这些视觉信息整理成结构化的代码修改提示词，用户可以一键复制并交给自己的 AI 编程工具。

用户应该安装 Visual Code Prompt，因为它能把“这里看起来不对”转化为包含目标元素、页面上下文、当前状态和修改意图的明确指令，减少设计、开发者和 AI Agent 之间的沟通成本，提高网页迭代效率。它尤其适合使用 Cursor、Claude Code、GitHub Copilot 或其他 AI 编程工具进行前端开发的用户。所有检查和提示词生成均在当前浏览器本地完成，不依赖远程 AI 服务；临时调整不会修改项目源代码，刷新页面即可恢复原始状态。
```

### 详细描述

```text
Visual Code Prompt 是一款面向前端开发者和 AI 编程 Agent 的可视化网页调整工具。

在网页上启动插件，直接选中需要调整的元素，查看它的布局、间距、字体、颜色和运行时样式，并进行临时的编辑、移动或缩放。插件会根据选中的元素及其上下文生成结构化的修改提示词，帮助你把“这里看起来不对”转化为更具体、更容易执行的代码修改指令。

核心功能：

• 在普通网页上直接选中页面元素
• 查看元素的布局、尺寸、间距、字体、颜色和运行时样式
• 临时编辑、移动和缩放元素，快速验证视觉调整方向
• 为元素添加交互说明和实现备注
• 生成并复制结构化的 AI 修改提示词
• 将视觉反馈交给你正在使用的 AI 编程 Agent 或开发者
• 刷新页面即可恢复原始状态，不修改网页源代码

Visual Code Prompt 不包含 AI 模型，也不会自动调用远程 AI 服务。提示词在当前浏览器中本地生成，用户可以将它复制到自己偏好的 AI 编程工具中继续使用。

适用场景：

• 前端页面视觉检查
• UI 设计与代码之间的沟通
• AI 编程 Agent 的网页修改任务
• 页面布局、间距和样式的快速验证
• 将设计反馈整理成可执行的代码修改说明

注意：插件仅对当前页面进行临时运行时调整，不会直接修改项目源代码。浏览器内部页面（例如 chrome:// 页面）不支持使用本插件。
```

### 版本更新说明

```text
首次公开发布。

• 在网页上可视化选中页面元素
• 查看元素的布局和运行时样式
• 临时编辑、移动和缩放元素
• 生成并复制面向 AI 编程 Agent 的修改提示词
• 支持交互说明和实现备注
```

## 三、英文商店文案

### Short description

```text
Select webpage elements visually and generate precise AI prompts for frontend code changes.
```

### Detailed description

```text
Visual Code Prompt is a visual webpage inspection and editing tool for frontend developers and AI coding agents.

Activate the extension on a webpage, select the element that needs attention, inspect its layout and rendered styles, and make temporary visual adjustments such as editing, moving, or resizing. The extension turns the selected element and its context into a structured edit prompt that you can copy directly to your preferred AI coding agent or developer.

Core features:

• Select elements directly on regular webpages
• Inspect layout, dimensions, spacing, typography, colors, and rendered styles
• Temporarily edit, move, and resize elements to test visual directions
• Add interaction notes and implementation notes
• Generate and copy structured AI edit prompts
• Hand precise visual feedback to an AI coding agent or developer
• Refresh the page to restore the original state without changing source code

Visual Code Prompt does not include an AI model and does not make remote AI requests. Prompts are generated locally in the current browser tab, so you can use them with the AI coding workflow you already prefer.

Use cases:

• Frontend visual QA
• Communication between design and code
• Webpage editing tasks for AI coding agents
• Rapid validation of layout, spacing, and style changes
• Turning visual feedback into actionable implementation instructions

The extension applies temporary runtime changes to the current page only. It does not directly modify project source code. Browser-internal pages such as chrome:// pages are not supported.
```

### Release notes

```text
Initial public release.

• Select live webpage elements visually
• Inspect layout and rendered styles
• Temporarily edit, move, and resize elements
• Generate and copy precise prompts for AI coding agents
• Add interaction and implementation notes
```

## 四、隐私权政策与数据使用声明

### 隐私权政策页面内容

隐私政策文件位于仓库根目录的 [`PRIVACY.md`](./PRIVACY.md)，公开地址为：

```text
https://github.com/Frannnk/Visual-Code-Prompt/blob/main/PRIVACY.md
```

### 数据使用核心声明

```text
本扩展不收集、不上传、不出售、不共享用户数据。网页内容、DOM、样式信息和用户输入的说明仅在当前浏览器标签页中本地处理，用于完成用户主动发起的元素选择、样式检查、临时调整和提示词生成。扩展不使用广告、分析、追踪像素、Cookie、远程 AI 服务或外部数据服务器。
```

### Chrome 数据披露选项

按当前产品行为填写：

- 是否出售用户数据：否
- 是否将用户数据用于广告：否
- 是否将用户数据用于信用评估、贷款或保险：否
- 是否收集个人身份信息：否
- 是否收集健康信息：否
- 是否收集财务或支付信息：否
- 是否收集身份验证信息：否
- 是否收集个人通信内容：否
- 是否收集网页浏览活动：否
- 是否收集网站内容：否
- 是否收集位置数据：否
- 是否收集其他用户数据：否

补充说明：扩展会在用户主动使用时读取当前页面的 DOM、尺寸和 computed styles，但这些信息只在本地用于当前功能，不会被收集或传输到服务器。

## 五、权限说明

### Chrome 隐私表单：单一用途说明

```text
Visual Code Prompt 是一款面向前端开发者和 AI 编程 Agent 的网页视觉调试工具。它的唯一用途是让用户在当前网页上可视化选中页面元素，查看元素的布局和渲染样式，进行仅限当前页面的临时视觉调整，并根据用户选中的元素和调整意图生成可复制的代码修改提示词。提示词在浏览器本地生成，用于帮助用户将视觉反馈准确交给 AI 编程工具或开发者。本扩展不提供网页浏览、广告、数据分析或远程 AI 服务。
```

### Chrome 隐私表单：请求主机权限的理由

```text
扩展需要访问用户主动检查的普通网页，以便在当前页面注入可视化工具栏和选择框，读取被选元素的 DOM、尺寸和 computed styles，并应用仅限当前页面的临时编辑、移动和缩放效果。由于用户可能在任意本地开发页面、测试环境或线上网页中使用，无法预先限定域名，因此需要 <all_urls>。网页内容仅在本地处理，不会上传、保存或共享。
```

### Chrome 隐私表单：远程代码

```text
请选择：否
```

补充说明：扩展所有 JavaScript、CSS 和 SVG 资源均随扩展软件包发布，不从远程服务器下载或执行 JavaScript、Wasm，也不使用 `eval` 或 `new Function`。`chrome.runtime.getURL` 仅用于读取扩展包内的本地 CSS 资源。

### `<all_urls>` 网站访问权限

```text
Visual Code Prompt 需要在用户正在检查的普通网页上运行，以便用户直接选中页面元素、读取元素的 DOM 和渲染样式、显示可视化选择框，并生成临时的运行时调整和 AI 修改提示词。扩展只在当前浏览器中本地处理这些信息，不会将网页内容、源代码、表单内容或选中元素信息上传到外部服务器。
```

### 内容脚本说明

```text
内容脚本用于在用户主动打开插件后显示可视化工具栏和元素选择界面。它读取当前页面中被用户选中的元素及其渲染上下文，用于样式检查、临时视觉调整和本地提示词生成。内容脚本不会向外部服务提交网页数据、登录信息或表单内容。
```

### `web_accessible_resources` 说明

```text
扩展仅开放自身使用的 CSS 文件和图标资源，使注入网页的本地可视化工具栏能够正确加载样式和图标。这些资源不用于收集或传输用户数据。
```

## 六、审核员测试说明

```text
1. 将 chrome-extension/ 目录作为未打包扩展加载到 Chrome。
2. 打开任意普通网页。
3. 点击浏览器工具栏中的 Visual Code Prompt 图标。
4. 将鼠标移动到网页元素上，并点击选中一个元素。
5. 使用 Edit、Move 或 Scale 工具进行临时调整。
6. 打开调整面板，点击“复制调整提示词”。
7. 将提示词粘贴到文本编辑器，确认其中包含选中元素和调整信息。
8. 刷新网页，确认临时调整已恢复，网页源代码未被修改。

插件无法在 chrome://extensions 等浏览器内部页面运行，这是 Chrome 平台限制，不是扩展故障。
```

## 七、开发者后台其他建议设置

- 可见性：公开
- 价格：免费
- 应用内购买：无
- 目标用户：前端开发者、UI/UX 设计师、AI 编程 Agent 用户、产品设计和研发团队
- 商店语言主版本：中文（简体）或英文，建议根据主要用户选择
- 网站和支持链接：使用上面的 GitHub 地址
- 隐私政策：必须填写公开可访问的 `PRIVACY.md` 地址
- 截图和宣传图：由项目方自行设计后上传

## 八、提交前检查

- [ ] 商品名称与 `manifest.json` 中的名称一致
- [ ] 简短描述与产品实际能力一致
- [ ] 详细描述没有声称插件会自动修改源代码
- [ ] 权限说明解释了 `<all_urls>` 的实际用途
- [ ] 隐私政策 URL 无需登录即可访问
- [ ] 支持 URL 无需登录即可提交 Issue
- [ ] 上传的 ZIP 根目录直接包含 `manifest.json`
- [ ] 上传截图不含真实用户数据、密码、Cookie、账号信息或第三方敏感内容
- [ ] 上传截图和宣传图由项目方自行设计
- [ ] 发布版本号与 `manifest.json` 中的版本号一致
