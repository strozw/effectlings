// I AM NOT DONE
//
// 再試行: Effect.retry
//
// ネットワークの一時的な失敗のように、もう一度試せば成功するかもしれない処理は
// `Effect.retry` で再試行できます。
//
//   effect.pipe(Effect.retry({ times: 3 }))                           // 最大 3 回まで再試行
//   effect.pipe(Effect.retry({ times: 3, while: (e) => e.retryable })) // 条件を満たすエラーのときだけ再試行
//
// 再試行しても成功しなかった場合は、最後のエラーで失敗します。
//
// 課題:
//   1. fetchWithRetry で、fetchQuote を最大 3 回まで再試行してください
//   2. fetchSafely で、NetworkError のときだけ最大 3 回まで再試行してください
//      （AuthError は再試行しても成功しないので、すぐに失敗させます）

import { Data, Effect } from "effect"
import assert from "node:assert/strict"

class NetworkError extends Data.TaggedError("NetworkError")<{}> {}
class AuthError extends Data.TaggedError("AuthError")<{}> {}

let attempts = 0

// 最初の 2 回は NetworkError で失敗し、3 回目で成功する
const fetchQuote: Effect.Effect<string, NetworkError | AuthError> = Effect.suspend(() => {
  attempts++
  return attempts < 3 ? Effect.fail(new NetworkError()) : Effect.succeed("Effect is awesome")
})

export const fetchWithRetry = fetchQuote

// 毎回 AuthError で失敗する
const fetchSecret: Effect.Effect<string, NetworkError | AuthError> = Effect.suspend(() => {
  attempts++
  return Effect.fail(new AuthError())
})

export const fetchSafely = fetchSecret.pipe(Effect.retry({ times: 3 }))

// --- テスト（ここから下は編集しないでください） ---

assert.equal(Effect.runSync(fetchWithRetry), "Effect is awesome")
assert.equal(attempts, 3)

attempts = 0
const error = Effect.runSync(Effect.flip(fetchSafely))
assert.equal(error._tag, "AuthError")
assert.equal(attempts, 1, "AuthError のときは再試行しないでください")
console.log("必要なときだけ再試行できるようになりました")
