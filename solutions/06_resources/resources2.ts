// リソースを持つサービス: Layer.effect と acquireRelease
//
// `Layer.effect(Service, effect)` の effect の中で acquireRelease を使うと、
// サービスが作られるときにリソースを取得し、Layer を使い終わったときに解放できます。
// Layer.effect は Scope の要求を自動的に取り除くので、Effect.scoped は必要ありません。
//
//   const DatabaseLive = Layer.effect(
//     Database,
//     Effect.gen(function* () {
//       const pool = yield* Effect.acquireRelease(openPool, closePool)
//       return { query: ... }
//     })
//   )
//
// `Effect.provide(program, DatabaseLive)` で提供すると、program が終わったときに解放されます。
//
// 課題: DatabaseLive は Layer.succeed で作られているため、プールが閉じられません。
//       Layer.effect と Effect.acquireRelease を使って、
//       Layer が作られるときに openPool を、使い終わったときに pool.close を呼ぶようにしてください。

import { Context, Effect, Layer } from "effect"
import assert from "node:assert/strict"

const log: Array<string> = []

interface Pool {
  readonly run: (sql: string) => string
  readonly close: () => void
}

const openPool = (): Pool => {
  log.push("open")
  return {
    run: (sql) => {
      log.push(`run: ${sql}`)
      return `result of ${sql}`
    },
    close: () => log.push("close")
  }
}

class Database extends Context.Service<
  Database,
  {
    readonly query: (sql: string) => Effect.Effect<string>
  }
>()("Database") {}

export const DatabaseLive: Layer.Layer<Database> = Layer.effect(
  Database,
  Effect.gen(function* () {
    const pool = yield* Effect.acquireRelease(Effect.sync(openPool), (pool) => Effect.sync(pool.close))
    return {
      query: (sql: string) => Effect.sync(() => pool.run(sql))
    }
  })
)

const program = Effect.gen(function* () {
  const db = yield* Database
  const a = yield* db.query("SELECT 1")
  const b = yield* db.query("SELECT 2")
  return [a, b]
})

// --- テスト（ここから下は編集しないでください） ---

assert.deepEqual(log, [], "Layer を定義しただけではプールを開かないでください")
const results = Effect.runSync(program.pipe(Effect.provide(DatabaseLive)))
assert.deepEqual(results, ["result of SELECT 1", "result of SELECT 2"])
assert.deepEqual(log, ["open", "run: SELECT 1", "run: SELECT 2", "close"])
console.log("サービスの終了時にプールを閉じられました")
