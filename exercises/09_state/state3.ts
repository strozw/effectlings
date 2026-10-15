// I AM NOT DONE
//
// ファイバー間の受け渡し: Queue
//
// `Queue` はファイバー間で値を順番に受け渡すためのキューです。
//
//   const queue = yield* Queue.bounded<number>(10)  // 最大 10 個まで入るキュー
//   yield* Queue.offer(queue, 1)                    // 入れる（いっぱいなら空くまで待つ）
//   const n = yield* Queue.take(queue)              // 取り出す（空なら入るまで待つ）
//
// bounded のキューは、いっぱいのときに offer が待たされます。
// これによって、速い生産者が遅い消費者を追い越しすぎないように調整できます（バックプレッシャー）。
//
// 課題:
//   1. producer で 1 から 5 までの注文番号を順番にキューに入れてください
//   2. consumer でキューから 5 件取り出し、`order-<番号>` の配列にして返してください

import { Effect, Fiber, Queue } from "effect"
import assert from "node:assert/strict"

export const producer = (queue: Queue.Queue<number>): Effect.Effect<void> => Effect.void

export const consumer = (queue: Queue.Queue<number>): Effect.Effect<Array<string>> => Effect.succeed([])

export const program = Effect.gen(function* () {
  const queue = yield* Queue.bounded<number>(2)
  const producerFiber = yield* Effect.forkChild(producer(queue))
  const orders = yield* consumer(queue)
  yield* Fiber.join(producerFiber)
  return orders
})

// --- テスト（ここから下は編集しないでください） ---

const orders = await Effect.runPromise(program.pipe(Effect.timeout("1 second")))
assert.deepEqual(orders, ["order-1", "order-2", "order-3", "order-4", "order-5"])
console.log(`注文を処理しました: ${orders.join(", ")}`)
