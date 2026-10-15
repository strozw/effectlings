// 同時実行数の制限: Semaphore
//
// `Semaphore` は「許可証（permit）」を決まった数だけ持つ仕組みです。
// 許可証を持っている間だけ処理を実行できるので、離れた場所から呼ばれる処理の同時実行数をまとめて制限できます。
//
//   const semaphore = yield* Semaphore.make(2)          // 許可証は 2 枚
//   yield* semaphore.withPermits(1)(effect)             // 1 枚借りて effect を実行し、終わったら返す
//   yield* Semaphore.withPermits(semaphore, 1)(effect)  // 同じ意味
//
// `Effect.forEach` の concurrency は 1 回の呼び出しの中だけの制限ですが、
// Semaphore は共有すれば、別々の場所から呼ばれた処理もまとめて制限できます。
//
// 課題: 外部 API には同時に 2 件までしかリクエストできません。
//       makeClient の中で Semaphore を作り、callApi が同時に 2 件までしか動かないようにしてください。

import { Effect, Semaphore } from "effect"
import assert from "node:assert/strict"

let running = 0
let maxRunning = 0

const request = (path: string) =>
  Effect.gen(function* () {
    running++
    maxRunning = Math.max(maxRunning, running)
    yield* Effect.sleep("10 millis")
    running--
    return `response of ${path}`
  })

export const makeClient = Effect.gen(function* () {
  const semaphore = yield* Semaphore.make(2)
  return {
    callApi: (path: string) => semaphore.withPermits(1)(request(path))
  }
})

export const program = Effect.gen(function* () {
  const client = yield* makeClient
  // ダッシュボードとバッチ処理が、それぞれ別々に API を呼ぶ
  const dashboard = Effect.all([client.callApi("/user"), client.callApi("/posts")], { concurrency: "unbounded" })
  const batch = Effect.forEach(["/a", "/b", "/c"], client.callApi, { concurrency: "unbounded" })
  return yield* Effect.all([dashboard, batch], { concurrency: "unbounded" })
})

// --- テスト（ここから下は編集しないでください） ---

const [dashboard, batch] = await Effect.runPromise(program)
assert.deepEqual(dashboard, ["response of /user", "response of /posts"])
assert.deepEqual(batch, ["response of /a", "response of /b", "response of /c"])
assert.equal(maxRunning, 2, `API への同時リクエストが ${maxRunning} 件になりました（2 件までにしてください）`)
console.log("Semaphore で同時リクエスト数を制限できました")
