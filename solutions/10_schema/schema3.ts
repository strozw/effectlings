// Effect の中で Schema を使う: decodeUnknownEffect と SchemaError
//
// `Schema.decodeUnknownSync` は失敗すると例外を投げますが、
// `Schema.decodeUnknownEffect(schema)(input)` は失敗を `SchemaError` という型付きエラーで表す Effect を返します。
// SchemaError のタグは "SchemaError" なので、catchTag で扱えます。message には読みやすい説明が入っています。
//
// `Schema.Class` を使うと、スキーマからクラスを定義できます。メソッドやゲッターも追加できます。
//
//   class Todo extends Schema.Class<Todo>("Todo")({ title: Schema.String }) {
//     get shout() { return this.title.toUpperCase() }
//   }
//
// 課題:
//   1. parseTodo を、input を Todo として検証する Effect にしてください（失敗は SchemaError）
//   2. describeTodo で、検証に成功したら todo.label を、
//      失敗したら "invalid todo: <SchemaError の message>" を返してください

import { Effect, Schema } from "effect"
import assert from "node:assert/strict"

export class Todo extends Schema.Class<Todo>("Todo")({
  title: Schema.String,
  done: Schema.Boolean
}) {
  get label(): string {
    return `[${this.done ? "x" : " "}] ${this.title}`
  }
}

export const parseTodo = (input: unknown): Effect.Effect<Todo, Schema.SchemaError> =>
  Schema.decodeUnknownEffect(Todo)(input)

export const describeTodo = (input: unknown): Effect.Effect<string> =>
  parseTodo(input).pipe(
    Effect.map((todo) => todo.label),
    Effect.catchTag("SchemaError", (error) => Effect.succeed(`invalid todo: ${error.message}`))
  )

// --- テスト（ここから下は編集しないでください） ---

const todo = Effect.runSync(parseTodo({ title: "learn Schema", done: true }))
assert.ok(todo instanceof Todo)
assert.equal(todo.label, "[x] learn Schema")

assert.equal(Effect.runSync(describeTodo({ title: "write tests", done: false })), "[ ] write tests")
assert.match(Effect.runSync(describeTodo({ title: "oops" })), /^invalid todo: Missing key\n {2}at \["done"\]$/)
console.log(Effect.runSync(describeTodo({ title: 42, done: false })))
