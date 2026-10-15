// Effect の基本: Effect.succeed と Effect.runSync
//
// `Effect.succeed(value)` は、必ず `value` で成功する Effect を作ります。
// 型は `Effect.Effect<A>` （= Effect<A, never, never>）になり、
//   A: 成功したときの値の型
//   E: 失敗したときのエラーの型（never = 失敗しない）
//   R: 実行に必要なサービスの型（never = 何も必要ない）
// を表します。
//
// 課題: `answer` が数値の 42 で成功する Effect になるように直してください。

import { Effect } from "effect"
import assert from "node:assert/strict"

export const answer = Effect.succeed(42)

// --- テスト（ここから下は編集しないでください） ---

const value: number = Effect.runSync(answer)
assert.equal(value, 42)
console.log(`answer = ${value}`)
