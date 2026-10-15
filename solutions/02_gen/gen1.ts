// Effect.gen: ジェネレータで Effect を順番に書く
//
// flatMap をつなげる代わりに、`Effect.gen` を使うと async/await のように
// 手続き的に書けます。`yield*` を付けると Effect の成功値を取り出せます。
//
//   const program = Effect.gen(function* () {
//     const a = yield* effectA      // effectA の成功値
//     const b = yield* effectB(a)
//     return a + b
//   })
//
// 課題: program の中で Effect の値を取り出せていません。直してください。

import { Effect } from "effect"
import assert from "node:assert/strict"

const getUser = (id: number) => Effect.succeed({ id, name: `user-${id}` })

const getPosts = (userId: number) =>
  Effect.succeed([`post-${userId}-a`, `post-${userId}-b`, `post-${userId}-c`])

export const program = Effect.gen(function* () {
  const user = yield* getUser(1)
  const posts = yield* getPosts(user.id)
  return `${user.name} は ${posts.length} 件投稿しています`
})

// --- テスト（ここから下は編集しないでください） ---

const message: string = Effect.runSync(program)
assert.equal(message, "user-1 は 3 件投稿しています")
console.log(message)
