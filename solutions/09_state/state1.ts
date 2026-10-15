// 共有状態: Ref
//
// 複数のファイバーから同じ値を読み書きするときは、ふつうの変数ではなく `Ref` を使います。
//
//   const ref = yield* Ref.make(0)        // 初期値 0 の Ref を作る
//   yield* Ref.get(ref)                   // 値を読む
//   yield* Ref.set(ref, 1)                // 値を書く
//   yield* Ref.update(ref, (n) => n + 1)  // 今の値から新しい値を計算して書く（不可分）
//
// `Ref.get` してから `Ref.set` すると、その間にほかのファイバーが書いた値を上書きしてしまいます。
// 今の値をもとに更新するときは、読み込みと書き込みを 1 回で行う `Ref.update` を使いましょう。
//
// 課題: increment は get と set に分かれているため、並行に実行すると更新が失われます。
//       Ref.update を使って、100 回の increment がすべて反映されるようにしてください。

import { Effect, Ref } from "effect"
import assert from "node:assert/strict"

const increment = (counter: Ref.Ref<number>): Effect.Effect<void> => Ref.update(counter, (n) => n + 1)

export const program = Effect.gen(function* () {
  const counter = yield* Ref.make(0)
  yield* Effect.forEach(Array.from({ length: 100 }), () => increment(counter), { concurrency: "unbounded" })
  return yield* Ref.get(counter)
})

// --- テスト（ここから下は編集しないでください） ---

const count = await Effect.runPromise(program)
assert.equal(count, 100, `100 回 increment したのに ${count} になりました`)
console.log(`カウンタは ${count} になりました`)
