import QuickLRU from 'quick-lru';
import * as vscode from 'vscode';

const cache = new QuickLRU<string, Token[]>({ maxSize: 25 });

interface Token {
  word: string;
  start: number;
  end: number;
}

type SegmenterFunction = (text: string) => Token[];

export function intlSegmenterTokenizeFunc(locales: string[] | undefined): SegmenterFunction {
  const intlSegmenter = new Intl.Segmenter(locales, { granularity: 'word' });
  return (text: string) =>
    Array.from(intlSegmenter.segment(text), ({ segment, index }) => {
      return { word: segment, start: index, end: index + segment.length };
    });
}

/**
 * jieba.tokenize的wrapper生成函数，处理emoji相关的特殊问题
 */
export async function jiebaTokenizeFunc(): Promise<SegmenterFunction> {
  const jieba = await import('jieba-wasm');

  /**
   * 基于grapheme集群边界合并tokens，包含码点索引到UTF-16索引的转换
   * @param originalTokens 原始tokens（包含码点索引）
   * @param text 原始文本
   * @returns 合并后的tokens（包含UTF-16索引）
   */
  function mergeGraphemeTokens(originalTokens: { word: string; start: number; end: number }[], text: string): Token[] {
    // 首先将码点索引转换为UTF-16索引
    const codePointToUtf16Map = buildCodePointToUtf16Map(text);
    const tokens = originalTokens.map((token) => ({
      word: token.word,
      start: codePointToUtf16Map[token.start],
      end: codePointToUtf16Map[token.end]
    }));

    // 创建grapheme分割器
    const graphemeSegmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const graphemes = Array.from(graphemeSegmenter.segment(text));

    // 预构建位置到grapheme索引的映射表
    const positionToGraphemeIndex: number[] = new Array<number>(text.length).fill(-1);
    for (let i = 0; i < graphemes.length; i++) {
      const g = graphemes[i];
      for (let pos = g.index; pos < g.index + g.segment.length; pos++) {
        if (pos < text.length) {
          positionToGraphemeIndex[pos] = i;
        }
      }
    }

    const mergedTokens: Token[] = [];
    let i = 0;

    while (i < tokens.length) {
      const currentToken = tokens[i];
      const currentGraphemeIndex = positionToGraphemeIndex[currentToken.start];
      let mergedWord = currentToken.word;
      let end = currentToken.end;
      let j = i + 1;

      // 合并具有相同grapheme索引的连续tokens
      while (j < tokens.length) {
        const nextToken = tokens[j];
        const nextGraphemeIndex = positionToGraphemeIndex[nextToken.start];
        if (currentGraphemeIndex === nextGraphemeIndex) {
          mergedWord += nextToken.word;
          end = nextToken.end;
          j++;
        } else {
          break;
        }
      }

      mergedTokens.push({
        word: mergedWord,
        start: currentToken.start,
        end: end
      });

      i = j;
    }

    return mergedTokens;
  }

  /**
   * 构建码点索引到UTF-16索引的映射表
   * @param text 原始文本
   * @returns 映射表数组，索引为码点索引，值为UTF-16索引
   */
  function buildCodePointToUtf16Map(text: string): number[] {
    const codePointToUtf16Map: number[] = [];
    let utf16Index = 0;
    let codePointIndex = 0;

    // 遍历文本，构建映射表
    for (const char of text) {
      codePointToUtf16Map[codePointIndex] = utf16Index;
      utf16Index += char.length; // 每个字符的UTF-16长度（1或2）
      codePointIndex++;
    }
    // 添加最后一个位置的映射（用于end索引）
    codePointToUtf16Map[codePointIndex] = utf16Index;

    return codePointToUtf16Map;
  }


  return (text: string) => {
    // 调用原始的jieba.tokenize获取包含码点索引的tokens
    const originalTokens = jieba.tokenize(text, "default", true);

    // 基于grapheme集群边界合并tokens，内部包含码点索引到UTF-16索引的转换
    const tokens = mergeGraphemeTokens(originalTokens, text);

    return tokens;
  };
}

let segmenter: SegmenterFunction | null = null;

export enum SegmenterType {
  Jieba = 'jieba-wasm',
  IntlSegmenter = 'Intl.Segmenter'
}

export async function initializeSegmenter(): Promise<void> {
  cache.clear();
  const config = vscode.workspace.getConfiguration('jieba');
  const segmenterType = config.get<SegmenterType>('segmenter');

  vscode.window.showInformationMessage(`Initializing segmenter: ${segmenterType}...`);

  try {
    switch (segmenterType) {
    case SegmenterType.Jieba:
    {
      segmenter = await jiebaTokenizeFunc();
      break;
    }

    case SegmenterType.IntlSegmenter:
    {
      const locales = config.get<string[]>('intlSegmenterLocales');
      segmenter = intlSegmenterTokenizeFunc(locales);
      break;
    }

    default:
      vscode.window.showErrorMessage(`Unknown segmenter type: ${segmenterType}`);
      segmenter = null;
      break;
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to initialize ${segmenterType} segmenter. ${error instanceof Error ? error.message : String(error)}`);
    segmenter = null;
  }
}

export function parseSentence(sentence: string): Token[] {
  if (!segmenter) {
    vscode.window.showErrorMessage('Segmenter is not initialized or failed to initialize.');
    throw new Error('Segmenter is not initialized or failed to initialize.');
  }
  if (cache.has(sentence)) {
    return cache.get(sentence)!;
  }

  const tokens = segmenter(sentence);
  cache.set(sentence, tokens);
  return tokens;
}
