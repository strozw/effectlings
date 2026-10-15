// ファイバー間の合図: Deferred
//
// `Deferred<A, E>` は「あとで一度だけ値が入る箱」です。
// `Deferred.await` で待っているファイバーは、ほかのファイバーが値を入れるまで止まります。
//
//   const ready = yield* Deferred.make<string>()
//   yield* Deferred.await(ready)            // 値が入るまで待つ
//   yield* Deferred.succeed(ready, "go")    // 値を入れる（待っているファイバーが動き出す）
//
// 課題: worker は start の合図を待ってから作業を始めます。
//       program で worker たちを起動したあと、setup が終わってから
//       start に "go" を入れて、worker を動かしてください。

import { Deferred, Effect, Fiber } from "effect"
import assert from "node:assert/strict"

const log: Array<string> = []

const worker = (name: string, start: Deferred.Deferred<string>) =>
  Effect.gen(function* () {
    const signal = yield* Deferred.await(start)
    log.push(`${name}: ${signal}`)
  })

const setup = Effect.sleep("20 millis").pipe(Effect.andThen(Effect.sync(() => log.push("setup done"))))

export const program = Effect.gen(function* () {
  const start = yield* Deferred.make<string>()
  const fibers = yield* Effect.forEach(["A", "B"], (name) => Effect.forkChild(worker(name, start)))
  yield* setup
  yield* Deferred.succeed(start, "go")
  yield* Fiber.joinAll(fibers)
})

// --- テスト（ここから下は編集しないでください） ---

await Effect.runPromise(program.pipe(Effect.timeout("1 second")))
assert.deepEqual(log, ["setup done", "A: go", "B: go"])
console.log("Deferred で worker に開始の合図を送れました")
