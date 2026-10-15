// スケジュール: Schedule と TestClock
//
// 再試行や繰り返しの「間隔」は `Schedule` で表します。
//
//   Schedule.spaced("1 second")          // 毎回 1 秒あける
//   Schedule.exponential("100 millis")   // 100ms, 200ms, 400ms, ... と倍々にあける
//   Schedule.recurs(3)                   // 3 回まで
//
//   effect.pipe(Effect.retry({ schedule: Schedule.exponential("100 millis"), times: 3 }))
//   effect.pipe(Effect.repeat({ schedule: Schedule.spaced("1 second"), times: 3 }))  // 成功したら繰り返す
//
// 時間のかかる処理をテストするときは、`TestClock` を使うと実際には待たずに時計を進められます。
// `TestClock.adjust("1 second")` で時計を進めると、その間に予定されていた処理が実行されます。
//
// 課題:
//   1. retryWithBackoff で、callApi を 100 ミリ秒から倍々に間隔をあけて、最大 3 回まで再試行してください
//   2. poll で、checkStatus を 1 秒間隔で 3 回繰り返してください（最初の 1 回と合わせて 4 回実行されます）

import { Clock, Effect, Fiber, Schedule } from "effect"
import { TestClock } from "effect/testing"
import assert from "node:assert/strict"

// 実行された時刻（ミリ秒）を記録する
const calledAt: Array<number> = []
const record = Clock.currentTimeMillis.pipe(Effect.tap((now) => Effect.sync(() => calledAt.push(now))))

const callApi = record.pipe(Effect.andThen(Effect.fail("unavailable")))

export const retryWithBackoff = callApi.pipe(Effect.retry({ schedule: Schedule.exponential("100 millis"), times: 3 }))

const checkStatus = record

export const poll = checkStatus.pipe(Effect.repeat({ schedule: Schedule.spaced("1 second"), times: 3 }))

// --- テスト（ここから下は編集しないでください） ---

// effect をバックグラウンドで開始し、TestClock で時計を 1 分進めてから結果を受け取る
const runWithTestClock = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(effect)
      yield* TestClock.adjust("1 minute")
      return yield* Fiber.join(fiber)
    }).pipe(Effect.exit, Effect.provide(TestClock.layer()))
  )

const started = Date.now()

await runWithTestClock(retryWithBackoff)
assert.deepEqual(calledAt, [0, 100, 300, 700], "100ms, 200ms, 400ms と間隔をあけて 3 回再試行してください")

calledAt.length = 0
await runWithTestClock(poll)
assert.deepEqual(calledAt, [0, 1000, 2000, 3000])

assert.ok(Date.now() - started < 2000, "TestClock を使っているので実際には待ちません")
console.log("Schedule で間隔を指定して再試行・繰り返しができました")
