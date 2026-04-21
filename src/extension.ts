import * as vscode from "vscode";
import {
  backwardKillWord,
  backwardWord,
  backwardSelectWord,
  forwardWord,
  forwardSelectWord,
  killWord,
  selectWord,
} from "./command";
import { doubleClickOnTextListener } from "./listener";
import { initializeSegmenter } from "./parse";
import { CwsDocumentHighlightProvider } from "./highlight";

export async function activate(context: vscode.ExtensionContext) {

  // 插件激活时，首次读取配置并初始化分词器
  await initializeSegmenter();
  // 监听配置更改。当用户切换分词器设置时，重新初始化。
  const disposableConfigListener = vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration('cws.segmenter') || event.affectsConfiguration('cws.intlSegmenterLocales')) {
      await initializeSegmenter();
    }
  });

  // 注册中文分词词高亮提供者（对所有文本文件生效）
  const highlightProvider = vscode.languages.registerDocumentHighlightProvider(
    { language: '*' },
    new CwsDocumentHighlightProvider()
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cws.forwardWord", forwardWord),
    vscode.commands.registerCommand("cws.backwardWord", backwardWord),
    vscode.commands.registerCommand("cws.forwardSelectWord", forwardSelectWord),
    vscode.commands.registerCommand("cws.backwardSelectWord", backwardSelectWord),
    vscode.commands.registerCommand("cws.killWord", killWord),
    vscode.commands.registerCommand("cws.backwardKillWord", backwardKillWord),
    vscode.commands.registerCommand("cws.selectWord", selectWord),
    vscode.window.onDidChangeTextEditorSelection(doubleClickOnTextListener),
    disposableConfigListener,
    highlightProvider,
  );
}

// This method is called when your extension is deactivated
export function deactivate() { }