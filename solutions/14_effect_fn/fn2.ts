// ログに文脈を付ける: Effect.annotateLogs と Effect.withLogSpan
//
// 同じ処理が何度も並行して動くと、どのログがどのリクエストのものか分からなくなります。
// `Effect.annotateLogs` を使うと、その Effect の中で出すすべてのログに注釈（キーと値）が付きます。
//
//   effect.pipe(Effect.annotateLogs("requestId", id))
//   effect.pipe(Effect.annotateLogs({ requestId: id, user: name }))
//
// `Effect.withLogSpan("label")` を使うと、ログに「その区間が始まってからの経過時間」が付きます。
//
// Effect.fn の 2 番目以降の引数に変換を置けば、関数全体のログに注釈を付けられます。
// 変換関数は本体の Effect に加えて、関数に渡された引数も受け取れます。
//
//   Effect.fn("handle")(
//     function* (id: string) { ... },
//     (effect, id) => effect.pipe(Effect.annotateLogs("id", id))
//   )
//
// 課題:
//   1. handleRequest の中のすべてのログに requestId の注釈を付けてください
//   2. handleRequest のログに "handleRequest" というログスパンを付けてください

import { Effect, Logger, References } from "effect"
import assert from "node:assert/strict"

interface Entry {
  readonly message: string
  readonly annotations: Record<string, unknown>
  readonly spans: ReadonlyArray<string>
}

const entries: Array<Entry> = []

// メッセージと注釈とログスパンの名前を entries に集める Logger
const collector = Logger.make(({ message, fiber }) => {
  entries.push({
    message: Array.isArray(message) ? message.join(" ") : String(message),
    annotations: { ...fiber.getRef(References.CurrentLogAnnotations) },
    spans: fiber.getRef(References.CurrentLogSpans).map(([label]) => label)
  })
})

const loadUser = Effect.fn("loadUser")(function* (name: string) {
  yield* Effect.log(`loading ${name}`)
  return { name }
})

export const handleRequest = Effect.fn("handleRequest")(
  function* (requestId: string, name: string) {
    yield* Effect.log("start")
    const user = yield* loadUser(name)
    yield* Effect.log("done")
    return user
  },
  (effect, requestId) => effect.pipe(Effect.annotateLogs("requestId", requestId), Effect.withLogSpan("handleRequest"))
)

// --- テスト（ここから下は編集しないでください） ---

Effect.runSync(
  Effect.all([handleRequest("r-1", "alice"), handleRequest("r-2", "bob")]).pipe(
    Effect.provide(Logger.layer([collector]))
  )
)

assert.deepEqual(
  entries.map((e) => `${e.annotations.requestId}: ${e.message}`),
  ["r-1: start", "r-1: loading alice", "r-1: done", "r-2: start", "r-2: loading bob", "r-2: done"]
)
assert.ok(
  entries.every((e) => e.spans.includes("handleRequest")),
  "すべてのログに handleRequest のログスパンを付けてください"
)
console.log("ログに requestId とログスパンを付けられました")
