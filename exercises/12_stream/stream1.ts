// I AM NOT DONE
//
// ストリーム: Stream の基本
//
// `Effect` が「1 つの値を返す処理」なのに対して、`Stream` は「値を次々に流す処理」です。
// 配列と似た操作で変換でき、`Stream.run*` で実行して初めて値が流れます。
//
//   Stream.make(1, 2, 3)                    // 決まった値を流す
//   Stream.range(1, 100)                    // 1 から 100 までの整数を流す
//   Stream.fromIterable(array)              // 配列などから流す
//
//   stream.pipe(Stream.filter((n) => ...), Stream.map((n) => ...), Stream.take(3))
//
//   Stream.runCollect(stream)               // すべて集めて配列にする Effect
//   Stream.runFold(stream, () => 0, (acc, n) => acc + n)  // 畳み込む Effect
//
// Stream は必要な分だけ値を作るので、`Stream.iterate` のような終わりのないストリームでも
// `Stream.take` で切り取れば実行できます。
//
// 課題:
//   1. firstSquares を、1 から始まる整数のうち 3 の倍数だけを 2 乗し、最初の 4 つを集めた配列にしてください
//   2. total を、1 から 100 までの整数の合計にしてください（Stream.runFold を使います）

import { Effect, Stream } from "effect"
import assert from "node:assert/strict"

// 1, 2, 3, ... と終わりなく続くストリーム
const naturals = Stream.iterate(1, (n) => n + 1)

export const firstSquares: Effect.Effect<Array<number>> = naturals.pipe(
  Stream.map((n) => n * n),
  Stream.filter((n) => n % 3 === 0)
)

export const total: Effect.Effect<number> = Stream.range(1, 100)

// --- テスト（ここから下は編集しないでください） ---

assert.deepEqual(Effect.runSync(firstSquares), [9, 36, 81, 144])
assert.equal(Effect.runSync(total), 5050)
console.log(`3 の倍数の 2 乗: ${Effect.runSync(firstSquares).join(", ")}、合計: ${Effect.runSync(total)}`)
