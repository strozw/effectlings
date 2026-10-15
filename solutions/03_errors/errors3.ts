// 複数のエラーをまとめて扱う: Effect.catchTags と Effect.result
//
// `Effect.catchTags({ TagA: (e) => ..., TagB: (e) => ... })` を使うと、
// 複数のタグのエラーを一度に処理できます。
//
// `Effect.result(effect)` は、成功・失敗を `Result<A, E>` という値に変換し、
// 「失敗しない Effect」にします（v3 の Effect.either に相当します）。
//   Result.isSuccess(r) なら r.success、Result.isFailure(r) なら r.failure で値を取り出せます。
//
// 課題:
//   1. `handled` で TimeoutError は "timeout" に、NotFoundError は "not found" に回復させてください
//      （ValidationError は処理せずに残します）
//   2. `describe` で handled を Effect.result を使って Result に変換し、
//      成功なら "ok: <値>"、失敗なら "invalid: <field>" という文字列にしてください

import { Data, Effect, Result } from "effect"
import assert from "node:assert/strict"

class TimeoutError extends Data.TaggedError("TimeoutError")<{}> {}
class NotFoundError extends Data.TaggedError("NotFoundError")<{}> {}
class ValidationError extends Data.TaggedError("ValidationError")<{ readonly field: string }> {}

const request = (input: string): Effect.Effect<string, TimeoutError | NotFoundError | ValidationError> => {
  switch (input) {
    case "slow":
      return Effect.fail(new TimeoutError())
    case "missing":
      return Effect.fail(new NotFoundError())
    case "":
      return Effect.fail(new ValidationError({ field: "input" }))
    default:
      return Effect.succeed(input.toUpperCase())
  }
}

export const handled = (input: string) =>
  request(input).pipe(
    Effect.catchTags({
      TimeoutError: () => Effect.succeed("timeout"),
      NotFoundError: () => Effect.succeed("not found")
    })
  )

export const describe = (input: string): Effect.Effect<string> =>
  handled(input).pipe(
    Effect.result,
    Effect.map((result) => (Result.isSuccess(result) ? `ok: ${result.success}` : `invalid: ${result.failure.field}`))
  )

// --- テスト（ここから下は編集しないでください） ---

const _handledType: (input: string) => Effect.Effect<string, ValidationError> = handled

assert.equal(Effect.runSync(handled("slow")), "timeout")
assert.equal(Effect.runSync(handled("missing")), "not found")
assert.equal(Effect.runSync(describe("hello")), "ok: HELLO")
assert.equal(Effect.runSync(describe("slow")), "ok: timeout")
assert.equal(Effect.runSync(describe("")), "invalid: input")

const r = Effect.runSync(Effect.result(handled("")))
assert.equal(Result.isFailure(r), true)
console.log("catchTags と Effect.result を使いこなせました")
