// 例外を投げるコードを Effect にする: Effect.try と Effect.tryPromise
//
// `Effect.sync` や `Effect.promise` は「失敗しない」処理用です。
// 中で例外が投げられたり Promise が reject されたりすると、型付きエラーではなく
// 「欠陥（defect）」として扱われ、catchTag などでは捕まえられません。
//
// 失敗しうる処理は次のように包み、例外を型付きエラーに変換します。
//
//   Effect.try({ try: () => ..., catch: (e) => new MyError(...) })
//   Effect.tryPromise({ try: (signal) => fetch(...), catch: (e) => new MyError(...) })
//
// 課題:
//   1. parseJson を、JSON.parse の例外を ParseError({ input }) に変換するようにしてください
//   2. fetchText を、fakeFetch の reject を FetchError({ url }) に変換するようにしてください

import { Data, Effect } from "effect"
import assert from "node:assert/strict"

class ParseError extends Data.TaggedError("ParseError")<{ readonly input: string }> {}

class FetchError extends Data.TaggedError("FetchError")<{ readonly url: string }> {}

export const parseJson = (input: string): Effect.Effect<unknown, ParseError> =>
  Effect.try({
    try: () => JSON.parse(input),
    catch: () => new ParseError({ input })
  })

const fakeFetch = (url: string): Promise<string> =>
  url.startsWith("https://")
    ? Promise.resolve(`<html>${url}</html>`)
    : Promise.reject(new Error(`invalid url: ${url}`))

export const fetchText = (url: string): Effect.Effect<string, FetchError> =>
  Effect.tryPromise({
    try: () => fakeFetch(url),
    catch: () => new FetchError({ url })
  })

// --- テスト（ここから下は編集しないでください） ---

assert.deepEqual(Effect.runSync(parseJson('{"a":1}')), { a: 1 })
const parseError = Effect.runSync(Effect.flip(parseJson("{oops")))
assert.equal(parseError._tag, "ParseError")
assert.equal(parseError.input, "{oops")

assert.equal(await Effect.runPromise(fetchText("https://effect.website")), "<html>https://effect.website</html>")
const fetchError = await Effect.runPromise(Effect.flip(fetchText("ftp://example.com")))
assert.equal(fetchError._tag, "FetchError")
assert.equal(fetchError.url, "ftp://example.com")
console.log("例外を型付きエラーに変換できました")
