// Effect の基本: pipe, Effect.map, Effect.flatMap
//
// Effect は `.pipe(...)` で変換をつなげていけます。
//   - Effect.map(f):     成功値を普通の関数 f で変換する   (A => B)
//   - Effect.flatMap(f): 成功値から次の Effect を作ってつなぐ (A => Effect<B, E2>)
//
// 課題:
//   1. `withTax` を、price に 10% の消費税を加えた金額（Math.round で四捨五入）にしてください
//   2. `discounted` は applyDiscount の結果（Effect）をつなげたいのに、
//      map を使っているため Effect の中に Effect が入ってしまっています。直してください

import { Effect } from "effect"
import assert from "node:assert/strict"

const price = Effect.succeed(100)

export const withTax = price.pipe(Effect.map((n) => Math.round(n * 1.1)))

const applyDiscount = (total: number, discount: number): Effect.Effect<number, string> =>
  total - discount < 0
    ? Effect.fail("割引額が大きすぎます")
    : Effect.succeed(total - discount)

export const discounted = withTax.pipe(
  Effect.flatMap((total) => applyDiscount(total, 10))
)

export const tooMuch = withTax.pipe(
  Effect.flatMap((total) => applyDiscount(total, 1000))
)

// --- テスト（ここから下は編集しないでください） ---

const taxed: number = Effect.runSync(withTax)
assert.equal(taxed, 110)

const _discountedType: Effect.Effect<number, string> = discounted
assert.equal(Effect.runSync(discounted), 100)
assert.equal(Effect.runSync(Effect.flip(tooMuch)), "割引額が大きすぎます")
console.log(`税込み ${taxed} 円、割引後 ${Effect.runSync(discounted)} 円`)
