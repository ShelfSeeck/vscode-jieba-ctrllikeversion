import * as assert from "assert";
import * as vscode from 'vscode';
import { intlSegmenterTokenizeFunc, jiebaTokenizeFunc } from "../../parse";

suite("Tokenizer Test Suite", () => {
  vscode.window.showInformationMessage("Start tokenizer tests.");

  test("Segmenter consistency test on emojis", segmenterConsistencyTest);
});
// 测试分词器结果一致性
async function segmenterConsistencyTest() {
  // 测试文本包含各种emoji情况
  const testCases = [
    "😀",
    "😮💨",
    "😮‍💨",
    "👨‍👩‍👧‍👦 ",
    "😊👨‍👩‍👧‍👦",
    "😀 👨‍👩‍👧‍👦👨‍💻",
    "😮‍💨😀👨‍👩‍👧‍👦👨‍💻",
    "测试😮‍💨emoji分词"
  ];

  const intlTokenizer = intlSegmenterTokenizeFunc(["zh-CN"]);
  const jiebaTokenizer = await jiebaTokenizeFunc();

  for (const text of testCases) {
    // 使用Intl.Segmenter作为基准
    const intlTokens = intlTokenizer(text);

    // 使用jieba分词器
    const jiebaTokens = jiebaTokenizer(text);

    // 比较token数量
    assert.strictEqual(
      jiebaTokens.length,
      intlTokens.length,
      `Token count mismatch for text: "${text}"`
    );

    // 比较每个token的start和end位置
    for (let i = 0; i < jiebaTokens.length; i++) {
      const jiebaToken = jiebaTokens[i];
      const intlToken = intlTokens[i];

      assert.strictEqual(
        jiebaToken.start,
        intlToken.start,
        `Start position mismatch for token "${jiebaToken.word}" at index ${i} in text: "${text}"`
      );

      assert.strictEqual(
        jiebaToken.end,
        intlToken.end,
        `End position mismatch for token "${jiebaToken.word}" at index ${i} in text: "${text}"`
      );

      // 对于emoji token，确保word内容一致
      if (jiebaToken.word.match(/\p{Emoji}/u) || intlToken.word.match(/\p{Emoji}/u)) {
        assert.strictEqual(
          jiebaToken.word,
          intlToken.word,
          `Emoji word content mismatch at index ${i} in text: "${text}"`
        );
      }
    }
  }
}
