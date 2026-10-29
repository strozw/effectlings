// コマンドラインツール: effect/cli
//
// `effect/cli` を使うと、引数やフラグを型付きで定義したコマンドラインツールを作れます。
// このツール（effectlings）自体も effect/cli で作られています（src/cli.ts）。
//
//   const greet = Command.make(
//     "greet",
//     {
//       name: Argument.String("name"),                                  // 位置引数
//       loud: Flag.Boolean("loud").pipe(Flag.withDefault(false)),      // --loud
//       times: Flag.Int("times").pipe(Flag.withDefault(1))             // --times 3
//     },
//     ({ name, loud, times }) => Console.log(...)                      // 解析済みの値を受け取るハンドラ
//   )
//
//   Command.run(greet, { version: "1.0.0" })              // process.argv を解析して実行
//   Command.runWith(greet, { version: "1.0.0" })(args)    // 引数の配列を渡して実行（テストに便利）
//
// `Flag.withAlias("l")` で `-l` のような短い名前も付けられます。
//
// 課題: todo コマンドを完成させてください。
//   - 位置引数 title（文字列）
//   - フラグ --priority（整数、省略時は 3、短い名前 -p）
//   - フラグ --done（真偽値、省略時は false）
//   ハンドラは `[x] <title> (p<priority>)`（done のとき）または `[ ] <title> (p<priority>)` を Console.log で出力します。

import { NodeServices } from "@effect/platform-node"
import { Console, Effect, Layer } from "effect"
import { Argument, Command, Flag } from "effect/cli"
import { TestConsole } from "effect/testing"
import assert from "node:assert/strict"

export const todo = Command.make(
  "todo",
  {
    title: Argument.String("title"),
    priority: Flag.Int("priority").pipe(Flag.withAlias("p"), Flag.withDefault(3)),
    done: Flag.Boolean("done").pipe(Flag.withDefault(false))
  },
  ({ title, priority, done }) => Console.log(`[${done ? "x" : " "}] ${title} (p${priority})`)
)

// --- テスト（ここから下は編集しないでください） ---

const run = Command.runWith(todo, { version: "1.0.0" })

const lines = await Effect.runPromise(
  Effect.gen(function* () {
    yield* run(["buy milk"])
    yield* run(["write tests", "--priority", "1"])
    yield* run(["learn cli", "-p", "2", "--done"])
    return yield* TestConsole.logLines
  }).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, TestConsole.layer)))
)
assert.deepEqual(lines, ["[ ] buy milk (p3)", "[ ] write tests (p1)", "[x] learn cli (p2)"])
console.log(lines.join("\n"))
