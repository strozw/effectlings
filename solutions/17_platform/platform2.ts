// HTTP クライアント: HttpClient
//
// `effect/http` の `HttpClient` を使うと、HTTP リクエストを Effect として扱えます。
// HttpClient もサービスなので、本番では `FetchHttpClient.layer` などを、テストではモックを提供します。
//
//   const response = yield* HttpClient.get("https://example.com/todos/1")
//   const ok = yield* HttpClientResponse.filterStatusOk(response)   // 2xx 以外を HttpClientError にする
//   const json = yield* ok.json                                     // 本文を JSON として読む
//   const todo = yield* Schema.decodeUnknownEffect(Todo)(json)      // Schema で検証する
//
// 失敗は `HttpClientError`（通信やステータスコードのエラー）と `SchemaError`（形が違う）で表されます。
//
// 課題: getTodo を、`https://api.example.com/todos/<id>` を GET して、
//       2xx でなければ失敗させ、本文を Todo として検証して返すようにしてください。
//       さらに findTodo で、成功したら Option.some(todo) に、HttpClientError なら Option.none() で成功させてください。
//       （Effect.asSome で成功値を Some に包み、Effect.succeedNone で None で成功する Effect を作れます）

import { Effect, Layer, Option, Schema } from "effect"
import { HttpClient, HttpClientResponse } from "effect/http"
import assert from "node:assert/strict"

const Todo = Schema.Struct({
  id: Schema.Finite,
  title: Schema.String,
  completed: Schema.Boolean
})

export const getTodo = (id: number) =>
  HttpClient.get(`https://api.example.com/todos/${id}`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((response) => response.json),
    Effect.flatMap(Schema.decodeUnknownEffect(Todo))
  )

export const findTodo = (id: number) =>
  getTodo(id).pipe(
    Effect.asSome,
    Effect.catchTag("HttpClientError", () => Effect.succeedNone)
  )

// --- テスト（ここから下は編集しないでください） ---

// 実際には通信せず、決まったレスポンスを返す HttpClient
const requested: Array<string> = []
const MockHttpClient = Layer.succeed(
  HttpClient.HttpClient,
  HttpClient.make((request, url) => {
    requested.push(`${request.method} ${url.pathname}`)
    const body =
      url.pathname === "/todos/1"
        ? Response.json({ id: 1, title: "learn HttpClient", completed: false })
        : url.pathname === "/todos/2"
          ? Response.json({ id: 2, title: 42 })
          : new Response("not found", { status: 404 })
    return Effect.succeed(HttpClientResponse.fromWeb(request, body))
  })
)

const run = <A, E>(effect: Effect.Effect<A, E, HttpClient.HttpClient>) =>
  Effect.runPromise(effect.pipe(Effect.provide(MockHttpClient)))

assert.deepEqual(await run(getTodo(1)), { id: 1, title: "learn HttpClient", completed: false })
assert.equal((await run(Effect.flip(getTodo(2))))._tag, "SchemaError")
assert.equal((await run(Effect.flip(getTodo(3))))._tag, "HttpClientError")
assert.deepEqual(await run(findTodo(3)), Option.none())
assert.equal((await run(Effect.flip(findTodo(2))))._tag, "SchemaError", "SchemaError は回復させないでください")
assert.deepEqual(requested, ["GET /todos/1", "GET /todos/2", "GET /todos/3", "GET /todos/3", "GET /todos/2"])
console.log("HttpClient で取得したデータを Schema で検証できました")
