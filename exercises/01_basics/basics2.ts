// I AM NOT DONE
//
// Effect の基本: Effect.sync と Effect.fail
//
// `Effect.succeed(x)` の `x` は Effect を作った時点で評価されます。
// 副作用（カウンタの更新、現在時刻の取得、ログ出力など）を含む処理は、
// `Effect.sync(() => ...)` で包んで「実行されるたびに」評価されるようにします。
//
// また、失敗する Effect は `Effect.fail(error)` で作ります。
// エラーの型は Effect の 2 番目の型パラメータ E に現れます。
//
// 課題:
//   1. `increment` を、実行するたびに counter を 1 増やしてその値を返す Effect にしてください
//   2. `failure` を、文字列 "boom" で失敗する Effect にしてください

import { Effect } from "effect"
import assert from "node:assert/strict"

let counter = 0

export const increment: Effect.Effect<number> = Effect.succeed(++counter)

export const failure: Effect.Effect<never, string> = Effect.succeed("boom")

// --- テスト（ここから下は編集しないでください） ---

assert.equal(counter, 0, "Effect を作っただけで counter が変わってしまいました")
assert.equal(Effect.runSync(increment), 1)
assert.equal(Effect.runSync(increment), 2)
assert.equal(counter, 2)

// Effect.flip は成功と失敗を入れ替えます。失敗の中身を取り出すのに便利です
assert.equal(Effect.runSync(Effect.flip(failure)), "boom")
console.log("increment と failure は期待どおりに動きました")
