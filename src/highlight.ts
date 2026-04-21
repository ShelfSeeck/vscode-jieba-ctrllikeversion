import * as vscode from 'vscode';
import { parseSentence } from './parse';

/**
 * 中文分词词高亮提供者
 * 当光标位于中文词上时，高亮文档中所有相同的词
 */
export class CwsDocumentHighlightProvider implements vscode.DocumentHighlightProvider {

  async provideDocumentHighlights(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.DocumentHighlight[] | undefined> {

    // 检查配置是否启用高亮
    const config = vscode.workspace.getConfiguration('cws');
    const enableHighlight = config.get('enableWordHighlight', true);
    if (!enableHighlight) {
      return undefined;
    }

    const lineText = document.lineAt(position.line).text;
    const charPos = position.character;

    // 如果光标在空白或行尾，不提供高亮
    if (charPos >= lineText.length || /\s/.test(lineText[charPos])) {
      return undefined;
    }

    // 找到光标所在的词
    const wordStart = this.findWordStart(charPos, lineText);
    const wordEnd = this.findWordEnd(charPos, lineText);

    if (wordStart === undefined || wordEnd === undefined) {
      return undefined;
    }

    const currentWord = lineText.slice(wordStart, wordEnd);

    // 如果是纯 ASCII 词（英文/数字/下划线），让 VSCode 原生处理
    // 这样可以避免与语言服务器的高亮冲突（如 TypeScript、Python 等）
    if (/^[a-zA-Z0-9_]+$/.test(currentWord)) {
      return undefined;
    }

    // 如果词中不包含中文字符，也让 VSCode 原生处理
    if (!/[\u4e00-\u9fff]/.test(currentWord)) {
      return undefined;
    }

    // 包含中文，扫描文档找所有相同词
    const highlights: vscode.DocumentHighlight[] = [];

    // 只扫描可见范围附近的行（性能优化）
    const visibleRange = this.getVisibleRange(document, position);

    for (let lineNum = visibleRange.start; lineNum <= visibleRange.end; lineNum++) {
      const line = document.lineAt(lineNum).text;
      const tokens = parseSentence(line);

      for (const token of tokens) {
        if (token.word === currentWord) {
          highlights.push(
            new vscode.DocumentHighlight(
              new vscode.Range(lineNum, token.start, lineNum, token.end),
              vscode.DocumentHighlightKind.Text
            )
          );
        }
      }
    }

    return highlights.length > 0 ? highlights : undefined;
  }

  /**
   * 找到光标所在词的起始位置
   */
  private findWordStart(charPos: number, lineText: string): number | undefined {
    const tokens = parseSentence(lineText);
    const token = tokens.find(t => t.start <= charPos && t.end > charPos);
    return token?.start;
  }

  /**
   * 找到光标所在词的结束位置
   */
  private findWordEnd(charPos: number, lineText: string): number | undefined {
    const tokens = parseSentence(lineText);
    const token = tokens.find(t => t.start <= charPos && t.end > charPos);
    return token?.end;
  }

  /**
   * 获取可见范围附近的行号范围（性能优化）
   */
  private getVisibleRange(
    document: vscode.TextDocument,
    position: vscode.Position
  ): { start: number; end: number } {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      // 默认扫描前后 100 行
      return {
        start: Math.max(0, position.line - 100),
        end: Math.min(document.lineCount - 1, position.line + 100)
      };
    }

    const visibleRanges = editor.visibleRanges;
    if (visibleRanges.length === 0) {
      return {
        start: Math.max(0, position.line - 100),
        end: Math.min(document.lineCount - 1, position.line + 100)
      };
    }

    // 扩展可见范围前后各 20 行
    const firstVisible = visibleRanges[0].start.line;
    const lastVisible = visibleRanges[visibleRanges.length - 1].end.line;

    return {
      start: Math.max(0, firstVisible - 20),
      end: Math.min(document.lineCount - 1, lastVisible + 20)
    };
  }
}