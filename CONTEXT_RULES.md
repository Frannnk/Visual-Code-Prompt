# Runtime Web Inspector Rules

## 当前唯一目标

当前只做 `chrome-extension`，把它收成：

- 任意网页上的 `Figma Dev / Code Mode` 风格检查与编辑插件
- 两种一级模式：
  - `交互流程`
  - `Design Tuning`
- 样式、尺寸、按钮状态、面板结构尽量 1:1 对齐 Figma 设计稿

先不要做：

- React demo 扩展
- flow/state/spec completeness
- 自动布局
- 新的导入导出能力
- 额外产品功能发挥

## 关键设计稿

- 主设计稿：
  [Runtime Interaction Spec](https://www.figma.com/design/L4DCiOgY5eOE2PDBKyMuCZ/Runtime-Interaction-Spec?node-id=5-21&t=HTnL3OpRLrzXltEv-4)
- 右侧设计面板：
  [47:455](https://www.figma.com/design/L4DCiOgY5eOE2PDBKyMuCZ/Runtime-Interaction-Spec?node-id=47-455&t=HTnL3OpRLrzXltEv-4)
- 交互注释卡：
  [5:944](https://www.figma.com/design/L4DCiOgY5eOE2PDBKyMuCZ/Runtime-Interaction-Spec?node-id=5-944&t=HTnL3OpRLrzXltEv-4)

## 当前模式规则

### 工具条

- 左侧：
  - `交互流程`
  - `Design Tuning`
- 右侧是当前模式下的动作按钮
- `关闭` 永远在最右边
- 图标都走本地 SVG，不走远程资源
- 切换动画要丝滑，不允许硬切或闪图

### 交互流程

- 默认是选择模式
- hover 元素时显示：
  - 左上角橙色模块标题
  - 蓝色外框
  - padding 斜纹区
  - 内层内容框
  - 四边距离数字牌
- 点击元素后锁定选中态
- 点击 `注释` icon 后：
  - 不打开右侧固定面板
  - 在选中元素附近出现注释卡

### Design Tuning

- 切到 `Design Tuning` 时：
  - 默认右侧第一个 `编辑` 按钮高亮
  - 默认进入持续选择模式
- 右侧工具固定顺序为：
  - `编辑`：使用原中间图标，负责打开编辑能力
  - `移动`：使用原右侧图标，负责拖动元素
  - `缩放`：使用原左侧图标，负责显示四角控制点并缩放元素
  - `关闭`：永远位于最右侧
- 不新增或替换图标资源；三个功能只复用现有 SVG
- 在选择模式下：
  - 鼠标移动持续显示 hover 检查
  - 单击后锁定当前元素
  - 不退出模式
  - 可以继续再选其他元素
- 在移动模式下：
  - 也是持续模式
  - 可以随时换选别的元素再拖动
  - 对有同级子元素的普通 `div`、`flex`、`grid` 容器，优先调整当前元素在父容器中的同级顺序，不叠加自由位移
  - 只有绝对定位 / 固定定位元素，或没有可重排同级元素时，才使用父容器边界内的位移
  - 调整项会记录同级顺序，删除或清空调整项时恢复原始 DOM 顺序
- 在编辑模式下：
  - 也是持续模式
  - 可以随时换选别的元素继续编辑

## 当前已做成

### 交互/选中层

- hover 和 selected 已分离
- design 模式下 badge 优先跟随当前 selected，而不是 hover
- selected 会在点击另一个元素后切换
- overlay 会跟随滚动和窗口变化重定位

### 设计编辑层

- 右侧面板宽度：`260px`
- 顶部是两 tab：
  - `编辑`
  - `调整项`
- 头部标题显示当前选中元素的真实标题
  - 单行
  - 超出 `...`
- `编辑` 面板当前已接通：
  - `X / Y / 宽度 / 高度`
  - `旋转`
  - `约束`
  - `透明度`
  - `圆角`
  - 四角圆角
  - `填充颜色 / 填充透明度`
  - `描边颜色 / 描边透明度 / 描边宽度 / 描边位置`
  - 文本的 `字体 / 字重 / 字号 / 行高 / 字距 / 对齐 / 文本内容`
  - `效果` 基础能力
- 所有输入框已支持：
  - 连续手动输入
  - Enter 或 blur 提交
  - 键盘上下增减
  - stepper 点击增减
- 文本类属性会优先落到模块里的真实文字节点，不再总是改容器

### 调整项

- `调整项` 会按元素/模块生成卡片
- 支持：
  - 单条删除
  - 清空全部
  - 复制调整提示词
- 删除或清空后，页面会恢复原样

### 移动/缩放

- `移动` 模式下可以直接拖动已选元素
- 默认限制在原父容器内移动
- 命中边界会提示“已限制在原容器内移动”
- 已支持四角 resize handle
- 拖动结束会显示 `W × H` 蓝色尺寸标签

## 当前主要问题

1. hover / selected 检查态还没达到 Figma Dev 1:1
2. 工具条虽然顺了很多，但还要继续保证：
   - 不闪图
   - 不缺图
   - 切换和宽度生长完全丝滑
3. 右侧设计面板结构已可用，但视觉还没完全贴 Figma `47:455`
4. `效果 / 约束 / 描边位置` 还要继续按“每项都可用”往下补
5. 模块内文字目标虽然更稳了，但复杂模块仍需继续验证

## 只改这些文件

- [/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/content.js](/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/content.js)
- [/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/content.css](/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/content.css)
- [/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/background.js](/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/background.js)
- [/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/manifest.json](/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/manifest.json)

本地图标目录：

- [/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/assets](/Users/frannnk/Desktop/Vibe Coding/CodeX/插件/Runtime Interaction Spec Layer/chrome-extension/src/assets)

## 下一步优先级

1. 继续把 hover / selected 检查态做成 Figma Dev 1:1
2. 继续把右侧设计面板做成 Figma `47:455` 1:1
3. 按“每项都可用”的标准继续补：
   - 效果
   - 约束
   - 描边位置
   - 颜色输入联动
4. 继续增强移动 / 编辑能力，但优先保持代码结构可用

## 验证命令

每次改完都执行：

- `node --check chrome-extension/src/content.js`
- `node --check chrome-extension/src/background.js`

## 新对话续接句

在新对话里直接这样说：

“先读 `CONTEXT_RULES.md`，继续只做 `chrome-extension`，重点收 `Design Tuning` 模式的持续选择、编辑、移动、缩放、hover 与 selected 分离、右侧设计面板和工具条丝滑动效，不要新增或替换现有图标，不要扩展别的功能。”
