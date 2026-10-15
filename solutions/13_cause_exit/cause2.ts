// 実行結果を値として受け取る: Exit と Cause
//
// `Effect.runSync` は失敗すると例外を投げますが、`Effect.runSyncExit` は結果を `Exit` という値で返します
// （Promise 版は `Effect.runPromiseExit`）。
//
//   Exit.match(exit, {
//     onSuccess: (value) => ...,
//     onFailure: (cause) => ...
//   })
//
// 失敗の詳細は `Cause` に入っています。Cause は「型付きエラー」「欠陥」「中断」をまとめて表します。
//
//   Cause.hasFails(cause)          // 型付きエラーを含むか
//   Cause.hasDies(cause)           // 欠陥を含むか
//   Cause.hasInterrupts(cause)     // 中断を含むか
//   Cause.findErrorOption(cause)   // 最初の型付きエラーを Option で取り出す
//
// 課題: report を、effect を runSyncExit で実行して次の文字列を返すようにしてください。
//   - 成功: "ok: <値>"
//   - 型付きエラー: "error: <エラーの _tag>"
//   - 欠陥: "defect"
//   - 中断: "interrupted"

import { Cause, Data, Effect, Exit, Option } from "effect"
import assert from "node:assert/strict"

class TimeoutError extends Data.TaggedError("TimeoutError")<{}> {}

export const report = (effect: Effect.Effect<number, TimeoutError>): string =>
  Exit.match(Effect.runSyncExit(effect), {
    onSuccess: (value) => `ok: ${value}`,
    onFailure: (cause) => {
      if (Cause.hasFails(cause)) {
        return Option.match(Cause.findErrorOption(cause), {
          onNone: () => "error",
          onSome: (error) => `error: ${error._tag}`
        })
      }
      if (Cause.hasDies(cause)) return "defect"
      return "interrupted"
    }
  })

// --- テスト（ここから下は編集しないでください） ---

assert.equal(report(Effect.succeed(1)), "ok: 1")
assert.equal(report(Effect.fail(new TimeoutError())), "error: TimeoutError")
assert.equal(report(Effect.die(new Error("bug"))), "defect")
assert.equal(report(Effect.interrupt), "interrupted")
console.log("Exit と Cause で結果を分類できました")
