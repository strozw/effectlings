// I AM NOT DONE
//
// 型付きエラーと欠陥（defect）: Effect.die, Effect.orDie, Effect.catchDefect
//
// Effect は失敗を 2 種類に分けて扱います。
//   - 型付きエラー: 想定している失敗。型 E に現れ、catchTag などで回復する（例: ユーザーが見つからない）
//   - 欠陥（defect）: 想定していない失敗。型には現れない（例: バグ、Effect.sync の中で投げられた例外）
//
//   Effect.die(new Error("..."))      // 欠陥で失敗させる
//   effect.pipe(Effect.orDie)         // 型付きエラーを欠陥に変える（E が never になる）
//   effect.pipe(Effect.catchDefect((defect) => ...))  // 欠陥から回復する（境界でログを出すときなど）
//
// 「ここで失敗したら回復しようがない」というエラーは orDie で欠陥にすると、
// 呼び出し側でエラー型を扱う必要がなくなります。
//
// 課題:
//   1. loadDefaults は組み込みの設定を読み込むだけで、失敗したらプログラムのバグです。
//      Effect.orDie を使って、エラー型を never にしてください
//   2. handleRequest で、handler の欠陥を catchDefect で受け止め、
//      "500 Internal Server Error" で成功するようにしてください（型付きエラーはそのまま残します）

import { Data, Effect } from "effect"
import assert from "node:assert/strict"

class ParseError extends Data.TaggedError("ParseError")<{ readonly input: string }> {}
class NotFoundError extends Data.TaggedError("NotFoundError")<{}> {}

const parseJson = (input: string) =>
  Effect.try({ try: (): unknown => JSON.parse(input), catch: () => new ParseError({ input }) })

export const loadDefaults: Effect.Effect<unknown> = parseJson('{"theme":"dark"}')

const handler = (path: string): Effect.Effect<string, NotFoundError> =>
  Effect.sync(() => {
    if (path === "/bug") throw new Error("undefined is not a function")
    return path
  }).pipe(Effect.flatMap((p) => (p === "/" ? Effect.succeed("200 OK") : Effect.fail(new NotFoundError()))))

export const handleRequest = (path: string): Effect.Effect<string, NotFoundError> => handler(path)

// --- テスト（ここから下は編集しないでください） ---

assert.deepEqual(Effect.runSync(loadDefaults), { theme: "dark" })

assert.equal(Effect.runSync(handleRequest("/")), "200 OK")
assert.equal(Effect.runSync(handleRequest("/bug")), "500 Internal Server Error")
assert.equal(Effect.runSync(Effect.flip(handleRequest("/missing")))._tag, "NotFoundError")
console.log("型付きエラーと欠陥を区別して扱えました")
