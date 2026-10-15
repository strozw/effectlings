// 値がないかもしれない: Option
//
// `Option<A>` は「値がある（Some）」か「値がない（None）」かを表す型です。
// `undefined` や `null` の代わりに使うと、値がないケースの扱いを型で強制できます。
//
//   Option.some(1)                     // Some(1)
//   Option.none()                      // None
//   Option.fromNullishOr(value)        // null / undefined なら None、それ以外は Some
//   Option.map(option, (a) => ...)     // Some のときだけ中身を変換する
//   Option.getOrElse(option, () => x)  // None なら x を使う
//   Option.match(option, { onNone: () => ..., onSome: (a) => ... })
//
// 課題:
//   1. findUser を、見つからないとき None を返すように直してください
//   2. displayName を、ユーザーがいれば名前を大文字にしたもの、いなければ "GUEST" を返すようにしてください
//   3. greeting を Option.match で「こんにちは、<名前> さん」/「はじめまして」にしてください

import { Option } from "effect"
import assert from "node:assert/strict"

interface User {
  readonly id: number
  readonly name: string
}

const users: ReadonlyArray<User> = [
  { id: 1, name: "alice" },
  { id: 2, name: "bob" }
]

export const findUser = (id: number): Option.Option<User> => Option.fromNullishOr(users.find((u) => u.id === id))

export const displayName = (id: number): string =>
  findUser(id).pipe(
    Option.map((user) => user.name.toUpperCase()),
    Option.getOrElse(() => "GUEST")
  )

export const greeting = (id: number): string =>
  Option.match(findUser(id), {
    onNone: () => "はじめまして",
    onSome: (user) => `こんにちは、${user.name} さん`
  })

// --- テスト（ここから下は編集しないでください） ---

assert.deepEqual(findUser(1), Option.some({ id: 1, name: "alice" }))
assert.equal(Option.isNone(findUser(3)), true)
assert.equal(displayName(2), "BOB")
assert.equal(displayName(3), "GUEST")
assert.equal(greeting(1), "こんにちは、alice さん")
assert.equal(greeting(99), "はじめまして")
console.log("Option で値がないケースを扱えました")
