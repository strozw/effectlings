// 型付きエラー: Data.TaggedError と Effect.catchTag
//
// Effect ではエラーを文字列ではなく、`_tag` で区別できるクラスとして定義するのが定番です。
//
//   class MyError extends Data.TaggedError("MyError")<{ readonly reason: string }> {}
//   new MyError({ reason: "..." })   // _tag は "MyError"
//
// `Effect.catchTag("MyError", (e) => ...)` を使うと、特定のタグのエラーだけを
// 処理して回復できます。処理したエラーは型 E から取り除かれます。
//
// 課題:
//   1. NotFoundError を、タグ "NotFoundError" と `id: string` フィールドを持つ
//      TaggedError として定義してください
//   2. `recovered` で NotFoundError だけを処理し、`"default-<id>"` で成功させてください
//      （UnauthorizedError はそのまま残します）

import { Data, Effect } from "effect"
import assert from "node:assert/strict"

class NotFoundError extends Data.TaggedError("NotFoundError")<{ readonly id: string }> {}

class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{}> {}

const findItem = (id: string): Effect.Effect<string, NotFoundError | UnauthorizedError> => {
  if (id === "secret") return Effect.fail(new UnauthorizedError())
  if (id.startsWith("item-")) return Effect.succeed(`found ${id}`)
  return Effect.fail(new NotFoundError({ id }))
}

export const recovered = (id: string) =>
  findItem(id).pipe(
    Effect.catchTag("NotFoundError", (e) => Effect.succeed(`default-${e.id}`))
  )

// --- テスト（ここから下は編集しないでください） ---

const _type: (id: string) => Effect.Effect<string, UnauthorizedError> = recovered

assert.equal(Effect.runSync(recovered("item-1")), "found item-1")
assert.equal(Effect.runSync(recovered("missing")), "default-missing")
const unauthorized = Effect.runSync(Effect.flip(recovered("secret")))
assert.equal(unauthorized._tag, "UnauthorizedError")
const notFound = Effect.runSync(Effect.flip(findItem("x")))
assert.equal(notFound._tag, "NotFoundError")
assert.equal(notFound instanceof Error, true, "TaggedError は Error のサブクラスです")
console.log("NotFoundError だけを回復できました")
