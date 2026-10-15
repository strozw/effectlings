// 依存関係: Context.Service と Effect.provideService
//
// Effect の 3 番目の型パラメータ R は「実行に必要なサービス」を表します。
// サービスは `Context.Service` でクラスとして定義し、Effect.gen の中で
// `yield* サービス` とするとその実装を取り出せます。
//
//   class Clock extends Context.Service<Clock, { readonly now: Effect.Effect<number> }>()("Clock") {}
//
// R に残っているサービスを提供しない限り、Effect.runSync などで実行できません
// （型エラーになります）。`Effect.provideService(サービス, 実装)` で提供できます。
//
// 課題: `runnable` を、next が常に 0.5 を返す Random を提供した Effect にしてください。

import { Context, Effect } from "effect"
import assert from "node:assert/strict"

class Random extends Context.Service<
  Random,
  {
    readonly next: Effect.Effect<number>
  }
>()("Random") {}

export const rollDice = Effect.gen(function* () {
  const random = yield* Random
  const n = yield* random.next
  return Math.floor(n * 6) + 1
})

export const runnable: Effect.Effect<number> = rollDice.pipe(
  Effect.provideService(Random, { next: Effect.succeed(0.5) })
)

// --- テスト（ここから下は編集しないでください） ---

assert.equal(Effect.runSync(runnable), 4)
console.log(`サイコロの目: ${Effect.runSync(runnable)}`)
