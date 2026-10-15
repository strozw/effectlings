// I AM NOT DONE
//
// 競争とタイムアウト: Effect.race と Effect.timeout
//
// `Effect.race(a, b)` は 2 つを同時に実行し、先に成功したほうの結果を返します。
// 負けたほうは自動的に中断されます。
//
// `Effect.timeout(effect, "1 second")` は、時間内に終わらないとき
// `Cause.TimeoutError`（タグは "TimeoutError"）で失敗させます。
// タイムアウトしたときに別の値で回復したいなら、`Effect.timeoutOrElse` が便利です。
//
//   effect.pipe(Effect.timeoutOrElse({ duration: "1 second", orElse: () => Effect.succeed(fallback) }))
//
// 課題:
//   1. fastest で primary と mirror を競争させ、先に返ってきたほうの結果を使ってください
//   2. strict で primary に 50 ミリ秒のタイムアウトを付け、TimeoutError で失敗させてください
//   3. withFallback で primary に 50 ミリ秒のタイムアウトを付け、
//      タイムアウトしたら "cached" で成功するようにしてください

import { Cause, Effect } from "effect"
import assert from "node:assert/strict"

let primaryInterrupted = false

const primary = Effect.sleep("200 millis").pipe(
  Effect.as("primary"),
  Effect.onInterrupt(() => Effect.sync(() => (primaryInterrupted = true)))
)

const mirror = Effect.sleep("20 millis").pipe(Effect.as("mirror"))

export const fastest: Effect.Effect<string> = primary

export const strict: Effect.Effect<string, Cause.TimeoutError> = primary

export const withFallback: Effect.Effect<string> = primary

// --- テスト（ここから下は編集しないでください） ---

assert.equal(await Effect.runPromise(fastest), "mirror")
assert.equal(primaryInterrupted, true, "負けた primary は中断されるはずです")

const timeoutError = await Effect.runPromise(Effect.flip(strict))
assert.equal(timeoutError._tag, "TimeoutError")

primaryInterrupted = false
assert.equal(await Effect.runPromise(withFallback), "cached")
assert.equal(primaryInterrupted, true, "タイムアウトした primary は中断されるはずです")
console.log("race と timeout で待ち時間を短くできました")
