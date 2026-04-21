# Jieba Ctrl-like Version

基于 [vscode-jieba](https://github.com/stephanoskomnenos/vscode-jieba) by StephanosKomnenos 改造，快捷键与英文体验统一。

## 与原版区别

| 功能 | 原版 (vscode-jieba) | 本版 |
|------|---------------------|------|
| 向后移动一个词 | `Shift+Alt+F` | `Ctrl+Right` (Win) / `Alt+Right` (Mac) |
| 向前移动一个词 | `Shift+Alt+B` | `Ctrl+Left` (Win) / `Alt+Left` (Mac) |
| 向后删除一个词 | `Shift+Alt+D` | `Ctrl+Delete` (Win) / `Alt+Delete` (Mac) |
| 向前删除一个词 | `Shift+Alt+Backspace` | `Ctrl+Backspace` (Win) / `Alt+Backspace` (Mac) |
| 向后选择扩展 | 无快捷键 | `Ctrl+Shift+Right` (Win) / `Alt+Shift+Right` (Mac) |
| 向前选择扩展 | 无快捷键 | `Ctrl+Shift+Left` (Win) / `Alt+Shift+Left` (Mac) |
| 选中当前词 | `Shift+Alt+2` | `Ctrl+D` |

**核心改动**：快捷键与英文分词行为统一，无需记忆额外快捷键。

## 功能

- `Ctrl+Left/Right` — 按中文词移动光标
- `Ctrl+Backspace/Delete` — 按中文词删除
- `Ctrl+Shift+Left/Right` — 按中文词选择扩展
- `Ctrl+D` — 选中当前词
- 支持双击选中分词（需启用配置 `cws.enableOnDoubleClick`）
- 支持多光标操作
- 支持 jieba-wasm 和 Intl.Segmenter 双引擎

## 配置项

| 配置 | 默认值 | 说明 |
|------|--------|------|
| `cws.segmenter` | `jieba-wasm` | 分词引擎 |
| `cws.intlSegmenterLocales` | `["zh-CN"]` | Intl.Segmenter 语言 |
| `cws.enableOnDoubleClick` | `false` | 双击选中分词 |

## 安装

### 从源码构建

```bash
npm install
npm run compile
npm run package  # 生成 .vsix 文件
```

在 VSCode 中安装 `.vsix` 文件：Extensions 面板 → "Install from VSIX..."

### 调试

在 VSCode 中打开项目，按 F5 启动 Extension Development Host。

## 致谢

- [stephanoskomnenos/vscode-jieba](https://github.com/stephanoskomnenos/vscode-jieba) — 原始项目
- [jieba-wasm](https://github.com/nicross/jieba-wasm) — jieba-rs 的 WebAssembly 实现


## 已知问题
每次启动时需要加载jieba导致会卡顿，建议文档编辑等高需求场景下再进行使用
## License

MIT License — 保留原作者版权声明