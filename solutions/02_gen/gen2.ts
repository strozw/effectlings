// Effect.gen とエラー
//
// Effect.gen の中で失敗する Effect を `yield*` すると、そこで処理が中断され、
// Effect 全体がそのエラーで失敗します（例外の throw に似ています）。
// 自分で失敗させたいときは `return yield* Effect.fail(error)` と書きます。
//
// 課題: validateAge が次のように振る舞うようにしてください。
//   - 数値として読めない文字列 → "数値ではありません: <入力>" で失敗（parseAge が担当）
//   - 0 未満 → "年齢は 0 以上である必要があります" で失敗
//   - 150 より大きい → "年齢が大きすぎます" で失敗
//   - それ以外 → 年齢で成功

import { Effect } from "effect"
import assert from "node:assert/strict"

const parseAge = (input: string): Effect.Effect<number, string> => {
  const n = Number(input)
  return Number.isInteger(n) ? Effect.succeed(n) : Effect.fail(`数値ではありません: ${input}`)
}

export const validateAge = (input: string): Effect.Effect<number, string> =>
  Effect.gen(function* () {
    const age = yield* parseAge(input)
    if (age < 0) {
      return yield* Effect.fail("年齢は 0 以上である必要があります")
    }
    if (age > 150) {
      return yield* Effect.fail("年齢が大きすぎます")
    }
    return age
  })

// --- テスト（ここから下は編集しないでください） ---

const error = (input: string) => Effect.runSync(Effect.flip(validateAge(input)))

assert.equal(Effect.runSync(validateAge("20")), 20)
assert.equal(Effect.runSync(validateAge("0")), 0)
assert.equal(error("abc"), "数値ではありません: abc")
assert.equal(error("-1"), "年齢は 0 以上である必要があります")
assert.equal(error("200"), "年齢が大きすぎます")
console.log("validateAge は期待どおりに動きました")
