// I AM NOT DONE
//
// データの形を定義する: Schema.Struct
//
// 外部から受け取ったデータ（JSON、フォーム、環境変数など）は、型が正しい保証がありません。
// `Schema` でデータの形を定義すると、実行時の検証と TypeScript の型を一度に手に入れられます。
//
//   const Person = Schema.Struct({
//     name: Schema.String,
//     age: Schema.Finite,                      // 有限の数値（NaN や Infinity を許さない）
//     nickname: Schema.optional(Schema.String)  // あってもなくてもよい
//   })
//   type Person = typeof Person.Type             // { readonly name: string; readonly age: number; ... }
//
//   Schema.decodeUnknownSync(Person)(input)      // 検証して Person を返す（不正なら例外を投げる）
//
// 課題: API から受け取る User の形が変わりました。User スキーマを次の形に合わせてください。
//   - id: 有限の数値
//   - name: 文字列
//   - roles: 文字列の配列（Schema.Array を使います）
//   - email: 文字列（省略されることがある）

import { Schema } from "effect"
import assert from "node:assert/strict"

export const User = Schema.Struct({
  id: Schema.Finite,
  name: Schema.String,
  role: Schema.String,
  email: Schema.String
})

export type User = typeof User.Type

export const parseUser = Schema.decodeUnknownSync(User)

// --- テスト（ここから下は編集しないでください） ---

const _type: {
  readonly id: number
  readonly name: string
  readonly roles: ReadonlyArray<string>
  readonly email?: string | undefined
} = {} as User

const fromApi: unknown = JSON.parse('{"id":1,"name":"alice","roles":["admin"]}')
assert.deepEqual(parseUser(fromApi), { id: 1, name: "alice", roles: ["admin"] })

const withEmail: unknown = JSON.parse('{"id":2,"name":"bob","roles":[],"email":"bob@example.com"}')
assert.equal(parseUser(withEmail).email, "bob@example.com")

const broken: unknown = JSON.parse('{"id":"3","name":"carol","roles":[]}')
assert.throws(() => parseUser(broken), /Expected number\n  at \["id"\]/)
console.log("Schema で API のレスポンスを検証できました")
