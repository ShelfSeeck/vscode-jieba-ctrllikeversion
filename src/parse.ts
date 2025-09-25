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
   * 检查字符串是否是emoji
   * @param str 要检查的字符串
   * @returns 是否是emoji
   */
  function isEmoji(str: string): boolean {
    // 简单的emoji检测：包含emoji字符或ZWJ
    const emojiRegex = /\p{Emoji}/u;
    return emojiRegex.test(str) || str.includes('\u200D');
  }

  /**
   * 处理ZWJ序列，合并复合emoji
   * @param tokens 原始tokens
   * @returns 处理后的tokens
   */
  function mergeZwjTokens(tokens: Token[]): Token[] {
    const mergedTokens: Token[] = [];
    const ZWJ = '\u200D'; // 零宽连字符

    let i = 0;
    while (i < tokens.length) {
      const currentToken = tokens[i];

      // 检查是否是ZWJ序列的开始（当前token是emoji，后面跟着ZWJ和另一个emoji）
      if (i + 2 < tokens.length &&
        tokens[i + 1].word === ZWJ &&
        isEmoji(currentToken.word) &&
        isEmoji(tokens[i + 2].word)) {

        // 合并ZWJ序列
        let mergedWord = currentToken.word;
        let j = i + 1;

        while (j < tokens.length && tokens[j].word === ZWJ && j + 1 < tokens.length && isEmoji(tokens[j + 1].word)) {
          mergedWord += tokens[j].word + tokens[j + 1].word;
          j += 2;
        }

        mergedTokens.push({
          word: mergedWord,
          start: currentToken.start,
          end: tokens[j - 1].end
        });

        i = j;
      } else {
        mergedTokens.push(currentToken);
        i++;
      }
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
    // 调用原始的jieba.tokenize
    const originalTokens = jieba.tokenize(text, "default", true);

    // 预计算码点索引到UTF-16索引的映射表
    const codePointToUtf16Map = buildCodePointToUtf16Map(text);

    // 使用预计算的映射表转换索引
    let tokens = originalTokens.map((token: { word: string; start: number; end: number }) => ({
      word: token.word,
      start: codePointToUtf16Map[token.start],
      end: codePointToUtf16Map[token.end]
    }));

    // 合并ZWJ序列的复合emoji
    tokens = mergeZwjTokens(tokens);

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
