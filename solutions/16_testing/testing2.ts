// 出力と時間をテストする: Console, TestConsole, TestClock
//
// `console.log` を直接呼ぶと、何が出力されたかをテストで確かめにくくなります。
// Effect の `Console.log` を使うと、出力先がサービスになるので、テストでは `TestConsole` に差し替えられます。
//
//   yield* Console.log("hello")                 // 標準では console.log と同じ
//   const lines = yield* TestConsole.logLines   // TestConsole.layer を提供すると、出力された内容を取り出せる
//
// 08_schedule で使った `TestClock` と組み合わせると、「1 秒ごとに出力する」ような処理も一瞬でテストできます。
//
// 課題:
//   1. countdown の console.log を Console.log に置き換えてください
//   2. テストで、countdown を TestConsole.layer と TestClock.layer() の両方を提供して実行できるようにしてください
//      （testLayer を直します。Layer.mergeAll を使います）

import { Console, Effect, Fiber, Layer } from "effect"
import { TestClock, TestConsole } from "effect/testing"
import assert from "node:assert/strict"

export const countdown = (from: number) =>
  Effect.gen(function* () {
    for (let n = from; n > 0; n--) {
      yield* Console.log(`${n}...`)
      yield* Effect.sleep("1 second")
    }
    yield* Console.log("liftoff!")
  })

const testLayer = Layer.mergeAll(TestConsole.layer, TestClock.layer())

// --- テスト（ここから下は編集しないでください） ---

const started = Date.now()
const lines = await Effect.runPromise(
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(countdown(3))
    yield* TestClock.adjust("1 second")
    const afterOneSecond = yield* TestConsole.logLines
    assert.deepEqual(afterOneSecond, ["3...", "2..."], "1 秒後には 2 行出力されているはずです")
    yield* TestClock.adjust("2 seconds")
    yield* Fiber.join(fiber)
    return yield* TestConsole.logLines
  }).pipe(Effect.provide(testLayer))
)
assert.deepEqual(lines, ["3...", "2...", "1...", "liftoff!"])
assert.ok(Date.now() - started < 2000, "TestClock を使っているので実際には待ちません")
console.log(lines.join(" "))
