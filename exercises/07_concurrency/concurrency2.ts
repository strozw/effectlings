// I AM NOT DONE
//
// ファイバー: Effect.forkChild, Fiber.join, Fiber.interrupt
//
// Effect は「ファイバー」という軽量なスレッドの上で動きます。
// `Effect.forkChild(effect)` で effect を別のファイバーとしてバックグラウンドで開始し、
// すぐに `Fiber` を受け取れます（effect の完了は待ちません）。
//
//   const fiber = yield* Effect.forkChild(slowTask)   // バックグラウンドで開始
//   // ... ほかの処理 ...
//   const result = yield* Fiber.join(fiber)           // 完了を待って結果を受け取る
//   yield* Fiber.interrupt(fiber)                     // 途中で中断する
//
// 課題:
//   1. program で backgroundJob をバックグラウンドで開始し、mainWork のあとで結果を受け取ってください
//   2. stopTicker で ticker をバックグラウンドで開始し、30 ミリ秒後に中断してください

import { Effect, Fiber } from "effect"
import assert from "node:assert/strict"

const log: Array<string> = []

const backgroundJob = Effect.gen(function* () {
  yield* Effect.sleep("30 millis")
  log.push("background done")
  return 42
})

const mainWork = Effect.sync(() => log.push("main work"))

export const program = Effect.gen(function* () {
  const result = yield* backgroundJob
  yield* mainWork
  return result
})

let ticks = 0
let stopped = false

// 10 ミリ秒ごとに ticks を増やし続ける（自分では終わらない）処理
const ticker = Effect.forever(Effect.sync(() => ticks++).pipe(Effect.andThen(Effect.sleep("10 millis")))).pipe(
  Effect.onInterrupt(() => Effect.sync(() => (stopped = true)))
)

export const stopTicker = Effect.gen(function* () {
  yield* Effect.forkChild(ticker)
  yield* Effect.sleep("30 millis")
})

// --- テスト（ここから下は編集しないでください） ---

assert.equal(await Effect.runPromise(program), 42)
assert.deepEqual(log, ["main work", "background done"], "backgroundJob の完了を待たずに mainWork を実行してください")

await Effect.runPromise(stopTicker)
assert.equal(stopped, true, "ticker を中断してください")
assert.ok(ticks > 0, "ticker が一度も実行されていません")
const ticksAfterStop = ticks
await Effect.runPromise(Effect.sleep("30 millis"))
assert.equal(ticks, ticksAfterStop, "中断したあとも ticker が動き続けています")
console.log(`ticker は ${ticks} 回動いてから止まりました`)
