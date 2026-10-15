// I AM NOT DONE
//
// 変換と制約: FiniteFromString と check
//
// Schema は「Encoded（外部の表現）」と「Type（アプリの中で使う表現）」の 2 つの型を持ちます。
// decode は Encoded から Type への変換です。
//
//   Schema.FiniteFromString                       // Encoded: string  → Type: number（"42" → 42）
//   Schema.String.check(Schema.isMinLength(1))    // 空文字を許さない文字列
//   Schema.Number.check(Schema.isGreaterThanOrEqualTo(0))  // 0 以上の数値
//
// `typeof Schema.Encoded` と `typeof Schema.Type` でそれぞれの型を取り出せます。
//
// 課題: フォームから送られてくる値はすべて文字列です。SignUpForm を直して、
//   - name は空文字を許さない文字列
//   - age は文字列から数値に変換し、0 以上 150 以下に制限する（isBetween({ minimum, maximum }) を使います）
//   - newsletter は "on" か "off" のどちらか（Schema.Literals(["on", "off"]) を使います）
//   になるようにしてください。

import { Schema } from "effect"
import assert from "node:assert/strict"

export const SignUpForm = Schema.Struct({
  name: Schema.String,
  age: Schema.Finite,
  newsletter: Schema.String
})

export const decodeForm = Schema.decodeUnknownSync(SignUpForm)

// --- テスト（ここから下は編集しないでください） ---

const _encoded: { readonly name: string; readonly age: string; readonly newsletter: "on" | "off" } =
  {} as typeof SignUpForm.Encoded
const _type: { readonly name: string; readonly age: number; readonly newsletter: "on" | "off" } =
  {} as typeof SignUpForm.Type

const input = (value: object): unknown => value

assert.deepEqual(decodeForm(input({ name: "alice", age: "30", newsletter: "on" })), {
  name: "alice",
  age: 30,
  newsletter: "on"
})
assert.throws(() => decodeForm(input({ name: "", age: "30", newsletter: "on" })), /length of at least 1/)
assert.throws(() => decodeForm(input({ name: "bob", age: "abc", newsletter: "on" })), /finite number/)
assert.throws(() => decodeForm(input({ name: "bob", age: "200", newsletter: "on" })))
assert.throws(() => decodeForm(input({ name: "bob", age: "20", newsletter: "yes" })))
console.log("フォームの文字列を検証しながら変換できました")
